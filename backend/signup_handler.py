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
    if event.get("httpMethod") == "OPTIONS":
        return respond(200, {"message": "CORS preflight"})

    try:
        body = json.loads(event.get("body", "{}"))
    except Exception:
        return respond(400, {"message": "Invalid JSON body"})

    name = body.get("name")
    email = body.get("email")
    password = body.get("password")

    if not all([name, email, password]):
        return respond(400, {"message": "All fields are required"})

    try:
        response = client.sign_up(
            ClientId=os.environ["CLIENT_ID"],
            Username=email,
            Password=password,
            UserAttributes=[
                {"Name": "name", "Value": name},
                {"Name": "email", "Value": email}
            ]
        )
        return respond(200, {"message": "Signup successful! Please verify your email."})

    except client.exceptions.UsernameExistsException:
        return respond(400, {"message": "This email is already registered."})

    except client.exceptions.InvalidPasswordException:
        return respond(400, {"message": "Password does not meet complexity requirements."})

    except client.exceptions.InvalidParameterException as e:
        return respond(400, {"message": str(e)})

    except ClientError as e:
        error = e.response["Error"]
        return respond(400, {"message": error.get("Message", "Unknown Cognito error")})

    except Exception as e:
        print("Unexpected error:", str(e))
        return respond(500, {"message": "Internal server error"})
