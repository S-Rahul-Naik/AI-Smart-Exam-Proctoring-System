# 🚀 Complete Setup Guide - AI Smart Exam Proctoring System

## PHASE 1: Setup External Services (15-20 minutes)

### Step 1: Setup MongoDB
**Option A: MongoDB Atlas (Recommended)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up (free tier available)
3. Create cluster (default settings fine)
4. Create database user with password
5. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/proctor`
6. Copy to `backend/.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/proctor
   ```

**Option B: Local MongoDB**
1. Install: https://www.mongodb.com/try/download/community
2. Run: `mongod` in terminal
3. Keep in `backend/.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/proctor
   ```

✅ **Verify**: Open MongoDB Compass and connect

---

### Step 2: Setup Cloudinary (Image Storage)
1. Go to https://cloudinary.com/users/register/free
2. Sign up (free tier: 25GB storage)
3. Copy dashboard credentials:
   - Cloud Name
   - API Key
   - API Secret
4. Add to `backend/.env`:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

✅ **Verify**: Log in to dashboard and see your account

---

### Step 3: Generate JWT Secret
1. Open terminal and run:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Copy output and paste in `backend/.env`:
   ```
   JWT_SECRET=your_generated_secret_here
   ```

✅ **Your `backend/.env` should now look like**:
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
JWT_SECRET=xxx
FRONTEND_URL=http://localhost:5173
```

---

## PHASE 2: Start Both Servers

### Step 4: Start MongoDB (if local)
```bash
mongod
# Leave running in this terminal
```

### Step 5: Start Backend Server
```bash
cd backend
npm run dev
# Should see:
# ✓ MongoDB connected: localhost
# ✓ Server running on port 5000
```

### Step 6: Start Frontend Server (new terminal)
```bash
cd frontend
npm run dev
# Should see:
# ✓ Local:   http://localhost:5173/
```

✅ **Verify Both are Running**:
- Backend: http://localhost:5000/api/health → should return `{"status":"OK"}`
- Frontend: http://localhost:5173 → should load home page

---

## PHASE 3: Test API Connections

### Step 7: Test Student Registration
Open Postman or VS Code REST Client and test:

```http
POST http://localhost:5000/api/students/register
Content-Type: application/json

{
  "email": "student@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "Password123!",
  "confirmPassword": "Password123!"
}
```

**Expected Response**:
```json
{
  "message": "Registration successful",
  "token": "eyJhbGc...",
  "student": {
    "id": "...",
    "email": "student@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Step 8: Test Student Login
```http
POST http://localhost:5000/api/students/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "Password123!"
}
```

✅ **Should return JWT token**

---

## PHASE 4: Connect Frontend to Backend APIs

### Step 9: Create API Client Service

Create file `frontend/src/services/api.ts`:

```typescript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const studentAPI = {
  register: (data: any) => apiClient.post('/students/register', data),
  login: (data: any) => apiClient.post('/students/login', data),
  getProfile: () => apiClient.get('/students/profile'),
  verifyFace: (data: any) => apiClient.post('/students/verify-face', data),
};

export const examAPI = {
  getExams: () => apiClient.get('/exams'),
  getExamById: (id: string) => apiClient.get(`/exams/${id}`),
  createExam: (data: any) => apiClient.post('/exams', data),
};

export const sessionAPI = {
  initialize: (examId: string) => apiClient.post('/sessions/initialize', { examId }),
  start: (sessionId: string) => apiClient.post(`/sessions/${sessionId}/start`, {}),
  submit: (sessionId: string, answers: any) => apiClient.post(`/sessions/${sessionId}/submit`, { sessionId, answers }),
  recordEvents: (sessionId: string, events: any) => apiClient.post(`/sessions/${sessionId}/events`, { sessionId, events }),
  uploadSnapshot: (sessionId: string, file: File, eventType: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sessionId', sessionId);
    formData.append('eventType', eventType);
    return apiClient.post(`/sessions/${sessionId}/snapshot`, formData);
  },
};

export default apiClient;
```

### Step 10: Update Login Page

Update `frontend/src/pages/login/page.tsx`:

```typescript
import { studentAPI } from '../../services/api';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await studentAPI.login({ email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.student));
      navigate('/exam/monitoring'); // or dashboard
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      {/* ... form fields ... */}
    </form>
  );
}
```

### Step 11: Update Exam Monitoring Page

Update `frontend/src/pages/exam/monitoring/page.tsx` to use real API:

```typescript
import { sessionAPI } from '../../../services/api';
import { useEffect, useState } from 'react';

