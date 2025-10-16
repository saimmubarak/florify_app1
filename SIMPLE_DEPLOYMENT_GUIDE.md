# 🚀 Simple Florify Deployment Guide

## Overview
This is a simplified version of Florify with just the essentials:
- **Backend**: AWS Lambda + DynamoDB (no S3, no complex IAM)
- **Frontend**: React with simple garden management
- **One file**: `serverless.yml` (no multiple configs)

## 📋 Prerequisites
1. AWS CLI configured: `aws configure`
2. Serverless Framework: `npm install -g serverless@3.38.0`
3. Node.js and npm installed

## 🔧 Manual Deployment Steps

### Step 1: Configure AWS Credentials
```bash
aws configure
# Enter your Access Key ID, Secret Access Key, and region (eu-north-1)
```

### Step 2: Deploy Backend
```bash
cd /workspace/backend
serverless deploy --stage dev
```

**Wait for this to complete** - it will show you the API Gateway URL at the end.

### Step 3: Update Frontend API URL
After deployment, you'll get a URL like:
`https://abc123.execute-api.eu-north-1.amazonaws.com/dev`

Update these files with your actual API URL:
1. `florify-frontend/src/api/auth.js` - Replace `YOUR_API_ID` with your actual API ID
2. `florify-frontend/src/api/gardens.js` - Replace `YOUR_API_ID` with your actual API ID

### Step 4: Start Frontend
```bash
cd /workspace/florify-frontend
npm install
npm run dev
```

## 🧪 Test the Application

### Test 1: Hello Endpoint
```bash
curl https://YOUR_API_ID.execute-api.eu-north-1.amazonaws.com/dev/hello
```
Should return: `"Hello from Florify backend!"`

### Test 2: Create Garden
```bash
curl -X POST https://YOUR_API_ID.execute-api.eu-north-1.amazonaws.com/dev/gardens \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Test Garden",
    "location": "123 Main St",
    "description": "A beautiful garden"
  }'
```

### Test 3: Get Gardens
```bash
curl https://YOUR_API_ID.execute-api.eu-north-1.amazonaws.com/dev/gardens
```

## 🎯 What Works Now

### Backend (AWS Lambda)
- ✅ User signup/login (Cognito)
- ✅ Create garden
- ✅ Get all gardens
- ✅ Get specific garden
- ✅ Update garden
- ✅ Delete garden
- ✅ Simple DynamoDB storage

### Frontend (React)
- ✅ User authentication pages
- ✅ Garden creation form
- ✅ Garden list view
- ✅ Garden detail/edit page
- ✅ Simple navigation

## 🔍 Troubleshooting

### If deployment fails:
1. **Check AWS credentials**: `aws sts get-caller-identity`
2. **Check region**: Make sure you're in `eu-north-1`
3. **Check permissions**: Your AWS user needs Lambda, DynamoDB, and API Gateway permissions

### If frontend can't connect:
1. **Check API URL**: Make sure you updated both `auth.js` and `gardens.js`
2. **Check CORS**: The backend has CORS enabled
3. **Check network**: Open browser DevTools to see the actual error

### If gardens don't work:
1. **Check DynamoDB**: Go to AWS Console → DynamoDB → Tables
2. **Check Lambda logs**: Go to AWS Console → CloudWatch → Log Groups
3. **Test with curl**: Use the test commands above

## 📁 File Structure
```
/workspace/
├── backend/
│   ├── serverless.yml          # ONE config file
│   ├── signup_handler.py       # User signup
│   ├── login_handler.py        # User login
│   ├── confirm_handler.py      # Email confirmation
│   ├── resend_handler.py       # Resend confirmation
│   ├── create_garden_handler.py # Create garden
│   ├── get_gardens_handler.py  # Get all gardens
│   ├── get_garden_handler.py   # Get specific garden
│   ├── update_garden_handler.py # Update garden
│   ├── delete_garden_handler.py # Delete garden
│   └── handler.py              # Hello endpoint
└── florify-frontend/
    ├── src/
    │   ├── api/
    │   │   ├── auth.js         # Authentication API
    │   │   └── gardens.js      # Garden API
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── SignupPage.jsx
    │   │   ├── LandingPage.jsx
    │   │   └── GardenDetailPage.jsx
    │   └── components/
    │       ├── CreateGardenForm.jsx
    │       └── SimpleCreateGardenWizard.jsx
    └── package.json
```

## 🚀 Next Steps (After Basic Deployment Works)

1. **Add Real Authentication**: Replace `user-123` with actual JWT user ID
2. **Add Error Handling**: Better error messages
3. **Add Validation**: Form validation
4. **Add Images**: S3 integration for garden photos
5. **Add Location**: Google Maps integration

## 💡 Why This is Simpler

- **One config file**: No multiple serverless.yml files
- **No shell scripts**: Manual commands only
- **No complex IAM**: Basic permissions that work
- **No S3**: Just DynamoDB for now
- **No JWT complexity**: Simple user ID for now
- **Clear structure**: Easy to understand and modify

## 🆘 If You Get Stuck

1. **Check the deployment output**: Look for the API Gateway URL
2. **Check AWS Console**: Look at Lambda functions and DynamoDB table
3. **Check CloudWatch logs**: Look for error messages
4. **Test with curl**: Use the test commands to verify endpoints work
5. **Check frontend console**: Open browser DevTools to see errors

This approach is much simpler and should deploy quickly without the CloudFormation complexity!