#!/bin/bash

# Vitrari Authentication Redirect Verification Script
# Tests that browser requests redirect to /auth while API requests get JSON responses

set -e

echo "🔐 Vitrari Authentication Redirect Verification"
echo "==============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Function to print test results
print_test_result() {
    local test_name="$1"
    local status="$2"
    local message="$3"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    if [ "$status" = "PASS" ]; then
        echo -e "✅ ${GREEN}[PASS]${NC} $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        if [ ! -z "$message" ]; then
            echo "   $message"
        fi
    else
        echo -e "❌ ${RED}[FAIL]${NC} $test_name"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        if [ ! -z "$message" ]; then
            echo "   ${RED}$message${NC}"
        fi
    fi
    echo ""
}

# Function to check if server is running
check_server() {
    if curl -s http://localhost:9995 > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to start server if not running
ensure_server_running() {
    if ! check_server; then
        echo -e "${YELLOW}📡 Starting Vitrari server...${NC}"
        go run . > server.log 2>&1 &
        SERVER_PID=$!

        # Wait for server to start
        local attempts=0
        while [ $attempts -lt 30 ]; do
            if check_server; then
                echo -e "${GREEN}✅ Server started successfully${NC}"
                echo ""
                return 0
            fi
            sleep 1
            attempts=$((attempts + 1))
        done

        echo -e "${RED}❌ Failed to start server${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ Server is already running${NC}"
        echo ""
    fi
}

# Test 1: Browser Request Redirects to Auth
test_browser_redirect_profile() {
    echo -e "${BLUE}🔍 Testing browser request redirect for /profile...${NC}"

    response=$(curl -s -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" \
                    -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
                    -w "%{http_code}|%{redirect_url}" \
                    -I http://localhost:9995/profile)

    http_code=$(echo "$response" | grep -o '[0-9]\{3\}|' | tr -d '|')
    location=$(echo "$response" | grep -i "Location:" | cut -d' ' -f2 | tr -d '\r')

    if [ "$http_code" = "302" ] && [ "$location" = "/auth" ]; then
        print_test_result "Browser Profile Redirect" "PASS" "HTTP 302 redirect to /auth"
    else
        print_test_result "Browser Profile Redirect" "FAIL" "Expected 302 redirect to /auth, got $http_code to '$location'"
    fi
}

# Test 2: Browser Request Redirects for Designer
test_browser_redirect_designer() {
    echo -e "${BLUE}🔍 Testing browser request redirect for /designer...${NC}"

    response=$(curl -s -H "Accept: text/html" \
                    -H "User-Agent: Mozilla/5.0 Browser" \
                    -w "%{http_code}" \
                    -I http://localhost:9995/designer)

    http_code=$(echo "$response" | grep -o '[0-9]\{3\}')
    location=$(echo "$response" | grep -i "Location:" | cut -d' ' -f2 | tr -d '\r')

    if [ "$http_code" = "302" ] && [ "$location" = "/auth" ]; then
        print_test_result "Browser Designer Redirect" "PASS" "HTTP 302 redirect to /auth"
    else
        print_test_result "Browser Designer Redirect" "FAIL" "Expected 302 redirect to /auth, got $http_code to '$location'"
    fi
}

# Test 3: Browser Request Redirects for Optimizer
test_browser_redirect_optimizer() {
    echo -e "${BLUE}🔍 Testing browser request redirect for /optimizer...${NC}"

    response=$(curl -s -H "Accept: text/html" \
                    -H "User-Agent: Mozilla/5.0 Browser" \
                    -w "%{http_code}" \
                    -I http://localhost:9995/optimizer)

    http_code=$(echo "$response" | grep -o '[0-9]\{3\}')
    location=$(echo "$response" | grep -i "Location:" | cut -d' ' -f2 | tr -d '\r')

    if [ "$http_code" = "302" ] && [ "$location" = "/auth" ]; then
        print_test_result "Browser Optimizer Redirect" "PASS" "HTTP 302 redirect to /auth"
    else
        print_test_result "Browser Optimizer Redirect" "FAIL" "Expected 302 redirect to /auth, got $http_code to '$location'"
    fi
}

# Test 4: API Request Gets JSON Response
test_api_json_response() {
    echo -e "${BLUE}🔍 Testing API request gets JSON response...${NC}"

    response=$(curl -s -H "Accept: application/json" \
                    -H "Content-Type: application/json" \
                    -w "%{http_code}|%{content_type}" \
                    http://localhost:9995/profile)

    http_code=$(echo "$response" | tail -1 | cut -d'|' -f1)
    content_type=$(echo "$response" | tail -1 | cut -d'|' -f2)
    body=$(echo "$response" | head -n -1)

    if [ "$http_code" = "401" ] && [[ "$content_type" == *"application/json"* ]] && [[ "$body" == *"unauthorized"* ]]; then
        print_test_result "API JSON Response" "PASS" "HTTP 401 with JSON error response"
    else
        print_test_result "API JSON Response" "FAIL" "Expected 401 JSON response, got $http_code with content-type '$content_type'"
    fi
}

# Test 5: API Endpoint Path Gets JSON
test_api_path_json() {
    echo -e "${BLUE}🔍 Testing /api path gets JSON response...${NC}"

    response=$(curl -s -H "Accept: text/html" \
                    -w "%{http_code}|%{content_type}" \
                    -X POST http://localhost:9995/api/auth/logout)

    http_code=$(echo "$response" | tail -1 | cut -d'|' -f1)
    content_type=$(echo "$response" | tail -1 | cut -d'|' -f2)
    body=$(echo "$response" | head -n -1)

    if [ "$http_code" = "401" ] && [[ "$content_type" == *"application/json"* ]]; then
        print_test_result "API Path JSON Response" "PASS" "/api path returns JSON even with HTML Accept header"
    else
        print_test_result "API Path JSON Response" "FAIL" "Expected JSON response for /api path, got $http_code with '$content_type'"
    fi
}

# Test 6: AJAX Request Gets JSON
test_ajax_json_response() {
    echo -e "${BLUE}🔍 Testing AJAX request gets JSON response...${NC}"

    response=$(curl -s -H "X-Requested-With: XMLHttpRequest" \
                    -H "Accept: */*" \
                    -w "%{http_code}|%{content_type}" \
                    http://localhost:9995/profile)

    http_code=$(echo "$response" | tail -1 | cut -d'|' -f1)
    content_type=$(echo "$response" | tail -1 | cut -d'|' -f2)
    body=$(echo "$response" | head -n -1)

    if [ "$http_code" = "401" ] && [[ "$content_type" == *"application/json"* ]]; then
        print_test_result "AJAX JSON Response" "PASS" "AJAX requests get JSON responses"
    else
        print_test_result "AJAX JSON Response" "FAIL" "Expected JSON response for AJAX, got $http_code with '$content_type'"
    fi
}

# Test 7: Redirect Follow Works
test_redirect_follow() {
    echo -e "${BLUE}🔍 Testing redirect follow to auth page...${NC}"

    response=$(curl -s -L -H "Accept: text/html" \
                    -H "User-Agent: Mozilla/5.0 Browser" \
                    http://localhost:9995/profile)

    if [[ "$response" == *"<title>Login - Vitrari</title>"* ]] && [[ "$response" == *"auth-container"* ]]; then
        print_test_result "Redirect Follow" "PASS" "Successfully redirected and loaded auth page"
    else
        print_test_result "Redirect Follow" "FAIL" "Did not successfully load auth page after redirect"
    fi
}

# Test 8: Auth Page Accessible
test_auth_page_accessible() {
    echo -e "${BLUE}🔍 Testing auth page is directly accessible...${NC}"

    response=$(curl -s -w "%{http_code}" http://localhost:9995/auth)
    http_code=$(echo "$response" | tail -1)
    body=$(echo "$response" | head -n -1)

    if [ "$http_code" = "200" ] && [[ "$body" == *"auth-container"* ]]; then
        print_test_result "Auth Page Accessible" "PASS" "Auth page loads correctly"
    else
        print_test_result "Auth Page Accessible" "FAIL" "Auth page not accessible, got HTTP $http_code"
    fi
}

# Test 9: Public Pages Still Work
test_public_pages() {
    echo -e "${BLUE}🔍 Testing public pages still work...${NC}"

    # Test homepage (should work without auth if it's public)
    response=$(curl -s -w "%{http_code}" http://localhost:9995/)
    http_code=$(echo "$response" | tail -1)

    if [ "$http_code" = "200" ] || [ "$http_code" = "302" ]; then
        print_test_result "Public Pages" "PASS" "Public pages respond correctly"
    else
        print_test_result "Public Pages" "FAIL" "Public pages not working, got HTTP $http_code"
    fi
}

# Test 10: Content-Type Detection
test_content_type_detection() {
    echo -e "${BLUE}🔍 Testing JSON Content-Type triggers API response...${NC}"

    response=$(curl -s -H "Content-Type: application/json" \
                    -H "Accept: text/html" \
                    -w "%{http_code}|%{content_type}" \
                    http://localhost:9995/profile)

    http_code=$(echo "$response" | tail -1 | cut -d'|' -f1)
    content_type=$(echo "$response" | tail -1 | cut -d'|' -f2)

    if [ "$http_code" = "401" ] && [[ "$content_type" == *"application/json"* ]]; then
        print_test_result "Content-Type Detection" "PASS" "JSON Content-Type triggers API response"
    else
        print_test_result "Content-Type Detection" "FAIL" "JSON Content-Type should trigger API response"
    fi
}

# Main execution
main() {
    echo -e "${BLUE}Starting comprehensive authentication redirect verification...${NC}"
    echo ""

    # Ensure server is running
    ensure_server_running

    # Run all tests
    test_browser_redirect_profile
    test_browser_redirect_designer
    test_browser_redirect_optimizer
    test_api_json_response
    test_api_path_json
    test_ajax_json_response
    test_redirect_follow
    test_auth_page_accessible
    test_public_pages
    test_content_type_detection

    # Final results
    echo "========================================="
    echo -e "${BLUE}📊 AUTHENTICATION REDIRECT SUMMARY${NC}"
    echo "========================================="
    echo ""
    echo -e "Total Tests Run: ${BLUE}$TOTAL_TESTS${NC}"
    echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
    echo ""

    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "🎉 ${GREEN}ALL TESTS PASSED!${NC}"
        echo -e "✅ Authentication redirect behavior is ${GREEN}PERFECT${NC}"
        echo ""
        echo -e "🚀 ${GREEN}Implementation Summary:${NC}"
        echo -e "  ✅ Browser requests redirect to /auth (302 Found)"
        echo -e "  ✅ API requests return JSON errors (401 Unauthorized)"
        echo -e "  ✅ AJAX requests get JSON responses"
        echo -e "  ✅ /api/* paths always return JSON"
        echo -e "  ✅ Content-Type detection works correctly"
        echo -e "  ✅ User-friendly redirect experience"
        echo ""
        echo -e "🔒 ${GREEN}Security Benefits:${NC}"
        echo -e "  • No more confusing JSON errors in browser"
        echo -e "  • Seamless redirect to login page"
        echo -e "  • API clients still get proper JSON responses"
        echo -e "  • Maintains RESTful API behavior"
        echo -e "  • Better user experience overall"
        echo ""
        echo -e "📱 ${GREEN}User Experience:${NC}"
        echo -e "  • Users are automatically taken to login page"
        echo -e "  • No technical error messages shown to users"
        echo -e "  • Smooth authentication flow"
        echo -e "  • API integration remains unchanged"
        echo ""
        exit 0
    else
        echo -e "⚠️  ${YELLOW}SOME TESTS FAILED${NC}"
        echo -e "❌ Authentication redirect behavior needs ${RED}additional work${NC}"
        echo ""
        echo "Please review the failed tests above and make necessary fixes."
        exit 1
    fi
}

# Cleanup function
cleanup() {
    if [ ! -z "$SERVER_PID" ]; then
        echo ""
        echo -e "${YELLOW}🛑 Cleaning up server process...${NC}"
        kill $SERVER_PID 2>/dev/null || true
    fi
    rm -f server.log
}

# Set up cleanup on exit
trap cleanup EXIT

# Run main function
main
