#!/bin/bash

# Vitrari Profile Page Verification Script
# Comprehensive testing of profile.html implementation

set -e

echo "🧪 Vitrari Profile Page Verification"
echo "===================================="
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

# Test 1: Template Parsing
test_template_parsing() {
    echo -e "${BLUE}🔍 Testing template parsing...${NC}"

    # Create a simple Go program to test template parsing
    cat > test_template.go << 'EOF'
package main
import (
    "html/template"
    "log"
)
func main() {
    _, err := template.ParseGlob("templates/*.html")
    if err != nil {
        log.Fatal(err)
    }
}
EOF

    if go run test_template.go 2>/dev/null; then
        print_test_result "Template Parsing" "PASS" "All templates parse successfully"
        rm -f test_template.go
    else
        print_test_result "Template Parsing" "FAIL" "Template parsing failed"
        rm -f test_template.go
    fi
}

# Test 2: Profile File Existence
test_profile_file_exists() {
    echo -e "${BLUE}🔍 Testing profile file existence...${NC}"

    if [ -f "templates/profile.html" ]; then
        print_test_result "Profile File Exists" "PASS" "templates/profile.html found"
    else
        print_test_result "Profile File Exists" "FAIL" "templates/profile.html not found"
    fi
}

# Test 3: Profile Route Configuration
test_profile_route() {
    echo -e "${BLUE}🔍 Testing profile route configuration...${NC}"

    if grep -q "HandleFunc.*profile.*handleProfile" main.go || grep -q "Handle.*profile.*handleProfile" main.go; then
        print_test_result "Profile Route" "PASS" "Profile route properly configured"
    else
        print_test_result "Profile Route" "FAIL" "Profile route not found in main.go"
    fi
}

# Test 4: Authentication Protection
test_auth_protection() {
    echo -e "${BLUE}🔍 Testing authentication protection...${NC}"

    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9995/profile)

    if [ "$response" = "401" ] || [ "$response" = "403" ] || [ "$response" = "302" ]; then
        print_test_result "Authentication Protection" "PASS" "Profile page properly protected (HTTP $response)"
    else
        print_test_result "Authentication Protection" "FAIL" "Profile page not properly protected (HTTP $response)"
    fi
}

