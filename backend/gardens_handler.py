import json
import boto3
import os
import uuid
import requests
from datetime import datetime
from botocore.exceptions import ClientError
from jose import jwt, jwk
from jose.exceptions import JWTError, JWKError

# Initialize AWS services
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

# Get configuration from environment variables
table_name = os.environ.get('GARDENS_TABLE_NAME', 'florify-gardens')
s3_bucket = os.environ.get('S3_BUCKET_NAME', 'florify-garden-images')
cognito_user_pool_id = os.environ.get('COGNITO_USER_POOL_ID')
cognito_region = os.environ.get('COGNITO_REGION', 'eu-north-1')
user_id_claim = os.environ.get('USER_ID_CLAIM', 'sub')

# Initialize DynamoDB table
table = dynamodb.Table(table_name)

# Cache for JWKS to avoid repeated API calls
_jwks_cache = None
_jwks_cache_time = None
JWKS_CACHE_DURATION = 300  # 5 minutes

def cors_headers():
    """Return CORS headers for all responses"""
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,DELETE",
        "Access-Control-Allow-Headers": "Content-Type,Authorization"
    }

def respond(status, body):
    """Create a standardized HTTP response"""
    return {
        "statusCode": status,
        "headers": cors_headers(),
        "body": json.dumps(body)
    }

def fetch_jwks():
    """
    Fetch and cache Cognito JWKS from the well-known endpoint.
    Returns the JWKS data or None if fetch fails.
    """
    global _jwks_cache, _jwks_cache_time
    
    # Check if we have valid cached JWKS
    if _jwks_cache and _jwks_cache_time:
        if datetime.utcnow().timestamp() - _jwks_cache_time < JWKS_CACHE_DURATION:
            return _jwks_cache
    
    # Fetch fresh JWKS from Cognito
    jwks_url = f"https://cognito-idp.{cognito_region}.amazonaws.com/{cognito_user_pool_id}/.well-known/jwks.json"
    
    try:
        response = requests.get(jwks_url, timeout=10)
        response.raise_for_status()
        _jwks_cache = response.json()
        _jwks_cache_time = datetime.utcnow().timestamp()
        return _jwks_cache
    except requests.RequestException as e:
        print(f"Error fetching JWKS: {str(e)}")
        return None

def get_user_from_token(authorization_header):
    """
    Verify Cognito JWT token and extract user information.
    Returns (user_id, email) tuple or (None, None) on failure.
    """
    if not authorization_header:
        return None, None
    
    # Check Bearer token format
    if not authorization_header.startswith('Bearer '):
        return None, None
    
    token = authorization_header[7:]  # Remove 'Bearer ' prefix
    
    try:
        # Get JWKS for token verification
        jwks = fetch_jwks()
        if not jwks:
            print("Failed to fetch JWKS")
            return None, None
        
        # Decode token header to get key ID
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get('kid')
        if not kid:
            print("No kid in token header")
            return None, None
        
        # Find the correct key in JWKS
        key = None
        for jwk_key in jwks.get('keys', []):
            if jwk_key.get('kid') == kid:
                key = jwk_key
                break
        
        if not key:
            print(f"Key with kid {kid} not found in JWKS")
            return None, None
        
        # Convert JWK to PEM format for verification
        public_key = jwk.construct(key)
        
        # Verify and decode the token
        claims = jwt.decode(
            token,
            public_key,
            algorithms=['RS256'],
            audience=None,  # Cognito doesn't use audience
            options={"verify_aud": False}
        )
        
        # Verify issuer matches Cognito
        expected_issuer = f"https://cognito-idp.{cognito_region}.amazonaws.com/{cognito_user_pool_id}"
        if claims.get('iss') != expected_issuer:
            print(f"Invalid issuer: {claims.get('iss')}")
            return None, None
        
        # Check token expiration
        current_time = datetime.utcnow().timestamp()
        if claims.get('exp', 0) < current_time:
            print("Token has expired")
            return None, None
        
        # Extract user information
        user_id = claims.get(user_id_claim)
        email = claims.get('email')
        
        if not user_id:
            print("No user ID found in token")
            return None, None
        
        return user_id, email
        
    except (JWTError, JWKError) as e:
        print(f"JWT verification error: {str(e)}")
        return None, None
    except Exception as e:
        print(f"Unexpected error during token verification: {str(e)}")
        return None, None

def query_gardens_for_user(user_id):
    """
    Query DynamoDB to get all gardens for a specific user.
    Returns list of garden items.
    """
    try:
        response = table.query(
            KeyConditionExpression='userId = :user_id',
            ExpressionAttributeValues={
                ':user_id': user_id
            }
        )
        return response.get('Items', [])
    except ClientError as e:
        print(f"Error querying gardens for user {user_id}: {str(e)}")
        return []

