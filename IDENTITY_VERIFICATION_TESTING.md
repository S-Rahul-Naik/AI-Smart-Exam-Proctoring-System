# Identity Verification System - Integration Testing Guide

## Overview

This guide provides step-by-step instructions for testing the complete identity verification system including exam start verification, continuous face matching, and face detection features.

---

## Prerequisites

- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:5173`
- MongoDB connected and running
- ArcFace service available (see SETUP_GUIDE.md)
- Test student account created with enrollment photo
- Webcam with good lighting
- Chrome/Firefox browser with console access

---

## Part 1: Backend Endpoint Testing

### Running the Test Suite

```bash
cd backend
npm install axios  # if not already installed
node test-identity-verification.js
```

This script will:
1. Register a test student
2. Login and get authentication token
3. Fetch enrollment photos
4. Test exam start verification endpoint
5. Test continuous matching endpoint (3 iterations)
6. Test error handling (missing fields)
7. Test authentication requirements

**Expected Output:**
```
🧪 Identity Verification Test Suite
============================================================
API URL: http://localhost:5000
============================================================

✅ PASS | Student Registration
        ID: 507f1f77bcf86cd799439011

🔐 TEST 2: Student Login
✅ PASS | Student Login
        Token received: eyJhbGciOiJIUzI1NiIsInR5c...

👤 TEST 3: Get Student Profile
✅ PASS | Get Profile
        Email: test.identity@example.com

📸 TEST 4: Get Enrollment Photos
✅ PASS | Get Enrollment Photos
        Found: login/signup photo

🎯 TEST 5: Compare Photo for Exam Start
✅ PASS | Compare Photo for Exam
        Match: 85%, Verified: true

🔄 TEST 6: Match Face for Exam (Continuous)
✅ PASS | Match Face for Exam
        Match: 85%, Same Person: true, Faces: 1

⏱️  TEST 7: Continuous Matching Simulation (3 iterations)
✅ PASS | Continuous Matching Simulation
        3/3 matching cycles successful

⚠️  TEST 8: Error Handling - Missing Required Fields
✅ PASS | Error Handling - Missing Frame
        Status: 400

✅ PASS | Error Handling - Missing Live Photo
        Status: 400

🔒 TEST 9: Authentication Required
✅ PASS | Authentication Required
        Status: 401

============================================================
📊 TEST SUMMARY
============================================================
✅ Passed: 12
❌ Failed: 0
📈 Success Rate: 100%
```

---

## Part 2: Frontend Manual Testing

### Test Case 1: Exam Start Verification Success (First Attempt)

**Objective:** Verify student can start exam after successful identity verification

**Steps:**

1. Open browser to `http://localhost:5173`
2. Login with test student account
3. Navigate to an available exam
4. Click "Start Exam" button
5. **Verify overlay appears with:**
   - Title: "Identity Verification"
   - Description: "Verify Your Identity"
   - Attempt counter: "1/3"
   - Status indicator
   - Match score display area (initially empty)

6. Click "Start Verification" button
7. **Verify capture process:**
   - Status changes to "Capturing..."
   - Camera is accessed and video feed visible
   - Webcam indicator pulses

8. **Wait for comparison:**
   - Status changes to "Comparing..."
   - Backend processes the frame

9. **Verify result:**
   - Match score displays (e.g., "92%")
   - Shows "✅ Identity Verified" if >= 70%
   - "Continue to Exam" button becomes enabled

10. Click "Continue to Exam" button
11. **Verify:**
    - Overlay disappears
    - Quiz questions become visible
    - Continuous face matching starts (runs in background)

---

### Test Case 2: Exam Start Verification Retry (Failed First Attempt)

**Objective:** Verify student can retry after mismatch

**Steps:**

1. Start exam again (with different student or environment)
2. See verification overlay
3. Click "Start Verification"
4. **If verification fails (<70% match):**
   - Match score displays low percentage
   - "❌ Not Enough Match" shown
   - "Start Verification" button remains clickable

