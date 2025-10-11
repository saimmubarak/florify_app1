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

    client.resend_confirmation_code(
        ClientId=os.environ["CLIENT_ID"],
        Username=email
    )

    return {
        "statusCode": 200,
        "headers": cors_headers(),
        "body": json.dumps({"message": "Confirmation code resent successfully."})
    }

def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
        "Access-Control-Allow-Headers": "Content-Type"
    }
