#!/bin/bash

# Florify Garden Endpoints Testing Script
# This script tests all the garden CRUD endpoints

set -e

# Get API URL from serverless info
echo "🔍 Getting API Gateway URL..."
API_URL=$(serverless info --config serverless_simplified.yml --stage dev | grep "endpoint:" | awk '{print $2}')

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

# Test 4: Create garden (without auth - should fail)
echo "🧪 Testing create garden without auth (should fail)..."
CREATE_GARDEN_RESPONSE=$(curl -s -X POST "$API_URL/gardens" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Garden",
    "location": "123 Test St",
    "description": "A test garden"
  }')
echo "Response: $CREATE_GARDEN_RESPONSE"
echo ""

# Test 5: Get gardens (without auth - should fail)
echo "🧪 Testing get gardens without auth (should fail)..."
GET_GARDENS_RESPONSE=$(curl -s -X GET "$API_URL/gardens")
echo "Response: $GET_GARDENS_RESPONSE"
echo ""

# Test 6: Create garden with mock token
echo "🧪 Testing create garden with mock token..."
CREATE_GARDEN_AUTH_RESPONSE=$(curl -s -X POST "$API_URL/gardens" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mock-token" \
  -d '{
    "name": "Test Garden",
    "location": "123 Test St",
    "description": "A test garden"
  }')
echo "Response: $CREATE_GARDEN_AUTH_RESPONSE"
echo ""

# Extract garden ID if creation was successful
GARDEN_ID=$(echo $CREATE_GARDEN_AUTH_RESPONSE | grep -o '"gardenId":"[^"]*"' | cut -d'"' -f4)

if [ -n "$GARDEN_ID" ]; then
    echo "✅ Garden created with ID: $GARDEN_ID"
    
    # Test 7: Get gardens with mock token
    echo "🧪 Testing get gardens with mock token..."
    GET_GARDENS_AUTH_RESPONSE=$(curl -s -X GET "$API_URL/gardens" \
      -H "Authorization: Bearer mock-token")
    echo "Response: $GET_GARDENS_AUTH_RESPONSE"
    echo ""
    
    # Test 8: Get specific garden
    echo "🧪 Testing get specific garden..."
    GET_GARDEN_RESPONSE=$(curl -s -X GET "$API_URL/gardens/$GARDEN_ID" \
      -H "Authorization: Bearer mock-token")
    echo "Response: $GET_GARDEN_RESPONSE"
    echo ""
    
    # Test 9: Update garden
    echo "🧪 Testing update garden..."
    UPDATE_GARDEN_RESPONSE=$(curl -s -X PUT "$API_URL/gardens/$GARDEN_ID" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer mock-token" \
      -d '{
        "name": "Updated Test Garden",
        "location": "456 Updated St",
        "description": "An updated test garden"
      }')
    echo "Response: $UPDATE_GARDEN_RESPONSE"
    echo ""
    
    # Test 10: Delete garden
    echo "🧪 Testing delete garden..."
    DELETE_GARDEN_RESPONSE=$(curl -s -X DELETE "$API_URL/gardens/$GARDEN_ID" \
      -H "Authorization: Bearer mock-token")
    echo "Response: $DELETE_GARDEN_RESPONSE"
    echo ""
    
else
    echo "⚠️  Garden creation failed, skipping garden-specific tests"
fi

echo "✅ Garden endpoint testing completed!"
echo ""
echo "📋 Next steps:"
echo "1. Test with real JWT tokens from Cognito"
echo "2. Test frontend integration"
echo "3. Check CloudWatch logs for any errors"