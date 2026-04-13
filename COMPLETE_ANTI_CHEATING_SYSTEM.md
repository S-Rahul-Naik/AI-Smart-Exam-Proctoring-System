# 🔒 COMPLETE ANTI-CHEATING SYSTEM IMPLEMENTATION

## System Architecture

The system now implements **9 layers of anti-cheating defense**:

```
Layer 1: Identity Verification (Stops Proxy Takers)
├─ Selfie capture
├─ ID photo verification
├─ Face matching (80%+ confidence)
└─ Continuous face tracking during exam

Layer 2: Biometric Monitoring (Face & Body)
├─ Face detection (required)
├─ Multiple faces detection (auto-flag)
├─ Gaze tracking (looking away)
├─ Lip movement detection (talking)
├─ Head movement analysis
└─ Extreme angle detection

Layer 3: Device Detection (Blocks Physical Cheating)
├─ Mobile phone detection (visual AI)
├─ Tablet detection
├─ Smartwatch detection
├─ Audio device changes
└─ Camera coverage analysis

Layer 4: Browser Lockdown (Prevents Online Cheating)
├─ Disable DevTools (F12)
├─ Disable inspect element (Ctrl+Shift+I)
├─ Disable copy-paste
├─ Disable right-click
├─ Disable keyboard shortcuts
└─ Fullscreen enforcement

Layer 5: Window/Tab Monitoring (Catches Cheating)
├─ Tab switch detection
├─ Window focus loss detection
├─ Alt+Tab detection
├─ Multiple window detection
└─ Screen presence validation

Layer 6: Question Randomization (Prevents Sharing)
├─ Unique question sets per student
├─ Randomized question order
├─ Randomized option order
├─ Scenario-based questions (can't Google)
└─ Large question pool (500+)

Layer 7: Timing Enforcement (Reduces Googling)
├─ Global exam timer
├─ Per-question timing (optional)
├─ No backtracking (optional)
├─ Auto-submit on expiry
└─ No time extensions

Layer 8: Recording & Evidence (Proves Cheating)
├─ Full session video recording
├─ Webcam stream stored
├─ Event snapshots captured
├─ Timestamp tracking
├─ Audio recording (optional)
└─ Evidence organization

Layer 9: Risk Scoring & Auto-Flagging (Decision Making)
├─ Real-time risk calculation
├─ Automatic flagging at 85%+
├─ Behavior pattern analysis
├─ Malpractice indicator detection
└─ Admin review workflow
```

---

## 🎥 Layer 1: Identity Verification

### Pre-Exam Process

**Mandatory Before Exam Starts:**

```
Student Flow:
1. Upload enrollment photo (during signup)
2. Register for exam
3. Before exam: Start verification
   ├─ Read rules & acknowledge
   ├─ Capture live selfie
   ├─ Upload ID document photo
   ├─ System matches faces
   └─ If 80%+ match → Approved
              ↓
    Start exam
```

### How It Works

**Selfie Capture:**
- Student faces webcam
- System captures live image
- Uses face-api.js or MediaPipe for landmarks
- Compares to enrollment photo

**ID Verification:**
- Student shows ID to camera
- Student face + ID in frame
- Does NOT need to match perfectly
- Just confirms real person (not photo)

**Face Matching:**
- Deep face comparison (ideally AWS Rekognition)
- Require 80%+ confidence
- If fails → 3 attempts allowed
- After 3 fails → Exam cannot start

**During Exam:**
- Face must stay visible
- If face disappears → Auto-flag
- If different face → Auto-submit

---

## 👁️ Layer 2: Biometric Monitoring

### Face Detection

**What We Check:**
- ✓ Face is present (detected)
- ✓ Only 1 face visible (identity assured)
- ✓ Face orientation reasonable (not extreme angles)
- ✓ Face quality acceptable (not blurred)
- ✓ Eyes visible (not covered)

