@echo off
setlocal

echo =========================================
echo  Smart Resource Allocation Deployment
echo =========================================
echo.

:: 1. Verify dependencies
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm is not installed. Please install Node.js.
    exit /b 1
)

where firebase >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Firebase CLI is not installed.
    echo Please run: npm install -g firebase-tools
    exit /b 1
)

:: 2. Build the project
echo [INFO] Installing dependencies and building the frontend...
call npm install
call npm run build

if %ERRORLEVEL% neq 0 (
    echo [ERROR] Build failed. Aborting deployment.
    exit /b 1
)

:: 3. Deploy to Firebase
echo [INFO] Deploying to Firebase Hosting, Functions, and Firestore...
call firebase deploy

if %ERRORLEVEL% equ 0 (
    echo.
    echo [SUCCESS] Deployment completed successfully!
    echo Your app is now live.
) else (
    echo.
    echo [ERROR] Deployment failed. Please check the logs above.
    exit /b 1
)

endlocal
