import boto3, json, os

client = boto3.client("cognito-idp")

def handler(event, context):
    body = json.loads(event["body"])

    response = client.initiate_auth(
        AuthFlow="USER_PASSWORD_AUTH",
        AuthParameters={
            "USERNAME": body["email"],
            "PASSWORD": body["password"]
        },
        ClientId=os.environ["CLIENT_ID"]
    )

    return {"statusCode": 200, "body": json.dumps({"message": "Login success", "response": response})}
