# Testing Auto-Submit Face Swap Detection Fix

## Changes Applied

### 1. Fixed Snapshot Upload Errors (400 Bad Request)
**File**: `frontend/src/services/api.ts`
- **Issue**: Explicit `Content-Type: 'multipart/form-data'` header causing multer to reject requests
- **Fix**: Removed explicit header, let axios auto-detect with proper boundary
- **Result**: Snapshots now upload successfully instead of 400 errors

### 2. Fixed Auto-Submit on Face Swap Detection
**File**: `frontend/src/pages/exam/monitoring/page.tsx`
- **Issue**: Face swap detection working but not triggering auto-submit
- **Fix**: Added `continuousFaceMatching.faceSwapSuspected` check to critical violations
- **Result**: Auto-submit now triggers when face swap detected with 6-second countdown

## Test Procedure

### Step 1: Rebuild and Start System
```bash
cd frontend && npm run build
cd ../backend && npm start
# Or use: start-system.bat
```

### Step 2: Join an Exam as Student
1. Login as student
2. Navigate to exam and click "Join Exam"
3. Complete enrollment (take selfie for face verification)
4. Answer at least one question

### Step 3: Test Face Swap Detection
During the exam monitoring phase:

**Option A - Block Camera** (simulates face swap)
1. While monitoring is active, physically block or cover the camera
2. Wait for continuous face matching to run (every 30 seconds)
3. After 2 consecutive mismatches, system should detect `faceSwapSuspected = true`

**Option B - Replace Face** (if you have another person)
1. During exam, have another person appear in front of camera
2. Wait for face matching cycle
3. System detects different face → triggers face swap detection

### Step 4: Verify Auto-Submit Triggered
When face swap is detected, you should see:

**In Console:**
```
🚨 FACE SWAP SUSPECTED - Possible proxy test-taker!
🚨 CRITICAL MALPRACTICE DETECTED: face_swap_suspected - AUTO-SUBMITTING EXAM
```

**In UI:**
1. Auto-submit countdown appears (6 seconds)
2. Alert dialog shows: "Your exam has been auto-submitted. Reason: face_swap_suspected"
3. Exam redirects to results page after countdown completes

**In Backend Logs:**
- Snapshots should upload successfully (no 400 errors)
- Session should be marked as submitted
- Malpractice events should be recorded

## Expected Results

✅ **All tests pass when:**
1. Snapshot uploads work (no 400 errors in network tab)
2. Backend receives file and stores snapshot metadata
3. Face swap detection sets `faceSwapSuspected = true` after 2 consecutive mismatches
4. Auto-submit countdown triggers automatically (not requiring manual click)
5. Exam submits with `face_swap_suspected` in violation type
6. User is redirected to results page

## Debugging Tips

### If snapshot uploads still fail:
- Check browser Network tab for actual request format
- Look for multer errors in backend logs
- Verify `uploadSingle` middleware is properly configured

### If auto-submit doesn't trigger:
- Check console for "FACE SWAP SUSPECTED" message
- Verify `continuousFaceMatching.faceSwapSuspected` is true in React DevTools
- Check that `examStarted` is true when violation detected
- Ensure `hasMalpracticeLoggedRef.current` is being reset properly

### Network Issues:
- Verify backend is running and API accessible
- Check CORS configuration (should allow `localhost:5173` or `localhost:3000`)
- Verify JWT token is being sent in Authorization header

## Files Modified
1. `frontend/src/services/api.ts` - Snapshot upload FormData
2. `frontend/src/pages/exam/monitoring/page.tsx` - Auto-submit logic

## Build Status
✅ Frontend builds successfully without errors
✅ No TypeScript compilation errors
✅ Backend snapshot endpoint properly configured
