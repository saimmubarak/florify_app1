import json
import boto3
import os
from botocore.exceptions import ClientError
from jwt_utils import get_user_id_from_token

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['GARDENS_TABLE_NAME'])

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
        # Get user ID from Cognito JWT token
        auth_header = event.get('headers', {}).get('Authorization', '')
        user_id = get_user_id_from_token(auth_header, os.environ['COGNITO_USER_POOL_ID'], os.environ['COGNITO_REGION'])
        
        if not user_id:
            return respond(401, {"message": "Invalid or missing authentication token"})
        
        # Get garden ID from path parameters
        garden_id = event.get('pathParameters', {}).get('gardenId')
        if not garden_id:
            return respond(400, {"message": "Garden ID is required"})

        # Delete garden from DynamoDB
        response = table.delete_item(
            Key={
                'userId': user_id,
                'gardenId': garden_id
            },
            ReturnValues="ALL_OLD"
        )

        deleted_garden = response.get('Attributes')
        if not deleted_garden:
            return respond(404, {"message": "Garden not found"})

        return respond(200, {
            "message": "Garden deleted successfully",
            "garden": deleted_garden
        })

    except ClientError as e:
        print(f"DynamoDB error: {e}")
        return respond(500, {"message": "Database error occurred"})
    except Exception as e:
        print(f"Unexpected error: {e}")
        return respond(500, {"message": "Internal server error"})