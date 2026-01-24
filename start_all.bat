@echo off
echo ========================================
echo   Jashchar ERP - Starting All Services
echo ========================================
echo.

echo Killing existing Node processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak > nul

echo Starting Backend Server (Port 5000)...
start "Jashchar Backend" cmd /k "cd /d %~dp0jashchar-backend && npm run dev"

timeout /t 3 /nobreak > nul

echo Starting Frontend Server (Port 3005)...
start "Jashchar Frontend" cmd /k "cd /d %~dp0jashchar-frontend && npm run dev"

echo.
echo ========================================
echo   Services Starting...
echo ========================================
echo.
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:3005
echo.
echo   Login as Master Admin to test:
echo   /master-admin/module-registry
echo   /master-admin/subscription-plans
echo   /master-admin/role-permission
echo.
echo   Task Management (after enabling):
echo   /super-admin/task-management/dashboard
echo.
echo ========================================
