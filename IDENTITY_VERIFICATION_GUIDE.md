# Identity Verification System - Complete Implementation Guide

## Overview

The Identity Verification System provides multiple layers of face verification to ensure exam integrity and prevent proxy test-taking:

1. **Mandatory Exam Start Verification**: Required face capture when exam begins (70% match threshold)
2. **Continuous Face Matching**: Periodic verification every 30 seconds during the exam
3. **Multiple Face Detection**: Automatic flagging when more than one person detected
4. **Face Absence Detection**: Alerts when student face disappears from camera

---

## Architecture

### Component Hierarchy

```
ExamMonitoringPage
├── useExamStartVerification
│   ├── captureFrame() → 320x240 JPEG
│   ├── compareWithEnrollment() → Backend face comparison
│   ├── startVerification() → Orchestrates flow
│   └── State: status, attemptCount, matchScore
├── useContinuousFaceMatching
│   ├── performFaceMatch() → Every 30 seconds
│   ├── Risk scoring algorithm
│   └── State: matchStatus, faceAbsentCount, faceSwapSuspected
└── useMediaPipeProctor (existing)
    ├── Real-time face detection
    └── Gaze tracking + event recording
```

### Face Matching Pipeline

```
┌─────────────────────────────────────────┐
│  ENROLLMENT PHASE (Signup/Login)        │
│  - Capture student face photo           │
│  - Store in database (loginPhotoUrl)    │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│  EXAM START VERIFICATION                │
│  - Show capture overlay on exam start   │
│  - Student clicks "Start Verification"  │
│  - Capture current frame (320x240 JPEG) │
│  - POST to /compare-photo-exam          │
│  - Backend: ArcFace comparison (70%)    │
│  - If match: Continue to exam           │
│  - If mismatch: Retry (max 3 attempts)  │
│  - If max exceeded: Lock out + flag     │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│  CONTINUOUS FACE MATCHING               │
│  - Every 30 seconds during exam         │
│  - Capture live frame (256x192 JPEG)    │
│  - POST to /match-face-exam             │
│  - Backend: Compare with enrollment     │
│  - If mismatch: Log event + risk score  │
│  - If 2+ consecutive mismatches: Flag   │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│  SESSION REVIEW                         │
│  - Analyze face matching events         │
│  - Check for patterns (face swaps)      │
│  - Auto-flag if suspicious              │
│  - Send to admin for verification       │
└─────────────────────────────────────────┘
```

---

## Frontend Implementation

### Core Hooks

#### 1. useExamStartVerification

**Location**: `frontend/src/hooks/useExamStartVerification.ts`

**Purpose**: Mandatory face verification when exam starts

**State Interface**:
```typescript
{
  status: 'waiting' | 'capturing' | 'comparing' | 'verified' | 'failed' | 'max_attempts',
  attemptCount: number,              // 0-3
  maxAttempts: 3,
  matchScore: number | null,         // 0-100
  capturedFrame: string | null,      // Base64 JPEG
  lastVerificationTime: number | null,
  error: string | null,
}
```

**Public Methods**:
```typescript
startVerification()         // Capture frame + compare
captureFrame()             // Record 320x240 canvas
compareWithEnrollment()    // Call backend API
skipVerification()         // Admin bypass
reset()                    // Retry after failure
```

**Example Usage**:
```typescript
const verification = useExamStartVerification(videoRef);

// Start verification
const result = await verification.startVerification();
if (result) {
  // Verification succeeded - proceed to exam
  setExamReady(true);
} else {
  // Failed - show retry option
  if (verification.attemptCount >= 3) {
    // Max attempts exceeded
  }
}
```

#### 2. useContinuousFaceMatching

**Location**: `frontend/src/hooks/useContinuousFaceMatching.ts`

**Purpose**: Real-time face verification during exam (every 30 seconds)

