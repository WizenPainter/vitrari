# Favicon Setup Guide

## Overview
This guide explains how to properly set up the favicon for the Glass Optimizer application. The app now supports multiple favicon formats for maximum browser compatibility.

## Where to Place Your favicon.ico File

### Option 1: Root Static Folder (Recommended)
Place your `favicon.ico` file directly in the `static/` folder:

```
glass-optimizer/
├── static/
│   ├── favicon.ico          ← Place your favicon.ico here
│   ├── css/
│   ├── js/
│   └── assets/
└── ...
```

This is the **recommended approach** because:
- The Go server automatically serves it at `/favicon.ico`
- Works with the existing route handler
- Standard web convention

### Option 2: Assets Folder (Alternative)
You can also place it in `static/assets/`:

```
glass-optimizer/
├── static/
│   ├── css/
│   ├── js/
│   └── assets/
│       ├── favicon.ico      ← Alternative location
│       ├── favicon.svg      ← Optional SVG version
│       └── apple-touch-icon.png ← Optional iOS icon
└── ...
```

## How It Works

### Server Configuration
The Go server (`main.go`) includes a dedicated route handler for the favicon:

```go
// Favicon
http.HandleFunc("/favicon.ico", func(w http.ResponseWriter, r *http.Request) {
    http.ServeFile(w, r, "static/favicon.ico")
})
```

This ensures that browsers can access the favicon at the standard `/favicon.ico` URL.

### HTML Templates
All templates now include comprehensive favicon references in the `<head>` section:

```html
<!-- Favicon -->
<link rel="icon" type="image/x-icon" href="/favicon.ico" />
<link rel="icon" type="image/svg+xml" href="/static/assets/favicon.svg" />
<link rel="apple-touch-icon" sizes="180x180" href="/static/assets/apple-touch-icon.png" />
```

### Favicon Formats Supported

1. **favicon.ico** (Required)
   - Traditional ICO format
   - Supported by all browsers
   - Place in: `static/favicon.ico`
   - URL: `/favicon.ico`

2. **favicon.svg** (Optional)
   - Modern SVG format
   - Scalable and lightweight
   - Place in: `static/assets/favicon.svg`
   - URL: `/static/assets/favicon.svg`

3. **apple-touch-icon.png** (Optional)
   - iOS home screen icon
   - 180x180 pixels recommended
   - Place in: `static/assets/apple-touch-icon.png`
   - URL: `/static/assets/apple-touch-icon.png`

## Setup Steps

### 1. Place Your favicon.ico
Copy your `favicon.ico` file to `static/favicon.ico`

### 2. Verify the Setup
Start your server and check these URLs:
- `http://localhost:9995/favicon.ico` - Should serve your ICO file
- `http://localhost:9995/` - Should show favicon in browser tab

### 3. Optional: Add Additional Formats
For better compatibility and modern browsers:

- Create an SVG version: `static/assets/favicon.svg`
- Create an iOS icon: `static/assets/apple-touch-icon.png` (180x180px)

### 4. Test Across Browsers
- **Chrome/Edge**: Uses ICO or SVG
- **Firefox**: Uses ICO or SVG  
- **Safari**: Uses ICO, SVG, or Apple Touch Icon
- **Mobile Safari**: Uses Apple Touch Icon for home screen

## Templates Updated

The following templates now include favicon support:

1. `templates/layout.html` - Main layout template
2. `templates/designer.html` - Designer page
3. `templates/index.html` - Dashboard/home page
4. `templates/optimizer.html` - Optimizer page
5. `templates/project.html` - Project page

## Browser Caching

Browsers heavily cache favicons. If you update your favicon:

1. **Clear browser cache** or use hard refresh (Ctrl+F5)
2. **Test in incognito/private mode**
3. **Check browser developer tools** for 404 errors

## Troubleshooting

### Favicon Not Showing
1. Verify file exists at `static/favicon.ico`
2. Check browser developer tools for 404 errors
3. Clear browser cache
4. Ensure file is valid ICO format

### 404 Error on /favicon.ico
1. Check that the Go server route handler is present
2. Verify file path in the handler: `static/favicon.ico`
3. Ensure server is restarted after code changes

### Wrong Icon Showing
1. Clear browser cache completely
2. Check for multiple favicon files with different names
3. Verify ICO file is valid (not just renamed PNG)

## Creating Favicon Files

### ICO Format
Use online tools or graphics software:
- **Online**: favicon.io, realfavicongenerator.net
- **Software**: GIMP, Photoshop, IconForge

### Recommended Sizes
- ICO: 16x16, 32x32, 48x48 (multi-size ICO)
- SVG: Scalable (any size)
- Apple Touch: 180x180 PNG

## Example Files Structure

```
glass-optimizer/
├── static/
│   ├── favicon.ico                    ← Your main favicon (required)
│   ├── css/
│   ├── js/
│   └── assets/
│       ├── favicon.svg                ← Optional modern SVG version
│       ├── apple-touch-icon.png       ← Optional iOS icon (180x180)
│       ├── favicon-16x16.png          ← Optional 16x16 PNG
│       ├── favicon-32x32.png          ← Optional 32x32 PNG
│       └── favicon-96x96.png          ← Optional 96x96 PNG
├── templates/
│   ├── designer.html                  ← Updated with favicon links
│   ├── index.html                     ← Updated with favicon links
│   ├── layout.html                    ← Updated with favicon links
│   ├── optimizer.html                 ← Updated with favicon links
│   └── project.html                   ← Updated with favicon links
└── main.go                           ← Updated with favicon route
```

## Quick Test

After setting up, you can quickly test by visiting:
- http://localhost:9995/ (should show favicon in tab)
- http://localhost:9995/favicon.ico (should download/display the ICO file)

The favicon should appear in:
- Browser tabs
- Bookmarks
- Browser history
- iOS home screen (if Apple Touch Icon provided)