**Auto-Flags:**
- No face detected for 5+ seconds → Event logged
- Multiple faces → Instant flag
- Face blur detected → Event logged
- Extreme angles (>45°) → Event logged

**Event Logging:**
```javascript
{
  type: 'face_absent',        // If no face
  type: 'multiple_faces',     // If 2+ faces
  type: 'face_blur',          // If low quality
  type: 'extreme_gaze_angle', // If head turned
  timestamp: Date,
  severity: 'critical' | 'high' | 'medium'
}
```

### Gaze Tracking

**What We Measure:**
- Where eyes are looking (center, left, right, down)
- Duration of gaze (if looking away 10+ seconds)
- Patterns (repeated looking in same direction)

**Red Flags:**
- Staring at wall for 20+ seconds
- Repeatedly looking down (at papers?)
- Looking to the right (at secondary screen?)
- Extreme angles suggest hiding something

### Lip Movement Detection

**What We Detect:**
- Subtle mouth movement (talking)
- Lip-reading friendly head position
- Jaw movement patterns
- Timing correlation with events

**Why It Matters:**
- Student reading answers aloud → Obvious cheating
- Could be getting oral hints from someone
- Detection confidence: 70-80%

### Head Movement Analysis

**Normal vs Suspicious:**
- ✓ Normal: Natural head movements, occasional glances
- ✗ Suspicious: Rapid jerky movements, same direction repeatedly, extreme angles

**What We Track:**
- Movement speed (rapid = suspicious)
- Direction consistency (looking repeatedly same direction)
- Angle extremes (>45° = hiding something)

---

## 📱 Layer 3: Device Detection

### Phone Detection

**AI Visual Detection:**
- Uses CNN on webcam frames
- Looks for phone characteristics:
  - Screen glow (bright rectangular shape)
  - Phone form factor (aspect ratio)
  - Texture patterns (specific to phones)
- Confidence scoring (0-100%)

**When We Detect:**
- Any phone in camera view = 80%+ confidence
- Even partially visible → Detected
- Handheld or on desk → Both detected

**Auto-Actions:**
- Screenshot captured (evidence)
- Event logged with timestamp
- Risk score increases 30 points
- Usually auto-flags for rejection

**False Positive Reduction:**
- Require sustained detection (not one frame)
- Check for phone characteristics multiple times
- Only flag if confidence > 80%

### Device Connection Monitoring

**What We Track:**
- Bluetooth devices connecting/disconnecting
- USB device changes
- Audio device connections
- WiFi changes

**Why It Matters:**
- Smartwatch connection = cheating device
- Wireless earbuds = communication device
- Sudden WiFi switch = cheating attempt

---

## 🖥️ Layer 4: Browser Lockdown

### DevTools Prevention

**Methods to Block:**
1. **Keyboard Shortcuts:**
   - F12 → Blocked
   - Ctrl+Shift+I → Blocked
   - Ctrl+Shift+J → Blocked
   - Ctrl+R (reload) → Blocked
   - Ctrl+U (view source) → Blocked

2. **Right-Click Context Menu:**
   - Right-click → Prevented
   - Inspect element → Blocked

3. **Detection:**
   - Monitor window size (DevTools open = wider gaps)
   - Detect console errors from scripts
   - Prevent debugging APIs

### Copy-Paste Blocking

**Prevented:**
- Ctrl+C (copy) → Blocked
- Ctrl+V (paste) → Blocked
- Ctrl+X (cut) → Blocked
- Cmd+C / Cmd+V (Mac) → Blocked

**Detection:**
- Every attempt logged
- 3+ attempts → Flag event
- Screenshot on attempt

### Advanced Protections

```javascript
// Block text selection (aggressive)
User cannot select text in exam
// Exception: Input fields allow selection

// Block drag operations
Cannot drag text, files

// Block print screen
Ctrl+P blocked

// Block keyboard navigation
Tab key restricted within exam window
```

### Reality Check

**Can Be Bypassed By:**
- Using developer console in another terminal
- Screenshot + OCR
- Mobile hotspot from second device
- Physical note-taking

