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

        # Query gardens for this user
        response = table.query(
            KeyConditionExpression='userId = :userId',
            ExpressionAttributeValues={
                ':userId': user_id
            }
        )

        gardens = response.get('Items', [])
        
        return respond(200, {
            "gardens": gardens,
            "count": len(gardens)
        })

    except ClientError as e:
        print(f"DynamoDB error: {e}")
        return respond(500, {"message": "Database error occurred"})
    except Exception as e:
        print(f"Unexpected error: {e}")
        return respond(500, {"message": "Internal server error"})