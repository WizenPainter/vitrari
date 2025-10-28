#!/bin/bash

# Vitrari Admin Account Creator Script
# This script creates an administrator account for the Vitrari application

set -e

echo "🛡️  Vitrari Admin Account Creator"
echo "================================="
echo ""

# Check if database exists
DB_PATH="./database/glass_optimizer.db"
if [ ! -f "$DB_PATH" ]; then
    echo "❌ Database not found at $DB_PATH"
    echo "Please run the main application first to initialize the database."
    exit 1
fi

# Function to validate email
validate_email() {
    local email=$1
    if [[ $email =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        return 0
    else
        return 1
    fi
}

# Get admin details
echo "Please provide the admin account details:"
echo ""

# First Name
read -p "👤 First Name: " FIRST_NAME
while [ -z "$FIRST_NAME" ]; do
    echo "❌ First name cannot be empty."
    read -p "👤 First Name: " FIRST_NAME
done

# Last Name
read -p "👤 Last Name: " LAST_NAME
while [ -z "$LAST_NAME" ]; do
    echo "❌ Last name cannot be empty."
    read -p "👤 Last Name: " LAST_NAME
done

# Email
while true; do
    read -p "📧 Email (must end with @vitrari.com or @admin.com for admin privileges): " EMAIL
    EMAIL=$(echo "$EMAIL" | tr '[:upper:]' '[:lower:]' | xargs)

    if [ -z "$EMAIL" ]; then
        echo "❌ Email cannot be empty."
        continue
    fi

    if ! validate_email "$EMAIL"; then
        echo "❌ Please enter a valid email address."
        continue
    fi

    # Check for admin domain
    if [[ ! "$EMAIL" =~ @(vitrari\.com|admin\.com)$ ]]; then
        echo "⚠️  Warning: This email domain will NOT have admin privileges."
        echo "   Admin privileges are only granted to @vitrari.com and @admin.com emails."
        read -p "   Continue anyway? (y/N): " CONFIRM
        CONFIRM=$(echo "$CONFIRM" | tr '[:upper:]' '[:lower:]')
        if [[ "$CONFIRM" != "y" && "$CONFIRM" != "yes" ]]; then
            continue
        fi
    fi

    # Check if user already exists
    EXISTING_USER=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM users WHERE email = '$EMAIL';" 2>/dev/null || echo "0")
    if [ "$EXISTING_USER" -gt 0 ]; then
        echo "❌ A user with email $EMAIL already exists."
        continue
    fi

    break
done

# Password
while true; do
    read -s -p "🔒 Password (minimum 8 characters): " PASSWORD
    echo ""

    if [ ${#PASSWORD} -lt 8 ]; then
        echo "❌ Password must be at least 8 characters long."
        continue
    fi

    read -s -p "🔒 Confirm Password: " CONFIRM_PASSWORD
    echo ""

    if [ "$PASSWORD" != "$CONFIRM_PASSWORD" ]; then
        echo "❌ Passwords do not match. Please try again."
        continue
    fi

    break
done

# Generate password hash using Python (bcrypt)
echo "🔄 Creating admin account..."

# Check if Python is available
if command -v python3 >/dev/null 2>&1; then
    PYTHON_CMD="python3"
elif command -v python >/dev/null 2>&1; then
    PYTHON_CMD="python"
else
    echo "❌ Python is required to hash the password. Please install Python."
    exit 1
fi

# Install bcrypt if not available
$PYTHON_CMD -c "import bcrypt" 2>/dev/null || {
    echo "📦 Installing bcrypt for password hashing..."
    $PYTHON_CMD -m pip install bcrypt --user >/dev/null 2>&1 || {
        echo "❌ Failed to install bcrypt. Please install it manually: pip install bcrypt"
        exit 1
    }
}

# Hash the password
PASSWORD_HASH=$($PYTHON_CMD -c "
import bcrypt
import sys
password = sys.argv[1].encode('utf-8')
hashed = bcrypt.hashpw(password, bcrypt.gensalt(rounds=12))
print(hashed.decode('utf-8'))
" "$PASSWORD")

# Get current timestamp
TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S")

# Insert admin user into database
sqlite3 "$DB_PATH" "
INSERT INTO users (
    email, password_hash, first_name, last_name,
    email_verified, created_at, updated_at
) VALUES (
    '$EMAIL',
    '$PASSWORD_HASH',
    '$FIRST_NAME',
    '$LAST_NAME',
    1,
    '$TIMESTAMP',
    '$TIMESTAMP'
);
"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Admin account created successfully!"
    echo "📧 Email: $EMAIL"
    echo "👤 Name: $FIRST_NAME $LAST_NAME"
    echo ""
    echo "🔐 You can now log in with these credentials at /auth"

    if [[ "$EMAIL" =~ @(vitrari\.com|admin\.com)$ ]]; then
        echo "🛡️  Admin privileges are automatically granted for this email domain"
    else
        echo "⚠️  Note: This account does NOT have admin privileges due to email domain"
    fi

    echo ""
    echo "🚀 Start the server with: ./glass-optimizer or go run main.go"
else
    echo "❌ Failed to create admin account. Please check the database and try again."
    exit 1
fi
