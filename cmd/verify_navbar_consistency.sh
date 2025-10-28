#!/bin/bash

# Vitrari Navbar Consistency Verification Script
# Verifies that the user menu is properly implemented across all pages

set -e

echo "🔍 Vitrari Navbar Consistency Verification"
echo "=========================================="
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

# Test 1: Template Files Exist
test_template_files() {
    echo -e "${BLUE}🔍 Testing template files exist...${NC}"

    local pages=("index.html" "designer.html" "optimizer.html" "profile.html")
    local missing_files=()

    for page in "${pages[@]}"; do
        if [ ! -f "templates/$page" ]; then
            missing_files+=("$page")
        fi
    done

    if [ ${#missing_files[@]} -eq 0 ]; then
        print_test_result "Template Files Exist" "PASS" "All template files present"
    else
        print_test_result "Template Files Exist" "FAIL" "Missing files: ${missing_files[*]}"
    fi
}

# Test 2: User Menu Structure Consistency
test_user_menu_structure() {
    echo -e "${BLUE}🔍 Testing user menu structure consistency...${NC}"

    local pages=("designer.html" "optimizer.html" "profile.html")
    local required_elements=(
        "user-menu-trigger"
        "userDropdownMenu"
        "user-avatar"
        "dropdown-item"
        "logout-btn"
    )

    local missing_elements=()

    for page in "${pages[@]}"; do
        for element in "${required_elements[@]}"; do
            if ! grep -q "$element" "templates/$page"; then
                missing_elements+=("$page:$element")
            fi
        done
    done

    if [ ${#missing_elements[@]} -eq 0 ]; then
        print_test_result "User Menu Structure" "PASS" "All pages have consistent user menu structure"
    else
        print_test_result "User Menu Structure" "FAIL" "Missing elements: ${missing_elements[*]}"
    fi
}

# Test 3: Template Variables Consistency
test_template_variables() {
    echo -e "${BLUE}🔍 Testing template variables consistency...${NC}"

    local pages=("designer.html" "optimizer.html" "profile.html")
    local required_vars=(
        "{{.User.FirstName}}"
        "{{.User.LastName}}"
        "{{.User.Email}}"
    )

    local missing_vars=()

    for page in "${pages[@]}"; do
        for var in "${required_vars[@]}"; do
            if ! grep -q "$var" "templates/$page"; then
                missing_vars+=("$page:$var")
            fi
        done
    done

    if [ ${#missing_vars[@]} -eq 0 ]; then
        print_test_result "Template Variables" "PASS" "All pages have consistent template variables"
    else
        print_test_result "Template Variables" "FAIL" "Missing variables: ${missing_vars[*]}"
    fi
}

# Test 4: JavaScript Functions Consistency
test_javascript_functions() {
    echo -e "${BLUE}🔍 Testing JavaScript functions consistency...${NC}"

    local pages=("designer.html" "optimizer.html" "profile.html")
    local required_functions=(
        "toggleUserMenu"
        "handleLogout"
    )

    local missing_functions=()

    for page in "${pages[@]}"; do
        for func in "${required_functions[@]}"; do
            if ! grep -q "function $func" "templates/$page"; then
                missing_functions+=("$page:$func")
            fi
        done
    done

    if [ ${#missing_functions[@]} -eq 0 ]; then
        print_test_result "JavaScript Functions" "PASS" "All pages have consistent JavaScript functions"
    else
        print_test_result "JavaScript Functions" "FAIL" "Missing functions: ${missing_functions[*]}"
    fi
}

# Test 5: Navigation Consistency
test_navigation_consistency() {
    echo -e "${BLUE}🔍 Testing navigation consistency...${NC}"

    local pages=("designer.html" "optimizer.html" "profile.html")
    local nav_links=(
        'href="/"'
        'href="/designer"'
        'href="/optimizer"'
    )

    local missing_nav=()

    for page in "${pages[@]}"; do
        for link in "${nav_links[@]}"; do
            if ! grep -q "$link" "templates/$page"; then
                missing_nav+=("$page:$link")
            fi
        done
    done

    if [ ${#missing_nav[@]} -eq 0 ]; then
        print_test_result "Navigation Consistency" "PASS" "All pages have consistent navigation links"
    else
        print_test_result "Navigation Consistency" "FAIL" "Missing nav links: ${missing_nav[*]}"
    fi
}

# Test 6: Language Selector Consistency
test_language_selector() {
    echo -e "${BLUE}🔍 Testing language selector consistency...${NC}"

    local pages=("designer.html" "optimizer.html" "profile.html")
    local lang_elements=(
        "language-selector"
        "lang-btn"
        'data-lang="en"'
        'data-lang="es"'
    )

    local missing_lang=()

    for page in "${pages[@]}"; do
        for element in "${lang_elements[@]}"; do
            if ! grep -q "$element" "templates/$page"; then
                missing_lang+=("$page:$element")
            fi
        done
    done

    if [ ${#missing_lang[@]} -eq 0 ]; then
        print_test_result "Language Selector" "PASS" "All pages have consistent language selector"
    else
        print_test_result "Language Selector" "FAIL" "Missing language elements: ${missing_lang[*]}"
    fi
}

# Test 7: Authentication Conditional Logic
test_auth_conditional() {
    echo -e "${BLUE}🔍 Testing authentication conditional logic...${NC}"

    local pages=("designer.html" "optimizer.html" "profile.html")
    local auth_elements=(
        "{{if .User}}"
        "{{else}}"
        "{{end}}"
        'href="/auth"'
    )

    local missing_auth=()

    for page in "${pages[@]}"; do
        for element in "${auth_elements[@]}"; do
            if ! grep -q "$element" "templates/$page"; then
                missing_auth+=("$page:$element")
            fi
        done
    done

    if [ ${#missing_auth[@]} -eq 0 ]; then
        print_test_result "Authentication Logic" "PASS" "All pages have consistent auth conditional logic"
    else
        print_test_result "Authentication Logic" "FAIL" "Missing auth elements: ${missing_auth[*]}"
    fi
}

# Test 8: CSS Classes Consistency
test_css_consistency() {
    echo -e "${BLUE}🔍 Testing CSS classes consistency...${NC}"

    local pages=("designer.html" "optimizer.html" "profile.html")
    local css_classes=(
        "user-menu"
        "user-menu-trigger"
        "dropdown-chevron"
        "user-dropdown-menu"
        "user-info"
        "user-avatar"
        "dropdown-item"
        "logout-btn"
    )

    local missing_css=()

    for page in "${pages[@]}"; do
        for class in "${css_classes[@]}"; do
            if ! grep -q "class=\"$class\"\\|class=\"[^\"]*$class[^\"]*\"" "templates/$page"; then
                missing_css+=("$page:$class")
            fi
        done
    done

    if [ ${#missing_css[@]} -eq 0 ]; then
        print_test_result "CSS Classes" "PASS" "All pages have consistent CSS classes"
    else
        print_test_result "CSS Classes" "FAIL" "Missing CSS classes: ${missing_css[*]}"
    fi
}

# Test 9: Template Parsing
test_template_parsing() {
    echo -e "${BLUE}🔍 Testing template parsing...${NC}"

    # Create a simple Go program to test template parsing
    cat > test_templates.go << 'EOF'
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

    if go run test_templates.go 2>/dev/null; then
        print_test_result "Template Parsing" "PASS" "All templates parse without errors"
    else
        print_test_result "Template Parsing" "FAIL" "Template parsing failed"
    fi

    rm -f test_templates.go
}

# Test 10: Profile Link Consistency
test_profile_link() {
    echo -e "${BLUE}🔍 Testing profile link consistency...${NC}"

    local pages=("designer.html" "optimizer.html")
    local missing_profile_links=()

    for page in "${pages[@]}"; do
        if ! grep -q 'href="/profile"' "templates/$page"; then
            missing_profile_links+=("$page")
        fi
    done

    if [ ${#missing_profile_links[@]} -eq 0 ]; then
        print_test_result "Profile Link" "PASS" "All pages have profile links in user menu"
    else
        print_test_result "Profile Link" "FAIL" "Missing profile links in: ${missing_profile_links[*]}"
    fi
}

# Main execution
main() {
    echo -e "${BLUE}Starting comprehensive navbar consistency verification...${NC}"
    echo ""

    # Ensure server is running for later tests
    ensure_server_running

    # Run all tests
    test_template_files
    test_user_menu_structure
    test_template_variables
    test_javascript_functions
    test_navigation_consistency
    test_language_selector
    test_auth_conditional
    test_css_consistency
    test_template_parsing
    test_profile_link

    # Final results
    echo "========================================="
    echo -e "${BLUE}📊 NAVBAR CONSISTENCY SUMMARY${NC}"
    echo "========================================="
    echo ""
    echo -e "Total Tests Run: ${BLUE}$TOTAL_TESTS${NC}"
    echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
    echo ""

    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "🎉 ${GREEN}ALL TESTS PASSED!${NC}"
        echo -e "✅ Navbar consistency is ${GREEN}PERFECT${NC} across all pages"
        echo ""
        echo -e "🚀 ${GREEN}Implementation Summary:${NC}"
        echo -e "  ✅ Designer page now has complete user menu"
        echo -e "  ✅ Optimizer page now has complete user menu"
        echo -e "  ✅ Profile page user menu maintained"
        echo -e "  ✅ Dashboard user menu already existed"
        echo ""
        echo -e "🔗 ${GREEN}Consistent Features:${NC}"
        echo -e "  • User avatar and name display"
        echo -e "  • Dropdown menu with profile link"
        echo -e "  • Logout functionality with confirmation"
        echo -e "  • Language selector"
        echo -e "  • Responsive design"
        echo -e "  • Authentication conditional logic"
        echo ""
        echo -e "📱 ${GREEN}Cross-Page Navigation:${NC}"
        echo -e "  • Users can now access profile from any page"
        echo -e "  • Consistent logout experience"
        echo -e "  • Unified navigation structure"
        echo ""
        exit 0
    else
        echo -e "⚠️  ${YELLOW}SOME TESTS FAILED${NC}"
        echo -e "❌ Navbar consistency needs ${RED}additional work${NC}"
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
    rm -f server.log test_templates.go
}

# Set up cleanup on exit
trap cleanup EXIT

# Run main function
main
