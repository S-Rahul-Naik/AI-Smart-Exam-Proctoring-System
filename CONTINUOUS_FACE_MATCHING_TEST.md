# Continuous Face Matching - QA Test Guide

## Testing Overview

This guide covers comprehensive testing of the new identity verification system including exam start verification, continuous face matching, and face detection features.

---

## Setup for Testing

### Prerequisites
- Test exam created and published
- Test student account ready
- Webcam with good lighting
- Enrollment photo on file (from signup)
- Admin account for review

### Pre-Test Checklist
```
☐ Frontend build: npm run build (0 errors)
☐ Backend running: npm run dev (listening on 5000)
☐ MongoDB connected (check logs)
☐ ArcFace service available
☐ Cloudinary connected (for photo storage)
☐ Test student avatar uploaded
☐ Good lighting in test area
☐ Webcam positioned correctly
```

---

## Test Cases

### TC-101: Exam Start Verification - First Attempt Success

**Objective**: Verify that student can pass verification on first attempt

**Preconditions**:
- Student logged in
- Enrollment photo exists in database
- On exam monitoring page
- Webcam working with good lighting

**Steps**:
```
1. Click "Start Exam" button
2. Verify verification overlay appears with:
   ☐ "Identity Verification" title
   ☐ "Verify Your Identity" description
   ☐ Attempt counter showing "1/3"
   ☐ Status showing "Ready"
   ☐ "Start Verification" button enabled
   ☐ Webcam instructions visible

3. Ensure face is centered in webcam feed
4. Click "Start Verification" button
5. Verify overlay changes to show:
   ☐ Status: "Capturing..."
   ☐ Button is disabled

6. Wait for capture to complete
7. Verify overlay shows:
   ☐ Status: "Comparing..."

8. Wait for comparison to complete
9. Verify results show:
   ☐ Match score: 75-100%
   ☐ "✅ Identity Verified" message

10. Verify button changes to "Continue to Exam"
11. Click "Continue to Exam"
12. Verify exam interface loads and is interactive
```

**Expected Results**:
- ✅ Overlay appears on exam start
- ✅ Capture happens without errors
- ✅ Comparison succeeds with >70% confidence
- ✅ Exam begins after verification
- ✅ Students can answer questions immediately

**Pass/Fail**: PASS if all steps completed successfully

---

### TC-102: Exam Start Verification - Failed Attempt + Retry Success

**Objective**: Verify student can retry after failed attempt

**Preconditions**:
- Setup same as TC-101
- Webcam positioned to show partial face or poor angle

**Steps**:
```
1. Click "Start Exam" button
2. Verification overlay appears
3. Click "Start Verification" button
4. First attempt completes with low match score:
   ☐ Score shows: 20-40%
   ☐ Message shows: "❌ Not Enough Match"

5. Verify UI shows:
   ☐ Attempt counter: "2/3"
   ☐ "Retry" button appears
   ☐ Error message visible

6. Reposition face to better angle
7. Click "Retry" button
8. Second attempt completes with high match:
   ☐ Score shows: 75-100%
   ☐ "✅ Identity Verified"

9. Click "Continue to Exam"
10. Exam loads successfully
```

**Expected Results**:
- ✅ First attempt shows low score
- ✅ Retry button available
- ✅ Attempt counter increments
- ✅ Second attempt succeeds
- ✅ Exam begins after verification

**Pass/Fail**: PASS if retry succeeds on second attempt

---

### TC-103: Exam Start Verification - Max Attempts Exceeded

**Objective**: Verify system locks out after 3 failed attempts

**Preconditions**:
- Setup same as TC-102
- Intentionally keep poor angle for all attempts

**Steps**:
```
1. Click "Start Exam" button
2. Verification overlay appears

3. ATTEMPT 1:
   ☐ Click "Start Verification"
   ☐ Wait for result: 30% match
   ☐ Verify: "2/3" shown
   ☐ Click "Retry"

4. ATTEMPT 2:
   ☐ Intentionally show profile view or side angle
   ☐ Click "Start Verification"
   ☐ Wait for result: 25% match
   ☐ Verify: "3/3" shown
   ☐ Click "Retry"

5. ATTEMPT 3:
   ☐ Show completely different angle
   ☐ Click "Start Verification"
   ☐ Wait for result: 15% match
   ☐ Verify: "3/3" shown
   ☐ Verify "Retry" button disappears

6. Verify UI shows:
   ☐ "Max Attempts Exceeded" message
   ☐ "Contact Administrator" text
   ☐ "Skip (Admin Bypass)" button visible
   ☐ Error description visible

7. Click "Skip (Admin Bypass)"
8. Verify exam loads (without verification)
```