**State Interface**:
```typescript
{
  isActive: boolean,
  lastMatchTime: number | null,
  matchScore: number | null,           // Current match %
  matchStatus: 'idle' | 'checking' | 'matched' | 'mismatch' | 'error',
  faceAbsentCount: number,             // Streak counter
  multipleFacesCount: number,          // Streak counter
  faceSwapSuspected: boolean,          // 2+ consecutive mismatches
  consecutiveMismatches: number,
  lastMatchPhoto: string | null,       // Last captured frame
  riskScore: number,                   // 0-100 calculated
  matchHistory: FaceMatchResult[],     // Last 10 matches
}
```

**Public Methods**:
```typescript
startMatching()         // Begin periodic checks
stopMatching()          // Pause verification
performFaceMatch()      // Manual check
reset()                 // Reset counters
```

**Risk Scoring Algorithm**:
```javascript
riskScore = Math.min(100,
  (faceAbsentCount * 10) +           // Each absence = 10 points
  (multipleFacesCount * 15) +        // Each multi-face = 15 points
  (consecutiveMismatches * 20) +     // Each mismatch = 20 points
  (faceSwapSuspected ? 50 : 0)       // Suspected swap = 50 points
)
```

---

## Backend Implementation

### API Endpoints

#### 1. POST `/api/students/compare-photo-exam`

**Purpose**: Verify identity at exam start (mandatory)

**Request**:
```json
{
  "capturedFrame": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..."
}
```

**Response (Success)**:
```json
{
  "success": true,
  "matchConfidence": 85,
  "verified": true,
  "message": "Identity verified. Exam can begin.",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response (Failure)**:
```json
{
  "success": false,
  "matchConfidence": 45,
  "verified": false,
  "message": "Identity verification failed. Please retry.",
  "timestamp": "2024-01-15T10:30:05Z"
}
```

**Implementation Notes**:
- Uses ArcFace for face comparison
- 70% confidence threshold for verification
- Compares against `student.loginPhotoUrl`
- Falls back to `student.signupPhotoUrl` if no login photo
- Returns 404 if no enrollment photo exists

#### 2. POST `/api/students/match-face-exam`

**Purpose**: Continuous face matching during exam (every 30 seconds)

**Request**:
```json
{
  "livePhoto": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
  "enrollmentPhotoUrl": "https://res.cloudinary.com/.../image.jpg"
}
```

**Response**:
```json
{
  "success": true,
  "matchConfidence": 82,
  "isSamePerson": true,
  "faceDetected": true,
  "faceCount": 1,
  "confidence": "high",
  "timestamp": "2024-01-15T10:32:00Z"
}
```

**Implementation Notes**:
- Called every 30 seconds during exam
- Uses ArcFace service
- Returns all metadata for event logging
- Non-critical failure (exam continues)

---

### Event Recording

**Event Types**:

```typescript
// Successful verification
{
  type: 'face_match_success',
  label: 'Face verified during exam (85% confidence)',
  severity: 'low',
  weight: 0,  // No penalty
  confidence: 85,
}

// Face mismatch
{
  type: 'face_mismatch',
  label: 'Face mismatch detected during exam (45% confidence)',
  severity: 'medium' | 'high',
  weight: 3 | 10,  // 10 if suspicious
  confidence: 45,
}

// Face absent
{
  type: 'face_absent',
  label: 'Face not detected (3 occurrences)',
  severity: 'high',
  weight: 5,
}

