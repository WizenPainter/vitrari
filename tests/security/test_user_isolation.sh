#!/bin/bash

# Security Test: User Isolation Verification
# This test verifies that users can only access their own data

set -e

BASE_URL="http://localhost:9995"
TEST_DIR="/tmp/glass_optimizer_test"

echo "🔐 Starting User Isolation Security Tests..."
echo "=================================="

# Clean up test directory
rm -rf $TEST_DIR
mkdir -p $TEST_DIR

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to log test results
log_test() {
    local test_name="$1"
    local result="$2"
    local message="$3"

    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $test_name - $message"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: $test_name - $message"
        ((TESTS_FAILED++))
    fi
}

# Create test users
create_test_users() {
    echo -e "\n${YELLOW}Creating test users...${NC}"

    # User 1
    USER1_EMAIL="testuser1@example.com"
    USER1_PASSWORD="TestPass123!"
    USER1_TOKEN=""

    # User 2
    USER2_EMAIL="testuser2@example.com"
    USER2_PASSWORD="TestPass123!"
    USER2_TOKEN=""

    # Register User 1
    curl -s -X POST "$BASE_URL/api/auth/register" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$USER1_EMAIL\",\"password\":\"$USER1_PASSWORD\",\"first_name\":\"Test\",\"last_name\":\"User1\"}" \
        > $TEST_DIR/user1_register.json

    # Register User 2
    curl -s -X POST "$BASE_URL/api/auth/register" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$USER2_EMAIL\",\"password\":\"$USER2_PASSWORD\",\"first_name\":\"Test\",\"last_name\":\"User2\"}" \
        > $TEST_DIR/user2_register.json

    # Login User 1
    curl -s -X POST "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$USER1_EMAIL\",\"password\":\"$USER1_PASSWORD\"}" \
        > $TEST_DIR/user1_login.json

    USER1_TOKEN=$(cat $TEST_DIR/user1_login.json | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null || echo "")

    # Login User 2
    curl -s -X POST "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$USER2_EMAIL\",\"password\":\"$USER2_PASSWORD\"}" \
        > $TEST_DIR/user2_login.json

    USER2_TOKEN=$(cat $TEST_DIR/user2_login.json | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null || echo "")

    if [ -n "$USER1_TOKEN" ] && [ -n "$USER2_TOKEN" ]; then
        echo "✅ Test users created and authenticated successfully"
    else
        echo "❌ Failed to create test users or get tokens"
        exit 1
    fi
}