**Expected Results**:
- ✅ Each attempt tracked correctly
- ✅ Attempts limited to 3
- ✅ Retry button disappears after 3rd attempt
- ✅ Admin bypass option available
- ✅ Session will be flagged for review

**Pass/Fail**: PASS if lockout works correctly

---

### TC-104: Continuous Face Matching - Success Pattern

**Objective**: Verify continuous face matching during normal exam with matching faces

**Preconditions**:
- Student passed exam start verification
- Face is clearly visible in webcam
- Good lighting maintained
- Exam in progress

**Steps**:
```
1. Start exam after successful verification
2. Verify sidebar shows:
   ☐ Live webcam feed
   ☐ Face detection circle (green)
   ☐ Gaze direction indicator
   ☐ Risk score starts at "LOW"

3. Keep face centered in frame
4. Wait for continuous checks (every 30 seconds)
5. Monitor backend logs or MongoDB:
   ☐ At 30s mark: Face matching check occurs
   ☐ At 60s mark: Another check occurs
   ☐ Event recorded: face_match_success
   ☐ Confidence score: 75-100%

6. Continue exam for 3-5 minutes
7. Verify in MongoDB (session.events):
   ☐ Multiple face_match_success events recorded
   ☐ All have high confidence scores
   ☐ No mismatch events present

8. Submit exam normally
```

**Expected Results**:
- ✅ Continuous checks every 30 seconds
- ✅ Events recorded in database
- ✅ Success events have 0 risk weight
- ✅ No warnings shown to student
- ✅ Exam submits normally

**Pass/Fail**: PASS if continuous monitoring works silently

---

### TC-105: Continuous Face Matching - Mismatch Detection

**Objective**: Verify system detects and flags face mismatches

**Preconditions**:
- Same as TC-104
- Ready to test mismatch scenario

**Steps**:
```
1. Start exam after successful verification
2. Face initially matches at start (verified)
3. At 3-minute mark: Move face out of frame
4. Keep different person or object in webcam
5. Wait for continuous check at ~5 min mark

6. Verify MongoDB event recorded:
   ☐ Type: 'face_mismatch'
   ☐ Score: <70% (e.g., 35%)
   ☐ Severity: 'medium'
   ☐ Weight: 3

7. Move original student back into frame
8. System should:
   ☐ Continue exam (not auto-submit)
   ☐ Record mismatch event
   ☐ Increase risk score

9. Submit exam and review in admin dashboard
10. Verify session shows:
    ☐ Face mismatch event recorded
    ☐ Suspicious flag if 2+ consecutive mismatches
```

**Expected Results**:
- ✅ Mismatch detected and recorded
- ✅ Event has proper severity/weight
- ✅ Exam continues (not auto-submitted for single mismatch)
- ✅ Session available for admin review
- ✅ Multiple mismatches flag as suspicious

**Pass/Fail**: PASS if mismatch properly detected and logged

---

### TC-106: Continuous Face Matching - Multiple Faces Detection

**Objective**: Verify system detects and flags multiple faces

**Preconditions**:
- Student in exam
- Another person available for testing

**Steps**:
```
1. Start exam normally (single face verified)
2. Exam in progress for 2-3 minutes
3. At 3-minute mark: Have another person enter frame
4. Both faces visible to webcam
5. Keep multiple faces visible for 10-15 seconds
6. Wait for continuous check (should occur within 30s)

7. Verify event recorded:
   ☐ Type: 'multiple_faces'
   ☐ Label: shows "2" faces detected
   ☐ Severity: 'critical'
   ☐ Weight: 10

8. In exam interface, verify one of:
   ☐ Auto-submit triggered (due to malpractice system)
   ☐ OR critical flag set for review

9. If not auto-submitted, check admin dashboard:
   ☐ Session flagged
   ☐ "Multiple faces detected" reason shown
   ☐ Severity: CRITICAL
```

**Expected Results**:
- ✅ Multiple faces detected immediately
- ✅ Critical event recorded
- ✅ System flags or auto-submits
- ✅ Evidence available for admin review
- ✅ Session marked for investigation

**Pass/Fail**: PASS if multiple faces properly handled

---

### TC-107: Continuous Face Matching - Face Absence Detection

**Objective**: Verify system detects when face disappears

