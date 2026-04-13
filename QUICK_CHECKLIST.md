# Quick Verification Checklist

## Current Status
- ✅ Backend running on port 5000
- ✅ Frontend dev server running on port 3000  
- ✅ Both systems fully operational
- ✅ All code fixes implemented and compiled

## What You Need To Do

### Step 1: Hard Refresh Browser
- [ ] Open http://localhost:3000 in your browser
- [ ] Press `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)
- [ ] Wait for page to reload (should show exam page)

### Step 2: Verify Console Logs
- [ ] Open DevTools (F12)
- [ ] Go to Console tab
- [ ] Look for these messages:
  - [ ] `🚀 Uploading snapshot to backend:` with file size
  - [ ] `✅ Snapshot queued for upload:` (means it reached backend)
  - [ ] `200` response code (NOT 400)

### Step 3: Check Backend Terminal
- [ ] Look at backend terminal where npm start is running
- [ ] You should see:
  - [ ] `📸 Snapshot upload request:` with sessionId and eventType
  - [ ] `✅ Snapshot stored locally` (GOOD - means file was received)
  - [ ] NOT `❌ No file provided in snapshot upload` (BAD - means old code)

### Step 4: Test Face Swap Detection
- [ ] Swap your face with someone else (or cover camera)
- [ ] Wait 30 seconds for face matching to detect the swap
- [ ] Look for console message: `🚨 CRITICAL MALPRACTICE DETECTED: face_swap_suspected`
- [ ] Auto-submit countdown should appear (6 seconds)
- [ ] Exam should auto-submit

## Success Indicators

✅ **Everything Working:**
- Snapshot uploads: 200 OK (not 400)
- Backend logs: "✅ Snapshot stored locally"
- Face swap detection: Triggers auto-submit within 30-60 seconds
- No console errors about "No file provided"

❌ **Something Still Wrong:**
- Still seeing 400 errors
- Backend logs still showing "No file provided"
- Face swap detection not triggering
- → Try: Hard refresh again (Ctrl+Shift+R)
- → Or: Clear cache in DevTools (Application > Cache Storage > Delete all)

## If Issues Persist

1. Check that both terminals are still running
   - Backend: `✓ Server running on port 5000`
   - Frontend: `➜ Local: http://localhost:3000/`

2. Verify code changes are in source files:
   - `frontend/src/services/api.ts` line 131-141: No explicit Content-Type header
   - `frontend/src/pages/exam/monitoring/page.tsx` line 526-527: Face swap in violations

3. Restart both servers:
   - Kill all node processes: `Get-Process node | Stop-Process -Force`
   - Start backend: `cd backend && npm start`
   - Start frontend: `cd frontend && npm run dev`
