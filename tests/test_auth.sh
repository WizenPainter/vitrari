#!/bin/bash

# Vitrari Authentication System Test Script
# This script tests the authentication endpoints to ensure they work correctly

set -e  # Exit on any error

BASE_URL="http://localhost:9997"
API_URL="$BASE_URL/api"

echo "🚀 Testing Vitrari Authentication System"
echo "=========================================="
echo "Base URL: $BASE_URL"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "SUCCESS")
            echo -e "${GREEN}✅ SUCCESS:${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}❌ ERROR:${NC} $message"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  INFO:${NC} $message"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  WARNING:${NC} $message"
            ;;
    esac
}

# Function to make HTTP requests
make_request() {
    local method=$1
    local url=$2
    local data=$3
    local headers=$4

    if [ -n "$headers" ]; then
        curl -s -X "$method" "$url" \
            -H "Content-Type: application/json" \
            -H "$headers" \
            -d "$data" \
            -w "\nHTTP_STATUS:%{http_code}\n"
    else
        curl -s -X "$method" "$url" \
            -H "Content-Type: application/json" \
            -d "$data" \
            -w "\nHTTP_STATUS:%{http_code}\n"
    fi
}

# Test variables
TEST_EMAIL="test@vitrari.com"
TEST_PASSWORD="SecurePassword123!"
TEST_FIRSTNAME="John"
TEST_LASTNAME="Doe"
JWT_TOKEN=""

echo "🔧 Test Configuration:"
echo "   Email: $TEST_EMAIL"
echo "   Password: [REDACTED]"
echo "   Name: $TEST_FIRSTNAME $TEST_LASTNAME"
echo ""

# Test 1: Health Check
echo "📊 Test 1: Health Check"
echo "----------------------"
response=$(make_request "GET" "$API_URL/health" "" "")
http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)

if [ "$http_status" = "200" ]; then
    print_status "SUCCESS" "Health check passed"
    echo "Response: $(echo "$response" | grep -v "HTTP_STATUS:")"
else
    print_status "ERROR" "Health check failed (Status: $http_status)"
    echo "Response: $(echo "$response" | grep -v "HTTP_STATUS:")"
fi
echo ""

# Test 2: User Registration
echo "👤 Test 2: User Registration"
echo "----------------------------"
signup_data="{
    \"firstName\": \"$TEST_FIRSTNAME\",
    \"lastName\": \"$TEST_LASTNAME\",
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
}"

response=$(make_request "POST" "$API_URL/auth/signup" "$signup_data" "")
http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)

if [ "$http_status" = "201" ] || [ "$http_status" = "409" ]; then
    if [ "$http_status" = "201" ]; then
        print_status "SUCCESS" "User registration successful"
    else
        print_status "INFO" "User already exists (Status: $http_status)"
    fi
    echo "Response: $(echo "$response" | grep -v "HTTP_STATUS:")"
else
    print_status "ERROR" "User registration failed (Status: $http_status)"
    echo "Response: $(echo "$response" | grep -v "HTTP_STATUS:")"
fi
echo ""

# Test 3: User Login
echo "🔐 Test 3: User Login"
echo "--------------------"
login_data="{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"rememberMe\": false
}"

response=$(make_request "POST" "$API_URL/auth/login" "$login_data" "")
http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
response_body=$(echo "$response" | grep -v "HTTP_STATUS:")

if [ "$http_status" = "200" ]; then
    print_status "SUCCESS" "User login successful"
    # Extract JWT token from response
    JWT_TOKEN=$(echo "$response_body" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$JWT_TOKEN" ]; then
        print_status "INFO" "JWT token extracted (Length: ${#JWT_TOKEN})"
    else
        print_status "WARNING" "JWT token not found in response"
    fi
    echo "Response: $response_body"
else
    print_status "ERROR" "User login failed (Status: $http_status)"
    echo "Response: $response_body"
fi
echo ""

# Test 4: Protected Route Access (if we have a token)
if [ -n "$JWT_TOKEN" ]; then
    echo "🔒 Test 4: Protected Route Access"
    echo "--------------------------------"

    response=$(make_request "GET" "$API_URL/auth/me" "" "Authorization: Bearer $JWT_TOKEN")
    http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)

    if [ "$http_status" = "200" ]; then
        print_status "SUCCESS" "Protected route access successful"
        echo "Response: $(echo "$response" | grep -v "HTTP_STATUS:")"
    else
        print_status "ERROR" "Protected route access failed (Status: $http_status)"
        echo "Response: $(echo "$response" | grep -v "HTTP_STATUS:")"
    fi
    echo ""
