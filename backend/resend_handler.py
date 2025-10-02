# resend_handler.py
# Resends confirmation code to a user
import os
import json
import logging
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

CLIENT_ID = os.environ.get("CLIENT_ID", "")
AWS_REGION = os.environ.get("AWS_REGION", "ap-south-1")

cognito = boto3.client("cognito-idp", region_name=AWS_REGION)

def parse_body(event):
    body = event.get("body") or "{}"
    if isinstance(body, str):
        try:
            return json.loads(body)
        except Exception:
            return {}
    return body

def response(status, payload):
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps(payload)
    }

def handler(event, context):
    data = parse_body(event)
    email = data.get("email")
    if not email:
        return response(400, {"error": "email is required"})
    if not CLIENT_ID:
        return response(500, {"error": "Server misconfiguration: CLIENT_ID missing"})

    try:
        resp = cognito.resend_confirmation_code(ClientId=CLIENT_ID, Username=email)
        return response(200, {"message": "Confirmation code resent", "CodeDeliveryDetails": resp.get("CodeDeliveryDetails")})
    except ClientError as e:
        err = e.response.get("Error", {}).get("Message", str(e))
        return response(400, {"error": err})
