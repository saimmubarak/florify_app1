#!/bin/bash

# Florify Backend Deployment Script
# This script deploys the authentication functions first, then the full application

set -e  # Exit on any error

echo "🚀 Starting Florify Backend Deployment..."

# Check if AWS credentials are configured
echo "📋 Checking AWS credentials..."
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS credentials configured"

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Deploy authentication functions first
echo "🔐 Deploying authentication functions..."
serverless deploy --config serverless_auth_only.yml --stage dev

if [ $? -eq 0 ]; then
    echo "✅ Authentication functions deployed successfully!"
    
    # Get the API Gateway URL
    API_URL=$(serverless info --config serverless_auth_only.yml --stage dev | grep "endpoint:" | awk '{print $2}')
    echo "🌐 API Gateway URL: $API_URL"
    
    # Test the hello endpoint
    echo "🧪 Testing hello endpoint..."
    curl -X GET "$API_URL/hello" || echo "⚠️  Hello endpoint test failed"
    
    # Deploy full application
    echo "🏗️  Deploying full application with DynamoDB and S3..."
    serverless deploy --stage dev
    
    if [ $? -eq 0 ]; then
        echo "✅ Full application deployed successfully!"
        
        # Get the final API Gateway URL
        FINAL_API_URL=$(serverless info --stage dev | grep "endpoint:" | awk '{print $2}')
        echo "🌐 Final API Gateway URL: $FINAL_API_URL"
        
        # Update frontend configuration
        echo "📝 Updating frontend configuration..."
        FRONTEND_CONFIG="/workspace/florify-frontend/src/api/auth.js"
        if [ -f "$FRONTEND_CONFIG" ]; then
            # Extract the base URL (remove /dev from the end)
            BASE_URL=$(echo $FINAL_API_URL | sed 's|/dev$||')
            sed -i "s|const API_BASE_URL = .*|const API_BASE_URL = \"$BASE_URL\";|" "$FRONTEND_CONFIG"
            echo "✅ Frontend configuration updated with API URL: $BASE_URL"
        fi
        
        echo ""
        echo "🎉 Deployment completed successfully!"
        echo "📋 Next steps:"
        echo "1. Test the signup endpoint: curl -X POST $FINAL_API_URL/signup -H 'Content-Type: application/json' -d '{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"TestPass123!\"}'"
        echo "2. Check CloudWatch logs if you encounter any issues"
        echo "3. Update your frontend to use the new API URL"
        
    else
        echo "❌ Full application deployment failed"
        exit 1
    fi
else
    echo "❌ Authentication functions deployment failed"
    exit 1
fi