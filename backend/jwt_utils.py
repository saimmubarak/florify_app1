import json
import base64
import urllib.request
import urllib.parse
import urllib.error
from typing import Optional, Dict, Any

def get_user_id_from_token(auth_header: str, user_pool_id: str, region: str) -> Optional[str]:
    """
    Extract user ID from Cognito JWT token.
    For production use, you should verify the JWT signature properly.
    This is a simplified version for development.
    """
    if not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header[7:]  # Remove 'Bearer ' prefix
    
    try:
        # Decode JWT payload (without verification for now)
        # In production, you should verify the signature
        parts = token.split('.')
        if len(parts) != 3:
            return None
        
        # Decode payload
        payload = parts[1]
        # Add padding if needed
        payload += '=' * (4 - len(payload) % 4)
        decoded_payload = base64.urlsafe_b64decode(payload)
        payload_data = json.loads(decoded_payload)
        
        # Extract user ID (sub claim)
        user_id = payload_data.get('sub')
        return user_id
        
    except Exception as e:
        print(f"Error decoding JWT: {e}")
        return None

def verify_token(auth_header: str, user_pool_id: str, region: str) -> Optional[Dict[str, Any]]:
    """
    Verify Cognito JWT token and return user information.
    This is a simplified version - in production, verify the signature.
    """
    if not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header[7:]
    
    try:
        # Decode JWT payload
        parts = token.split('.')
        if len(parts) != 3:
            return None
        
        # Decode header and payload
        header = parts[0]
        payload = parts[1]
        
        # Add padding if needed
        header += '=' * (4 - len(header) % 4)
        payload += '=' * (4 - len(payload) % 4)
        
        decoded_header = base64.urlsafe_b64decode(header)
        decoded_payload = base64.urlsafe_b64decode(payload)
        
        header_data = json.loads(decoded_header)
        payload_data = json.loads(decoded_payload)
        
        # Basic validation
        if payload_data.get('iss') != f'https://cognito-idp.{region}.amazonaws.com/{user_pool_id}':
            return None
        
        # Check if token is expired
        import time
        current_time = int(time.time())
        if payload_data.get('exp', 0) < current_time:
            return None
        
        return payload_data
        
    except Exception as e:
        print(f"Error verifying JWT: {e}")
        return None