// Multiple faces
{
  type: 'multiple_faces',
  label: 'Multiple faces detected (2 occurrences)',
  severity: 'critical',
  weight: 10,
}
```

---

## User Experience Flow

### Exam Start Verification Flow

```
┌─────────────────────────────┐
│  Exam Start Button Clicked  │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────┐
│  Exam Start Verification Overlay Shows          │
│  ┌─────────────────────────────────────────┐   │
│  │ Identity Verification                   │   │
│  │ Verify Your Identity                    │   │
│  │                                         │   │
│  │ Attempts: 1/3                           │   │
│  │ Status: Ready                           │   │
│  │                                         │   │
│  │ [Start Verification] [Retry] [Skip]    │   │
│  │                                         │   │
│  │ 📹 WEBCAM INSTRUCTIONS                  │   │
│  │ ✓ Ensure adequate lighting              │   │
│  │ ✓ Face directly at camera               │   │
│  │ ✓ Keep face centered in frame           │   │
│  └─────────────────────────────────────────┘   │
└──────────────┬──────────────────────────────────┘
               │ User clicks "Start Verification"
               ▼
       ┌──────────────┐
       │ Capturing... │
       └──────┬───────┘
              │
              ▼
     ┌────────────────┐
     │ Comparing... │
     └────────┬───────┘
              │
              ▼
        ┌──────────────┐
        │ Result: 85%  │
        │ ✅ Verified  │
        └──────┬───────┘
               │
               ▼
     ┌──────────────────┐
     │ Continue to Exam │ ← Exam begins
     └──────────────────┘
```

**Failure Case** (shows retry option):
```
        ┌──────────────┐
        │ Result: 45%  │
        │ ❌ No Match  │
        └──────┬───────┘
               │
       ┌───────▼─────────┐
       │ Retry Available │
       │ Attempts: 2/3   │ ← Can click "Retry"
       └─────────────────┘
```

**Max Retries Case**:
```
        ┌──────────────┐
        │ Result: 40%  │
        │ ❌ No Match  │
        └──────┬───────┘
               │
       ┌───────▼────────────────┐
       │ Max Attempts Exceeded  │
       │ Attempts: 3/3          │ ← Session flagged
       │ Contact Administrator  │
       │ [Skip (Admin Bypass)]   │
       └────────────────────────┘
```

---

## Continuous Monitoring During Exam

### Real-Time Face Matching

**Visible in Exam Monitoring Page**:

1. **Sidebar Status Indicator**
   - Live webcam feed (always visible)
   - Face detection circle (green/red)
   - Gaze direction arrows
   - Risk score display

2. **Background Operations** (invisible to student)
   - Every 30 seconds: Capture + compare frame
   - Record results to MongoDB
   - Calculate risk scores
   - Alert on suspicious patterns

3. **Automatic Responses**
   - Match success → Silent, no action
   - Match failure → Event logged, risk +
   - 2+ consecutive failures → Risk increases significantly
   - Face absent → Event logged, risk +
   - Multiple faces → Auto-flag violation

---

## Configuration

### Verification Parameters

```typescript
// File: frontend/src/hooks/useContinuousFaceMatching.ts

// Face comparison interval
const checkIntervalMs = 30000;  // 30 seconds

// Confidence thresholds
const VERIFICATION_THRESHOLD = 70;        // 70% for exam start
const CONTINUOUS_THRESHOLD = 70;          // 70% for ongoing checks

// Risk thresholds
const FACE_ABSENT_TIMEOUT = 5000;         // 5 seconds
const FACE_SWAP_THRESHOLD = 2;            // 2+ consecutive mismatches
```

### Backend Configuration

```javascript
// File: backend/src/controllers/studentController.js

// Match confidence calculation
const MINIMUM_CONFIDENCE = 70;             // 70% threshold
const HIGH_CONFIDENCE = 85;                // 85%+ is very confident
const LOW_CONFIDENCE = 50;                 // Below this = likely mismatch

