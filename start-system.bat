@echo off
REM Quick Start Guide - After Build Fix (Windows)
REM Run this batch file to start both frontend and backend

echo.
echo === AI Smart Exam Proctoring System ===
echo.
echo Starting Backend...
start "Backend" cmd /k "cd backend && npm run dev"
timeout /t 3

echo.
echo Starting Frontend...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo === SYSTEM RUNNING ===
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000/api
echo.
echo Close the command windows to stop the servers.
echo.
