import json
import boto3
import jwt
import requests
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

def get_cognito_public_keys():
    """Get Cognito public keys for JWT verification"""
    region = "eu-north-1"
    user_pool_id = "eu-north-1_i7vhr8PxH"
    
    url = f"https://cognito-idp.{region}.amazonaws.com/{user_pool_id}/.well-known/jwks.json"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching Cognito public keys: {e}")
        return None

def verify_jwt_token(token):
    """Verify JWT token and return user information"""
    try:
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]
        
        # Get Cognito public keys
        jwks = get_cognito_public_keys()
        if not jwks:
            return None, "Unable to verify token"
        
        # Decode token header to get key ID
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get('kid')
        
        if not kid:
            return None, "Invalid token format"
        
        # Find the correct key
        public_key = None
        for key in jwks['keys']:
            if key['kid'] == kid:
                public_key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(key))
                break
        
        if not public_key:
            return None, "Invalid token key"
        
        # Verify and decode the token
        decoded_token = jwt.decode(
            token,
            public_key,
            algorithms=['RS256'],
            audience="76i7it21omdm3n80nf9j9dc2oc",  # Client ID
            issuer=f"https://cognito-idp.eu-north-1.amazonaws.com/eu-north-1_i7vhr8PxH"
        )
        
        return decoded_token, None
        
    except jwt.ExpiredSignatureError:
        return None, "Token has expired"
    except jwt.InvalidTokenError as e:
        return None, f"Invalid token: {str(e)}"
    except Exception as e:
        print(f"Error verifying token: {e}")
        return None, "Token verification failed"

def get_user_id_from_token(event):
    """Extract and verify user ID from Authorization header"""
    try:
        # Get Authorization header
        headers = event.get('headers', {})
        auth_header = headers.get('Authorization') or headers.get('authorization')
        
        if not auth_header:
            return None, "No authorization header found"
        
        # Verify JWT token
        decoded_token, error = verify_jwt_token(auth_header)
        if error:
            return None, error
        
        # Extract user ID from token
        user_id = decoded_token.get('sub')  # 'sub' is the user ID in Cognito tokens
        if not user_id:
            return None, "No user ID found in token"
        
        return user_id, None
        
    except Exception as e:
        print(f"Error extracting user ID: {e}")
        return None, "Authentication failed"

def require_auth(handler_func):
    """Decorator to require authentication for Lambda handlers"""
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