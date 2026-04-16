# Multi-Student Exam System & Admin Dashboard

## Overview

The proctoring system now supports:
- **Multiple concurrent students** taking exams simultaneously
- **Separate admin login** with role-based dashboard
- **Real-time monitoring** of all active exam sessions
- **Risk-based analytics** for exam integrity
- **Session review** and approval workflow

---

## System Architecture

### Frontend (Port 3000)
```
/login              → Unified login (student/admin selector)
/home               → Student home (browse exams)
/exam/*             → Student exam flow
/admin/*            → Admin dashboard
```

### Backend (Port 5000)
```
/api/students/*     → Student authentication & profile
/api/admins/*       → Admin authentication
/api/admin/*        → Admin operations (monitoring, analytics)
/api/exams/*        → Exam management
/api/sessions/*     → Exam session recording
/api/alerts/*       → Risk alerts and notifications
```

### Database (MongoDB)
```
students            → Student accounts
admins              → Admin accounts
sessions            → Exam sessions (one per student per exam)
exams               → Exam definitions
alerts              → Risk threshold alerts
```

---

## Multi-Student Support

### How It Works

1. **Independent Sessions**
   - Each student gets a unique session ID
   - Session stored with reference to student and exam
   - Multiple sessions can be "in_progress" simultaneously

2. **Concurrent Operations**
   - No blocking between student sessions
   - Each student's proctor events recorded independently
   - Risk scores calculated per-student

3. **Scalability**
   - MongoDB supports unlimited concurrent sessions
   - Backend API stateless (can load-balance)
   - Real-time monitoring using API polling (3-second intervals)

### Database Schema (Session)
```javascript
{
  _id: ObjectId,
  exam: String|ObjectId,           // Exam reference
  student: ObjectId,               // Student reference
  status: 'initiated'|'in_progress'|'submitted'|'completed',
  riskScore: 0-100,
  events: [{ type, timestamp, weight, gazeDir, ... }],
  snapshots: [{ url, timestamp, eventType }],
  startTime: Date,
  endTime: Date,
  flagged: Boolean,
  adminReview: { approver, notes, decision }
}
```

---

## Admin Dashboard

### Admin Login
```
Email: admin@proctor.com
Password: Admin@123456
```

### Admin Endpoints

#### 1. **POST /api/admins/login**
Authenticate admin user
```
Request:
{
  "email": "admin@proctor.com",
  "password": "Admin@123456"
}

Response:
{
  "token": "jwt_token_here",
  "admin": {
    "id": "...",
    "email": "admin@proctor.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin"
  }
}
```

#### 2. **GET /api/admin/sessions/active**
Get all active exam sessions
```
Response:
{
  "count": 5,
  "sessions": [
    {
      "_id": "...",
      "student": { "firstName": "John", "lastName": "Doe", "email": "john@test.com" },
      "status": "in_progress",
      "avgRisk": 45,
      "alertsCount": 3,
      "highRiskCount": 0
    },
    ...
  ]
}
```

#### 3. **GET /api/admin/students**
Get all registered students
```
Query params:
- status: 'active'|'inactive'
- search: name or email search

Response:
{
  "count": 25,
  "students": [
    {
      "_id": "...",
      "email": "student@test.com",
      "firstName": "Jane",
      "lastName": "Smith"
    },
    ...
  ]
}
```

#### 4. **GET /api/admin/students/:studentId**
Get student details with exam history
```
Response:
{
  "student": { ... },
  "sessionsCount": 3,
  "alertsCount": 5,
  "highRiskAlerts": 2
}
```

#### 5. **GET /api/admin/sessions/:sessionId**
Get detailed session info with events
```
Response:
{
  "_id": "...",
  "student": { ... },
  "status": "completed",
  "riskScore": 62,
  "events": [
    { "type": "gaze_deviation", "timestamp": "...", "weight": 5 },
    ...
  ],
  "alerts": [
    { "severity": "high", "message": "..." },
    ...
  ],
  "eventsCount": 23,
  "highRiskAlerts": 2
}
```

