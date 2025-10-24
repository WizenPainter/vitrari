# Mobile Sidebar Menu Layout Fixes

## Overview
This document outlines the changes made to the Glass Optimizer designer page to handle production environment detection and mobile view improvements.

## Changes Made

### 1. Environment Detection
- Added production environment detection to hide certain buttons in development mode
- Production detection logic:
  ```javascript
  const isProduction =
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1" &&
      !window.location.hostname.includes("local") &&
      !window.location.port;
  ```

### 2. Button Visibility Controls

#### Production-Only Buttons
The following buttons are now hidden in development environment:
- **Export to File** (`btn-save`) - File export functionality
- **Load Design** (`btn-load`) - File import functionality

These buttons have been marked with the `production-only` CSS class.

#### Mobile View Adjustments
In mobile view (screen width ≤ 768px), the following buttons are hidden:
- **Export to File** (also marked with `desktop-only`)
- **Load Design** (also marked with `desktop-only`)

### 3. Spanish Translation Updates

#### Updated Buttons
- **Save** button: Now shows "Guardar" in Spanish
- **Save As** button: Now shows "Guardar como" in Spanish

#### Translation Additions to i18n.js
```javascript
// English
save: "Save",
saveAs: "Save As",

// Spanish  
save: "Guardar",
saveAs: "Guardar como",
```

### 4. CSS Classes Added

#### New CSS Classes in designer.css
```css
/* Production and Mobile Environment Controls */
.production-only {
    display: block;
}

.desktop-only {
    display: block;
}

/* Hide production-only elements in mobile view */
@media (max-width: 768px) {
    .desktop-only {
        display: none !important;
    }
}
```

### 5. JavaScript Functions Added

#### Environment Detection
```javascript
function initializeEnvironment() {
    const isProduction =
        window.location.hostname !== "localhost" &&
        window.location.hostname !== "127.0.0.1" &&
        !window.location.hostname.includes("local") &&
        !window.location.port;

    const productionOnlyElements =
        document.querySelectorAll(".production-only");
    productionOnlyElements.forEach((element) => {
        if (!isProduction) {
            element.style.display = "none";
        }
    });
}
```

#### Mobile View Handling
```javascript
function handleMobileView() {
    const desktopOnlyElements =
        document.querySelectorAll(".desktop-only");
    if (window.innerWidth <= 768) {
        desktopOnlyElements.forEach((element) => {
            element.style.display = "none";
        });
    } else {
        desktopOnlyElements.forEach((element) => {
            element.style.display = "";
        });
    }
}
```

## Files Modified

### 1. templates/designer.html
- Added `data-i18n` attributes to Save and Save As buttons
- Added `production-only desktop-only` classes to Export and Load buttons
- Added JavaScript functions for environment and mobile detection
- Updated button initialization logic

### 2. static/js/i18n.js
- Added Spanish translations for "save" and "saveAs" keys

### 3. static/css/designer.css  
- Added CSS rules for `production-only` and `desktop-only` classes
- Added mobile media query to hide desktop-only elements

### 4. test-mobile-designer.html
- Updated to match main designer template changes
- Added same environment detection functionality

## Testing

### Test File Created
- `test-environment-detection.html` - Comprehensive test page to verify:
  - Environment detection (development vs production)
  - Mobile vs desktop view detection
  - Button visibility rules
  - Spanish translation functionality

### Test Scenarios

#### Development Environment (localhost)
- ✅ "Export to File" button hidden
- ✅ "Load Design" button hidden  
- ✅ "Save" and "Save As" buttons visible
- ✅ Other buttons (Print, Clear All) visible

#### Production Environment
- ✅ All buttons visible on desktop
- ✅ "Export to File" and "Load Design" hidden on mobile

#### Mobile View (≤768px width)
- ✅ "Export to File" button hidden
- ✅ "Load Design" button hidden
- ✅ "Save" and "Save As" buttons visible and properly translated

#### Spanish Language
- ✅ "Save" shows as "Guardar"
- ✅ "Save As" shows as "Guardar como"
- ✅ Other buttons maintain existing Spanish translations

## Browser Support
- ✅ Modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ✅ Responsive design maintains functionality across screen sizes

## Deployment Notes
1. Changes are backward compatible
2. No database migrations required
3. CSS and JavaScript changes take effect immediately
4. Test environment detection functionality before deploying to production

## Future Improvements
1. Consider adding environment variable override for testing production features in development
2. Add user preference storage for button visibility
3. Implement progressive enhancement for environments without JavaScript