export default function ExamMonitoringPage() {
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    // Initialize session
    const initSession = async () => {
      // Get exam ID from URL params
      const response = await sessionAPI.initialize(examId);
      setSessionId(response.data.session._id);
    };
    initSession();
  }, []);

  // When recording events
  const recordBehaviorEvent = async (event: any) => {
    if (!sessionId) return;
    await sessionAPI.recordEvents(sessionId, [event]);
  };

  // When capturing snapshot
  const handleSnapshot = async (file: File) => {
    await sessionAPI.uploadSnapshot(sessionId, file, 'face_absent');
  };

  return (
    // ... existing JSX, but now calling real APIs
  );
}
```

---

## PHASE 5: Add Admin Dashboard

### Step 12: Create Admin Login
Update `frontend/src/pages/login/page.tsx` to support admin mode:

```typescript
const [userType, setUserType] = useState('student'); // or 'admin'

const handleLogin = async (e: any) => {
  if (userType === 'admin') {
    const response = await adminAPI.login({ email, password });
  } else {
    const response = await studentAPI.login({ email, password });
  }
};
```

### Step 13: Create Admin Monitoring with Real Data

Update `frontend/src/pages/admin/monitoring/page.tsx`:

```typescript
import { sessionAPI } from '../../../services/api';
import { useEffect, useState } from 'react';

export default function AdminMonitoringPage() {
  const [sessions, setSessions] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Fetch active sessions from backend
    const fetchSessions = async () => {
      const response = await sessionAPI.getSessions();
      setSessions(response.data.sessions);
    };
    
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    // Display real sessions instead of mock data
  );
}
```

---

## PHASE 6: Deploy

### Step 14: Deploy Backend
**Option A: Heroku (Easy)**
```bash
cd backend
heroku login
heroku create your-app-name
heroku config:set MONGODB_URI=your_atlas_uri
heroku config:set CLOUDINARY_CLOUD_NAME=xxx
git push heroku main
```

**Option B: Railway.app**
1. Go to https://railway.app
2. Connect GitHub repo
3. Add environment variables
4. Deploy

**Option C: Docker + AWS/DigitalOcean**
```bash
docker build -t proctor-backend .
docker run -p 5000:5000 proctor-backend
```

### Step 15: Deploy Frontend
**Vercel (Easiest)**
1. Connect GitHub repo
2. Update API URL to production backend
3. Deploy one click

**Netlify**
1. Connect GitHub repo
2. Set build command: `npm run build`
3. Deploy

---

## ✅ TESTING CHECKLIST

- [ ] MongoDB connection successful
- [ ] Cloudinary credentials working
- [ ] Backend server running on :5000
- [ ] Frontend server running on :5173
- [ ] Student registration works
- [ ] Student login returns JWT token
- [ ] Exam list loads from backend
- [ ] Session initialization works
- [ ] Events are recorded to DB
- [ ] Snapshots upload to Cloudinary
- [ ] Risk scoring calculated
- [ ] Admin alerts triggered
- [ ] Session review workflow works

---

## 🔗 IMPORTANT API CONFIG

Update `frontend/src/services/api.ts` later for production:

```typescript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend.herokuapp.com/api'  // Production API
  : 'http://localhost:5000/api';               // Development API
```

---

## 📞 Quick Reference

| Component | URL | Status |
|-----------|-----|--------|
| Frontend Dev | http://localhost:5173 | Local |
| Backend Dev | http://localhost:5000 | Local |
| MongoDB | Uses `.env` | Local or Atlas |
| Cloudinary | Dashboard | Cloud |

---

## 🐛 Common Issues

**Issue**: Backend won't start
- **Fix**: Check `.env` file has all variables, MongoDB is running

**Issue**: Frontend can't reach backend
- **Fix**: Ensure backend is running on :5000, check CORS in `.env`

**Issue**: Images not uploading
- **Fix**: Check Cloudinary credentials in `.env`

**Issue**: Login fails
- **Fix**: Ensure MongoDB has the student document, check password

---

## Next Advanced Features (Optional)

1. **Real-time Monitoring** - Add Socket.IO
2. **Phone Detection** - Integrate YOLOv8
3. **Email Notifications** - Add Nodemailer
4. **Payment** - Add Stripe integration
5. **Background Jobs** - Add Bull/Redis jobs for processing