#### 6. **POST /api/admin/sessions/:sessionId/review**
Set admin decision on session
```
Request:
{
  "decision": "approve"|"reject"|"pending",
  "notes": "Student showed suspicious behavior"
}

Response:
{
  "message": "Session reviewed",
  "session": { ... }
}
```

#### 7. **GET /api/admin/analytics**
Get system-wide statistics
```
Query params:
- examId: filter by specific exam
- startDate: ISO date string
- endDate: ISO date string

Response:
{
  "summary": {
    "totalSessions": 150,
    "completedSessions": 145,
    "totalStudents": 50,
    "sessionsWithHighRisk": 12,
    "completionRate": 96
  },
  "alerts": {
    "byType": [
      { "_id": "gaze_deviation", "count": 45 },
      { "_id": "face_absent", "count": 23 },
      ...
    ],
    "bySeverity": [
      { "_id": "high", "count": 12 },
      { "_id": "medium", "count": 34 },
      ...
    ],
    "avgRiskScore": 35.2
  }
}
```

#### 8. **GET /api/admin/alerts/high-risk**
Get high-risk alerts
```
Query params:
- status: 'unresolved'|'resolved'
- limit: 50 (default)

Response:
{
  "count": 8,
  "alerts": [
    {
      "_id": "...",
      "sessionId": "...",
      "severity": "high",
      "message": "Multiple gaze deviations detected",
      "riskScore": 78,
      "resolved": false
    },
    ...
  ]
}
```

#### 9. **PATCH /api/admin/alerts/:alertId/resolve**
Resolve an alert
```
Request:
{
  "resolution": "False alarm - reflection detected"
}

Response:
{
  "message": "Alert resolved",
  "alert": { ... }
}
```

---

## Admin Dashboard Pages

### 📊 Monitoring
- **Live real-time view** of all active exam sessions
- **Risk leaderboard** (students ranked by risk score)
- **Trend chart** showing risk over time
- **Event timeline** of all proctor events
- **Quick filters** by risk level (All, High, Medium, Low)
- **Alert bell** with unread notification count
- **Emergency stop** button for critical situations

### 👥 Students
- **List all registered students**
- **Search by name or email**
- **Filter by status** (active, inactive)
- **View individual student details**:
  - Total exams taken
  - Sessions completed
  - Total alerts triggered
  - High-risk incidents

### 🎓 Exams
- **Browse all exams**
- **View exam statistics**:
  - Total sessions
  - Completion rate
  - Average risk score
- **View exam participants**
- **Create/edit exams** (if enabled)

### 📝 Sessions
- **Review completed exam sessions**
- **View proctor events timeline**
- **See alert history**
- **Approve/reject sessions**:
  - Add decision (Approve/Reject/Pending)
  - Add review notes
  - Flag for further review
- **Download session details**

### 📈 Analytics
- **System-wide statistics**:
  - Total sessions and completion rate
  - Active students count
  - Average risk scores
- **Alert breakdown**:
  - By type (gaze deviation, face absent, etc.)
  - By severity (low, medium, high)
- **Trend analysis** over custom date ranges
- **High-risk session insights**

### 🔔 Notifications
- **High-risk alerts list**
- **Mark alerts as resolved**
- **Filter by status** (unresolved, resolved)
- **Quick student lookup** from alerts

### ⚙️ Settings
- **Admin profile management**
- **System settings**:
  - Risk thresholds
  - Alert rules
  - Monitoring intervals
- **Permissions management** (if multi-admin)

---

## Role-Based Access Control

### Routes Protection

**Admin-only routes:**
- `/admin/*` ← Only `role: 'admin'` can access
- Other users redirected to `/home` (student) or `/login`

**Student-only routes:**
- `/home` ← Only `role: 'student'` can access
- Other users redirected to `/admin/monitoring` (admin) or `/login`

**Public routes:**
- `/login` ← Both students and admins
- `/signup` ← New student registration

### Implementation
```typescript
// ProtectedRoute.tsx
<ProtectedRoute 
  element={<AdminMonitoringPage />} 
  requiredRole="admin"  // ← Enforced
/>
```