**Still Worth It Because:**
- 80% of cheaters are not sophisticated
- Even skilled users might miss something
- Time pressure favors honest approach
- Multi-layer approach catches attempts

---

## 🔄 Layer 5: Window & Tab Monitoring

### Tab Switch Detection

**How Detected:**
- Browser visibility API
- Window focus events
- Tab hidden state tracking

**What We Log:**
- Time of switch
- Frequency (5+ in 5 min = suspicious)
- Duration away from exam
- Whether alt+tab used

**Penalties:**
- First occurrence: Toast notification
- 5+ occurrences: Warning popup
- 10+ in 5 min: Auto-submit

### Window Focus Loss

**Trigger Events:**
- Alt+Tab away from window
- Click outside window
- Minimize window
- Another app comes to foreground

**Auto-Actions:**
- Refocus window if possible
- Log event with timestamp
- Add risk points
- Screenshot on repeated violations

### Fullscreen Enforcement

**Rules:**
- Exam MUST be fullscreen
- If user exits fullscreen:
  - Auto-warning popup
  - Request to re-enter
  - Log violation

**Technically:**
- Request fullscreen on start
- Monitor fullscreenchange events
- Re-request if exited
- Flag persistent violations

---

## 🎲 Layer 6: Question Randomization

### Unique Question Sets

**Per Student:**
- Each student gets different questions
- From pool of 500+ questions
- Order is randomized
- Answer options are shuffled

**Benefits:**
```
Student A: Q3, Q12, Q45... (in order)
Student B: Q1, Q29, Q87... (different)
Student C: Q7, Q41, Q20... (different)

Even if they collaborate:
S_A answers: Q3=B, Q12=C
S_B answers: Q1=D, Q29=A
→ Answers don't match
→ Collaboration obvious
```

### Question Design

**Scenario-Based:**
- Problem: "If data takes 30ms to search, which algorithm?"
- Can't Google: Need to understand algorithms
- Forces thinking

**Logic-Based:**
- Problem: "What's output of: sort([3,1,2])"
- Can't copy-paste: Need to execute mentally
- Easy to detect if wrong

**Code-Based (For Programming):**
- Problem: "Write function to reverse string"
- Requires actual coding
- Can detect suspicious patterns
- Obvious plagiarism

### Per-Question Timing

**Feature:**
- Each question has time limit (e.g., 2 minutes)
- Can't spend 30 minutes on one question
- Auto-advance to next (optional)

**Effect:**
- Less time = less Googling
- Pressure favors prepared students
- Honest students manage fine
- Cheaters run out of time

### Disable Backtracking

**How It Works:**
- No "Previous" button
- Can only move forward
- Can't change previous answers
- Forces commit to answers

**Why:**
- Prevents cross-checking (common cheating strategy)
- "Wait for someone to finish, then adjust"
- Reduces deliberation time

---

## ⏱️ Layer 7: Timing Enforcement

### Global Exam Timer

**Non-Negotiable:**
- Timer always visible
- Counts down continuously
- No pause
- No extensions

**Auto-Submit:**
- When timer hits 0:00
- Exam auto-submits
- No saving draft
- Goes to admin review

### Per-Question Timing

**Optional Feature:**
```
Question 1: 2 minutes
├─ Time displayed
├─ Warning at 30 seconds
├─ Auto-advance when expired
└─ Unanswered = blank

Question 2: 2 minutes
...
```

### Effect on Cheating

```
Normal response time: ~30-60 seconds per question
Cheating strategy (Google): ~120+ seconds

With 2-minute limit per question:
✓ Honest student: Ample time, answers from knowledge
❌ Cheating student: Barely enough time to Google & apply
```

---

## 📹 Layer 8: Full Recording & Evidence

### Session Recording

**What's Recorded:**
1. **Webcam Feed**
   - Student's face and surroundings
   - Full exam duration
   - 720p minimum quality

