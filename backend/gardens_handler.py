import json
import boto3
import os
import uuid
from datetime import datetime
from botocore.exceptions import ClientError

# Initialize DynamoDB (commented out for mock implementation)
# dynamodb = boto3.resource('dynamodb')
# table_name = os.environ.get('GARDENS_TABLE_NAME', 'florify-gardens')
# table = dynamodb.Table(table_name)

# Initialize S3 for image storage (commented out for mock implementation)
# s3_client = boto3.client('s3')
# s3_bucket = os.environ.get('S3_BUCKET_NAME', 'florify-garden-images')

# Mock storage for development
mock_gardens = [
    {
        "gardenId": "sample-1",
        "userEmail": "user@example.com",
        "name": "My Backyard Paradise",
        "location": "123 Main St, Backyard",
        "description": "A beautiful backyard garden with herbs and vegetables",
        "imageUrl": "",
        "status": "active",
        "plantCount": 12,
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
    },
    {
        "gardenId": "sample-2",
        "userEmail": "user@example.com",
        "name": "Urban Herb Garden",
        "location": "Apartment Balcony",
        "description": "Small herb garden on my apartment balcony",
        "imageUrl": "",
        "status": "active",
        "plantCount": 8,
        "createdAt": "2024-01-10T14:20:00Z",
        "updatedAt": "2024-01-10T14:20:00Z"
    }
]

def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,DELETE",
        "Access-Control-Allow-Headers": "Content-Type,Authorization"
    }

def respond(status, body):
    return {
        "statusCode": status,
        "headers": cors_headers(),
        "body": json.dumps(body)
    }

def get_user_from_token(authorization_header):
    """Extract user email from Authorization header"""
    if not authorization_header:
        return None
    
    try:
        # For now, we'll use a simple approach
        # In production, you should verify the JWT token with Cognito
        # This is a simplified version for development
        return "user@example.com"  # Placeholder - implement proper JWT verification
    except:
        return None

def upload_image_to_s3(image_file, garden_id):
    """Upload image to S3 and return URL"""
    try:
        file_extension = image_file.filename.split('.')[-1] if '.' in image_file.filename else 'jpg'
        s3_key = f"gardens/{garden_id}/image.{file_extension}"
        
        s3_client.upload_fileobj(
            image_file,
            s3_bucket,
            s3_key,
            ExtraArgs={'ContentType': image_file.content_type}
        )
        
        return f"https://{s3_bucket}.s3.amazonaws.com/{s3_key}"
    except Exception as e:
        print(f"Error uploading image: {str(e)}")
        return None

def handler(event, context):
    # Handle CORS preflight
    method = event.get("requestContext", {}).get("http", {}).get("method", "")
    if method == "OPTIONS":
        return respond(200, {"message": "CORS preflight"})

    # Get user from authorization header
    headers = event.get("headers", {})
    authorization = headers.get("Authorization") or headers.get("authorization")
    user_email = get_user_from_token(authorization)
    
    if not user_email:
        return respond(401, {"message": "Unauthorized"})

    if method == "GET":
        # Get all gardens for user
        try:
            # Mock implementation - filter gardens by user email
            user_gardens = [garden for garden in mock_gardens if garden.get('userEmail') == user_email]
            return respond(200, {"gardens": user_gardens})
            
        except Exception as e:
            print(f"Error fetching gardens: {str(e)}")
            return respond(500, {"message": "Failed to fetch gardens"})

    elif method == "POST":
        # Create new garden
        try:
            # Parse multipart form data
            body = event.get("body", "")
            if event.get("isBase64Encoded", False):
                import base64
                body = base64.b64decode(body).decode('utf-8')
            
            # For now, we'll handle JSON data
            # In production, you'd need to parse multipart form data
            try:
                data = json.loads(body)
            except:
                return respond(400, {"message": "Invalid JSON body"})
            
            garden_id = str(uuid.uuid4())
            garden_data = {
                "gardenId": garden_id,
                "userEmail": user_email,
                "name": data.get("name", ""),
                "location": data.get("location", ""),
                "description": data.get("description", ""),
                "imageUrl": data.get("imageUrl", ""),
                "status": "active",
                "plantCount": 0,
                "createdAt": datetime.utcnow().isoformat(),
                "updatedAt": datetime.utcnow().isoformat()
            }
            
            # Validate required fields
            if not garden_data["name"] or not garden_data["location"]:
                return respond(400, {"message": "Name and location are required"})
            
            # Save to mock storage
            mock_gardens.append(garden_data)
            
            return respond(201, garden_data)
            
        except Exception as e:
            print(f"Error creating garden: {str(e)}")
            return respond(500, {"message": "Failed to create garden"})

    else:
        return respond(405, {"message": "Method not allowed"})