def put_garden_item(item):
    """
    Write a garden item to DynamoDB.
    Returns True on success, False on failure.
    """
    try:
        table.put_item(Item=item)
        return True
    except ClientError as e:
        print(f"Error putting garden item: {str(e)}")
        return False

def generate_presigned_post(garden_id, filename, content_type):
    """
    Generate presigned POST data for S3 upload.
    Returns (upload_data, public_url) tuple.
    """
    try:
        # Create S3 key for the image
        file_extension = filename.split('.')[-1] if '.' in filename else 'jpg'
        s3_key = f"gardens/{garden_id}/image.{file_extension}"
        
        # Generate presigned POST
        presigned_post = s3_client.generate_presigned_post(
            Bucket=s3_bucket,
            Key=s3_key,
            Fields={"Content-Type": content_type},
            Conditions=[
                {"Content-Type": content_type},
                ["content-length-range", 1, 10 * 1024 * 1024]  # 10MB max
            ],
            ExpiresIn=3600  # 1 hour
        )
        
        # Generate public URL
        public_url = f"https://{s3_bucket}.s3.{cognito_region}.amazonaws.com/{s3_key}"
        
        return presigned_post, public_url
        
    except ClientError as e:
        print(f"Error generating presigned POST: {str(e)}")
        return None, None

def handler(event, context):
    """Main Lambda handler for gardens API"""
    
    # Handle CORS preflight
    method = event.get("requestContext", {}).get("http", {}).get("method", "")
    if method == "OPTIONS":
        return respond(200, {"message": "CORS preflight"})
    
    # Get user from authorization header
    headers = event.get("headers", {})
    authorization = headers.get("Authorization") or headers.get("authorization")
    user_id, user_email = get_user_from_token(authorization)
    
    if not user_id:
        return respond(401, {"message": "Unauthorized - invalid or missing token"})
    
    # Route based on HTTP method and path
    path = event.get("requestContext", {}).get("http", {}).get("path", "")
    
    if method == "GET" and path == "/gardens":
        # Get all gardens for authenticated user
        try:
            gardens = query_gardens_for_user(user_id)
            return respond(200, {"gardens": gardens})
        except Exception as e:
            print(f"Error fetching gardens: {str(e)}")
            return respond(500, {"message": "Failed to fetch gardens"})
    
    elif method == "GET" and path == "/gardens/upload-url":
        # Generate presigned upload URL
        try:
            query_params = event.get("queryStringParameters") or {}
            filename = query_params.get("filename")
            content_type = query_params.get("contentType", "image/jpeg")
            
            if not filename:
                return respond(400, {"message": "filename parameter is required"})
            
            # Generate a new garden ID for the upload
            garden_id = str(uuid.uuid4())
            
            upload_data, public_url = generate_presigned_post(garden_id, filename, content_type)
            
            if not upload_data:
                return respond(500, {"message": "Failed to generate upload URL"})
            
            return respond(200, {
                "uploadData": upload_data,
                "publicUrl": public_url,
                "gardenId": garden_id
            })
            
        except Exception as e:
            print(f"Error generating upload URL: {str(e)}")
            return respond(500, {"message": "Failed to generate upload URL"})
    
    elif method == "POST" and path == "/gardens":
        # Create new garden
        try:
            body = event.get("body", "")
            if event.get("isBase64Encoded", False):
                import base64
                body = base64.b64decode(body).decode('utf-8')
            
            data = json.loads(body)
            
            # Validate required fields
            if not data.get("name") or not data.get("location"):
                return respond(400, {"message": "Name and location are required"})
            
            # Use provided gardenId or generate new one
            garden_id = data.get("gardenId", str(uuid.uuid4()))
            
            # Create garden item
            now = datetime.utcnow().isoformat()
            garden_item = {
                "userId": user_id,
                "gardenId": garden_id,
                "name": data.get("name"),
                "location": data.get("location"),
                "description": data.get("description", ""),
                "imageUrl": data.get("imageUrl", ""),
                "status": "active",
                "plantCount": 0,
                "userEmail": user_email or "",
                "createdAt": now,
                "updatedAt": now
            }
            
            # Save to DynamoDB
            if not put_garden_item(garden_item):
                return respond(500, {"message": "Failed to save garden"})
            
            return respond(201, garden_item)
            
        except json.JSONDecodeError:
            return respond(400, {"message": "Invalid JSON body"})
        except Exception as e:
            print(f"Error creating garden: {str(e)}")
            return respond(500, {"message": "Failed to create garden"})
    
    else:
        return respond(405, {"message": "Method not allowed"})