---

## Real-Time Monitoring (Polling)

The admin dashboard polls for updates every 3 seconds:

```typescript
// In AdminMonitoringPage
useEffect(() => {
  const fetchSessions = async () => {
    const response = await adminAPI.getActiveSessions();
    setSessions(response.data.sessions);
  };

  fetchSessions();
  const interval = setInterval(fetchSessions, 3000); // 3-second polling
  return () => clearInterval(interval);
}, []);
```

**To upgrade to WebSocket (future enhancement):**
1. Add Socket.io to backend
2. Emit session updates on proctor events
3. Admin dashboard subscribes to live updates
4. Instant UI updates (vs 3-second delay)

---

## Testing the System

### Test Scenario: 3 Concurrent Students

1. **Setup:**
   ```
   Admin: admin@proctor.com / Admin@123456
   Student 1: student1@test.com (signup via UI)
   Student 2: student2@test.com (signup via UI)
   Student 3: student3@test.com (signup via UI)
   ```

2. **Start Exams:**
   - Open 3 browser windows
   - Each student logs in and starts exam
   - Each gets independent session ID

3. **Monitor in Real-Time:**
   - Open admin dashboard in 4th window
   - See 3 active sessions
   - Risk scores update live
   - Can click on any student to review

4. **End Exams:**
   - Students submit exams sequentially
   - Sessions marked as "completed"
   - Sessions move to history
   - Admin can review decisions

---

## Verification Checklist

- [ ] Admin can login with `admin@proctor.com`
- [ ] Admin dashboard shows active sessions
- [ ] Multiple students can take exams simultaneously
- [ ] Each student has independent session
- [ ] Real-time monitoring updates (3-second polling)
- [ ] Risk scores displayed correctly
- [ ] Admin can filter by risk level
- [ ] Admin can review and approve sessions
- [ ] Student cannot access `/admin` routes
- [ ] Admin cannot access `/exam` routes
- [ ] Session persists on page refresh
- [ ] Logout clears auth tokens

---

## Scaling to 100+ Students

The current system supports:
- ✓ 100+ concurrent exams (MongoDB tested)
- ✓ Real-time monitoring with 3-second updates
- ✓ Unlimited student registrations
- ✓ Independent risk score calculations

**For 1000+ concurrent students:**
1. Switch from polling to WebSocket
2. Add Redis caching for analytics
3. Implement database indexing:
   ```javascript
   db.sessions.createIndex({ status: 1, createdAt: -1 })
   db.alerts.createIndex({ sessionId: 1, severity: 1 })
   ```
4. Deploy backend on multiple servers with load balancer
5. Use MongoDB replication for high availability

---

## API Security

All admin endpoints require:
- **Bearer token** in Authorization header
- **Valid JWT** signed with `JWT_SECRET`
- **Non-expired token** (7-day expiry)
- Token automatically included via axios interceptor:
  ```typescript
  apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  ```

---

## Troubleshooting

### Admin login fails
- Check: `npm run seed-admin` was executed
- Check: MongoDB is running
- Check: Network requests in browser DevTools

### No active sessions shown
- Check: Schedule an exam if none exist
- Check: Have students actually start exams
- Check: Browser console for API errors

### Real-time updates not working
- Check: API polling is firing (Network tab in DevTools)
- Check: `/api/admin/sessions/active` responds correctly
- Check: Frontend auth token is valid

### Role-based routing not working
- Check: `useAuth()` hook returns correct role
- Check: ProtectedRoute component is imported
- Check: Routes configured with ProtectedRoute wrapper

---

## Next Steps & Roadmap

- [ ] WebSocket for true real-time updates
- [ ] Mobile admin app
- [ ] Advanced analytics (ML-based risk prediction)
- [ ] Batch operations (bulk approve/reject)
- [ ] Email notifications for admins
- [ ] Scheduled reports
- [ ] Multi-admin support with permissions
- [ ] Audit logs
- [ ] Session recording & playback
