# Vitrari Admin Account Setup Guide

## 🛡️ Overview

This guide explains how to create and manage administrator accounts for the Vitrari glass optimization application. Admin accounts have elevated privileges and can access administrative features.

## 🔐 Admin Privileges

Administrator privileges are automatically granted to users with email addresses ending in:
- `@vitrari.com`
- `@admin.com`

These email domains are configured in the authentication middleware and grant access to:
- Administrative endpoints (`/admin/*`)
- System management features
- User management capabilities
- Advanced configuration options

## 🚀 Creating an Admin Account

### Method 1: Using the Comprehensive Setup Tool (Recommended)

The complete setup tool handles database initialization and admin account creation:

1. **Interactive mode** (guided setup):
   ```bash
   go run setup_admin.go
   ```

2. **Non-interactive mode** (command-line arguments):
   ```bash
   go run setup_admin.go "John" "Admin" "john@vitrari.com" "MySecurePassword123!"
   ```

3. **View help**:
   ```bash
   go run setup_admin.go --help
   ```

### Method 2: Using the Simple Admin Creator

For quick admin creation when database is already set up:

1. **Interactive mode**:
   ```bash
   go run create_admin.go
   ```

2. **Non-interactive mode**:
   ```bash
   go run create_admin_simple.go "John" "Admin" "john@vitrari.com" "MySecurePassword123!"
   ```

### Method 3: Using the Shell Script

1. **Make the script executable**:
   ```bash
   chmod +x create_admin.sh
   ```

2. **Run the script**:
   ```bash
   ./create_admin.sh
   ```

### Method 4: Manual Database Entry

If you prefer to create the admin account manually:

1. **Hash the password** using bcrypt (cost factor 12):
   ```python
   import bcrypt
   password = "your_secure_password".encode('utf-8')
   hashed = bcrypt.hashpw(password, bcrypt.gensalt(rounds=12))
   print(hashed.decode('utf-8'))
   ```

2. **Insert into database**:
   ```sql
   INSERT INTO users (
       email, password_hash, first_name, last_name,
       email_verified, created_at, updated_at
   ) VALUES (
       'admin@vitrari.com',
       '$2b$12$...',  -- Your hashed password
       'Admin',
       'User',
       1,
       datetime('now'),
       datetime('now')
   );
   ```

## 📋 Example Admin Account Creation

Here's a complete example of creating an admin account using the comprehensive setup tool:

```bash
$ go run setup_admin.go "Jane" "SuperAdmin" "jane.admin@vitrari.com" "SuperSecurePassword456!"

🛡️  Vitrari Complete Admin Setup
==================================

🛡️  Creating admin account for Jane SuperAdmin (jane.admin@vitrari.com)
🔄 Initializing database...
🔄 Setting up authentication tables...
🔄 Creating admin account...

✅ Admin account created successfully!
📧 Email: jane.admin@vitrari.com
👤 Name: Jane SuperAdmin
🆔 User ID: 2

🛡️  Admin privileges are automatically granted for this email domain
✓ Can access administrative endpoints
✓ Can manage system settings
✓ Can manage other users

🔐 You can now log in with these credentials at:
   http://localhost:9995/auth

🚀 Start the server with:
   go run main.go
```

Interactive mode example:

```bash
$ go run setup_admin.go

🛡️  Vitrari Complete Admin Setup
==================================

This tool will:
✓ Initialize the database if needed
✓ Create authentication tables
✓ Create an admin user account
✓ Set up proper permissions

Please provide the admin account details:

👤 First Name: John
👤 Last Name: Admin
📧 Email (recommended: @vitrari.com or @admin.com for admin privileges): john.admin@vitrari.com
🔒 Password (minimum 8 characters): [hidden]
🔒 Confirm Password: [hidden]
```

## 🔍 Verifying Admin Access

After creating an admin account:

1. **Start the server**:
   ```bash
   go run main.go
   ```

2. **Navigate to the authentication page**:
   ```
   http://localhost:9995/auth
   ```

3. **Log in with your admin credentials**