// Risk scoring
const RISK_WEIGHTS = {
  face_absent: 5,                          // Each absence
  multiple_faces: 10,                      // Multiple people detected
  face_mismatch: 3,                        // Single mismatch
  face_swap_suspected: 50,                 // Probable proxy
};
```

---

## Database Schema

### Session Document

```javascript
{
  _id: ObjectId,
  examId: ObjectId,
  studentId: ObjectId,
  
  // Face verification tracking
  faceVerification: {
    examStartVerified: true,              // Did they pass exam start verification?
    enrollmentPhotoUrl: "https://...",
    examStartAttempts: 1,                 // How many tries?
    firstVerificationTime: Date,          // When verified at start?
    lastVerificationTime: Date,           // Last continuous check?
    consecutiveMismatches: 2,             // Track streak
    faceSwapSuspected: false,             // Flag for review
  },
  
  // Events array (existing, now includes face events)
  events: [
    {
      type: 'face_match_success',
      timestamp: Date,
      label: 'Face verified during exam (85%)',
      severity: 'low',
      weight: 0,
      confidence: 85,
    },
    // ... more events
  ],
  
  // Snapshots (existing)
  snapshots: [
    {
      url: "https://...",
      timestamp: Date,
      reason: 'face_verification' | 'phone_detected' | ...
    }
  ],
}
```

---

## Testing

### Manual Test Scenarios

#### Scenario 1: Successful Exam Start Verification
```
1. Go to exam monitoring page
2. See "Identity Verification" overlay
3. Click "Start Verification"
4. Overlay shows "Capturing..."
5. Then "Comparing..."
6. Shows match: 82%
7. Button changes to "Continue to Exam"
8. Click it → Exam begins
```

#### Scenario 2: Failed Verification (Retry)
```
1. Start verification
2. Match shows: 45%
3. "Not Enough Match" warning
4. Button shows: "Retry"
5. Attempts: 2/3
6. Click "Retry"
7. Try different angle
8. Match shows: 88%
9. "Identity Verified" ✅
10. Continue to exam
```

#### Scenario 3: Max Attempts Exceeded
```
1. First attempt: 40% - Retry
2. Second attempt: 35% - Retry
3. Third attempt: 38% - Max attempts reached
4. Error message: "Contact Administrator"
5. [Skip (Admin Bypass)] button available
6. Admin can verify manually and allow continuation
```

#### Scenario 4: Continuous Monitoring - Face Match Success
```
1. Exam in progress (5 min mark)
2. Backend performs continuous check
3. Face matches at 84%
4. No alert shown (silent success)
5. Event recorded: face_match_success
```

#### Scenario 5: Continuous Monitoring - Face Mismatch
```
1. Exam in progress (10 min mark)
2. Backend check: 42% (mismatch)
3. Event recorded: face_mismatch (weight: 3)
4. Risk score increases
5. 30 sec later: Another check 38%
6. Another mismatch = "suspicious"
7. Event recorded with weight: 10
8. Risk score increases significantly
9. Warning sent to admin (optional)
```

#### Scenario 6: Multiple Faces Detected
```
1. During continuous monitoring check
2. Backend detects 2 faces
3. Immediate event: multiple_faces (weight: 10)
4. This also triggers auto-malpractice in existing system
5. Critical flag for admin review
```

---

## Admin Features

### Dashboard Integration

```typescript
// New admin dashboard sections

// 1. Verification Statistics
{
  totalExams: 450,
  startVerificationsPassed: 420,
  startVerificationsFailed: 30,
  passRate: 93.3%,
  averageMatchScore: 84.5,
}

// 2. Suspicious Sessions
{
  sessions: [
    {
      sessionId: "...",
      studentId: "...",
      examName: "Data Structures",
      verificationAttempts: 3,
      firstMatchScore: 42,
      consecutiveMismatches: 5,
      riskScore: 78,
      status: 'flagged_for_review',
      action: 'View Details'
    }
  ]
}