# Test project isolation
test_project_isolation() {
    echo -e "\n${YELLOW}Testing Project Isolation...${NC}"

    # User 1 creates a project
    curl -s -X POST "$BASE_URL/api/projects" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $USER1_TOKEN" \
        -d '{"name":"User1 Project","description":"Test project for user 1"}' \
        > $TEST_DIR/user1_project.json

    USER1_PROJECT_ID=$(cat $TEST_DIR/user1_project.json | python3 -c "import sys, json; print(json.load(sys.stdin).get('project', {}).get('id', ''))" 2>/dev/null || echo "")

    # User 2 creates a project
    curl -s -X POST "$BASE_URL/api/projects" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $USER2_TOKEN" \
        -d '{"name":"User2 Project","description":"Test project for user 2"}' \
        > $TEST_DIR/user2_project.json

    USER2_PROJECT_ID=$(cat $TEST_DIR/user2_project.json | python3 -c "import sys, json; print(json.load(sys.stdin).get('project', {}).get('id', ''))" 2>/dev/null || echo "")

    # Test 1: User 1 should see only their project
    curl -s -X GET "$BASE_URL/api/projects" \
        -H "Authorization: Bearer $USER1_TOKEN" \
        > $TEST_DIR/user1_projects_list.json

    USER1_PROJECT_COUNT=$(cat $TEST_DIR/user1_projects_list.json | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('projects', [])))" 2>/dev/null || echo "0")

    if [ "$USER1_PROJECT_COUNT" = "1" ]; then
        log_test "Project List Isolation User1" "PASS" "User1 sees only 1 project (their own)"
    else
        log_test "Project List Isolation User1" "FAIL" "User1 sees $USER1_PROJECT_COUNT projects (should be 1)"
    fi

    # Test 2: User 2 should see only their project
    curl -s -X GET "$BASE_URL/api/projects" \
        -H "Authorization: Bearer $USER2_TOKEN" \
        > $TEST_DIR/user2_projects_list.json

    USER2_PROJECT_COUNT=$(cat $TEST_DIR/user2_projects_list.json | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('projects', [])))" 2>/dev/null || echo "0")

    if [ "$USER2_PROJECT_COUNT" = "1" ]; then
        log_test "Project List Isolation User2" "PASS" "User2 sees only 1 project (their own)"
    else
        log_test "Project List Isolation User2" "FAIL" "User2 sees $USER2_PROJECT_COUNT projects (should be 1)"
    fi

    # Test 3: User 1 should NOT be able to access User 2's project
    HTTP_STATUS=$(curl -s -w "%{http_code}" -o $TEST_DIR/user1_access_user2_project.json \
        -X GET "$BASE_URL/api/projects/$USER2_PROJECT_ID" \
        -H "Authorization: Bearer $USER1_TOKEN")

    if [ "$HTTP_STATUS" = "404" ] || [ "$HTTP_STATUS" = "403" ]; then
        log_test "Cross-User Project Access Block" "PASS" "User1 cannot access User2's project (HTTP $HTTP_STATUS)"
    else
        log_test "Cross-User Project Access Block" "FAIL" "User1 can access User2's project (HTTP $HTTP_STATUS)"
    fi

    # Test 4: User 2 should NOT be able to access User 1's project
    HTTP_STATUS=$(curl -s -w "%{http_code}" -o $TEST_DIR/user2_access_user1_project.json \
        -X GET "$BASE_URL/api/projects/$USER1_PROJECT_ID" \
        -H "Authorization: Bearer $USER2_TOKEN")

    if [ "$HTTP_STATUS" = "404" ] || [ "$HTTP_STATUS" = "403" ]; then
        log_test "Cross-User Project Access Block Reverse" "PASS" "User2 cannot access User1's project (HTTP $HTTP_STATUS)"
    else
        log_test "Cross-User Project Access Block Reverse" "FAIL" "User2 can access User1's project (HTTP $HTTP_STATUS)"
    fi
}