**Preconditions**:
- Student in exam
- Exam running for 1-2 minutes
- Face is visible and verified

**Steps**:
```
1. Start exam with verified face
2. Exam in progress for 1-2 minutes
3. At 2-minute mark: Teacher covers webcam
4. Face completely hidden from view
5. Situation: No face in frame
6. Wait for continuous check (~30s)

7. Verify event recorded:
   ☐ Type: 'face_absent'
   ☐ Severity: 'high'
   ☐ Weight: 5
   ☐ Label shows occurrence count

8. Uncover webcam
9. Face reappears and recognized
10. Continue exam
11. At next interval, verify:
    ☐ No more "face_absent" events
    ☐ Back to "face_match_success"

12. Check admin dashboard:
    ☐ Session shows face absence event
    ☐ Risk score increased
    ☐ Available for review
```

**Expected Results**:
- ✅ Face absence detected
- ✅ Event recorded with high severity
- ✅ Risk score increases
- ✅ Recovery detected when face reappears
- ✅ Session flagged for investigation

**Pass/Fail**: PASS if absence properly detected

---

### TC-108: Consecutive Mismatches - Suspicious Flag

**Objective**: Verify system flags suspicious activity after 2+ consecutive mismatches

**Preconditions**:
- Exam in progress
- Ready to simulate face swap

**Steps**:
```
1. Start exam with verified face (~5 min in)

2. MISMATCH 1 (@ ~6 min):
   ☐ Show different angle/person for 20 seconds
   ☐ Trigger continuous check
   ☐ Event: face_mismatch (weight: 3)
   ☐ consecutiveMismatches: 1

3. Return to correct face for 30 seconds

4. MISMATCH 2 (@ ~9 min):
   ☐ Show different angle again
   ☐ Trigger continuous check
   ☐ Event: face_mismatch (weight: 10) ← increased!
   ☐ consecutiveMismatches: 2
   ☐ faceSwapSuspected: TRUE

5. Verify in MongoDB:
   ☐ Session.faceVerification.faceSwapSuspected: true
   ☐ Session.faceVerification.consecutiveMismatches: 2
   ☐ Risk score significantly increased (50+ points)

6. Admin dashboard shows:
   ☐ "SUSPICIOUS" flag
   ☐ Reason: "Possible proxy attempt"
   ☐ Status: Requires manual review
```

**Expected Results**:
- ✅ First mismatch recorded with low weight
- ✅ Second consecutive mismatch triggers suspicion
- ✅ Weight changes from 3 to 10
- ✅ faceSwapSuspected flag set
- ✅ Session moved to high priority review

**Pass/Fail**: PASS if suspicious pattern properly detected

---

### TC-109: UI Locking During Verification

**Objective**: Verify exam UI is locked during initial verification

**Preconditions**:
- Student on exam page
- Verification overlay showing

**Steps**:
```
1. Exam start verification overlay shows
2. Verify verification step is 'verifying'

3. Try to interact with exam:
   ☐ Click on answer options: Should do nothing
   ☐ Click navigation buttons: Disabled (opacity 40%)
   ☐ Click "Submit Exam": Disabled
   ☐ Tab key navigation: Should skip locked elements

4. Verify sidebar still shows:
   ☐ Webcam feed visible
   ☐ Proctor monitoring active
   ☐ Status indicators visible

5. Complete verification successfully
6. Verify verificationStep changes to 'verified'

7. Now interact with exam:
   ☐ Click answer option: Works, shows selection
   ☐ Navigation buttons: Enabled (100% opacity)
   ☐ "Submit Exam": Enabled
   ☐ Tab navigation: Works properly

8. Verify exam UI is fully interactive
```

**Expected Results**:
- ✅ All interactive elements disabled during verification
- ✅ Opacity/styling shows disabled state
- ✅ No exam interaction possible during verification
- ✅ All elements re-enabled after verification
- ✅ Sidebar monitoring always visible

**Pass/Fail**: PASS if UI properly locked

---

### TC-110: Event Recording & Database Storage

**Objective**: Verify all events properly recorded to MongoDB

**Preconditions**:
- Completed exam with various events
- MongoDB access available
- Exam session has passed through all phases

