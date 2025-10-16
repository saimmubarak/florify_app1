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

        # Parse request body
        body = json.loads(event.get("body", "{}"))
        garden_name = body.get("name")
        garden_location = body.get("location")
        garden_description = body.get("description")

        # Build update expression dynamically
        update_expression = "SET updatedAt = :updatedAt"
        expression_attribute_values = {
            ":updatedAt": context.aws_request_id
        }

        if garden_name is not None:
            update_expression += ", #name = :name"
            expression_attribute_values[":name"] = garden_name

        if garden_location is not None:
            update_expression += ", #location = :location"
            expression_attribute_values[":location"] = garden_location

        if garden_description is not None:
            update_expression += ", description = :description"
            expression_attribute_values[":description"] = garden_description

        # Update garden in DynamoDB
        response = table.update_item(
            Key={
                'userId': user_id,
                'gardenId': garden_id
            },
            UpdateExpression=update_expression,
            ExpressionAttributeNames={
                '#name': 'name',
                '#location': 'location'
            },
            ExpressionAttributeValues=expression_attribute_values,
            ReturnValues="ALL_NEW"
        )

        updated_garden = response.get('Attributes')
        if not updated_garden:
            return respond(404, {"message": "Garden not found"})

        return respond(200, {
            "message": "Garden updated successfully",
            "garden": updated_garden
        })

    except json.JSONDecodeError:
        return respond(400, {"message": "Invalid JSON body"})
    except ClientError as e:
        print(f"DynamoDB error: {e}")
        return respond(500, {"message": "Database error occurred"})
    except Exception as e:
        print(f"Unexpected error: {e}")
        return respond(500, {"message": "Internal server error"})