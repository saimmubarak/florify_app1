#!/bin/bash

# Florify Backend Simplified Deployment Script
# This script deploys the simplified version without S3

set -e  # Exit on any error

echo "🚀 Starting Florify Backend Simplified Deployment..."

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

# Deploy simplified version
echo "🏗️  Deploying simplified application..."
serverless deploy --config serverless_simplified.yml --stage dev

if [ $? -eq 0 ]; then
    echo "✅ Simplified application deployed successfully!"
    
    # Get the API Gateway URL
    API_URL=$(serverless info --config serverless_simplified.yml --stage dev | grep "endpoint:" | awk '{print $2}')
    echo "🌐 API Gateway URL: $API_URL"
    
    # Test the hello endpoint
    echo "🧪 Testing hello endpoint..."
    curl -X GET "$API_URL/hello" || echo "⚠️  Hello endpoint test failed"
    
    # Update frontend configuration
    echo "📝 Updating frontend configuration..."
    FRONTEND_CONFIG="/workspace/florify-frontend/src/api/auth.js"
    if [ -f "$FRONTEND_CONFIG" ]; then
        # Extract the base URL (remove /dev from the end)
        BASE_URL=$(echo $API_URL | sed 's|/dev$||')
        sed -i "s|const API_BASE_URL = .*|const API_BASE_URL = \"$BASE_URL\";|" "$FRONTEND_CONFIG"
        echo "✅ Frontend configuration updated with API URL: $BASE_URL"
    fi
    
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo "📋 Next steps:"
    echo "1. Test the signup endpoint: curl -X POST $API_URL/signup -H 'Content-Type: application/json' -d '{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"TestPass123!\"}'"
    echo "2. Test garden creation: curl -X POST $API_URL/gardens -H 'Content-Type: application/json' -H 'Authorization: Bearer YOUR_TOKEN' -d '{\"name\":\"My Garden\",\"location\":\"123 Main St\",\"description\":\"A beautiful garden\"}'"
    echo "3. Test garden retrieval: curl -X GET $API_URL/gardens -H 'Authorization: Bearer YOUR_TOKEN'"
    echo "4. Check CloudWatch logs if you encounter any issues"
    echo "5. Update your frontend to use the new API URL"
    
else
    echo "❌ Deployment failed"
    exit 1
fi