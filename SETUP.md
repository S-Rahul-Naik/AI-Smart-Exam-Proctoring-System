# ProctorAI: Complete Setup Guide

## 🚀 Get ProctorAI Running on Your Laptop

This guide walks you through setting up and running the complete ProctorAI project from scratch on a new laptop.

**Time Required**: ~30 minutes (first time setup)

---

## ✅ Prerequisites Checklist

Before starting, make sure you have:

- [ ] **Windows 10/11 or macOS or Linux**
- [ ] **Git** installed (for cloning the project)
- [ ] **Node.js 18+** (includes npm package manager)
- [ ] **Python 3.8+** (for backend)
- [ ] **MongoDB Community Edition** or **MongoDB Atlas** (cloud)
- [ ] **Visual Studio Code** or any code editor (optional, but recommended)

---

## 📋 Step 1: Install Prerequisites

### 1.1 Install Git
**Windows/Mac/Linux**: Visit https://git-scm.com/download and install

**Verify**:
```bash
git --version
# Should show: git version 2.x.x
```

### 1.2 Install Node.js (includes npm)
**Windows/Mac/Linux**: Visit https://nodejs.org (download LTS version)

**Verify**:
```bash
node --version
# Should show: v18.x.x or higher

npm --version
# Should show: 9.x.x or higher
```

### 1.3 Install Python
**Windows**: Visit https://www.python.org/downloads, download Python 3.10+
- **Important**: Check "Add Python to PATH" during installation

**Mac**: Use Homebrew
```bash
brew install python@3.10
```

**Linux**: Use apt
```bash
sudo apt-get install python3.10 python3-pip
```

**Verify**:
```bash
python --version
# Should show: Python 3.10.x or higher

pip --version
# Should show: pip 22.x or higher
```

### 1.4 Install MongoDB (Choose One)

#### Option A: MongoDB Community (Local - Recommended for Development)

**Windows**:
1. Download from https://www.mongodb.com/try/download/community
2. Run installer, choose "Complete" installation
3. Choose "Install MongoD as a Service"
4. Finish installation

**Mac**:
```bash
brew tap mongodb/brew
brew install mongodb-community
# Start MongoDB
brew services start mongodb-community
```

**Linux (Ubuntu)**:
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

**Verify MongoDB is Running**:
```bash
mongo --version
# Should show version 6.0 or higher
```

#### Option B: MongoDB Atlas (Cloud - Alternative)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a cluster (free tier)
4. Get connection string
5. Save connection string for later

---

## 📁 Step 2: Clone the Project

### 2.1 Choose a Location
Create a folder where you want the project:

**Windows (PowerShell)**:
```powershell
cd C:\Users\YourUsername\Desktop
# or any folder you prefer
```

**Mac/Linux**:
```bash
cd ~/Desktop
# or any folder you prefer
```

### 2.2 Clone Repository
```bash
git clone https://github.com/your-username/proctor.git
cd proctor
```

**If you get "repository not found"**: Make sure you have the correct GitHub URL.

### 2.3 Verify Project Structure
```bash
ls
# You should see folders: frontend, backend, model
```

---

## 🔧 Step 3: Backend Setup

### 3.1 Navigate to Backend
```bash
cd backend
```

### 3.2 Create Python Virtual Environment

**Windows (PowerShell)**:
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
# You should see (.venv) at start of terminal
```

**Mac/Linux**:
```bash
python3 -m venv .venv
source .venv/bin/activate
# You should see (.venv) at start of terminal
```

### 3.3 Install Python Dependencies
```bash
pip install -r requirements.txt
# This will take 2-5 minutes, lots of output is normal
```

### 3.4 Create `.env` File

Create a new file named `.env` in the backend folder:

**Windows**: Right-click → New → Text Document → rename to `.env`
**Mac/Linux**: `touch .env`

Add this content (copy-paste):

```
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/proctordb
# OR if using MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/proctordb

# Server Configuration
PORT=4000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:3000

# JWT Secret (use any random string)
JWT_SECRET=your-super-secret-key-change-this-in-production

# CORS Settings
CORS_ORIGIN=http://localhost:3000
```

**If using MongoDB Atlas**:
- Replace `mongodb+srv://username:password@cluster.mongodb.net/proctordb` with your actual connection string
- Get it from MongoDB Atlas → Connect → Connection String

### 3.5 Install Node.js Dependencies
```bash
npm install
# This will take 1-2 minutes
```

### 3.6 Verify Backend Setup
```bash
npm run dev
# Should show: Server running on http://localhost:4000
# Press Ctrl+C to stop
```

---

## 🎨 Step 4: Frontend Setup

