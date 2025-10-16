#!/bin/bash

# Florify Backend Endpoint Testing Script
# This script tests all the authentication endpoints

set -e

# Get API URL from serverless info
echo "🔍 Getting API Gateway URL..."
API_URL=$(serverless info --stage dev | grep "endpoint:" | awk '{print $2}')

if [ -z "$API_URL" ]; then
    echo "❌ Could not get API Gateway URL. Make sure the backend is deployed."
    exit 1
fi

echo "🌐 API Gateway URL: $API_URL"
echo ""

# Test 1: Hello endpoint
echo "🧪 Testing hello endpoint..."
HELLO_RESPONSE=$(curl -s -X GET "$API_URL/hello")
echo "Response: $HELLO_RESPONSE"
echo ""

# Test 2: Signup endpoint
echo "🧪 Testing signup endpoint..."
SIGNUP_RESPONSE=$(curl -s -X POST "$API_URL/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123!"
  }')
echo "Response: $SIGNUP_RESPONSE"
echo ""

# Test 3: Login endpoint (should fail with unconfirmed user)
echo "🧪 Testing login endpoint (should fail with unconfirmed user)..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }')
echo "Response: $LOGIN_RESPONSE"
echo ""

# Test 4: Resend confirmation code
echo "🧪 Testing resend confirmation code endpoint..."
RESEND_RESPONSE=$(curl -s -X POST "$API_URL/resend" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }')
echo "Response: $RESEND_RESPONSE"
echo ""

echo "✅ Endpoint testing completed!"
echo ""
echo "📋 Next steps:"
echo "1. Check your email for the confirmation code"
echo "2. Use the confirmation code with the /confirm endpoint"
echo "3. Then try logging in again"
echo ""
echo "🔗 Test confirmation endpoint:"
echo "curl -X POST $API_URL/confirm -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",\"code\":\"YOUR_CODE\"}'"