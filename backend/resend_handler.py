import json
import boto3
import os

client = boto3.client("cognito-idp")

def handler(event, context):
    # Handle CORS preflight
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": cors_headers(),
            "body": ""
        }

    try:
        body = json.loads(event.get("body", "{}"))
    except Exception:
        return {
            "statusCode": 400,
            "headers": cors_headers(),
            "body": json.dumps({"message": "Invalid JSON body"})
        }

    email = body.get("email")

    if not email:
        return {
            "statusCode": 400,
            "headers": cors_headers(),
            "body": json.dumps({"message": "Email is required"})
        }

    try:
        client.resend_confirmation_code(
            ClientId=os.environ["CLIENT_ID"],
            Username=email
        )

        return {
            "statusCode": 200,
            "headers": cors_headers(),
            "body": json.dumps({"message": "Confirmation code resent successfully."})
        }
    except client.exceptions.InvalidParameterException:
        return {
            "statusCode": 400,
            "headers": cors_headers(),
            "body": json.dumps({"message": "Invalid email address"})
        }
    except client.exceptions.UserNotFoundException:
        return {
            "statusCode": 400,
            "headers": cors_headers(),
            "body": json.dumps({"message": "User not found"})
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": cors_headers(),
            "body": json.dumps({"message": "Internal server error"})
        }

def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
        "Access-Control-Allow-Headers": "Content-Type"
    }
