# Student Experience - Exam Monitoring & Integrity Check

## Before the Exam

### Camera & Mic Setup
Students see:
- "Enabling webcam access..."
- "Please allow camera access in browser popup"
- Live camera preview to test conditions
- Lighting quality indicator (good/poor)
- Face detection confirmation

### Pre-Exam Checklist
✓ Camera working  
✓ Microphone detected  
✓ Lighting sufficient  
✓ No other windows/apps running  
✓ Fullscreen mode ready  

---

## During the Exam

### Real-Time Monitoring (Invisible to Student)

The system continuously monitors:
- **Face Detection** - Ensuring student is visible
- **Gaze Tracking** - Detecting attempts to look away
- **Phone Detection** - Scanning for mobile devices
- **Multiple Faces** - Checking for unauthorized persons
- **Browser Activity** - Tab switches, window loses focus
- **Keyboard Shortcuts** - DevTools, copy/paste attempts
- **Lighting** - Room brightness changes
- **Device Audio** - Audio device changes
- **Performance** - Exam interactions tracked

### Student Notifications

#### 1. Real-Time Toast Alerts (Top of Screen)
When violations occur, student sees brief messages:
- "Gaze detected: looking left"
- "Tab switch detected"
- "Face not visible in frame"
- "Suspicious activity detected"

Appears for ~3 seconds, then disappears.

#### 2. Focus Violation Warnings (Popup Modal)
When critical violations happen:

**Window Lost Focus**
- Title: "Violation Detected"
- Message: "This action has been logged and a webcam snapshot captured"
- Buttons: "Return to Fullscreen" or "Dismiss"
- Shows: Timestamp and risk points added
- Warning: "Repeated violations may result in exam termination"

**Fullscreen Exited**
- Similar popup appears
- Prompts return to fullscreen
- Records evidence snapshot

#### 3. Banner Alerts
- **Fullscreen Required** (top banner if not fullscreen)
  - Message: "Fullscreen mode required for exam integrity"
  - Button: "Enable Fullscreen"
  
- **Last Minute Warning** (when 1 minute left)
  - Message: "Less than 1 minute remaining! Exam will auto-submit when time expires"
  - Persistent alert until submission

#### 4. Time's Up Auto-Submit
- 6-second countdown overlay
- Shows final stats:
  - Answered X/Y questions
  - Risk score: X/100
  - Snapshots captured: X
  - Final risk level
  - Focus violations count
- Auto-redirects to results page

### Student Risk Score Display

**Right Sidebar - AI Detection Panel**

Constantly updating showing:

**Risk Score**: 0/100 (0% → 100% progress bar)
- Color changes: Green → Yellow → Orange → Red
- Updates every 2-5 seconds

**Risk Level Badge**: LOW/MEDIUM/HIGH (color-coded)

**Detection Status Icons**:
- ✓ Face (green checkmark if detected)
- ✓ Gaze (green arrow point direction)
- ✓ Phone (green or red if detected)
- ✓ Focus (green if focused)
- ✓ Locked (green if in fullscreen)

**AI Events (Log)**:
- Shows recent detection events
- Timestamp for each
- Type of event
- Scrollable history

### Student's View of System

```
┌─────────────────────────────────────────────────────────────┐
│ Advanced Algorithms & Data Structures      02:59:18         │
├─────────────────────────────────────────────────────────────┤
│          [Fullscreen reminder banner if                      │
│           not fullscreen]                                    │
│                                                               │
│  [Question]              [AI DETECTION PANEL]                │
│                          Locked ✓                            │
│  Q2 - Multiple Choice    Risk: 15/100 LOW ✓                 │
│                          Gaze: Center ✓                      │
│  What is time            Phone: None ✓                       │
│  complexity of...        Focus: Center ✓                     │
│                          Locked ✓                            │
│  ○ O(V²)                                                     │
│  ○ O(E log V)  [Selected]                                   │
│  ○ O(V + E)                                                  │
│  ○ O(V log E)            AI EVENTS                          │
│                          • Gaze: looking left                │
│  [< Previous] [Next >]   • Gaze: center                      │
│                          • Tab switch detected (!)           │
│                          • Gaze: down                        │
└─────────────────────────────────────────────────────────────┘
```

### What Gets Captured

Every time something suspicious happens:
1. **Screenshot** - Webcam capture is saved
2. **Event Log** - Timestamp and type recorded
3. **Risk Updated** - Points added to score
4. **Evidence Stored** - Could be used in review

### What Happens if Student Violates?

**Minor Violation** (e.g., one gaze deviation)
- Toast notification appears
- Evidence snapshot captures
- Small risk points added
- Student continues exam

**Repeated Violations** (e.g., 5+ tab switches)
- Warning popup
- "May result in automatic termination"
- More evidence collected
- Risk score rises

**Critical Violation** (e.g., phone detected, multiple faces)
- Immediate warning popup
- High-confidence snapshot
- Significant risk points added
- Session flagged for admin review

**Auto-Termination Threshold**
- If risk reaches 95%+
- Exam may auto-submit
- Flagged for manual review
- Student informed

---

## Violation Examples & What Students See

### Example 1: Tom Looks at a Paper on His Desk

**What Happens**:
- Face detected ✓
- Gaze tracked: "down" (5 seconds)
- Event recorded: gaze_deviation

**Student Sees**:
- Toast: "Gaze detected: looking down"
- Risk score: 15 → 17 (small increase)
- Continues exam normally

**Admin Later Sees**:
- Gaze deviation event
- One instance
- Probably innocent explanation
- Could be looking at notes

---

### Example 2: Sarah's Roommate Walks Behind Her

