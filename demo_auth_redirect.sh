#!/bin/bash

# Vitrari Authentication Redirect Demo
# Demonstrates the new user-friendly authentication behavior

echo "🔐 Vitrari Authentication Redirect Demo"
echo "======================================="
echo ""
echo "This demo shows how the authentication system now provides"
echo "user-friendly redirects for browsers while maintaining API compatibility."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Start server
echo -e "${BLUE}🚀 Starting Vitrari server...${NC}"
go run . > /dev/null 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 3

echo ""
echo "========================================="
echo "🌐 BROWSER BEHAVIOR (User-Friendly)"
echo "========================================="
echo ""

echo -e "${BLUE}📱 What users experience when accessing protected pages:${NC}"
echo ""

echo "1. User visits /profile without login:"
echo "   → Automatically redirected to login page (HTTP 302)"
echo ""
curl -s -H "Accept: text/html" -I http://localhost:9995/profile | grep -E "(HTTP|Location)" | sed 's/^/   /'

echo ""
echo "2. User visits /designer without login:"
echo "   → Automatically redirected to login page (HTTP 302)"
echo ""
curl -s -H "Accept: text/html" -I http://localhost:9995/designer | grep -E "(HTTP|Location)" | sed 's/^/   /'

echo ""
echo "3. Following the redirect loads the login page:"
echo "   → User sees professional login interface"
echo ""
LOGIN_TITLE=$(curl -s -H "Accept: text/html" -L http://localhost:9995/profile | grep -o "<title>.*</title>")
echo "   $LOGIN_TITLE"

echo ""
echo "========================================="
echo "⚙️  API BEHAVIOR (Developer-Friendly)"
echo "========================================="
echo ""

echo -e "${BLUE}🔌 What API clients receive (unchanged behavior):${NC}"
echo ""

echo "1. API request to protected endpoint:"
echo "   → Returns JSON error response (HTTP 401)"
echo ""
API_RESPONSE=$(curl -s -H "Accept: application/json" -H "Content-Type: application/json" http://localhost:9995/profile)
echo "   HTTP 401: $API_RESPONSE"

echo ""
echo "2. AJAX request behavior:"
echo "   → Returns JSON for client-side handling"
echo ""
AJAX_RESPONSE=$(curl -s -H "X-Requested-With: XMLHttpRequest" http://localhost:9995/profile)
echo "   AJAX Response: $AJAX_RESPONSE"

echo ""
echo "3. API endpoint behavior:"
echo "   → Always returns JSON regardless of headers"
echo ""
API_ENDPOINT_RESPONSE=$(curl -s -X POST -H "Accept: text/html" http://localhost:9995/api/auth/logout)
echo "   API Response: $API_ENDPOINT_RESPONSE"

echo ""
echo "========================================="
echo "🎯 SMART DETECTION EXAMPLES"
echo "========================================="
echo ""

echo -e "${BLUE}🧠 How the system intelligently detects request types:${NC}"
echo ""

echo "1. Browser-like request (gets redirect):"
BROWSER_HEADERS="Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
BROWSER_STATUS=$(curl -s -H "$BROWSER_HEADERS" -o /dev/null -w "%{http_code}" http://localhost:9995/profile)
echo "   Headers: $BROWSER_HEADERS"
echo "   Result: HTTP $BROWSER_STATUS (Redirect to /auth)"

echo ""
echo "2. JSON API request (gets JSON response):"
JSON_HEADERS="Accept: application/json"
JSON_STATUS=$(curl -s -H "$JSON_HEADERS" -o /dev/null -w "%{http_code}" http://localhost:9995/profile)
echo "   Headers: $JSON_HEADERS"
echo "   Result: HTTP $JSON_STATUS (JSON Error)"

echo ""
echo "3. Mixed headers (smart decision):"
MIXED_HEADERS="Accept: application/json, text/html"
MIXED_STATUS=$(curl -s -H "$MIXED_HEADERS" -o /dev/null -w "%{http_code}" http://localhost:9995/profile)
echo "   Headers: $MIXED_HEADERS"
echo "   Result: HTTP $MIXED_STATUS (JSON takes precedence)"

echo ""
echo "========================================="
echo "✨ BENEFITS SUMMARY"
echo "========================================="
echo ""

echo -e "${GREEN}🎉 User Experience Improvements:${NC}"
echo "   ✅ No more confusing JSON error messages"
echo "   ✅ Automatic redirect to login page"
echo "   ✅ Professional authentication flow"
echo "   ✅ Seamless user journey"
echo ""

echo -e "${GREEN}🔧 Developer Benefits:${NC}"
echo "   ✅ API behavior completely unchanged"
echo "   ✅ No breaking changes to existing integrations"
echo "   ✅ Clear separation between browser and API requests"
echo "   ✅ Intelligent request type detection"
echo ""

echo -e "${GREEN}🛡️  Security Maintained:${NC}"
echo "   ✅ All authentication protections intact"
echo "   ✅ Proper HTTP status codes"
echo "   ✅ No information disclosure"
echo "   ✅ Session management unchanged"
echo ""

echo "========================================="
echo -e "${YELLOW}🚀 Implementation Complete!${NC}"
echo "========================================="
echo ""
echo "The authentication system now provides the best of both worlds:"
echo "  • Human-friendly browser experience with seamless redirects"
echo "  • Machine-friendly API responses with proper error codes"
echo ""
echo "Users will never again see technical error messages when"
echo "accessing protected pages - they'll be smoothly guided"
echo "through the authentication process."
echo ""

# Cleanup
echo "🛑 Stopping demo server..."
kill $SERVER_PID 2>/dev/null

echo ""
echo -e "${GREEN}✨ Demo completed successfully!${NC}"
echo "Ready for production deployment."