**Steps**:
```
1. In MongoDB, query session:
   db.sessions.findOne({_id: ObjectId("...")})

2. Verify events array contains:
   ☐ At least one 'face_match_success' event
   ☐ Possibly 'face_mismatch' events if applicable
   ☐ All events have: type, timestamp, label, severity, weight

3. Verify field structure for face events:
   {
     type: 'face_match_success' | 'face_mismatch' | 'face_absent',
     timestamp: ISODate("2024-01-15T..."),
     label: "Face verified...", 
     severity: 'low' | 'medium' | 'high' | 'critical',
     weight: 0 | 3 | 5 | 10,
     confidence: 82,  // if applicable
   }

4. Verify faceVerification sub-document:
   {
     examStartVerified: true,
     enrollmentPhotoUrl: "https://...",
     examStartAttempts: 1,
     firstVerificationTime: ISODate("..."),
     lastVerificationTime: ISODate("..."),
     consecutiveMismatches: 0 | 1 | 2,
     faceSwapSuspected: false | true,
   }

5. Verify snapshots array contains:
   ☐ Snapshots with reason: 'exam_start_verification' (first)
   ☐ Potentially 'face_match_verification' snapshots

6. Calculate total risk from all events:
   ☐ Sum of event weights
   ☐ Compare to risk score shown in admin UI
```

**Expected Results**:
- ✅ All events properly recorded
- ✅ Timestamps accurate and sequential
- ✅ All required fields present
- ✅ faceVerification sub-document populated
- ✅ Risk calculations correct
- ✅ Data format matches schema

**Pass/Fail**: PASS if all data properly stored

---

## Performance Testing

### PT-101: Verification Latency

**Objective**: Measure response time for exam start verification

**Steps**:
```
1. Note time when "Start Verification" clicked
2. Measure time until result displayed:
   ☐ Capture time: < 500ms
   ☐ Upload time: < 1000ms
   ☐ Comparison time: < 2000ms
   ☐ Total: < 3500ms

Target: < 5 seconds from click to result
```

**Pass**: Total time < 5 seconds

---

### PT-102: Continuous Check Impact

**Objective**: Verify continuous face matching doesn't impact exam performance

**Steps**:
```
1. Monitor system resources during exam:
   ☐ CPU usage: Should not spike above 30%
   ☐ Memory: Should not increase > 50MB
   ☐ Network: Periodic 30s requests only
   ☐ Frame rate: Exam UI smooth at 60fps

2. Verify exam responsiveness:
   ☐ Click response time < 200ms
   ☐ Navigation smooth
   ☐ No stuttering or freezing

3. Check network timing:
   ☐ Each face match request: < 2000ms
   ☐ Event recording: < 500ms
```

**Pass**: No impact on exam performance

---

## Edge Cases & Error Handling

### EC-101: Network Failure During Verification

**Steps**:
```
1. Start exam verification
2. Disconnect internet (or mock failure)
3. Verification attempt fails
4. Verify error message shown:
   ☐ "Network error"
   ☐ Suggests retry
4. Reconnect internet
5. Click "Retry"
6. Verification succeeds
```

**Pass**: Graceful error handling and recovery

---

### EC-102: ArcFace Service Unavailable

**Steps**:
```
1. Stop ArcFace service
2. Start exam verification
3. Capture succeeds but comparison fails
4. Verify error message and retry option
5. Can skip with admin bypass
6. Restart ArcFace
7. Retry succeeds
```

**Pass**: Fallback behavior and recovery

---

### EC-103: No Enrollment Photo

**Steps**:
```
1. Create new student (no signup photo)
2. Try to do exam start verification
3. Verify error: "No enrollment photo on file"
4. Direct student to complete signup first
5. Student completes signup (takes photo)
6. Now verification works
```

**Pass**: Clear error messaging

---

## Reporting Template

### Summary Report
```
Test Date: _______________
Tester: ___________________
Environment: [Dev/Staging/Prod]

Total Test Cases: 10
Passed: ___
Failed: ___
Blocked: ___

Critical Issues: ___
Major Issues: ___
Minor Issues: ___

Overall Result: [PASS/FAIL]

Blockers for Production:
- [List any critical failures]

Recommendations:
- [Any improvements needed]
```

### Issue Report
```
Issue ID: _______________
Severity: [Critical/Major/Minor]
Step: ___________
Expected: ___________
Actual: ___________
Environment: ___________
Reproducible: [Yes/No]
Attachment: [Screenshot/Video/Log]
```

---

## Sign-Off

This test guide ensures comprehensive coverage of the identity verification system. All test cases should pass before production deployment.

**Approved by**: _________________ Date: _________
**Tested by**: _________________ Date: _________
**Issues resolved**: _________________ Date: _________

