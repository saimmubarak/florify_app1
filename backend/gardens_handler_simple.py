import json
import os
import requests
from datetime import datetime
from jose import jwt, jwk

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
    
    # Get Cognito configuration from environment
    cognito_user_pool_id = os.environ.get('COGNITO_USER_POOL_ID')
    cognito_region = os.environ.get('COGNITO_REGION', 'eu-north-1')
    
    if not cognito_user_pool_id:
        print("COGNITO_USER_POOL_ID not set")
        return None
    
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
        cognito_user_pool_id = os.environ.get('COGNITO_USER_POOL_ID')
        cognito_region = os.environ.get('COGNITO_REGION', 'eu-north-1')
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
        user_id = claims.get('sub')
        email = claims.get('email')
        
        if not user_id:
            print("No user ID found in token")
            return None, None
        
        return user_id, email
        
    except Exception as e:
        print(f"Error during token verification: {str(e)}")
        return None, None

def handler(event, context):
    """Main Lambda handler for gardens API - Step 1: Basic JWT verification only"""
    
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
        # Return mock data for now - Step 1 only
        mock_gardens = [
            {
                "gardenId": "mock-1",
                "userId": user_id,
                "userEmail": user_email or "unknown@example.com",
                "name": "My Test Garden",
                "location": "123 Test St",
                "description": "A test garden for Step 1",
                "imageUrl": "",
                "status": "active",
                "plantCount": 0,
                "createdAt": datetime.utcnow().isoformat(),
                "updatedAt": datetime.utcnow().isoformat()
            }
        ]
        
        return respond(200, {
            "message": "Step 1: JWT verification working!",
            "user_id": user_id,
            "user_email": user_email,
            "gardens": mock_gardens
        })
    
    elif method == "POST" and path == "/gardens":
        # Mock garden creation for Step 1
        try:
            body = event.get("body", "")
            if event.get("isBase64Encoded", False):
                import base64
                body = base64.b64decode(body).decode('utf-8')
            
            data = json.loads(body)
            
            # Create mock garden response
            mock_garden = {
                "gardenId": "mock-new-garden",
                "userId": user_id,
                "userEmail": user_email or "unknown@example.com",
                "name": data.get("name", "New Garden"),
                "location": data.get("location", "Unknown Location"),
                "description": data.get("description", ""),
                "imageUrl": "",
                "status": "active",
                "plantCount": 0,
                "createdAt": datetime.utcnow().isoformat(),
                "updatedAt": datetime.utcnow().isoformat()
            }
            
            return respond(201, {
                "message": "Step 1: Garden creation working!",
                "garden": mock_garden
            })
            
        except json.JSONDecodeError:
            return respond(400, {"message": "Invalid JSON body"})
        except Exception as e:
            print(f"Error in mock garden creation: {str(e)}")
            return respond(500, {"message": "Failed to create garden"})
    
    else:
        return respond(405, {"message": "Method not allowed"})