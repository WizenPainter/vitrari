# User Dropdown Testing Guide

## 🧪 Overview

This document outlines the testing procedures for the user dropdown functionality in the Vitrari glass optimization application. The user dropdown provides authenticated users with quick access to profile options and logout functionality.

## 🎯 Features to Test

### User Interface
- **User Icon Display**: User avatar/icon appears in navbar when logged in
- **User Name Display**: First name appears next to the user icon
- **Dropdown Arrow**: Chevron arrow indicates dropdown functionality
- **Login Button**: "Login" button appears when user is not authenticated

### Dropdown Menu
- **User Information**: Display user's full name, email, and avatar
- **Navigation Links**: Profile and Account Settings links
- **Logout Button**: Functional logout with confirmation
- **Visual Feedback**: Hover states and smooth animations

### Interactions
- **Click to Open**: Dropdown opens when user icon is clicked
- **Click Outside**: Dropdown closes when clicking outside
- **Keyboard Navigation**: Arrow keys navigate menu items
- **Escape Key**: Closes dropdown menu
- **Logout Process**: Successful logout and redirect

## 🚀 Testing Procedures

### 1. Initial State Testing

**Test Case: Unauthenticated User**
1. Navigate to `http://localhost:9995`
2. Verify "Login" button appears in navbar
3. Verify no user dropdown is visible
4. Click "Login" button
5. Verify redirect to `/auth` page

**Expected Result**: ✅ Login button visible, no user dropdown

### 2. Authentication Testing

**Test Case: User Login**
1. Navigate to `http://localhost:9995/auth`
2. Click "Login" tab
3. Enter admin credentials:
   - Email: `john.admin@vitrari.com`
   - Password: `MySecurePassword123!`
4. Click "Sign In"
5. Verify redirect to dashboard
6. Check navbar for user dropdown

**Expected Result**: ✅ User dropdown appears with user's first name

### 3. Dropdown Functionality Testing

**Test Case: Opening User Dropdown**
1. Ensure user is logged in
2. Click on user icon/name in navbar
3. Verify dropdown menu opens
4. Check dropdown contains:
   - User avatar (circle with person icon)
   - Full name display
   - Email address display
   - Profile link
   - Account Settings link
   - Logout button

**Expected Result**: ✅ Dropdown opens with all expected elements

**Test Case: Closing User Dropdown**
1. Open user dropdown
2. Test closing methods:
   - Click user icon again (toggle)
   - Click outside dropdown area
   - Press Escape key
3. Verify dropdown closes in all cases

**Expected Result**: ✅ Dropdown closes with all methods

### 4. Visual States Testing

**Test Case: Hover Effects**
1. Open user dropdown
2. Hover over each menu item
3. Verify background color changes
4. Verify logout item has red color on hover

**Expected Result**: ✅ All hover states work correctly

**Test Case: Dropdown Arrow Animation**
1. Click to open dropdown
2. Verify arrow rotates 180 degrees
3. Close dropdown
4. Verify arrow rotates back

**Expected Result**: ✅ Arrow animation works smoothly

### 5. Keyboard Navigation Testing

**Test Case: Arrow Key Navigation**
1. Open user dropdown with mouse
2. Press Tab or Down arrow to focus first item
3. Use Down arrow to navigate through items
4. Use Up arrow to navigate backwards
5. Verify visual focus indicators

**Expected Result**: ✅ Keyboard navigation works correctly

**Test Case: Enter Key Activation**
1. Navigate to logout button with keyboard
2. Press Enter
3. Verify logout function executes

**Expected Result**: ✅ Enter key activates focused item

### 6. Logout Functionality Testing

**Test Case: Successful Logout**
1. Open user dropdown
2. Click "Logout" button
3. Verify success notification appears
4. Wait for redirect to `/auth` page
5. Verify user is logged out (login form appears)

**Expected Result**: ✅ User successfully logged out with notification

**Test Case: Logout Error Handling**
1. Simulate network error (disconnect internet)
2. Attempt logout
3. Verify error notification appears
4. Verify user remains logged in

**Expected Result**: ✅ Error handled gracefully with notification

### 7. Responsive Design Testing

**Test Case: Mobile View**
1. Resize browser to mobile width (< 768px)
2. Verify user dropdown still functions
3. Check dropdown positioning
4. Test touch interactions