5. Click "Start Verification" again
6. **Verify attempt counter:**
   - Changes from "1/3" to "2/3"
   - Score should improve (same person in different position)

7. On success:
   - Click "Continue to Exam"
   - Exam begins normally

---

### Test Case 3: Exam Start Verification Max Attempts

**Objective:** Verify system prevents exam start after 3 failed attempts

**Steps:**

1. Start exam
2. Deliberately angle webcam away or cover face partially
3. Click "Start Verification" 3 times
4. After 3rd failure:
   - Attempt counter shows "3/3"
   - "Start Verification" button disabled
   - Message indicates admin override required
   - Exam cannot proceed

5. **Expected behavior:** Admin must intervene to allow exam continuation

---

### Test Case 4: Continuous Face Matching During Exam

**Objective:** Verify continuous monitoring every 30 seconds

**Steps:**

1. Successfully verify identity and start exam
2. Answer first question normally
3. **Wait for continuous matching (30 seconds):**
   - Backend silently matches face in background
   - No UI change if match successful
   - Events recorded to database

4. **Monitor browser console:**
   - Open DevTools: F12 or Ctrl+Shift+I
   - Check Console tab
   - Look for logs like:
     ```
     🔍 Starting continuous face matching (every 30s)
     ✅ Face match successful (92% confidence)
     ```

5. Answer more questions
6. After 60 seconds (2 cycles):
   - Multiple successful matches recorded
   - No alerts or warnings shown

---

### Test Case 5: Face Mismatch Detection

**Objective:** Verify system detects when different person appears on camera

**Steps:**

1. Start exam successfully with Student A
2. Answer first question
3. **After first 30-second cycle, have Student B sit in front of camera:**
   - Different face now visible
   - Match score will drop significantly

4. **Monitor console:**
   - Should see:
     ```
     ⚠️ Face mismatch detected! Score: 23%
     ```

5. **Check MongoDB events:**
   ```bash
   # In MongoDB shell or Compass
   db.sessions.findOne({_id: ObjectId("...")}).events
   # Should contain: face_mismatch event
   ```

6. **After 2 consecutive mismatches:**
   - Console shows:
     ```
     🚨 FACE SWAP SUSPECTED - Possible proxy test-taker!
     ```
   - Session flagged for review

---

### Test Case 6: Face Absence Detection

**Objective:** Verify system detects when face disappears from camera

**Steps:**

1. Start exam successfully
2. Answer question
3. **Move away from camera or cover face completely**
4. **Wait 30+ seconds (for next continuous matching)**
5. **Monitor console:**
   - Should see:
     ```
     ⚠️ No face detected (faceCount: 0)
     ```

6. **In database events:**
   ```
   {
     type: "face_absent",
     label: "Face not detected (1 occurrences)",
     severity: "high",
     weight: 5
   }
   ```

7. **If face absent for multiple cycles:**
   - Risk score increases
   - Session gets flagged
   - Exam may auto-submit if critical threshold reached

---

### Test Case 7: Multiple Faces Detection

**Objective:** Verify system detects multiple people on camera

**Steps:**

1. Start exam successfully with Student A
2. Have another person enter frame and sit beside camera
3. **Wait 30+ seconds for continuous matching**
4. **Monitor console:**
   - Should show face detection shows 2 faces
   - Console logs:
     ```
     🔴 Multiple faces detected! (faceCount: 2)
     ```

5. **Check session events:**
   ```
   {
     type: "multiple_faces",
     label: "Multiple faces detected (1 occurrences)",
     severity: "critical",
     weight: 10
   }
   ```

6. **Risk score jumps:**
   - Multiple faces = 15 points per occurrence
   - After 2 occurrences: risk = 30 points
   - Session flagged as critical violation

---

### Test Case 8: Resource Cleanup on Exit

**Objective:** Verify no memory leaks when exam ends

**Steps:**

1. Start exam and pass verification
2. Complete exam (answer questions and submit)
3. **Monitor browser console:**
   - Should see:
     ```
     🛑 Stopping continuous face matching
     ```