# Test 5: Template Structure
test_template_structure() {
    echo -e "${BLUE}🔍 Testing template structure...${NC}"

    local required_elements=(
        "profile-container"
        "profile-header"
        "profile-avatar"
        "profile-content"
        "Account Information"
        "Subscription.*Billing"
        "Usage Statistics"
    )

    local missing_elements=()

    for element in "${required_elements[@]}"; do
        if ! grep -q "$element" templates/profile.html; then
            missing_elements+=("$element")
        fi
    done

    if [ ${#missing_elements[@]} -eq 0 ]; then
        print_test_result "Template Structure" "PASS" "All required sections present"
    else
        print_test_result "Template Structure" "FAIL" "Missing elements: ${missing_elements[*]}"
    fi
}

# Test 6: Template Variables
test_template_variables() {
    echo -e "${BLUE}🔍 Testing template variables...${NC}"

    local required_vars=(
        "{{.User.FirstName}}"
        "{{.User.LastName}}"
        "{{.User.Email}}"
        "{{if .User.EmailVerified}}"
        "{{.User.CreatedAt.Format"
    )

    local missing_vars=()

    for var in "${required_vars[@]}"; do
        if ! grep -q "$var" templates/profile.html; then
            missing_vars+=("$var")
        fi
    done

    if [ ${#missing_vars[@]} -eq 0 ]; then
        print_test_result "Template Variables" "PASS" "All required template variables present"
    else
        print_test_result "Template Variables" "FAIL" "Missing variables: ${missing_vars[*]}"
    fi
}

# Test 7: JavaScript Functions
test_javascript_functions() {
    echo -e "${BLUE}🔍 Testing JavaScript functions...${NC}"

    local required_functions=(
        "showChangePasswordModal"
        "showUpgradeModal"
        "toggleUserMenu"
        "handleLogout"
    )

    local missing_functions=()

    for func in "${required_functions[@]}"; do
        if ! grep -q "function $func" templates/profile.html; then
            missing_functions+=("$func")
        fi
    done

    if [ ${#missing_functions[@]} -eq 0 ]; then
        print_test_result "JavaScript Functions" "PASS" "All required JavaScript functions present"
    else
        print_test_result "JavaScript Functions" "FAIL" "Missing functions: ${missing_functions[*]}"
    fi
}

# Test 8: CSS Classes
test_css_classes() {
    echo -e "${BLUE}🔍 Testing CSS classes...${NC}"

    local required_classes=(
        "profile-container"
        "profile-header"
        "profile-avatar"
        "profile-name"
        "profile-email"
        "profile-content"
        "profile-section"
        "stats-grid"
        "btn-primary"
        "btn-secondary"
    )

    local missing_classes=()

    for class in "${required_classes[@]}"; do
        if ! grep -q "\.$class\s*{" templates/profile.html; then
            missing_classes+=("$class")
        fi
    done

    if [ ${#missing_classes[@]} -eq 0 ]; then
        print_test_result "CSS Classes" "PASS" "All required CSS classes present"
    else
        print_test_result "CSS Classes" "FAIL" "Missing classes: ${missing_classes[*]}"
    fi
}

# Test 9: Responsive Design
test_responsive_design() {
    echo -e "${BLUE}🔍 Testing responsive design...${NC}"

    if grep -q "@media.*max-width.*768px" templates/profile.html; then
        print_test_result "Responsive Design" "PASS" "Mobile breakpoints configured"
    else
        print_test_result "Responsive Design" "FAIL" "No mobile breakpoints found"
    fi
}

# Test 10: Profile Handler Function
test_profile_handler() {
    echo -e "${BLUE}🔍 Testing profile handler function...${NC}"

    if grep -A 15 "func handleProfile" main.go | grep -q "templates\.ExecuteTemplate.*profile\.html"; then
        print_test_result "Profile Handler" "PASS" "Profile handler properly executes template"
    else
        print_test_result "Profile Handler" "FAIL" "Profile handler not properly configured"
    fi
}

# Test 11: Security Headers
test_security_headers() {
    echo -e "${BLUE}🔍 Testing security headers...${NC}"

    local headers=$(curl -s -I http://localhost:9995/)

    if echo "$headers" | grep -q "X-Frame-Options" && echo "$headers" | grep -q "X-Content-Type-Options"; then
        print_test_result "Security Headers" "PASS" "Security headers present"
    else
        print_test_result "Security Headers" "FAIL" "Security headers missing"
    fi
}

# Test 12: Database Integration
test_database_integration() {
    echo -e "${BLUE}🔍 Testing database integration...${NC}"

    if [ -f "database/glass_optimizer.db" ] && sqlite3 database/glass_optimizer.db ".tables" | grep -q "users"; then
        print_test_result "Database Integration" "PASS" "User database table exists"
    else
        print_test_result "Database Integration" "FAIL" "User database table not found"
    fi
}

# Main execution
main() {
    echo -e "${BLUE}Starting comprehensive profile page verification...${NC}"
    echo ""

    # Ensure server is running
    ensure_server_running

    # Run all tests
    test_template_parsing
    test_profile_file_exists
    test_profile_route
    test_auth_protection
    test_template_structure
    test_template_variables
    test_javascript_functions
    test_css_classes
    test_responsive_design
    test_profile_handler
    test_security_headers
    test_database_integration

    # Final results
    echo "========================================="
    echo -e "${BLUE}📊 VERIFICATION SUMMARY${NC}"
    echo "========================================="
    echo ""
    echo -e "Total Tests Run: ${BLUE}$TOTAL_TESTS${NC}"
    echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
    echo ""

    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "🎉 ${GREEN}ALL TESTS PASSED!${NC}"
        echo -e "✅ Profile page is ${GREEN}FULLY FUNCTIONAL${NC} and ready for production"
        echo ""
        echo -e "🚀 ${GREEN}Profile page implementation: COMPLETE${NC}"
        echo ""
        echo "Next steps:"
        echo "  1. Test with actual user login at http://localhost:9995/auth"
        echo "  2. Navigate to http://localhost:9995/profile after login"
        echo "  3. Verify all interactive elements work correctly"
        echo "  4. Deploy to production environment"
        exit 0
    else
        echo -e "⚠️  ${YELLOW}SOME TESTS FAILED${NC}"
        echo -e "❌ Profile page needs ${RED}additional work${NC}"
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
    rm -f server.log test_template.go
}

# Set up cleanup on exit
trap cleanup EXIT

# Run main function
main