fi

# Test 5: Invalid Login Attempt
echo "🚫 Test 5: Invalid Login Attempt"
echo "--------------------------------"
invalid_login_data="{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"WrongPassword123!\",
    \"rememberMe\": false
}"

response=$(make_request "POST" "$API_URL/auth/login" "$invalid_login_data" "")
http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)

if [ "$http_status" = "401" ]; then
    print_status "SUCCESS" "Invalid login properly rejected"
    echo "Response: $(echo "$response" | grep -v "HTTP_STATUS:")"
else
    print_status "ERROR" "Invalid login test failed - wrong status code (Status: $http_status)"
    echo "Response: $(echo "$response" | grep -v "HTTP_STATUS:")"
fi
echo ""

# Test 6: Forgot Password
echo "🔑 Test 6: Forgot Password"
echo "-------------------------"
forgot_data="{
    \"email\": \"$TEST_EMAIL\"
}"

response=$(make_request "POST" "$API_URL/auth/forgot-password" "$forgot_data" "")
http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)

if [ "$http_status" = "200" ]; then
    print_status "SUCCESS" "Forgot password request accepted"
    echo "Response: $(echo "$response" | grep -v "HTTP_STATUS:")"
else
    print_status "ERROR" "Forgot password request failed (Status: $http_status)"
    echo "Response: $(echo "$response" | grep -v "HTTP_STATUS:")"
fi
echo ""

# Test 7: Access Without Token
echo "🔓 Test 7: Access Without Authentication"
echo "---------------------------------------"
response=$(make_request "GET" "$API_URL/auth/me" "" "")
http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)

if [ "$http_status" = "401" ]; then
    print_status "SUCCESS" "Unauthenticated access properly blocked"
    echo "Response: $(echo "$response" | grep -v "HTTP_STATUS:")"
else
    print_status "ERROR" "Unauthenticated access test failed (Status: $http_status)"
    echo "Response: $(echo "$response" | grep -v "HTTP_STATUS:")"
fi
echo ""

# Test 8: Logout (if we have a token)
if [ -n "$JWT_TOKEN" ]; then
    echo "🚪 Test 8: User Logout"
    echo "---------------------"

    response=$(make_request "POST" "$API_URL/auth/logout" "" "Authorization: Bearer $JWT_TOKEN")
    http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)

    if [ "$http_status" = "200" ]; then
        print_status "SUCCESS" "User logout successful"
        echo "Response: $(echo "$response" | grep -v "HTTP_STATUS:")"
    else
        print_status "ERROR" "User logout failed (Status: $http_status)"
        echo "Response: $(echo "$response" | grep -v "HTTP_STATUS:")"
    fi
    echo ""
fi

# Test 9: Frontend Auth Page
echo "🎨 Test 9: Frontend Auth Page"
echo "-----------------------------"
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" "$BASE_URL/auth")
http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)

if [ "$http_status" = "200" ]; then
    # Check if the response contains expected elements
    if echo "$response" | grep -q "Vitrari" && echo "$response" | grep -q "login"; then
        print_status "SUCCESS" "Auth page loads correctly with Vitrari branding"
    else
        print_status "WARNING" "Auth page loads but may be missing expected content"
    fi
else
    print_status "ERROR" "Auth page failed to load (Status: $http_status)"
fi
echo ""

echo "🏁 Test Summary"
echo "==============="
echo "All authentication tests completed!"
echo ""
echo "📋 Manual Testing Instructions:"
echo "1. Open your browser and go to: $BASE_URL/auth"
echo "2. Try creating an account with:"
echo "   - Email: your-email@example.com"
echo "   - Password: A secure password (8+ characters)"
echo "3. Test the login/signup toggle functionality"
echo "4. Verify password strength indicator works"
echo "5. Test form validations"
echo ""
echo "🔗 Available Endpoints:"
echo "   - GET  $BASE_URL/auth           (Auth page)"
echo "   - POST $API_URL/auth/signup     (User registration)"
echo "   - POST $API_URL/auth/login      (User login)"
echo "   - POST $API_URL/auth/logout     (User logout)"
echo "   - GET  $API_URL/auth/me         (Current user info)"
echo "   - POST $API_URL/auth/forgot-password (Password reset)"
echo "   - GET  $API_URL/health          (Health check)"
echo ""
print_status "INFO" "Testing complete! 🎉"
