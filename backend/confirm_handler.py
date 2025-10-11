import json
import boto3
import os

client = boto3.client("cognito-idp")

def handler(event, context):
    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": cors_headers(),
            "body": ""
        }

    body = json.loads(event["body"])
    email = body["email"]
    code = body["code"]

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

def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
        "Access-Control-Allow-Headers": "Content-Type"
    }
