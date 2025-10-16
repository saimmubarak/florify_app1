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