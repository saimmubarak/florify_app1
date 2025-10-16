import json
import boto3
import os
from botocore.exceptions import ClientError

client = boto3.client("cognito-idp")

def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
        "Access-Control-Allow-Headers": "Content-Type"
    }

def respond(status, body):
    return {
        "statusCode": status,
        "headers": cors_headers(),
        "body": json.dumps(body)
    }

def handler(event, context):
    # Handle CORS preflight
    method = event.get("requestContext", {}).get("http", {}).get("method", "")
    if method == "OPTIONS":
        return respond(200, {"message": "CORS preflight"})

    try:
        body = json.loads(event.get("body", "{}"))
    except Exception:
        return respond(400, {"message": "Invalid JSON body"})

    email = body.get("email")
    password = body.get("password")

    if not email or not password:
        return respond(400, {"message": "Email and password are required"})

    try:
        response = client.initiate_auth(
            ClientId=os.environ["CLIENT_ID"],
            AuthFlow="USER_PASSWORD_AUTH",
            AuthParameters={
                "USERNAME": email,
                "PASSWORD": password
            }
        )

        tokens = response.get("AuthenticationResult", {})
        return respond(200, {
            "message": "Login successful",
            "token": tokens.get("IdToken"),  # Use ID token for authentication
            "accessToken": tokens.get("AccessToken"),
            "refreshToken": tokens.get("RefreshToken")
        })

    except client.exceptions.NotAuthorizedException:
        return respond(400, {"message": "Incorrect email or password"})

    except client.exceptions.UserNotConfirmedException:
        return respond(400, {"message": "Please confirm your email before logging in"})

    except client.exceptions.UserNotFoundException:
        return respond(400, {"message": "User does not exist"})

    except ClientError as e:
        print("ClientError:", e)
        error = e.response["Error"]
        return respond(400, {"message": error.get("Message", "Unknown Cognito error")})

    except Exception as e:
        print("Unexpected error:", str(e))
        return respond(500, {"message": "Internal server error"})