**Expected Result**: ✅ User dropdown works on mobile devices

**Test Case: Tablet View**
1. Resize browser to tablet width (768px - 1024px)
2. Verify dropdown positioning
3. Test all interactions

**Expected Result**: ✅ User dropdown works on tablet devices

### 8. Cross-Browser Testing

**Test Case: Browser Compatibility**
Test in multiple browsers:
- Chrome/Chromium
- Firefox
- Safari
- Edge

Verify:
- Dropdown functionality
- CSS animations
- JavaScript interactions
- Visual consistency

**Expected Result**: ✅ Consistent behavior across browsers

## 🐛 Common Issues and Troubleshooting

### Issue: User dropdown not appearing
**Possible Causes:**
- User not properly authenticated
- Template context missing user data
- CSS not loading properly

**Debug Steps:**
1. Check browser dev tools for JavaScript errors
2. Verify user context in page source: `{{.User}}`
3. Check network tab for failed CSS/JS requests

### Issue: Logout not working
**Possible Causes:**
- API endpoint not responding
- CORS issues
- JavaScript errors

**Debug Steps:**
1. Check browser console for errors
2. Verify `/api/auth/logout` endpoint in network tab
3. Check server logs for authentication errors

### Issue: Dropdown positioning incorrect
**Possible Causes:**
- CSS conflicts
- Z-index issues
- Responsive design problems

**Debug Steps:**
1. Inspect dropdown element in dev tools
2. Check CSS cascade and specificity
3. Verify z-index values

## 📝 Test Checklist

Use this checklist for comprehensive testing:

### Authentication States
- [ ] Unauthenticated user sees login button
- [ ] Authenticated user sees user dropdown
- [ ] User name displays correctly
- [ ] User email displays correctly

### Dropdown Functionality
- [ ] Dropdown opens on click
- [ ] Dropdown closes on outside click
- [ ] Dropdown closes on escape key
- [ ] Dropdown toggles correctly

### Menu Items
- [ ] User info section displays correctly
- [ ] Profile link works
- [ ] Account Settings link works
- [ ] Logout button functions

### Visual Feedback
- [ ] Hover states work on all items
- [ ] Arrow rotation animation works
- [ ] Dropdown slide animation works
- [ ] Color scheme matches design

### Keyboard Navigation
- [ ] Tab navigation works
- [ ] Arrow key navigation works
- [ ] Enter key activates items
- [ ] Focus indicators visible

### Logout Process
- [ ] Logout API call succeeds
- [ ] Success notification shows
- [ ] Redirect to auth page works
- [ ] User session cleared

### Responsive Design
- [ ] Works on mobile devices
- [ ] Works on tablet devices
- [ ] Positioning correct on all screen sizes
- [ ] Touch interactions work

### Error Handling
- [ ] Network errors handled gracefully
- [ ] Error notifications display
- [ ] Fallback notifications work

## 🔧 Testing Tools

### Browser Developer Tools
- **Console**: Check for JavaScript errors
- **Network**: Monitor API requests
- **Elements**: Inspect CSS and HTML
- **Application**: Check cookies and localStorage

### Manual Testing Commands
```bash
# Start the server
go run main.go

# Create admin user for testing
go run setup_admin.go "Test" "User" "test@vitrari.com" "TestPassword123!"
```

### Test User Credentials
For consistent testing, use these credentials:
- **Email**: `john.admin@vitrari.com`
- **Password**: `MySecurePassword123!`

## 📊 Success Criteria

The user dropdown functionality is considered successful if:

1. ✅ All visual elements display correctly
2. ✅ All interactions work as expected
3. ✅ Logout process completes successfully
4. ✅ No JavaScript errors in console
5. ✅ Responsive design works across devices
6. ✅ Keyboard navigation is fully functional
7. ✅ Error handling works appropriately

## 📚 Related Documentation

- [Authentication System Documentation](./AUTH_SYSTEM_DOCUMENTATION.md)
- [Admin Setup Guide](./ADMIN_SETUP.md)
- [Frontend Architecture](./FRONTEND_ARCHITECTURE.md)

---

**Last Updated**: October 27, 2025
**Version**: 1.0.0
**Tested By**: Development Team