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