**What Happens**:
- Camera sees 1 face → 2 faces
- Multiple faces event triggered
- Immediate snapshot captured
- Critical event flagged
- Risk score → 75+

**Student Sees**:
- Toast flashes: "Multiple faces detected"
- Popup warning: "This has been logged"
- Risk badge changes to HIGH
- Screenshot captured
- Timestamp shown

**Admin Later Sees**:
- Multiple faces indicator: CRITICAL
- Snapshot showing roommate
- Session auto-flagged
- Likely to be REJECTED

---

### Example 3: Jeff's Phone on Desk

**What Happens**:
- During gaze down, phone visible
- AI phone detection: 87% confidence
- Critical event: phone_detected
- Snapshot: phone clearly visible
- Auto-flagged for review
- Risk score → 90+

**Student Sees**:
- Popup warning: "Phone device detected"
- Toast: "Phone detected in frame"
- Risk badge: CRITICAL
- Message: "Violations logged"
- Continues exam (until submission)

**Admin Later Sees**:
- "Phone detected: 87% confidence"
- Clear snapshot showing phone
- Session auto-flagged
- Evidence is visual/irrefutable
- Likely to be REJECTED

---

### Example 4: Lisa Tab-Switched During Exam

**What Happens**:
- Student clicks different browser tab
- Window blur event detected
- Second time → warning
- Third time → repeated
- Seventh time within 5 minutes
- Auto-flagged (5+ in short period)

**Student Sees**:
- First tab switch: small toast
- Second tab switch: popup warning
- After 5 switches: "May result in termination"
- Risk score rising: 20 → 35 → 50 → 65

**Admin Later Sees**:
- 7x tab_switch events
- Timeline showing all timestamps
- Doesn't look like honest exam
- Likely to be REJECTED

---

### Example 5: Mike Just Nervous (False Positive)

**What Happens**:
- Looking around room (gaze: left, right, down)
- Medium lighting (background change)
- Fidgeting (rapid head movement)
- Risk score: 55 (MEDIUM)
- NOT auto-flagged

**Student Sees**:
- Multiple toasts: "Gaze detected left", etc.
- Risk badge: MEDIUM
- No popup warnings (not critical)
- Continues exam

**Admin Later Sees**:
- Many gaze deviations but no critical events
- No phone/multiple faces/devtools
- Risk score: 55
- Notes: "Nervous student behavior"
- Decision: APPROVED (likely innocent)

---

## After the Exam

### Auto-Submit (When Time Expires)

Student sees:
- Bold countdown: 6, 5, 4, 3, 2, 1
- "Time's Up!" heading
- Final statistics card:
  - Answered: 4/5 questions
  - Risk Score: 62/100
  - Snapshots: 8 captured
  - Final Risk Level: MEDIUM
  
- Session end log:
  - Exam auto-submitted at timer expiry
  - Final risk level: MEDIUM
  - Focus violations: 3
  - Evidence snapshots: 8

- Redirects to Results page

### Manual Submit (Before Time Runs Out)

1. Student clicks "Submit Exam"
2. Confirmation dialog
3. Session submitted to backend
4. System calculates final risk score
5. Auto-flagging logic runs
6. Redirects to Results page

### Results Page Shows

- Exam score
- Submitted status
- "Review pending" notice (if flagged for review)
- Appeal/help links (if applicable)

---

## Privacy & Student Rights

**What Students Know**:
- Real-time AI detection running
- Penalties for violations
- Evidence being collected
- Risk score updating
- Violations being logged

**What Students Don't See**:
- Specific risk point values
- Frame-by-frame analysis
- Detailed admin comments
- Other students' reviews
- Admin identification

**Data Retention**:
- Snapshots stored with exam
- Events logged indefinitely
- Used only for integrity purposes
- Deleted per institution policy

---

## Legal & Policy Notices

**Before Exam, Student Confirms**:
- ✓ "I understand my exam is being monitored"
- ✓ "I understand evidence may be collected"
- ✓ "I accept the monitoring terms"
- ✓ "I'm aware of integrity policies"

**During Exam**:
- Notifications keep students aware
- They know they're being watched
- No secret surveillance

**After Review**:
- If rejected: Student notified with evidence
- If approved: Normal grade recorded
- If appeal: Process available

---

## Common Student Questions

**Q: Why am I seeing "gaze deviation" for normal looking?**
A: System uses landmark-based tracking. Looking at papers/notes registers as deviation. Normal during exams.

**Q: Does the system detect cheating perfectly?**
A: No. Humans review all flagged sessions. Some false positives cleared. AI assists, admins decide.

**Q: Can I just close my eyes to avoid gaze tracking?**
A: Face must stay visible. Closing eyes = face_absent events. Multiple = flagging.

**Q: What if my phone was just sitting there?**
A: Phone detection = auto-flag. During review, admin decides if you knew. Physical evidence matters.

**Q: Can I appeal if I'm rejected?**
A: Yes. Contact your institution's academic integrity office. Evidence is reviewed again.

**Q: Why am I getting so many alerts?**
A: Depends on behavior. Nervous students show more gaze deviations. Multiple factors together = review trigger.

---

## Honest Student's Perspective

**What Honest Students Do**:
✓ Look at exam questions  
✓ Occasionally glance at notes  
✓ Type answers  
✓ Take bathroom break (leaves screen)  
✓ Skip questions  
✓ Review answers  

**What They DON'T See**:
✗ No toast notifications (compliant = quiet)  
✗ Low risk score (stays green/low)  
✗ No warnings  
✗ No snapshots captured  
✗ Exam proceeds normally  

**Result**: APPROVED with no review needed

---

*System designed with fairness in mind - AI assists, humans verify*
