#!/bin/bash

# AI Smart Exam Proctoring System - Quick Start Script for Mac/Linux

echo ""
echo "================================================"
echo "  ProctorAI - Quick Start"
echo "================================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install it from https://nodejs.org/"
    exit 1
fi

echo "[1/4] Checking Node.js..."
node --version
echo "✓ Node.js OK"
echo ""

echo "[2/4] Setting up Backend..."
cd backend
if [ ! -f ".env" ]; then
    echo "Creating .env from template..."
    cp .env.example .env
    echo "✓ Backend .env created (UPDATE WITH YOUR CREDENTIALS!)"
else
    echo "✓ Backend .env exists"
fi
cd ..
echo ""

echo "[3/4] Setting up Frontend..."
if [ ! -f "frontend/.env" ]; then
    echo "Creating frontend .env..."
    cat > frontend/.env << EOF
VITE_API_URL=http://localhost:5000/api
EOF
    echo "✓ Frontend .env created"
else
    echo "✓ Frontend .env exists"
fi
echo ""

echo "[4/4] Dependencies installed?"
if [ -d "backend/node_modules" ]; then
    echo "✓ Backend packages OK"
else
    echo "Installing backend packages..."
    cd backend
    npm install
    cd ..
fi

if [ -d "frontend/node_modules" ]; then
    echo "✓ Frontend packages OK"
else
    echo "Installing frontend packages..."
    cd frontend
    npm install
    cd ..
fi
echo ""

echo "================================================"
echo "  SETUP COMPLETE!"
echo "================================================"
echo ""
echo "Next steps:"
echo ""
echo "1. UPDATE CREDENTIALS in backend/.env:"
echo "   - MongoDB URI"
echo "   - Cloudinary keys"
echo "   - JWT secret"
echo ""
echo "2. START BACKEND (Terminal 1):"
echo "   cd backend"
echo "   npm run dev"
echo ""
echo "3. START FRONTEND (Terminal 2):"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "4. OPEN http://localhost:5173 in your browser"
echo ""
echo "5. TEST LOGIN with registered credentials"
echo ""
echo "================================================"
echo ""
