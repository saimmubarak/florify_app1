# AWS Backend Migration - Deployment and Testing Guide

This document provides step-by-step instructions for deploying the migrated AWS-backed gardens application and verifying its functionality.

## Prerequisites

- AWS CLI configured with appropriate permissions
- Serverless Framework installed (`npm install -g serverless`)
- Node.js and npm for frontend
- Valid AWS credentials with permissions for:
  - Lambda functions
  - DynamoDB
  - S3
  - Cognito User Pools

## Deployment Steps

### 1. Deploy Backend Infrastructure

Navigate to the backend directory and deploy the serverless application:

```bash
cd backend
serverless deploy --stage dev
```

After successful deployment, note the API Gateway endpoints that are printed. You'll need these for frontend configuration.

### 2. Update Frontend Configuration

Update the frontend configuration to point to your deployed API:

1. Open `florify-frontend/src/config.js`
2. Update `API_BASE_URL` to your deployed API Gateway URL (e.g., `https://your-api-id.execute-api.eu-north-1.amazonaws.com/dev`)

### 3. Deploy Frontend

```bash
cd florify-frontend
npm install
npm run build
# Deploy to your preferred hosting service (e.g., S3, Vercel, Netlify)
```

## Testing Steps

### Step 1: Verify Infrastructure Deployment

1. **Check DynamoDB Table**: 
   - Go to AWS Console → DynamoDB
   - Verify table `florify-auth-gardens-dev` exists with:
     - Partition Key: `userId` (String)
     - Sort Key: `gardenId` (String)

2. **Check S3 Bucket**:
   - Go to AWS Console → S3
   - Verify bucket `florify-garden-images-dev` exists
   - Check CORS configuration allows your frontend domain

3. **Check Lambda Function**:
   - Go to AWS Console → Lambda
   - Verify `florify-auth-dev-gardens` function exists
   - Check environment variables are set correctly

### Step 2: Test Authentication Flow

1. **Login via Frontend**:
   - Open your deployed frontend
   - Login with valid Cognito credentials
   - Open browser DevTools → Application → Local Storage
   - Verify `token` contains a valid JWT

2. **Verify Token Structure**:
   - Copy the JWT token from localStorage
   - Decode at [jwt.io](https://jwt.io) to verify:
     - `iss` matches your Cognito User Pool
     - `sub` contains the user ID
     - `email` contains user email
     - Token is not expired

### Step 3: Test Gardens API Endpoints

#### Test 1: GET /gardens (Unauthenticated)

```bash
curl -X GET https://your-api-gateway-url/dev/gardens
```

**Expected**: 401 Unauthorized with message about invalid/missing token

#### Test 2: GET /gardens (Authenticated)

```bash
curl -X GET https://your-api-gateway-url/dev/gardens \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected**: 200 OK with `{"gardens": []}` for new user

#### Test 3: GET /gardens/upload-url

```bash
curl -X GET "https://your-api-gateway-url/dev/gardens/upload-url?filename=test.jpg&contentType=image/jpeg" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected**: 200 OK with presigned upload data and public URL

#### Test 4: POST /gardens (Create Garden)

```bash
curl -X POST https://your-api-gateway-url/dev/gardens \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Garden",
    "location": "123 Test St",
    "description": "A test garden",
    "imageUrl": "https://example.com/test.jpg"
  }'
```

**Expected**: 201 Created with the created garden object

#### Test 5: GET /gardens (After Creation)

```bash
curl -X GET https://your-api-gateway-url/dev/gardens \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected**: 200 OK with the created garden in the gardens array

### Step 4: Test Frontend Integration

1. **Create Garden with Image**:
   - Open frontend Create Garden Wizard
   - Fill in garden details
   - Select a location on the map
   - Upload an image
   - Submit the form

2. **Verify Image Upload**:
   - Check S3 bucket for uploaded image at path `gardens/{gardenId}/image.{extension}`
   - Verify image is publicly accessible via the returned URL

3. **Verify Garden Creation**:
   - Check DynamoDB table for the new garden item
   - Verify `userId` matches your Cognito `sub` value
   - Verify `imageUrl` points to the S3 object

### Step 5: Test User Isolation

1. **Create Garden with User A**:
   - Login as User A
   - Create a garden
   - Note the garden ID

2. **Verify User B Cannot See User A's Garden**:
   - Login as User B
   - Call GET /gardens
   - Verify User A's garden is not in the response

3. **Verify DynamoDB Query**:
   - Check DynamoDB table
   - Verify gardens have different `userId` values
   - Verify query by `userId` returns only that user's gardens

## Troubleshooting

### Common Issues

1. **401 Unauthorized**:
   - Check JWT token is valid and not expired
   - Verify Cognito User Pool ID in environment variables
   - Check token format includes "Bearer " prefix

2. **500 Internal Server Error**:
   - Check CloudWatch logs for Lambda function
   - Verify DynamoDB table permissions
   - Check S3 bucket permissions

3. **Image Upload Fails**:
   - Verify S3 bucket CORS configuration
   - Check presigned URL generation
   - Verify file size limits (10MB max)

4. **CORS Issues**:
   - Check API Gateway CORS configuration
   - Verify frontend domain is in allowed origins
   - Check preflight OPTIONS requests

### Debugging Commands

```bash
# Check Lambda logs
serverless logs -f gardens --stage dev

# Test DynamoDB query
aws dynamodb query \
  --table-name florify-auth-gardens-dev \
  --key-condition-expression "userId = :user_id" \
  --expression-attribute-values '{":user_id":{"S":"your-user-id"}}'

# Check S3 bucket contents
aws s3 ls s3://florify-garden-images-dev/gardens/ --recursive
```

## Security Verification

1. **JWT Verification**:
   - Tokens are properly validated against Cognito JWKS
   - Expired tokens are rejected
   - Invalid signatures are rejected
   - Issuer is verified against Cognito User Pool

2. **User Isolation**:
   - Users can only access their own gardens
   - DynamoDB queries use `userId` as partition key
   - No cross-user data leakage

3. **S3 Security**:
   - Images are uploaded to user-specific paths
   - Presigned URLs have expiration (1 hour)
   - File size limits are enforced (10MB)

## Performance Considerations

1. **JWKS Caching**:
   - JWKS are cached for 5 minutes to reduce API calls
   - Cache is refreshed automatically on expiration

2. **DynamoDB**:
   - Uses on-demand billing for cost efficiency
   - Queries are optimized with proper partition key usage

3. **S3**:
   - Images are stored with appropriate content types
   - Public read access for easy frontend integration

## Monitoring

1. **CloudWatch Metrics**:
   - Monitor Lambda invocations and errors
   - Track DynamoDB read/write capacity
   - Monitor S3 request metrics

2. **Logs**:
   - Lambda function logs in CloudWatch
   - API Gateway access logs
   - DynamoDB query logs

## Cleanup

To remove all resources:

```bash
cd backend
serverless remove --stage dev
```

Then manually delete the S3 bucket if it contains objects.