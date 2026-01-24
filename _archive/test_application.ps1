# Application Test Script
# Run this to verify everything is set up correctly

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Application Status Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Frontend
Write-Host "1. Checking Frontend..." -ForegroundColor Yellow
$frontendPath = "frontend\package.json"
if (Test-Path $frontendPath) {
    Write-Host "   ✅ Frontend package.json found" -ForegroundColor Green
    $frontendPkg = Get-Content $frontendPath | ConvertFrom-Json
    Write-Host "   📦 Frontend Name: $($frontendPkg.name)" -ForegroundColor White
} else {
    Write-Host "   ❌ Frontend package.json NOT found" -ForegroundColor Red
}

# Check Backend
Write-Host ""
Write-Host "2. Checking Backend..." -ForegroundColor Yellow
$backendPath = "backend\package.json"
if (Test-Path $backendPath) {
    Write-Host "   ✅ Backend package.json found" -ForegroundColor Green
    $backendPkg = Get-Content $backendPath | ConvertFrom-Json
    Write-Host "   📦 Backend Name: $($backendPkg.name)" -ForegroundColor White
} else {
    Write-Host "   ❌ Backend package.json NOT found" -ForegroundColor Red
}

# Check Key Files
Write-Host ""
Write-Host "3. Checking Key Files..." -ForegroundColor Yellow
$files = @(
    "frontend\src\pages\master-admin\front-cms\Menus.jsx",
    "frontend\src\pages\master-admin\front-cms\MenuItems.jsx",
    "backend\src\controllers\frontCms.controller.js",
    "backend\src\routes\frontCms.routes.js"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file NOT found" -ForegroundColor Red
    }
}

# Check Ports
Write-Host ""
Write-Host "4. Checking Ports..." -ForegroundColor Yellow
$port3005 = Get-NetTCPConnection -LocalPort 3005 -ErrorAction SilentlyContinue
$port5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue

if ($port3005) {
    Write-Host "   ✅ Port 3005 is in use (Frontend might be running)" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Port 3005 is free (Frontend not running)" -ForegroundColor Yellow
}

if ($port5000) {
    Write-Host "   ✅ Port 5000 is in use (Backend might be running)" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Port 5000 is free (Backend not running)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start Backend:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start Frontend (in new terminal):" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Open Browser:" -ForegroundColor White
Write-Host "   http://localhost:3005/" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Check Browser Console (F12) for errors" -ForegroundColor White
Write-Host ""

