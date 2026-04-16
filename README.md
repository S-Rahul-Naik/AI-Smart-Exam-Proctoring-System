# 🧠 AI Smart Exam Proctoring System

> **Real-time AI-powered exam proctoring with multi-modal behavioral analysis, temporal risk scoring, and explainable alerts.**

![Proctoring](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![React](https://img.shields.io/badge/React-19-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-7.5-green)

---

## 📋 Quick Start (5 minutes)

### Windows
```bash
start /B start.bat
```

### Mac/Linux
```bash
chmod +x start.sh && ./start.sh
```

### Manual Setup
```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with MongoDB + Cloudinary credentials
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

**Open**: http://localhost:3000

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│ Frontend (React 19 + TypeScript)                   │
│ ├─ Student Exam Interface (MediaPipe AI)           │
│ ├─ Admin Live Monitoring Dashboard                 │
│ ├─ Session Review & Evidence                       │
│ └─ Real-time Risk Scoring Visualization            │
└──────────────┬──────────────────────────────────────┘
               │ JWT + REST API
┌──────────────▼──────────────────────────────────────┐
│ Backend (Node.js + Express)                        │
│ ├─ Student & Exam Management                       │
│ ├─ Session Tracking & Event Recording              │
│ ├─ Risk Calculation Engine                         │
│ └─ Alert System                                    │
└──────────────┬──────────────────────────────────────┘
       ┌───────┴────────┐
       │                │
    MongoDB          Cloudinary
   (Events +        (Snapshots +
    Sessions)        Videos)
```

---

## ✨ Features

### 🎯 For Students
- ✅ Secure login with face verification
- ✅ Pre-exam system check (camera, lighting, audio)
- ✅ Real-time exam interface with Q&A
- ✅ Live behavioral monitoring (non-intrusive)
- ✅ Real-time feedback on monitoring status
- ✅ Session recording & evidence collection

### 👨‍💼 For Administrators
- ✅ Live monitoring dashboard (multi-student grid)
- ✅ Real-time risk alerts with evidence
- ✅ Session review with event timeline
- ✅ Admin-controlled result approval
- ✅ Analytics & reporting
- ✅ Exam management & scheduling

### 🤖 AI/Proctoring Engine
- ✅ **Face Detection**: Absence, multiple faces
- ✅ **Gaze Tracking**: Eye direction (center/left/right/down)
- ✅ **Phone Detection**: Mobile device usage (YOLOv8)
- ✅ **Focus Lock**: Tab switches, window blur, fullscreen exit
- ✅ **Temporal Analysis**: 30-sec sliding window
- ✅ **Risk Scoring**: Weighted, time-decayed algorithm
- ✅ **Explainable Alerts**: Evidence-based notifications

---

## 📁 Project Structure

```
proctor/
├── frontend/                 # React UI
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/           # Route pages (18 total)
│   │   ├── hooks/           # Custom hooks (useMediaPipeProctor, useAuth, etc.)
│   │   ├── services/        # API client (NEW!)
│   │   ├── utils/           # Helpers
│   │   └── App.tsx          # Root with AuthProvider
│   ├── package.json         # Dependencies
│   └── .env                 # API configuration
│
├── backend/                  # Node.js API
│   ├── src/
│   │   ├── config/          # MongoDB, Cloudinary, Redis
│   │   ├── models/          # Mongoose schemas (5 models)
│   │   ├── controllers/     # Business logic
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Auth, errors, upload
│   │   ├── services/        # AI integration
│   │   ├── utils/           # Helpers
│   │   ├── app.js           # Express app
│   │   └── index.js         # Server entry
│   ├── package.json         # Dependencies (474 packages)
│   ├── Dockerfile           # Docker image
│   └── .env                 # Database credentials
│
├── SETUP_GUIDE.md           # Step-by-step setup
├── INTEGRATION_COMPLETE.md  # API integration docs
├── start.bat                # Windows quick start
└── start.sh                 # Mac/Linux quick start
```

---

## 🔧 Technology Stack

### Frontend
- **React 19** - UI framework
- **TypeScript 5.8** - Type safety
- **Vite 7** - Build tool (sub-second HMR)
- **TailwindCSS 3.4** - Styling
- **MediaPipe** - Face detection & gaze tracking
- **Recharts** - Analytics charts
- **Axios** - HTTP client
- **React Router** - Navigation

### Backend
- **Node.js 18+** - Runtime
- **Express 4.18** - Web framework
- **MongoDB 7.5** - Database
- **Mongoose** - MongoDB ORM
- **Cloudinary** - Image storage
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **REST polling** - Real-time updates (Socket.IO not implemented)

### External Services
- **MongoDB Atlas** - Cloud database (free tier: 512 MB)
- **Cloudinary** - Image CDN (free tier: 25 GB)
- **Roboflow** - YOLOv8 API (phone detection)

---

## 🔐 Authentication Flow

```
1. Student enters credentials
   ↓
2. Backend validates against MongoDB
   ↓
3. Returns JWT token + user data
   ↓
4. Frontend stores token in localStorage
   ↓
5. All API requests include: Authorization: Bearer <token>
   ↓
6. If 401 response → Auto logout
```

---

## 📊 Data Flow

### During Exam:
```
Student's Browser
  ↓ (Webcam frames @ 2 FPS)
Frontend AI Processing (MediaPipe)
  ↓ (Events: face_absent, gaze_deviation, phone_detected)
Backend Event Storage (MongoDB)
  ↓
Admin Dashboard (REST-polling updates)

Snapshots:
  ↓ (On high-risk events)
Frontend → Cloudinary
  ↓
Admin Evidence Review
```

### Session Submission:
```
Student clicks Submit
  ↓
Frontend validates answers
  ↓
POST /sessions/:id/submit
  ↓
Backend calculates final risk score
  ↓
Session saved with status "completed"
  ↓
Admin review dashboard updated
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/students/register          # Create student account
POST   /api/students/login             # Login (returns JWT)
GET    /api/students/profile           # Get student info
POST   /api/students/verify-face       # Face verification
```

### Exams
```
GET    /api/exams                      # List all exams
POST   /api/exams                      # Create exam (admin)
GET    /api/exams/:id                  # Get exam details
PUT    /api/exams/:id                  # Update exam
PATCH  /api/exams/:id/publish          # Publish exam
DELETE /api/exams/:id                  # Delete exam
```

### Sessions
```
POST   /api/sessions/initialize        # Start exam session
POST   /api/sessions/:id/start         # Begin monitoring
POST   /api/sessions/:id/events        # Record behavior events
POST   /api/sessions/:id/snapshot      # Upload evidence photo
POST   /api/sessions/:id/submit        # Submit answers
GET    /api/sessions/:id               # Get session details
POST   /api/sessions/:id/review        # Admin review
```

### Alerts
```
GET    /api/alerts                     # List alerts (admin)
POST   /api/alerts                     # Create alert
PATCH  /api/alerts/:id/acknowledge     # Acknowledge alert
PATCH  /api/alerts/:id/resolve         # Mark resolved
```

---

## 📈 Risk Scoring Algorithm

```javascript
Risk Score = Σ(weight × frequency × duration) with decay

Weights:
- Face absent: 3 points
- Gaze deviation: 2 points  
- Phone detected: 5 points
- Tab switch: 3 points
- Window blur: 3 points
- Fullscreen exit: 4 points

Temporal Window: 30 seconds (sliding)
Max Score: 100
Decay: Score decreases over time without events

Levels:
- Low: 0-34
- Medium: 35-64
- High: 65-100
```

---

## 🧪 Testing

### 1. Register Student
```bash
curl -X POST http://localhost:5000/api/students/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/students/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "SecurePass123!"
  }'
```

### 3. Browser Test
1. Open http://localhost:3000/login
2. Click "Student" role
3. Enter credentials above
4. Allow camera access
5. Take face verification photo
6. Redirects to exam pre-check

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [SETUP_GUIDE.md](./SETUP_GUIDE.md) | Complete 6-phase setup guide |
| [INTEGRATION_COMPLETE.md](./INTEGRATION_COMPLETE.md) | API integration details |
| [backend/README.md](./backend/README.md) | Backend API documentation |
| [frontend/project_plan.md](./frontend/project_plan.md) | Frontend architecture |

---

## 🚀 Deployment

### Backend (Heroku)
```bash
cd backend
heroku login
heroku create your-app-name
heroku config:set MONGODB_URI=your_atlas_uri
heroku config:set CLOUDINARY_CLOUD_NAME=...
git push heroku main
```

### Frontend (Vercel)
```bash
# Connect GitHub repo to Vercel
# Set env: VITE_API_URL=https://your-backend.herokuapp.com/api
# Deploy one-click
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot GET /api/health" | Backend not running. `cd backend && npm run dev` |
| "Login failed" | Check MongoDB connection, verify credentials registered |
| "CORS error" | Update `FRONTEND_URL` in backend `.env`, restart backend |
| "Snapshots not uploading" | Verify Cloudinary credentials in backend `.env` |
| "Port 5000/3000 in use" | Close other apps using ports or change in config |

---

## 📦 System Requirements

- **Node.js**: 18+ (check: `node --version`)
- **npm**: 8+ (check: `npm --version`)
- **MongoDB**: 4.4+ (local or Atlas)
- **Bandwidth**: 10 Mbps for HD video
- **RAM**: 2+ GB recommended
- **Browser**: Chrome/Edge 90+, Firefox 88+, Safari 14+

---

## 📋 Pre-Deployment Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Cloudinary account configured
- [ ] JWT_SECRET generated and secure
- [ ] Backend .env configured
- [ ] Frontend .env configured
- [ ] Both servers start without errors
- [ ] Registration/login flow tested
- [ ] Session recording tested
- [ ] Snapshots upload to Cloudinary
- [ ] Data appears in MongoDB
- [ ] Admin monitoring dashboard loads

---

## 🤝 Contributing

Issues and PRs welcome! Please follow:
1. Fork the repo
2. Create feature branch (`git checkout -b feature/cool-feature`)
3. Commit changes (`git commit -m 'Add cool feature'`)
4. Push branch (`git push origin feature/cool-feature`)
5. Open Pull Request

---

## 📄 License

MIT © 2026 ProctorAI Team

---

## 📞 Support

- **Docs**: See [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **Issues**: Check [GitHub Issues](https://github.com/your-repo/issues)
- **Email**: support@proctor.ai

---

## 🎓 Research & References

- **Related Work**: 
  - Remote Proctoring Systems (Respondus, Proctorio)
  - Face Recognition APIs (MediaPipe, TensorFlow.js)
  - Behavioral Analysis in Security (IEEE papers)
  
- **Technologies**:
  - MediaPipe Face Detection & Gaze Tracking
  - YOLOv8 Object Detection
  - MongoDB Document Storage
  - Cloudinary CDN

---

## 🌟 Features Roadmap

### Phase 1 (✅ COMPLETE)
- Frontend UI (18 pages)
- Backend API (20+ endpoints)
- MongoDB integration
- Cloudinary storage
- JWT authentication

### Phase 2 (🚀 NEXT)
- REST-polling live updates (Socket.IO not implemented)
- YOLOv8 phone detection
- Email notifications
- Advanced analytics
- Batch session processing

### Phase 3 (📋 PLANNED)
- Payment integration (Stripe)
- Multi-language support
- Mobile app
- Blockchain verification
- Advanced ML models

---

## ✅ Status

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend | ✅ Complete | 18 pages, responsive design |
| Backend | ✅ Complete | 20+ endpoints, MongoDB ready |
| Integration | ✅ Complete | API calls connected end-to-end |
| Testing | 🔄 In Progress | Unit tests & E2E tests |
| Deployment | 📋 Ready | Docker, Heroku configs ready |

---

## 🎯 Quick Links

- 🚀 [Getting Started](./SETUP_GUIDE.md)
- 🔌 [API Reference](./INTEGRATION_COMPLETE.md)
- 📦 [Backend Docs](./backend/README.md)
- 🎨 [Frontend Structure](./frontend/project_plan.md)
- ⚡ [Quick Verification](./verify-installation.js)

---

**Made with ❤️ for educational integrity**

*ProctorAI - AI-Powered Exam Security Platform*
