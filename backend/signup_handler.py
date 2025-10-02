import boto3, json, os

client = boto3.client("cognito-idp")

def handler(event, context):
    body = json.loads(event["body"])

    # simple password check
    password = body["password"]
    if not any(c.isupper() for c in password):
        return {"statusCode": 400, "body": json.dumps({"error": "Password must have an uppercase letter"})}
    if not any(c in "!@#$%^&*()-_=+" for c in password):
        return {"statusCode": 400, "body": json.dumps({"error": "Password must have a special character"})}

    response = client.sign_up(
        ClientId=os.environ["CLIENT_ID"],
        Username=body["email"],
        Password=password,
        UserAttributes=[
            {"Name": "email", "Value": body["email"]},
            {"Name": "name", "Value": body["name"]}
        ]
    )

    return {"statusCode": 200, "body": json.dumps({"message": "User signed up", "response": response})}
