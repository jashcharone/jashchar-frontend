@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM JASHCHAR ERP - Android Build Script
REM Usage: build_android.bat [debug|release]
REM ═══════════════════════════════════════════════════════════════════════════

setlocal

set BUILD_TYPE=%1
if "%BUILD_TYPE%"=="" set BUILD_TYPE=debug

echo.
echo ══════════════════════════════════════════════════════════════
echo   JASHCHAR ERP - Android %BUILD_TYPE% Build
echo ══════════════════════════════════════════════════════════════
echo.

REM Step 1: Build web app
echo [1/3] Building web app...
call npx vite build
if %errorlevel% neq 0 (
    echo ERROR: Web build failed!
    exit /b 1
)
echo      Web build complete ✓
echo.

REM Step 2: Sync to Android
echo [2/3] Syncing to Android...
call npx cap sync android
if %errorlevel% neq 0 (
    echo ERROR: Cap sync failed!
    exit /b 1
)
echo      Android sync complete ✓
echo.

REM Step 3: Build APK/AAB
echo [3/3] Building Android %BUILD_TYPE%...
cd android

if "%BUILD_TYPE%"=="release" (
    call gradlew.bat bundleRelease
    if %errorlevel% neq 0 (
        echo ERROR: Release build failed!
        exit /b 1
    )
    echo.
    echo ══════════════════════════════════════════════════════════════
    echo   BUILD COMPLETE ✓
    echo   AAB: android\app\build\outputs\bundle\release\app-release.aab
    echo ══════════════════════════════════════════════════════════════
) else (
    call gradlew.bat assembleDebug
    if %errorlevel% neq 0 (
        echo ERROR: Debug build failed!
        exit /b 1
    )
    echo.
    echo ══════════════════════════════════════════════════════════════
    echo   BUILD COMPLETE ✓
    echo   APK: android\app\build\outputs\apk\debug\app-debug.apk
    echo ══════════════════════════════════════════════════════════════
)

cd ..
endlocal