4. **Verify admin access** by checking:
   - Access to admin-only endpoints
   - Administrative features in the UI
   - System management capabilities

## 🛠️ Admin Management

### Viewing Admin Users

To see which users have admin privileges:

```sql
SELECT id, email, first_name, last_name, created_at 
FROM users 
WHERE email LIKE '%@vitrari.com' OR email LIKE '%@admin.com';
```

### Updating Admin Privileges

To grant admin privileges to an existing user, change their email domain:

```sql
UPDATE users 
SET email = 'user@vitrari.com' 
WHERE id = [user_id];
```

### Removing Admin Privileges

To remove admin privileges, change the email domain:

```sql
UPDATE users 
SET email = 'user@example.com' 
WHERE id = [user_id];
```

## 🔒 Security Best Practices

### Password Requirements
- **Minimum 8 characters**
- Use a mix of uppercase, lowercase, numbers, and symbols
- Avoid common passwords and dictionary words
- Consider using a password manager

### Account Security
- **Email Verification**: Admin accounts are pre-verified
- **Account Lockout**: After 5 failed login attempts, accounts are locked for 30 minutes
- **Session Management**: Sessions expire after 24 hours (or 30 days with "Remember Me")
- **Secure Storage**: Passwords are hashed with bcrypt (cost factor 12)

### Admin Email Domains
- Use `@vitrari.com` for production administrators
- Use `@admin.com` for development/testing
- Never use public email domains for admin accounts

## 🔧 Troubleshooting

### Database Not Found
```
❌ Database not found at ./database/glass_optimizer.db
```
**Solution**: Run the main application once to initialize the database:
```bash
go run main.go
```

### Email Already Exists
```
❌ A user with email admin@vitrari.com already exists.
```
**Solution**: Either use a different email or delete the existing user:
```sql
DELETE FROM users WHERE email = 'admin@vitrari.com';
```

### No Admin Privileges After Login
If you can log in but don't have admin access:
1. Verify your email domain ends with `@vitrari.com` or `@admin.com`
2. Check the authentication middleware configuration
3. Restart the server after email changes

### Permission Denied
```
❌ Failed to create admin account: database is locked
```
**Solution**: Ensure the server is stopped before creating admin accounts

## 🌐 Environment Variables

The admin creation tools respect these environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_PATH` | `./database/glass_optimizer.db` | Database file location |
| `JWT_SECRET` | `vitrari-default-secret-change-in-production` | JWT signing secret |

Examples with custom settings:
```bash
# Custom database path
DB_PATH=/custom/path/database.db go run setup_admin.go

# Custom JWT secret
JWT_SECRET=your-production-secret go run setup_admin.go

# Both custom settings
DB_PATH=/custom/path/db.sqlite JWT_SECRET=secret go run setup_admin.go "Admin" "User" "admin@vitrari.com" "password123"
```

## 🔧 Available Tools

The project includes several tools for admin account management:

| Tool | Purpose | Best For |
|------|---------|----------|
| `setup_admin.go` | Complete setup with database initialization | First-time setup, new installations |
| `create_admin.go` | Interactive admin creation | When database exists |
| `create_admin_simple.go` | Command-line admin creation | Scripting, automation |
| `create_admin.sh` | Shell script version | Systems without Go installed |

## 📚 Related Documentation

- [Authentication System Documentation](./AUTH_SYSTEM_DOCUMENTATION.md)
- [API Endpoints](./AUTH_SYSTEM_DOCUMENTATION.md#api-endpoints)
- [Security Features](./AUTH_SYSTEM_DOCUMENTATION.md#security-features)
- [Database Schema](./AUTH_SYSTEM_DOCUMENTATION.md#database-schema)

## 🆘 Support

For additional help with admin account setup:

1. Check the server logs for detailed error messages
2. Verify database permissions and connectivity
3. Ensure all dependencies are installed
4. Review the authentication system documentation

---

**Note**: Always use secure passwords and proper email domains for production admin accounts. The `@admin.com` domain should only be used for development and testing purposes.