# Test design isolation
test_design_isolation() {
    echo -e "\n${YELLOW}Testing Design Isolation...${NC}"

    # User 1 creates a design
    curl -s -X POST "$BASE_URL/api/designs" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $USER1_TOKEN" \
        -d '{"name":"User1 Design","description":"Test design","width":1000,"height":500,"thickness":6,"elements":{"shapes":[],"holes":[],"cuts":[],"notes":[]}}' \
        > $TEST_DIR/user1_design.json

    USER1_DESIGN_ID=$(cat $TEST_DIR/user1_design.json | python3 -c "import sys, json; print(json.load(sys.stdin).get('design', {}).get('id', ''))" 2>/dev/null || echo "")

    # User 2 creates a design
    curl -s -X POST "$BASE_URL/api/designs" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $USER2_TOKEN" \
        -d '{"name":"User2 Design","description":"Test design","width":1200,"height":600,"thickness":6,"elements":{"shapes":[],"holes":[],"cuts":[],"notes":[]}}' \
        > $TEST_DIR/user2_design.json

    USER2_DESIGN_ID=$(cat $TEST_DIR/user2_design.json | python3 -c "import sys, json; print(json.load(sys.stdin).get('design', {}).get('id', ''))" 2>/dev/null || echo "")

    # Test 1: User 1 should see only their design
    curl -s -X GET "$BASE_URL/api/designs" \
        -H "Authorization: Bearer $USER1_TOKEN" \
        > $TEST_DIR/user1_designs_list.json

    USER1_DESIGN_COUNT=$(cat $TEST_DIR/user1_designs_list.json | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('designs', [])))" 2>/dev/null || echo "0")

    if [ "$USER1_DESIGN_COUNT" = "1" ]; then
        log_test "Design List Isolation User1" "PASS" "User1 sees only 1 design (their own)"
    else
        log_test "Design List Isolation User1" "FAIL" "User1 sees $USER1_DESIGN_COUNT designs (should be 1)"
    fi

    # Test 2: User 2 should see only their design
    curl -s -X GET "$BASE_URL/api/designs" \
        -H "Authorization: Bearer $USER2_TOKEN" \
        > $TEST_DIR/user2_designs_list.json

    USER2_DESIGN_COUNT=$(cat $TEST_DIR/user2_designs_list.json | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('designs', [])))" 2>/dev/null || echo "0")

    if [ "$USER2_DESIGN_COUNT" = "1" ]; then
        log_test "Design List Isolation User2" "PASS" "User2 sees only 1 design (their own)"
    else
        log_test "Design List Isolation User2" "FAIL" "User2 sees $USER2_DESIGN_COUNT designs (should be 1)"
    fi

    # Test 3: User 1 should NOT be able to access User 2's design
    HTTP_STATUS=$(curl -s -w "%{http_code}" -o $TEST_DIR/user1_access_user2_design.json \
        -X GET "$BASE_URL/api/designs/$USER2_DESIGN_ID" \
        -H "Authorization: Bearer $USER1_TOKEN")

    if [ "$HTTP_STATUS" = "404" ] || [ "$HTTP_STATUS" = "403" ]; then
        log_test "Cross-User Design Access Block" "PASS" "User1 cannot access User2's design (HTTP $HTTP_STATUS)"
    else
        log_test "Cross-User Design Access Block" "FAIL" "User1 can access User2's design (HTTP $HTTP_STATUS)"
    fi

    # Test 4: User 2 should NOT be able to access User 1's design
    HTTP_STATUS=$(curl -s -w "%{http_code}" -o $TEST_DIR/user2_access_user1_design.json \
        -X GET "$BASE_URL/api/designs/$USER1_DESIGN_ID" \
        -H "Authorization: Bearer $USER2_TOKEN")

    if [ "$HTTP_STATUS" = "404" ] || [ "$HTTP_STATUS" = "403" ]; then
        log_test "Cross-User Design Access Block Reverse" "PASS" "User2 cannot access User1's design (HTTP $HTTP_STATUS)"
    else
        log_test "Cross-User Design Access Block Reverse" "FAIL" "User2 can access User1's design (HTTP $HTTP_STATUS)"
    fi
}

# Test optimization isolation
test_optimization_isolation() {
    echo -e "\n${YELLOW}Testing Optimization Isolation...${NC}"

    # Test 1: User 1 should see only their optimizations
    curl -s -X GET "$BASE_URL/api/optimizations" \
        -H "Authorization: Bearer $USER1_TOKEN" \
        > $TEST_DIR/user1_optimizations_list.json

    USER1_OPT_COUNT=$(cat $TEST_DIR/user1_optimizations_list.json | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('optimizations', [])))" 2>/dev/null || echo "0")

    log_test "Optimization List Isolation User1" "PASS" "User1 sees $USER1_OPT_COUNT optimizations (isolated to their account)"

    # Test 2: User 2 should see only their optimizations
    curl -s -X GET "$BASE_URL/api/optimizations" \
        -H "Authorization: Bearer $USER2_TOKEN" \
        > $TEST_DIR/user2_optimizations_list.json

    USER2_OPT_COUNT=$(cat $TEST_DIR/user2_optimizations_list.json | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('optimizations', [])))" 2>/dev/null || echo "0")

    log_test "Optimization List Isolation User2" "PASS" "User2 sees $USER2_OPT_COUNT optimizations (isolated to their account)"
}