2. **Event Snapshots**
   - Screenshot when violation detected
   - Before/after of suspicious behavior
   - Multiple angles/moments

3. **Screen Recording** (Optional)
   - What student sees
   - Browser window only (privacy)
   - Exam interface interaction

4. **Metadata**
   - Timestamp of each event
   - Event type
   - Confidence scores
   - Risk points added

### Storage & Format

```
Session Video:
├─ Filename: exam_[studentId]_[sessionId].webm
├─ Codec: VP8 (open standard)
├─ Size: ~500MB per hour (2.5 Mbps)
├─ Duration: Full exam
└─ Upload: After exam completes

Snapshots:
├─ event_[timestamp]_[type].jpg
├─ Multiple per violation
├─ ~100KB each
└─ Organized by session
```

### Evidence Preservation

- **Auto-backup** to cloud storage
- **Version control** (keep all copies)
- **Tamper detection** (hash verification)
- **Long-term storage** (7+ years per policy)

---

## 🎯 Layer 9: Risk Scoring & Auto-Flagging

### Real-Time Risk Calculation

**Events Generate Points:**

| Event | Points | Threshold |
|-------|--------|-----------|
| Phone detected | +30 | 1+ = Auto-flag |
| Multiple faces | +25 | 1+ = Auto-flag |
| DevTools opened | +25 | 1+ = Auto-flag |
| Tab switch | +15 | 5+ = Flag |
| Face absent | +20 | 10+ = Flag |
| Copy-paste attempt | +20 | 3+ = Flag |
| Fullscreen exit | +12 | 3+ = Flag |
| Lip movement | +15 | 5+ = Flag |
| Extreme gaze angle | +12 | 5+ = Flag |
| Rapid head movement | +15 | 8+ = Flag |

**Rolling Window:**
- Events in last 30 minutes count
- Older events fade in impact
- Prevents unfair flagging later in exam

### Risk Levels

```
0-35:   LOW (Green) - Normal exam
35-65:  MEDIUM (Yellow) - Monitor
65-85:  HIGH (Orange) - Likely cheating
85-100: CRITICAL (Red) - Definite cheating
```

### Auto-Flagging Triggers

Session AUTO-FLAGGED for review if:
1. Risk score reaches 85+
2. Phone detected (even once)
3. Multiple faces detected (even once)
4. DevTools opened (even once)
5. 2+ critical events
6. 5+ violations in 5-minute window

### Admin Review Decision

**If Auto-Flagged:**

1. **Evidence Compiled:**
   - Risk score & breakdown
   - Timeline of events
   - Snapshots & video
   - Student performance data

2. **Admin Reviews:**
   - Watch video
   - Look at snapshots
   - Analyze timeline
   - Check performance anomalies

3. **Possible Decisions:**
   - ✅ APPROVED (false alarm, honest exam)
   - ❌ REJECTED (cheating detected, score invalid)
   - ⏳ PENDING (needs investigation)
   - ? MANUAL REVIEW (escalate to senior)

---

## 📊 Cheat Score System

### Example Scenarios

**Scenario 1: Honest Student**
```
Event: Gaze left (3x) ......... +24 points
Event: Tab switch (1x) ....... +15 points
Event: Face briefly absent .... +5 points
────────────────────────────────────
Total Risk Score: 44/100 (MEDIUM)
Decision: Safe - probably just nervous
Admin Decision: APPROVED
```

**Scenario 2: Moderate Cheating**
```
Event: Phone detected (85% conf) +30 points
Event: Tab switches (8x) ....... +120 points  
Event: Multiple searches ...... +15 points
Event: Rapid head movements .... +45 points
────────────────────────────────────
Total Risk Score: 75/100 (HIGH)
Decision: Very likely cheating
Auto-Flagged: YES
Admin Decision: Usually REJECTED
```

