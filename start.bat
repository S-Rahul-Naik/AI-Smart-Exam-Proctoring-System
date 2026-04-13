@echo off
REM AI Smart Exam Proctoring System - Quick Start Script for Windows

echo.
echo ================================================
echo   ProctorAI - Quick Start
echo ================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed. Please install it from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/4] Checking Node.js...
node --version
echo ✓ Node.js OK
echo.

echo [2/4] Setting up Backend...
cd backend
if not exist ".env" (
    echo Creating .env from template...
    copy .env.example .env
    echo ✓ Backend .env created (UPDATE WITH YOUR CREDENTIALS!)
) else (
    echo ✓ Backend .env exists
)
cd ..
echo.

echo [3/4] Setting up Frontend...
if not exist "frontend\.env" (
    echo Creating frontend .env...
    (
        echo VITE_API_URL=http://localhost:5000/api
    ) > frontend\.env
    echo ✓ Frontend .env created
) else (
    echo ✓ Frontend .env exists
)
echo.

echo [4/4] Dependencies installed?
if exist "backend\node_modules" (
    echo ✓ Backend packages OK
) else (
    echo Installing backend packages...
    cd backend
    call npm install
    cd ..
)

if exist "frontend\node_modules" (
    echo ✓ Frontend packages OK
) else (
    echo Installing frontend packages...
    cd frontend
    call npm install
    cd ..
)
echo.

echo ================================================
echo   SETUP COMPLETE!
echo ================================================
echo.
echo Next steps:
echo.
echo 1. UPDATE CREDENTIALS in backend\.env:
echo    - MongoDB URI
echo    - Cloudinary keys
echo    - JWT secret
echo.
echo 2. START BACKEND (Terminal 1):
echo    cd backend
echo    npm run dev
echo.
echo 3. START FRONTEND (Terminal 2):
echo    cd frontend
echo    npm run dev
echo.
echo 4. OPEN http://localhost:5173 in your browser
echo.
echo 5. TEST LOGIN with registered credentials
echo.
echo ================================================
echo.

pause
