import boto3, json, os

client = boto3.client("cognito-idp")

def handler(event, context):
    body = json.loads(event["body"])

    response = client.confirm_sign_up(
        ClientId=os.environ["CLIENT_ID"],
        Username=body["email"],
        ConfirmationCode=body["code"]
    )

    return {"statusCode": 200, "body": json.dumps({"message": "User confirmed", "response": response})}
