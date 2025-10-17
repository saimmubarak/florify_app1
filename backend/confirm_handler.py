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
    code = body.get("code")

    if not email or not code:
        return {
            "statusCode": 400,
            "headers": cors_headers(),
            "body": json.dumps({"message": "Email and code are required"})
        }

    try:
        client.confirm_sign_up(
            ClientId=os.environ["CLIENT_ID"],
            Username=email,
            ConfirmationCode=code
        )

        return {
            "statusCode": 200,
            "headers": cors_headers(),
            "body": json.dumps({"message": "Email confirmed successfully!"})
        }
    except client.exceptions.CodeMismatchException:
        return {
            "statusCode": 400,
            "headers": cors_headers(),
            "body": json.dumps({"message": "Invalid confirmation code"})
        }
    except client.exceptions.ExpiredCodeException:
        return {
            "statusCode": 400,
            "headers": cors_headers(),
            "body": json.dumps({"message": "Confirmation code has expired"})
        }
    except client.exceptions.NotAuthorizedException:
        return {
            "statusCode": 400,
            "headers": cors_headers(),
            "body": json.dumps({"message": "User is already confirmed"})
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
