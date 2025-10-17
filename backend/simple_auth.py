import json
import boto3
import os
from botocore.exceptions import ClientError

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

def get_user_id_from_token(event):
    """Extract user ID from Authorization header - simplified version"""
    try:
        # Get Authorization header
        headers = event.get('headers', {})
        auth_header = headers.get('Authorization') or headers.get('authorization')
        
        if not auth_header:
            return None, "No authorization header found"
        
        # For now, we'll use a simple approach
        # In a real implementation, you'd verify the JWT token
        # For this demo, we'll extract user info from the token
        
        # Remove 'Bearer ' prefix if present
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]
        else:
            token = auth_header
        
        # For now, we'll use a simple mapping or extract from token
        # This is a temporary solution until JWT verification is properly set up
        
        # Try to decode the token as base64 to get user info
        import base64
        try:
            # JWT tokens have 3 parts separated by dots
            parts = token.split('.')
            if len(parts) == 3:
                # Decode the payload (second part)
                payload = parts[1]
                # Add padding if needed
                payload += '=' * (4 - len(payload) % 4)
                decoded = base64.urlsafe_b64decode(payload)
                payload_data = json.loads(decoded)
                
                # Extract user ID from the token payload
                user_id = payload_data.get('sub')  # 'sub' is the user ID in Cognito tokens
                if user_id:
                    return user_id, None
        except:
            pass
        
        # If we can't decode the token, return an error
        return None, "Invalid token format"
        
    except Exception as e:
        print(f"Error extracting user ID: {e}")
        return None, "Authentication failed"

def require_auth(handler_func):
    """Decorator to require authentication for Lambda handlers - simplified version"""
    def wrapper(event, context):
        # Handle CORS preflight
        if event.get("httpMethod") == "OPTIONS":
            return respond(200, {"message": "CORS preflight"})
        
        # Get user ID from token
        user_id, error = get_user_id_from_token(event)
        if error:
            return respond(401, {"message": f"Authentication required: {error}"})
        
        # Add user_id to event for use in handler
        event['user_id'] = user_id
        
        # Call the original handler
        return handler_func(event, context)
    
    return wrapper