// 3. Face Match Trends
{
  avgScore: 85.2,
  lowScoreCount: 12,
  zeroFaceDetections: 3,
  multipleFaceDetections: 5,
}
```

### Review Interface

```
[Session Review]
┌─────────────────────────────────────────┐
│ Face Verification Details               │
├─────────────────────────────────────────┤
│                                         │
│ Exam Start Verification:                │
│  • Attempts: 1/3                        │
│  • First attempt: 42% ❌                │
│  • Retry 1: 45% ❌                      │
│  • Retry 2: 51% ❌                      │
│  • Final: Max attempts exceeded         │
│  • Final status: ALLOWED (admin bypass) │
│                                         │
│ During Exam (Continuous Checks):        │
│  • Check at 5 min: 85% ✅              │
│  • Check at 10 min: 38% ❌             │
│  • Check at 15 min: 42% ❌             │
│  • Suspicious after 2nd mismatch       │
│                                         │
│ Risk Assessment:                        │
│  • Total risk score: 65/100 (Yellow)   │
│  • Flag reason: Possible proxy attempt │
│  • Recommended action: Manual review   │
│                                         │
│ [View Photos] [Approve] [Reject]       │
│                                         │
└─────────────────────────────────────────┘
```

---

## Troubleshooting

### Common Issues

#### Issue: "Face Verification Modal Not Showing"
```
Solution:
1. Check enrollmentPhotoUrl is loaded
2. Verify video ref is properly passed
3. Check examStarted state changes to true at 800ms
4. Verify verificationStep is 'verifying'
5. Check browser console for errors
```

#### Issue: "Continuous Face Matching Not Working"
```
Solution:
1. Verify verificationStep === 'verified'
2. Check continuousFaceMatching.isActive is true
3. Verify /match-face-exam endpoint responds
4. Check ArcFace service availability
5. Review network tab for API calls
```

#### Issue: "High False Positive Rate"
```
Solution:
1. Adjust VERIFICATION_THRESHOLD from 70% to 75%
2. Improve lighting in exam room
3. Ensure enrollment photo is high quality
4. Check for glasses/facial hair differences
```

#### Issue: "Students Timing Out on Verification"
```
Solution:
1. Increase attempt limit from 3 to 5
2. Add admin bypass button for technical issues
3. Show helpful webcam instructions
4. Test with various lighting conditions
```

---

## Performance Considerations

### Optimization Tips

1. **Frame Capture**
   - Use 320x240 for exam start (faster comparison)
   - Use 256x192 for continuous checks (minimal overhead)
   - JPEG compression at 0.8 quality

2. **Network Usage**
   - Continuous checks every 30 seconds (not every second)
   - Batch event recording (5s debounce)
   - Use base64 encoding for efficient transfer

3. **CPU Usage**
   - Canvas operations are fast (<100ms)
   - ArcFace comparison on backend (not frontend)
   - MediaPipe face detection already running

4. **Risk Assessment**
   - Calculated locally (no server calls)
   - Updated every 30s with continuous checks
   - Used only for decision-making, not storage

---

## Security Considerations

### Best Practices

1. **Never Trust Client-Side Only**
   - Always verify on backend
   - Use ArcFace for accurate comparison
   - Threshold-based decisions with buffer

2. **Prevent Spoofing**
   - Check image is live (not photo)
   - Monitor for face absence/presence changes
   - Flag sudden face swaps

3. **Privacy Protection**
   - Don't store captured frames permanently
   - Compress face data for storage
   - Encrypt enrollment photos at rest

4. **Admin Bypass**
   - Audit all bypasses in session logs
   - Require admin credentials
   - Show bypass notifications

---

## Compliance & Standards

- **GDPR**: Face data encryption, consent collection
- **FERPA**: Student data privacy in session storage
- **WCAG 2.1 AA**: Accessible UI with keyboard navigation
- **SOC 2**: Audit trails for all verification attempts

---

## Future Enhancements

### Planned Features

1. **3D Face Liveness Detection**
   - Check for real face vs. photo/video
   - Request specific head movements
   - Prevent deepfakes

2. **Behavioral Analysis**
   - Track eye movement patterns
   - Detect unusual behavior
   - Machine learning for anomaly detection

3. **Multi-Modal Verification**
   - Combine face + voice recognition
   - Add keystroke dynamics
   - Additional biometric layers

4. **Real-Time Alerts**
   - Admin dashboard push notifications
   - Proctor alerts during exam
   - Automatic lockdown on critical flags

---

## Support & Documentation

**For Admins**: See QUICK_START_IDENTITY.md
**For QA Testing**: See CONTINUOUS_FACE_MATCHING_TEST.md
**For Developers**: See code comments in hooks
**Issue Reports**: File with sessionId + timestamps