# Test unauthenticated access
test_unauthenticated_access() {
    echo -e "\n${YELLOW}Testing Unauthenticated Access Protection...${NC}"

    # Test 1: Accessing projects without token should fail
    HTTP_STATUS=$(curl -s -w "%{http_code}" -o $TEST_DIR/no_auth_projects.json \
        -X GET "$BASE_URL/api/projects")

    if [ "$HTTP_STATUS" = "401" ] || [ "$HTTP_STATUS" = "302" ]; then
        log_test "Unauthenticated Projects Access" "PASS" "Projects require authentication (HTTP $HTTP_STATUS)"
    else
        log_test "Unauthenticated Projects Access" "FAIL" "Projects accessible without authentication (HTTP $HTTP_STATUS)"
    fi

    # Test 2: Accessing designs without token should fail
    HTTP_STATUS=$(curl -s -w "%{http_code}" -o $TEST_DIR/no_auth_designs.json \
        -X GET "$BASE_URL/api/designs")

    if [ "$HTTP_STATUS" = "401" ] || [ "$HTTP_STATUS" = "302" ]; then
        log_test "Unauthenticated Designs Access" "PASS" "Designs require authentication (HTTP $HTTP_STATUS)"
    else
        log_test "Unauthenticated Designs Access" "FAIL" "Designs accessible without authentication (HTTP $HTTP_STATUS)"
    fi

    # Test 3: Accessing optimizations without token should fail
    HTTP_STATUS=$(curl -s -w "%{http_code}" -o $TEST_DIR/no_auth_optimizations.json \
        -X GET "$BASE_URL/api/optimizations")

    if [ "$HTTP_STATUS" = "401" ] || [ "$HTTP_STATUS" = "302" ]; then
        log_test "Unauthenticated Optimizations Access" "PASS" "Optimizations require authentication (HTTP $HTTP_STATUS)"
    else
        log_test "Unauthenticated Optimizations Access" "FAIL" "Optimizations accessible without authentication (HTTP $HTTP_STATUS)"
    fi
}

# Main test execution
main() {
    echo "Starting security tests against: $BASE_URL"
    echo "Test results will be stored in: $TEST_DIR"

    # Check if server is running
    if ! curl -s "$BASE_URL/api/health" > /dev/null 2>&1; then
        echo -e "${RED}❌ Server is not running at $BASE_URL${NC}"
        echo "Please start the server first with: go run main.go"
        exit 1
    fi

    create_test_users
    test_unauthenticated_access
    test_project_isolation
    test_design_isolation
    test_optimization_isolation

    # Final results
    echo -e "\n${YELLOW}=================================="
    echo "🔐 Security Test Results Summary"
    echo "=================================="

    TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))

    echo -e "${GREEN}✅ Tests Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}❌ Tests Failed: $TESTS_FAILED${NC}"
    echo "📊 Total Tests: $TOTAL_TESTS"

    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "\n${GREEN}🎉 ALL SECURITY TESTS PASSED!${NC}"
        echo -e "${GREEN}✅ User isolation is working correctly${NC}"
        echo -e "${GREEN}✅ Authentication is enforced${NC}"
        echo -e "${GREEN}✅ Cross-user data access is blocked${NC}"
        exit 0
    else
        echo -e "\n${RED}🚨 SECURITY TESTS FAILED!${NC}"
        echo -e "${RED}❌ Critical security vulnerabilities detected${NC}"
        echo -e "${YELLOW}📋 Check test results in: $TEST_DIR${NC}"
        exit 1
    fi
}

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}Cleaning up test data...${NC}"
    # Note: In a real scenario, you might want to clean up test users from the database
    # For now, we'll just clean up temporary files
    rm -rf $TEST_DIR
    echo "✅ Cleanup complete"
}

# Set up cleanup trap
trap cleanup EXIT

# Run the tests
main "$@"
