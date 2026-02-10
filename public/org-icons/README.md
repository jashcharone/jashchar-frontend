# Organization-Specific PWA Icons

## Directory Structure
```
org-icons/
├── demo/
│   ├── icon-192x192.png
│   ├── icon-512x512.png
│   └── apple-touch-icon.png
├── abc/
│   ├── icon-192x192.png
│   ├── icon-512x512.png
│   └── apple-touch-icon.png
└── xyz/
    ├── icon-192x192.png
    ├── icon-512x512.png
    └── apple-touch-icon.png
```

## Icon Requirements

### PWA Icons
- **192x192**: Minimum size for PWA installation
- **512x512**: High-res icon for app launchers
- **apple-touch-icon**: iOS home screen icon (180x180 recommended)

### Design Guidelines
- Use organization's primary color as background
- Include school/college logo or name
- Ensure logo/text is clearly visible
- Test on both light and dark backgrounds

## How to Add Icons for New Organization

1. Create folder: `public/org-icons/[org-slug]/`
2. Add 3 icon files with exact names above
3. Icons will automatically be served via `/api/public/org-icon` endpoint
4. PWA manifest will automatically reference these icons

## Icon Generation Tools

### Online Tools:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

### Command Line:
```bash
# Using ImageMagick
convert logo.png -resize 192x192 icon-192x192.png
convert logo.png -resize 512x512 icon-512x512.png
convert logo.png -resize 180x180 apple-touch-icon.png
```

## Fallback Behavior
If organization-specific icons don't exist, system uses default icons from `/public/` directory.
