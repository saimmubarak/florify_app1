import json
import boto3
import os
from botocore.exceptions import ClientError

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['GARDENS_TABLE'])

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

def handler(event, context):
    # Handle CORS preflight
    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return respond(200, {"message": "CORS preflight"})

    try:
        # For now, use a simple user ID - we'll add proper auth later
        user_id = "user-123"  # This will be replaced with real user ID from JWT
        
        # Get garden ID from path parameters
        garden_id = event.get('pathParameters', {}).get('gardenId')
        if not garden_id:
            return respond(400, {"message": "Garden ID is required"})

        # Get garden from DynamoDB
        response = table.get_item(
            Key={
                'userId': user_id,
                'gardenId': garden_id
            }
        )

        garden = response.get('Item')
        if not garden:
            return respond(404, {"message": "Garden not found"})

        return respond(200, {"garden": garden})

    except ClientError as e:
        print(f"DynamoDB error: {e}")
        return respond(500, {"message": "Database error occurred"})
    except Exception as e:
        print(f"Unexpected error: {e}")
        return respond(500, {"message": "Internal server error"})