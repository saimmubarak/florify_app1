# Florify Backend Deployment and Testing Guide

## 🚀 Quick Start

### Prerequisites
- AWS CLI configured with appropriate permissions
- Node.js and npm installed
- Python 3.9+ installed

### Step 1: Configure AWS Credentials
```bash
aws configure
# Enter your Access Key ID, Secret Access Key, and region (eu-north-1)
```

### Step 2: Deploy Backend
```bash
cd /workspace/backend
./deploy.sh
```

This will:
1. Deploy authentication functions first
2. Test the deployment
3. Deploy the full application
4. Update frontend configuration

### Step 3: Test the Deployment
```bash
cd /workspace/backend
./test_endpoints.sh
```

### Step 4: Start Frontend
```bash
cd /workspace/florify-frontend
npm install
npm run dev
```

## 🔧 Manual Deployment (if automated script fails)

### Deploy Authentication Functions Only
```bash
cd /workspace/backend
serverless deploy --config serverless_auth_only.yml --stage dev
```

### Deploy Full Application
```bash
serverless deploy --stage dev
```

## 🧪 Testing the Signup Functionality

### 1. Test API Endpoints Directly

#### Test Signup
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

#### Test Login (should fail with unconfirmed user)
```bash
curl -X POST https://your-api-id.execute-api.eu-north-1.amazonaws.com/dev/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

**Expected Response**: `{"message": "Please confirm your email before logging in"}`

#### Test Resend Confirmation Code
```bash
curl -X POST https://your-api-id.execute-api.eu-north-1.amazonaws.com/dev/resend \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

**Expected Response**: `{"message": "Confirmation code resent successfully."}`

### 2. Test Frontend Integration

1. Open `http://localhost:5173` in your browser
2. Navigate to the signup page
3. Fill in the signup form with test data
4. Submit the form
5. Check browser DevTools → Network tab for API calls
6. Check browser DevTools → Console for any errors

### 3. Monitor CloudWatch Logs

1. Go to AWS Console → CloudWatch → Log Groups
2. Look for these log groups:
   - `florify-auth-dev-signup`
   - `florify-auth-dev-login`
   - `florify-auth-dev-confirm`
   - `florify-auth-dev-resend`
   - `florify-auth-dev-gardens`

## 🔍 Troubleshooting

### Issue: "Network error. Please try again"

**Possible Causes:**
1. Lambda functions not deployed
2. API Gateway not configured
3. CORS issues
4. IAM permissions insufficient

**Solutions:**
1. Check if functions are deployed: `serverless info --stage dev`
2. Verify API Gateway URL in frontend config
3. Check CloudWatch logs for errors
4. Ensure IAM permissions are correct

### Issue: Lambda functions not appearing in CloudWatch

**Solution:**
1. Check IAM permissions for CloudWatch Logs
2. Verify Lambda functions are actually deployed
3. Check CloudFormation stack status

### Issue: CORS errors in browser

**Solution:**
1. Check API Gateway CORS settings
2. Verify frontend is calling correct API URL
3. Ensure preflight OPTIONS requests are handled

### Issue: "Access Denied" during deployment

**Solution:**
1. Ensure your AWS user/role has permissions in `iam-policy.json`
2. Check if you're using the correct AWS profile
3. Verify region is set to `eu-north-1`

## 📋 Verification Checklist

- [ ] AWS credentials configured
- [ ] Authentication functions deployed
- [ ] API Gateway URL accessible
- [ ] Signup endpoint returns success
- [ ] CloudWatch logs show function invocations
- [ ] Frontend can call API endpoints
- [ ] CORS headers present in responses
- [ ] Error handling works properly

## 🚨 Emergency Rollback

If deployment fails:
```bash
# Remove failed deployment
serverless remove --stage dev

# Deploy auth functions only
serverless deploy --config serverless_auth_only.yml --stage dev
```

## 📞 Support

If issues persist:
1. Check AWS CloudFormation console for stack errors
2. Review CloudWatch logs for specific error messages
3. Verify all environment variables are correctly set
4. Ensure Cognito User Pool is properly configured

## 🔄 Next Steps After Successful Deployment

1. **Test Complete User Flow:**
   - Signup → Email confirmation → Login → Create garden

2. **Monitor Performance:**
   - Check CloudWatch metrics
   - Monitor API Gateway latency
   - Watch for any error rates

3. **Security Review:**
   - Verify IAM permissions are minimal required
   - Check CORS configuration
   - Review API Gateway access logs

4. **Production Preparation:**
   - Update CORS to specific domains only
   - Set up proper monitoring and alerting
   - Configure backup and disaster recovery