### 4.1 Navigate to Frontend (NEW TERMINAL)
Open a new terminal window and run:

```bash
cd path/to/proctor/frontend
# For example: cd C:\Users\YourUsername\Desktop\proctor\frontend
```

### 4.2 Install Dependencies
```bash
npm install
# This will take 2-3 minutes
```

### 4.3 Create `.env` File

Create `.env` in the frontend folder:

**Windows**: Right-click → New → Text Document → rename to `.env`
**Mac/Linux**: `touch .env`

Add this content:

```
VITE_API_URL=http://localhost:4000
VITE_ENVIRONMENT=development
```

### 4.4 Verify Frontend Setup
```bash
npm run dev
# Should show: Local: http://localhost:3000
```

---

## 💾 Step 5: Database Setup

### 5.1 Check MongoDB is Running

**Windows**:
- Check Services (search "Services" in Start Menu)
- Look for "MongoDB" → should be "Running"

**Mac**:
```bash
brew services list
# MongoDB should show "started"
```

**Linux**:
```bash
sudo systemctl status mongod
# Should show "active (running)"
```

### 5.2 Seed the Database (Create Admin & Test Accounts)

**IMPORTANT**: You MUST run this step before logging in!

Open a **new terminal** and run:

```bash
cd path/to/proctor/backend
npm run seed
# Should output: "✓ Database seeded successfully"
```

**What the seed command does**:
✓ Creates MongoDB collections (database structure)  
✓ Creates an **Admin Account** (for you to manage exams)  
✓ Creates a **Student Account** (for testing as a student)  
✓ Loads sample exam data  

**Default Accounts Created**:

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| **Admin** | `admin@test.com` | `admin123` | Login to admin dashboard & review sessions |
| **Student** | `student@test.com` | `password123` | Login as student to take test exam |

### 5.3 Verify Seeding Worked

Check if database was created:

**Windows/Mac/Linux**:
```bash
mongosh
# Or: mongo

use proctordb
show collections
# Should see: admins, students, exams, sessions, etc.

db.admins.findOne()
# Should show the admin account with email: admin@test.com
```

If you see the admin account, you're ready! ✅

---

## 🚀 Step 6: Run the Complete Project

### 6.1 Start Everything

You need **3 terminal windows** running simultaneously:

**Terminal 1 - Backend**:
```bash
cd path/to/proctor/backend
npm run dev
# Watch for: "Server running on http://localhost:4000"
```

**Terminal 2 - Frontend**:
```bash
cd path/to/proctor/frontend
npm run dev
# Watch for: "Local: http://localhost:3000"
```

**Terminal 3 - MongoDB (if not running as service)**:
```bash
mongod
# Watch for: "Waiting for connections on port 27017"
```

### 6.2 Access the Application

Open your browser and go to:
```
http://localhost:3000
```

You should see the ProctorAI landing page!

---

## ✅ Step 7: Verify Everything Works

### 7.1 Test Login
1. Go to http://localhost:3000
2. Click "Sign In"
3. Use test credentials:
   - **Email**: `student@test.com`
   - **Password**: `password123`

### 7.2 Test Admin Dashboard
1. Click "Admin Console" on homepage
2. Use test admin credentials created by seeding:
   - **Email**: `admin@test.com`
   - **Password**: `admin123`
3. You should see the admin dashboard with live monitoring, alerts, and sessions
4. If login fails, make sure you ran `npm run seed` in Step 5.2

### 7.3 Check Database Connection
Open a new terminal:

**Windows/Mac/Linux**:
```bash
mongo
# or
mongosh
# You should see: MongoDB shell

show databases
# Should see: proctordb
```

---

## 🎓 Understanding the Setup

### What Each Terminal Does

| Terminal | Purpose | Command |
|----------|---------|---------|
| **Backend** | API server, handles requests | `npm run dev` |
| **Frontend** | Web UI, React development | `npm run dev` |
| **MongoDB** | Database, stores data | `mongod` |

### Port Assignments

| Service | Port | URL |
|---------|------|-----|
| **Frontend** | 3000 | http://localhost:3000 |
| **Backend** | 4000 | http://localhost:4000 |
| **MongoDB** | 27017 | mongodb://localhost:27017 |

### Folder Structure

```
proctor/
├── frontend/                 ← React app (student/admin UI)
│   ├── src/                  ← React components
│   ├── public/               ← Static files
│   └── .env                  ← Frontend config
│
├── backend/                  ← Node.js API server
│   ├── src/
│   │   ├── models/           ← Database schemas
│   │   ├── controllers/      ← API logic
│   │   ├── services/         ← Business logic
│   │   └── utils/            ← Helper functions
│   ├── routes/               ← API endpoints
│   ├── .env                  ← Backend config
│   └── package.json          ← Dependencies
│
├── model/                    ← AI models (YOLOv8, ArcFace)
│   └── README.md             ← Model setup guide
│
├── OVERVIEW.md               ← Project explanation
├── README.md                 ← Quick start
└── SETUP.md                  ← This file!
```