4. **Verify in DevTools Memory tab:**
   - Take heap snapshot before exam
   - Submit exam
   - Take another heap snapshot
   - Compare: should not see growing face matching references

5. **Check for console errors:**
   - Should see NO warnings about unmounted components
   - Should see NO timer/interval errors

---

## Part 3: Database Verification

### Checking Session Events in MongoDB

```javascript
// Connect to MongoDB
db = connect("mongodb://localhost:27017/proctoring_system");

// Find a recent session
const session = db.sessions.findOne({}, { sort: { _id: -1 } });

// View all events
session.events.forEach(event => {
  console.log(`[${event.type}] ${event.label} - Severity: ${event.severity}`);
});

// Count by type
const eventCounts = {}
session.events.forEach(e => {
  eventCounts[e.type] = (eventCounts[e.type] || 0) + 1;
});
console.log("Event Summary:", eventCounts);

// Check for face-specific events
const faceEvents = session.events.filter(e => 
  e.type.includes('face') || e.type.includes('multiple')
);
console.log("Face Verification Events:", faceEvents);
```

---

## Part 4: Troubleshooting

### Issue: "ArcFace comparison failed"

**Solution:**
- Verify ArcFace service is running: `curl http://localhost:8000/health`
- Check backend logs for ArcFace errors
- See ARCFACE_SETUP.md for configuration

### Issue: Verification overlay doesn't appear

**Solution:**
- Check browser console for errors
- Verify `useExamStartVerification` hook is imported correctly
- Check that exam is actually starting (`examStarted` state)
- Verify `verificationStep === 'verifying'` is set

### Issue: Continuous matching not recording events

**Solution:**
- Verify backend is receiving `/match-face-exam` requests
- Check MongoDB connection
- Verify session ID is being passed correctly
- Check that `verificationStep === 'verified'` (matching only starts after verification)

### Issue: Face matching always fails even with same person

**Solution:**
- Adjust lighting (ensure good, consistent lighting)
- Check camera quality and positioning
- Try with different face angles
- Verify enrollment photo is clear and recent
- Check ArcFace confidence threshold (currently 70%)

### Issue: Multiple faces not detected

**Solution:**
- Ensure good face detection by MediaPipe
- Check browser console for MediaPipe errors
- Verify canvas capture is working (check livePhoto size)
- Monitor backend face detection logs

---

## Performance Metrics

After testing, verify these metrics:

| Metric | Expected | Actual |
|--------|----------|--------|
| Exam start verification time | < 3 seconds | __ |
| Continuous matching interval | 30 seconds | __ |
| Event recording latency | < 1 second | __ |
| Memory usage (1 hour exam) | < 200 MB | __ |
| CPU usage (continuous matching) | < 5% | __ |
| False negative rate | < 5% | __ |
| False positive rate | < 2% | __ |

---

## Completion Checklist

- [ ] Backend test suite: All 12 tests pass
- [ ] Exam start verification: Success on first attempt
- [ ] Exam start verification: Retry after failure
- [ ] Max attempts limit: Enforced after 3 failures
- [ ] Continuous matching: Events recorded every 30s
- [ ] Face mismatch: Detected and logged
- [ ] Multiple faces: Detected and flagged critical
- [ ] Face absence: Detected and logged
- [ ] Resource cleanup: No memory leaks on exam exit
- [ ] Console: No errors or warnings
- [ ] Database: All events properly stored
- [ ] Performance: Metrics within acceptable range

---

## Next Steps

1. **Manual Testing Complete?** → Document any issues found
2. **All Tests Pass?** → System ready for pilot testing
3. **Issues Found?** → Create bug reports using issue template
4. **Pilot Testing?** → Deploy to staging and monitor real usage
5. **Production Ready?** → Deploy with monitoring and alerts

---

## Contact

For issues or questions about the identity verification system:
- Check [QUICK_START_IDENTITY.md](./QUICK_START_IDENTITY.md)
- Review [IDENTITY_VERIFICATION_GUIDE.md](./IDENTITY_VERIFICATION_GUIDE.md)
- Check logs in `logs/` directory
