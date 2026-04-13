#!/bin/bash
# Quick Start Guide - After Build Fix
# Run this script to start both frontend and backend

echo "=== AI Smart Exam Proctoring System ==="
echo ""
echo "Backend starting..."
cd backend
npm run dev &
BACKEND_PID=$!
sleep 3

echo ""
echo "Frontend starting..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=== SYSTEM RUNNING ==="
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:5000/api"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

wait