---

## 🔧 Common Configuration

### Using Different MongoDB Connection

**MongoDB Atlas (Cloud)**:
1. Go to https://www.mongodb.com/cloud/atlas
2. Create account → Create cluster
3. Get connection string
4. In backend/.env:
```
MONGODB_URI=mongodb+srv://username:password@cluster-name.mongodb.net/proctordb?retryWrites=true&w=majority
```

**Different Local Port**:
Edit backend/.env:
```
PORT=5000  # Change from 4000 to 5000
```

**Different Frontend Port**:
Edit frontend/.env:
```
VITE_API_URL=http://localhost:5000  # Match backend port
```

---

## ⚠️ Troubleshooting

### Problem: `npm install` fails

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Try again
npm install
```

### Problem: MongoDB connection error

**Check if MongoDB is running**:
```bash
# Windows
tasklist | findstr mongod

# Mac
brew services list

# Linux
sudo systemctl status mongod
```

**Start MongoDB**:
- Windows: Check Services
- Mac: `brew services start mongodb-community`
- Linux: `sudo systemctl start mongod`

### Problem: Port 3000 or 4000 already in use

**Find what's using the port** (Windows):
```powershell
netstat -ano | findstr :3000
```

**Kill the process** (Windows):
```powershell
taskkill /PID <process_id> /F
```

**Or change ports** in `.env` files

### Problem: "Cannot find module" error

**Solution**:
```bash
# Go to the folder with error
cd backend  # or cd frontend

# Clear node modules
rm -r node_modules  # Mac/Linux
rmdir /s node_modules  # Windows

# Reinstall
npm install
```

### Problem: Python virtual environment not activating

**Windows**:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
# Then try: .\.venv\Scripts\Activate.ps1
```

**Mac/Linux**:
```bash
source .venv/bin/activate
```

### Problem: "git clone" fails

**Solution**:
```bash
# Check git is installed
git --version

# Check url is correct
git clone https://github.com/your-username/proctor.git
```

---

## 📱 First Time Using the App

### For Students:
1. Enroll (name, student ID, email, program)
2. Pre-exam check (camera, lighting, face verification)
3. Accept rules
4. Take exam with monitoring active
5. Submit or auto-submit

### For Admins:
1. View live monitoring dashboard
2. See alerts (students with high risk)
3. Click session to review evidence
4. Make decision: Approve / Flag / Reject

---

## 🔄 Development Workflow

### Making Changes

**Backend Changes**:
```bash
cd backend
# Edit code in src/ folder
npm run dev  # Auto-restarts on save
```

**Frontend Changes**:
```bash
cd frontend
# Edit code in src/ folder
npm run dev  # Auto-refreshes in browser
```

### Stopping the Project
Press `Ctrl+C` in each terminal

### Starting Again
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev

# Terminal 3 (if needed)
mongod
```

---

## 📦 Next Steps After Setup

1. **Read OVERVIEW.md** - Understand how the system works
2. **Check README.md** - Project details
3. **Explore frontend/** - React components
4. **Explore backend/** - API and database
5. **Run sample exam** - Test the workflow
6. **Review admin features** - How to moderate sessions

---

## 🎯 Quick Start Summary

```bash
# 1. Clone project
git clone https://github.com/your-username/proctor.git
cd proctor

# 2. Backend setup (Terminal 1)
cd backend
python -m venv .venv
source .venv/bin/activate  # or .\.venv\Scripts\Activate.ps1 on Windows
npm install
npm run dev

# 3. Frontend setup (Terminal 2)
cd ../frontend
npm install
npm run dev

# 4. Open browser
# Go to http://localhost:3000

# Done! 🎉
```

---

## ❓ Need Help?

Check these files in order:
1. **OVERVIEW.md** - How the system works
2. **README.md** - Project info
3. **This file (SETUP.md)** - Installation issues
4. **backend/README.md** - Backend specific
5. **frontend/README.md** - Frontend specific

---

## ✨ You're Ready!

Your ProctorAI instance is now running locally. You can:
- ✅ Test the exam interface
- ✅ Try student features
- ✅ Test admin dashboard
- ✅ Monitor AI detection
- ✅ Develop new features
- ✅ Customize for your needs

**Happy proctor-ing! 🚀**

---

*Last Updated: April 2026*  
*ProctorAI v1.0*
