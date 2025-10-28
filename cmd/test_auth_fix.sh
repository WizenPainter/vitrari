#!/bin/bash

# Test script to verify authentication fix
# This script tests the login flow and cookie setting behavior

BASE_URL="http://localhost:9995"
COOKIE_JAR="/tmp/auth_test_cookies.txt"

echo "🔐 Testing Authentication Fix"
echo "============================="
echo

# Clean up any existing cookies
rm -f $COOKIE_JAR

echo "1. Testing login with Remember Me = false"
echo "----------------------------------------"

# Test login without remember me
LOGIN_RESPONSE=$(curl -s -c $COOKIE_JAR -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@vitrari.com",
    "password": "testpassword",
    "rememberMe": false
  }' \
  "$BASE_URL/api/auth/login")

echo "Login Response:"
echo $LOGIN_RESPONSE | jq '.' 2>/dev/null || echo $LOGIN_RESPONSE
echo

# Check if auth_token cookie was set
echo "2. Checking if auth_token cookie was set"
echo "---------------------------------------"

if [ -f $COOKIE_JAR ]; then
    echo "Cookie file exists. Contents:"
    cat $COOKIE_JAR
    echo

    if grep -q "auth_token" $COOKIE_JAR; then
        echo "✅ SUCCESS: auth_token cookie was set"
        AUTH_TOKEN_SET=true
    else
        echo "❌ FAILURE: auth_token cookie was NOT set"
        AUTH_TOKEN_SET=false
    fi
else
    echo "❌ FAILURE: No cookie file created"
    AUTH_TOKEN_SET=false
fi
echo

echo "3. Testing protected page access"
echo "-------------------------------"

# Try to access a protected page using the cookies
PROTECTED_RESPONSE=$(curl -s -b $COOKIE_JAR -w "%{http_code}" -o /tmp/protected_response.html "$BASE_URL/designer")
HTTP_CODE=$PROTECTED_RESPONSE

echo "HTTP Status Code: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ SUCCESS: Protected page accessible with cookie"
    PROTECTED_ACCESS=true

    # Check if the response contains user info (not login form)
    if grep -q "user-menu" /tmp/protected_response.html; then
        echo "✅ SUCCESS: User menu found in response (user authenticated)"
        USER_MENU_FOUND=true
    else
        echo "❌ WARNING: No user menu found - might still be showing login"
        USER_MENU_FOUND=false
    fi
elif [ "$HTTP_CODE" = "302" ]; then
    echo "❌ FAILURE: Got redirect (302) - likely redirected to auth page"
    PROTECTED_ACCESS=false
    USER_MENU_FOUND=false
else
    echo "❌ FAILURE: Unexpected HTTP code: $HTTP_CODE"
    PROTECTED_ACCESS=false
    USER_MENU_FOUND=false
fi
echo

echo "4. Testing /api/auth/me endpoint"
echo "------------------------------"

# Test the /me endpoint to verify token validation
ME_RESPONSE=$(curl -s -b $COOKIE_JAR -w "%{http_code}" "$BASE_URL/api/auth/me")
ME_HTTP_CODE=$(echo "$ME_RESPONSE" | tail -c 4)
ME_BODY=$(echo "$ME_RESPONSE" | head -c -4)

echo "HTTP Status Code: $ME_HTTP_CODE"
echo "Response Body:"
echo $ME_BODY | jq '.' 2>/dev/null || echo $ME_BODY
echo

if [ "$ME_HTTP_CODE" = "200" ]; then
    echo "✅ SUCCESS: /api/auth/me endpoint accessible"
    ME_ACCESS=true
else
    echo "❌ FAILURE: /api/auth/me endpoint not accessible"
    ME_ACCESS=false
fi
echo

echo "5. Summary"
echo "=========="

echo "Test Results:"
echo "- Auth token cookie set: $([ "$AUTH_TOKEN_SET" = true ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "- Protected page access: $([ "$PROTECTED_ACCESS" = true ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "- User menu displayed: $([ "$USER_MENU_FOUND" = true ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "- /api/auth/me access: $([ "$ME_ACCESS" = true ] && echo "✅ PASS" || echo "❌ FAIL")"
echo

if [ "$AUTH_TOKEN_SET" = true ] && [ "$PROTECTED_ACCESS" = true ] && [ "$USER_MENU_FOUND" = true ] && [ "$ME_ACCESS" = true ]; then
    echo "🎉 ALL TESTS PASSED - Authentication fix is working!"
    exit 0
else
    echo "❌ SOME TESTS FAILED - Authentication fix needs more work"
    echo
    echo "Debugging Info:"
    echo "- Check if the server is running on port 9995"
    echo "- Check if test user exists (test@vitrari.com / testpassword)"
    echo "- Check server logs for any errors"
    exit 1
fi

# Cleanup
rm -f $COOKIE_JAR /tmp/protected_response.html
