# Multiple Students Testing Guide - Incognito Method

## Problem
Regular browser tabs share localStorage, so all tabs show the same logged-in user.

## Solution
Use **Incognito/Private Windows** - each has separate localStorage = separate user session

---

## Step-by-Step Setup

### Step 1: Open 4 Incognito Windows

**Windows:**
- **Window 1**: Normal browser (for Admin)
- **Window 2**: Incognito (for Student 1)
- **Window 3**: Incognito (for Student 2)
- **Window 4**: Incognito (for Student 3)

**How to open Incognito:**
- Chrome/Edge: `Ctrl + Shift + N`
- Firefox: `Ctrl + Shift + P`

---

### Step 2: Admin Login (Window 1 - Normal)

**URL**: `http://localhost:3000/login`

**Steps:**
1. Select "Admin" from dropdown
2. Email: `admin@proctor.com`
3. Password: `Admin@123456`
4. Click Login
5. Dashboard shows: **"0 active sessions"** initially

✅ Keep this window open to monitor

---

### Step 3: Student 1 Login (Window 2 - Incognito)

**URL**: `http://localhost:3000/login`

**Steps:**
1. Select "Student" from dropdown (default)
2. Email: `student1@test.com` (or signup if doesn't exist)
3. Password: (your password)
4. Allow camera access
5. Show face to camera → "Face Verified"
6. Click "Start Exam" or "Take Exam"

✅ Student 1 now taking exam

---

### Step 4: Student 2 Login (Window 3 - Incognito)

**URL**: `http://localhost:3000/login`

**Steps:**
1. Select "Student"
2. Email: `student2@test.com`
3. Password: (your password)
4. Allow camera
5. Face verification
6. Click "Start Exam"

✅ Student 2 now taking exam

---

### Step 5: Student 3 Login (Window 4 - Incognito)

**URL**: `http://localhost:3000/login`

**Steps:**
1. Select "Student"
2. Email: `student3@test.com`
3. Password: (your password)
4. Allow camera
5. Face verification
6. Click "Start Exam"

✅ Student 3 now taking exam

---

### Step 6: Watch Admin Dashboard (Window 1)

**Go to**: `http://localhost:3000/admin/monitoring`

**You should see:**
- ✅ Active Sessions: **3**
- ✅ Student 1, Student 2, Student 3 all visible
- ✅ Each with independent risk score
- ✅ Real-time updates every 3 seconds

---

## Expected Result

```
ADMIN DASHBOARD
═══════════════════════════════════════════════════════

📊 STATS:
  Active Sessions: 3 ✅
  High Risk: 0
  Medium Risk: 1
  Low Risk: 2
  Avg Risk: 35%

───────────────────────────────────────────────────────

STUDENTS TAKING EXAM:

┌─────────────────────────────────────┐
│ Student 1                           │
│ Email: student1@test.com            │
│ Status: in_progress                 │
│ Risk: 45% 🟡 MEDIUM                 │
│ Alerts: 3                           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Student 2                           │
│ Email: student2@test.com            │
│ Status: in_progress                 │
│ Risk: 62% 🔴 HIGH                   │
│ Alerts: 5                           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Student 3                           │
│ Email: student3@test.com            │
│ Status: in_progress                 │
│ Risk: 28% 🟢 LOW                    │
│ Alerts: 1                           │
└─────────────────────────────────────┘
```

✅ **All 3 students visible simultaneously**
✅ **Each has independent session**
✅ **Each has independent risk score**
✅ **Updates in real-time**

---

## Verification Checklist

- [ ] Admin sees 3 active sessions
- [ ] Each student name/email correct
- [ ] Risk scores are different (not identical)
- [ ] Each student can take exam independently
- [ ] Admin can click on student to view details
- [ ] Risk scores update live (not static)
- [ ] Switching between incognito windows shows different student
- [ ] Refreshing admin page, still sees 3 students

---

## Troubleshooting

**Problem**: Admin still shows 0 sessions
- **Solution**: Refresh admin page (F5)
- **Check**: Make sure students actually clicked "Start Exam"

**Problem**: All windows show same student
- **Solution**: Make sure using Incognito, NOT regular tabs
- **Check**: Window should have Incognito icon (🕵️)

**Problem**: Student can't login
- **Solution**: Signup first if account doesn't exist
- Create: `student1@test.com`, `student2@test.com`, `student3@test.com`
- Face verification during signup

**Problem**: Camera not working
- **Solution**: 
  - Check browser permissions (allow camera)
  - Restart browser
  - Check if camera is in use elsewhere

---

## Important Notes

⚠️ **MUST use Incognito/Private windows**
- Regular tabs = shared storage = same user everywhere
- Incognito windows = separate storage = separate users ✅

⚠️ **Each window needs its own localStorage**
- Incognito does this automatically
- Different browsers also work (Chrome, Firefox, Edge)
- Different physical devices on network also work

⚠️ **Admin dashboard updates every 3 seconds**
- Not real-time instant
- Refresh manually to see immediate updates

---

## Next Features to Test

Once multi-student works:
1. **Submit exams** from different students
2. **Check risk scores** in admin analytics
3. **View student sessions** history
4. **Approve/reject** sessions from admin
5. **High-risk alerts** in notifications

---

## Quick Commands

Check if servers running:
```powershell
# Are they running?
netstat -ano | findstr :3000   # Frontend
netstat -ano | findstr :5000   # Backend
```

Restart servers if needed:
```powershell
# Kill all Node processes
taskkill /F /IM node.exe

# Restart backend
cd c:\Users\prave\Desktop\proctor\proctor\backend
node src/index.js

# Restart frontend (in new terminal)
cd c:\Users\prave\Desktop\proctor\proctor\frontend
npm run dev
```

---

**Ready to test? Open 4 windows and follow the steps above! 🚀**