**Scenario 3: Clear Cheating**
```
Event: Multiple faces (2x) .... +50 points
Event: Phone detected (92%) .... +30 points
Event: DevTools opened ........ +25 points
Event: Extreme gaze angle (8x). +96 points
────────────────────────────────────
Total Risk Score: 95/100 (CRITICAL)
Decision: Almost certainly cheating
Auto-Flagged & Auto-Submit: YES
Admin Decision: DEFINITELY REJECTED
```

---

## 🔍 Red Flags for Admins

**What Makes Admin Say "REJECTED":**

1. **Visual Evidence (Photo/Video)**
   - Phone clearly in frame
   - Second person visible
   - Screen showing unauthorized site

2. **Technical Evidence**
   - DevTools opened & used
   - Multiple tab switches in rapid sequence
   - Copy-paste of exact answers

3. **Behavioral Evidence**
   - Looking repeatedly away (at phone/notes/person)
   - Lip movement (reading aloud or getting hints)
   - Extreme head angles
   - Rapid hand movements from different person

4. **Anomaly Evidence**
   - Impossible time patterns
   - Perfect score but high risk
   - Performance spike after violations
   - Answers match other student's (collaboration)

5. **Pattern Evidence**
   - Violation spike at hard questions
   - Violations stop at easy questions
   - Timing correlates with Google searches

---

## 📋 Administrator Workflow

### Session Appears in Review Queue When:
1. Auto-flagged during exam
2. Risk score 65+
3. Manual flag by proctor
4. Exam completed with critical events

### Admin Review Process:

```
1. See session in queue (sorted by risk)
2. Click to open detailed view
3. Review all evidence
4. Watch key video moments
5. Read behavior analysis
6. Add admin notes
7. Choose decision
8. Submit (audit trail recorded)
```

### Evidence Available:

```
Dashboard Shows:
├─ Risk Timeline (graph)
├─ Events List (chronological)
├─ Snapshots (grid gallery of violations)
├─ Full Video (play & scrub)
├─ Student Answers (compare to others)
├─ Performance Metrics
├─ Biometric Summary
└─ Confidence Scores (per event)
```

---

## ⚖️ Fairness & Appeal

### False Positive Protection

- If marked REJECTED but believe wrongfully:
  - Appeal process available
  - Senior admin reviews
  - Can provide context video

### If Decision is APPROVED:
- Grade stands as normal
- No further oversight
- No permanent record

### If Decision is REJECTED:
- Score becomes ZERO
- Flagged in transcript (temporarily)
- Appeals process available
- Disciplinary review (per policy)

---

## 🚀 Implementation Checklist

✅ Identity verification (selfie + ID)  
✅ Continuous face tracking  
✅ Multiple face detection (auto-flag)  
✅ Phone detection (visual AI)  
✅ Gaze tracking (where eyes looking)  
✅ Lip movement detection (talking)  
✅ Tab switch logging  
✅ DevTools blocking  
✅ Copy-paste prevention  
✅ Fullscreen enforcement  
✅ Question randomization  
✅ Per-question timing (optional)  
✅ Session recording  
✅ Snapshot capture on violations  
✅ Real-time risk scoring  
✅ Auto-flagging at 85+  
✅ Admin review dashboard  
✅ Evidence presentation  
✅ Decision recording  
✅ Audit trail  

---

## 🎓 Final Reality Check

### What This PREVENTS:
- Proxy test-takers (identity verification)
- Outside help (face + no other people)
- Online cheating (DevTools blocked, tab switching logged)
- Phone usage (visual detection)
- Copy-pasting answers (blocked)
- Leaving exam for resources (tab detection)
- Collaboration (question randomization)

### What This CANNOT Prevent:
- Memorized answers (if studied)
- Knowing the material (legitimate knowledge)
- Tutoring before exam (we don't monitor past)
- Natural nervousness (gaze deviation normal)

### The Philosophy:
**Make cheating risky enough that honest test is easier.**

---

*Complete Anti-Cheating System*  
*April 12, 2026*  
*Production Ready*
