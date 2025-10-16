# Florify Backend Troubleshooting Guide

## Issue: "Network error. Please try again" during signup

### Root Cause Analysis
The "Network error" during signup is likely caused by:
1. **Missing Lambda functions** - Only `florify-backend-dev-hello` appears in CloudWatch
2. **Insufficient IAM permissions** - Lambda functions can't be deployed or executed properly
3. **API Gateway configuration issues** - Endpoints not properly configured

### Solution Steps

#### Step 1: Fix IAM Permissions
The current IAM policy in `serverless.yml` is missing critical permissions for:
- Lambda function deployment and execution
- CloudWatch Logs creation
- API Gateway management
- CloudFormation operations

**Fixed IAM Policy**: Use the updated `serverless.yml` or `serverless_auth_only.yml` with comprehensive permissions.

#### Step 2: Deploy Authentication Functions First
```bash
cd /workspace/backend
./deploy.sh
```

This script will:
1. Deploy authentication functions first (signup, login, confirm, resend)
2. Test the deployment
3. Deploy the full application with DynamoDB and S3
4. Update frontend configuration automatically

#### Step 3: Manual Deployment (if script fails)
```bash
# Deploy auth functions only
serverless deploy --config serverless_auth_only.yml --stage dev

# Deploy full application
serverless deploy --stage dev
```

#### Step 4: Verify Deployment
```bash
# Check deployed functions
serverless info --stage dev

# Test signup endpoint
curl -X POST https://your-api-id.execute-api.eu-north-1.amazonaws.com/dev/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"TestPass123!"}'
```

### Expected CloudWatch Log Groups
After successful deployment, you should see:
- `florify-auth-dev-signup`
- `florify-auth-dev-login`
- `florify-auth-dev-confirm`
- `florify-auth-dev-resend`
- `florify-auth-dev-gardens` (if full deployment)

### Common Issues and Solutions

#### Issue 1: "AWS provider credentials not found"
**Solution**: Configure AWS credentials
```bash
aws configure
# Enter your Access Key ID, Secret Access Key, and region (eu-north-1)
```

#### Issue 2: "Serverless plugin not found"
**Solution**: Install required plugins
```bash
cd /workspace/backend
serverless plugin install -n serverless-python-requirements
```

#### Issue 3: "Access Denied" errors during deployment
**Solution**: Ensure your AWS user/role has the permissions in `iam-policy.json`

#### Issue 4: CORS errors in browser
**Solution**: The CORS configuration in serverless.yml should handle this, but if issues persist:
1. Check API Gateway CORS settings in AWS Console
2. Verify frontend is calling the correct API URL
3. Ensure preflight OPTIONS requests are handled

#### Issue 5: Lambda functions not appearing in CloudWatch
**Solution**: 
1. Check IAM permissions for CloudWatch Logs
2. Verify Lambda functions are actually deployed
3. Check CloudFormation stack status in AWS Console

### Testing the Fix

#### 1. Test Signup Endpoint
```bash
curl -X POST https://your-api-id.execute-api.eu-north-1.amazonaws.com/dev/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com", 
    "password": "TestPass123!"
  }'
```

**Expected Response**: `{"message": "Signup successful! Please verify your email."}`

#### 2. Test Frontend Integration
1. Update `florify-frontend/src/api/auth.js` with correct API URL
2. Start frontend: `cd florify-frontend && npm run dev`
3. Try signing up through the UI
4. Check browser DevTools Network tab for API calls

#### 3. Monitor CloudWatch Logs
1. Go to AWS Console → CloudWatch → Log Groups
2. Look for `florify-auth-dev-*` log groups
3. Check logs for any errors during signup attempts

### Prevention for Future Deployments

1. **Always use the comprehensive IAM policy** provided in the updated `serverless.yml`
2. **Deploy authentication functions first** before the full application
3. **Test each endpoint** after deployment
4. **Monitor CloudWatch logs** for any issues
5. **Keep AWS credentials updated** and properly configured

### Emergency Rollback

If deployment fails and you need to rollback:
```bash
# Remove the failed deployment
serverless remove --stage dev

# Deploy auth functions only
serverless deploy --config serverless_auth_only.yml --stage dev
```

### Support

If issues persist after following this guide:
1. Check AWS CloudFormation console for stack errors
2. Review CloudWatch logs for specific error messages
3. Verify all environment variables are correctly set
4. Ensure Cognito User Pool is properly configured