import json
import boto3
import os
import uuid
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
        
        body = json.loads(event.get("body", "{}"))
        garden_name = body.get("name")
        garden_location = body.get("location")
        garden_description = body.get("description", "")

        if not garden_name or not garden_location:
            return respond(400, {"message": "Garden name and location are required"})

        # Generate unique garden ID
        garden_id = str(uuid.uuid4())

        # Create garden item
        garden_item = {
            "userId": user_id,
            "gardenId": garden_id,
            "name": garden_name,
            "location": garden_location,
            "description": garden_description,
            "createdAt": context.aws_request_id,
            "updatedAt": context.aws_request_id
        }

        # Save to DynamoDB
        table.put_item(Item=garden_item)

        return respond(201, {
            "message": "Garden created successfully",
            "garden": garden_item
        })

    except json.JSONDecodeError:
        return respond(400, {"message": "Invalid JSON body"})
    except ClientError as e:
        print(f"DynamoDB error: {e}")
        return respond(500, {"message": "Database error occurred"})
    except Exception as e:
        print(f"Unexpected error: {e}")
        return respond(500, {"message": "Internal server error"})