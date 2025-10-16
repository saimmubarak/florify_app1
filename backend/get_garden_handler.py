import json
import boto3
import os
from botocore.exceptions import ClientError
from jwt_utils import require_auth, respond

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['GARDENS_TABLE'])

@require_auth
def handler(event, context):
    try:
        # Get authenticated user ID from the decorator
        user_id = event['user_id']
        
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