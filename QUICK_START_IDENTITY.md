# Identity Verification - Quick Start for Admins

## What's New?

Three layers of facial identity verification have been added to prevent proxy test-taking and ensure exam integrity:

### 1. **Exam Start Verification** (Mandatory)
Students must verify their identity with a webcam capture before starting the exam.
- **When**: Immediately after clicking "Start Exam"
- **How it works**: Camera captures face, compares with enrollment photo
- **Requirement**: Match ≥ 70% confidence
- **Retries**: 3 attempts allowed, then requires admin bypass

### 2. **Continuous Face Matching** (During Exam)
System periodically checks if the same person remains on camera throughout the exam.
- **When**: Every 30 seconds during exam
- **How it works**: Captures frame, compares with enrollment photo
- **Flags**: Records all mismatches for review

### 3. **Multiple Face Detection** (Continuous)
System automatically detects if multiple people appear in the same frame.
- **When**: During continuous monitoring (every 30 seconds)
- **Flag**: "Multiple faces detected" = immediate critical alert

---

## For Admins: Session Review Interface

### Accessing Flagged Sessions
```
1. Go to Admin Dashboard
2. Navigate to "Sessions" > "Flagged for Review"
3. Look for sessions with these flags:
   - "exam_start_verification_exceeded"
   - "face_swap_suspected"
   - "multiple_faces_detected"
   - "face_absent_prolonged"
```

### Understanding Session Flags

| Flag | Meaning | Action |
|------|---------|--------|
| **Max Attempts Exceeded** | Student failed verification 3x | Manual review: View comparison photos |
| **Face Swap Suspected** | 2+ consecutive face mismatches | High suspicion: Proxy test-taker likely |
| **Multiple Faces** | More than 1 person in frame | CRITICAL: Definite violation |
| **Face Absent** | No face detected during exam | Exam continuation blocked |

### Reviewing a Flagged Session

```
Session Details:
┌────────────────────────────────────┐
│ Session ID: 60a5c4b9f1c2d3e4f5g    │
│ Student: John Doe                  │
│ Exam: Data Structures              │
│ Date: Jan 15, 2024                 │
│                                    │
│ FACE VERIFICATION DETAILS          │
│                                    │
│ Exam Start Results:                │
│ • Attempt 1: 42% - Failed ❌       │
│ • Attempt 2: 38% - Failed ❌       │
│ • Attempt 3: 45% - Failed ❌       │
│ • Final: Admin bypass allowed      │
│                                    │
│ Continuous Monitoring:             │
│ • Check @ 5 min: 85% - Pass ✅    │
│ • Check @ 10 min: 38% - Fail ❌   │
│ • Check @ 15 min: 42% - Fail ❌   │
│ • Risk Score: 65/100 (Yellow)     │
│                                    │
│ RECOMMENDATION:                    │
│ Manual review recommended.          │
│ Multiple factors suggest proxy.    │
│ Consider invalidating or re-exam.  │
│                                    │
│ [View Photos] [Approve] [Reject]   │
└────────────────────────────────────┘
```

### Decision Options

**[Approve]** ← Click if:
- Exam result looks legitimate
- Face verification shows reasonable scores
- Extended time wasn't needed for other reasons
- Student has good history

**[Reject]** ← Click if:
- Multiple faces detected
- Consistent face mismatches
- Student not present
- Verification max retries with low scores

**[Request Retest]** ← Click if:
- Uncertain but want more data
- Student has technical issues documented
- Exam needs rerun under supervision

---

## Admin Bypass

### When to Use
- Technical issues (webcam not working)
- False positive (student looks different that day)
- System error (ArcFace service down)
- Accessibility needs

### How to Enable
```
During exam:
1. Student on verification overlay (stuck)
2. Accept their bypass request or:
3. Admin logs in to exam system
4. Navigate to session
5. Click "Override Verification"
6. Student gets bypass, exam starts
7. System logs your action + reason
```

### Impact
- Session gets flagged: "admin_bypass_used"
- You must approve/reject manually later
- Audit trail shows who bypassed and why
- Student can still be flagged after exam completion

---

## Dashboard Statistics

### Key Metrics to Monitor

**Verification Success Rate**
```
Total Exams: 450
Passed Start Verification: 425 (94%)
Failed Start Verification: 25 (6%)
Admin Bypasses Used: 10 (2%)

Trend: Should be 93-97% success, <2% bypass
Alert if: <90% success or >5% bypasses
```

**Face Match Quality**
```
Average Match Score: 84.5%
Low Scores (<60%): 8 exams
Very Low Scores (<40%): 1 exam
Zero Face Detections: 0

Trend: Track suspicious patterns
Alert if: Average drops below 80%
```

**Suspicious Sessions**
```
This Month:
• Multiple faces detected: 3
• Face swaps suspected: 2
• Face absent prolonged: 0
• Require manual review: 5

Rate: 1-2% is normal
Alert if: >5% of exams flagged
```

---

## Common Scenarios

### Scenario 1: Low Initial Scores (42%, 38%, etc.)

**Why it happens**:
- Poor lighting in room
- Webcam angled wrong
- Student wearing different glasses/makeup
- Student nervous and not centered in frame

**What to do**:
1. Look at enrollment photo quality
2. Compare with exam start attempts
3. If ALL attempts have low scores + admin bypass used:
   - Likely legitimate - different conditions
   - Check exam score quality
   - Look at continuous checks during exam
4. If continuous checks show high scores later:
   - Confirms it was just technical difficulty at start
   - APPROVE the session

**Concern if**:
- Low scores at start + low scores throughout = possible proxy
- Different person possibly taken exam

---

### Scenario 2: Face Match Success at Start, Then Failure Later

**Why it happens**:
- Someone else took over exam
- Different person relayed to original student
- Student stepping away (face absent)
- Lighting changed significantly

**What to do**:
1. Check timestamp of mismatch vs. exam time
2. If @ 30 min mark: Most of exam already done by real student
3. Check question patterns:
   - If answers change completely after mismatch time = suspicious
   - If answers similar quality = technical glitch
4. Look at continuous events log:
   - One mismatch = probably shifted in chair
   - Multiple consecutive mismatches = proxy likely

**Concern if**:
- Face swap detected + score improvement after = substitution
- Different answers before/after = another person took over

---

### Scenario 3: Multiple Faces Detected

**Why it happens**:
- Sibling/family member in background
- Roommate walked past
- Deliberate proxy setup

**What to do**:
1. Check timestamp
2. If brief (30 sec): Probably accidental
   - View snapshot if available
   - Multiple faces entered/left quickly = accident
   - APPROVE after visual confirmation
3. If sustained (>2 minutes): Deliberate
   - Multiple faces stayed in frame
   - Likely collaborative cheating
   - Check exam answers for collaboration patterns
   - REJECT and investigate

**Concern if**:
- Multiple faces with multiple different people = obvious violation
- One person remained centered = substitution

---

### Scenario 4: Face Absent Detected

**Why it happens**:
- Student stepped away (allowed with monitor)
- Webcam blocked
- Student lying down or looking away
- Screen share to another device

**What to do**:
1. Check duration:
   - < 5 sec: Probably shifted position
   - 10-30 sec: Brief break or adjustment
   - > 30 sec: Definite absence
2. Check frequency:
   - Single event: Probably technical
   - Multiple events: Pattern of step-away
3. Check if correlates with:
   - Exam submissions time
   - External monitor detection
   - Phone detection events

**Concern if**:
- Frequent, prolonged absences = unsupervised exam
- Correlates with external help indicators

---

## Quick Decision Tree

```
Session Flagged for Review
│
├─ Multiple Faces Detected?
│  YES → REJECT (Clear violation)
│  NO  → Continue
│
├─ Max Attempts at Start?
│  YES → Check continuous scores
│        │
│        ├─ High scores during exam (75%+)
│        │  APPROVE (Technical start issue)
│        │
│        └─ Low scores during exam (<50%)
│           REJECT (Likely proxy)
│  NO  → Continue
│
├─ Face Swap Suspected (2+ mismatches)?
│  YES → Check answer quality before/after
│        │
│        ├─ Answers stay consistent
│        │  APPROVE (Technical glitch)
│        │
│        └─ Answers change dramatically
│           REJECT (Substitution)
│  NO  → Continue
│
├─ Face Absent Events?
│  YES → Check duration & frequency
│        │
│        ├─ Rare (<2 events)
│        │  APPROVE (Normal)
│        │
│        └─ Frequent (>5 events)
│           REQUEST RETEST (Suspicious)
│  NO  → Continue
│
└─ Score Valid? Risk < 50%?
   YES → APPROVE (Exam looks legitimate)
   NO  → REJECT (Too many concerns)
```

---

## Reporting

### Monthly Admin Report

```
IDENTITY VERIFICATION MONTHLY SUMMARY
Month: January 2024

EXAMS PROCESSED:
• Total exams: 450
• Flagged for review: 18 (4%)
• Approved: 15 (3%)
• Rejected: 3 (1%)

VERIFICATION STATS:
• Start verification pass rate: 94%
• Average face match score: 84.5%
• Multiple faces incidents: 3
• Face swap incidents: 2
• Admin bypasses: 10

SECURITY IMPACT:
• Potential proxy attempts detected: 3
• Prevented cheating opportunities: 5+
• System uptime: 99.8%
• False positive rate: 1.2%

RECOMMENDATIONS:
• Consider: Improve webcam setup guides
• Monitor: Low match score trend
• Review: Bypass usage patterns
```

---

## Troubleshooting

### Issue: Students Failing Verification Legitimately

**Symptoms**:
- >10% of students fail verification
- All have low initial scores
- But continuous checks show high scores

**Causes**:
- Poor webcam setup in testing center
- Lighting issues
- Students nervous at start

**Solution**:
1. Improve room lighting
2. Provide setup guide with images
3. Allow practice verification before real exam
4. Consider increasing initial threshold from 70% to 75%

---

### Issue: False Positives (Multiple Faces)

**Symptoms**:
- System flags multiple faces
- But review shows only one person
- Student in home study environment

**Causes**:
- Reflection in glass/mirror
- Poster/photo on wall behind
- Pet or stuffed animal in frame

**Solution**:
1. Request students clear background
2. Provide background guidelines
3. Consider requesting "clean" background
4. Review snapshots before approving rejection

---

### Issue: ArcFace Service Timing Out

**Symptoms**:
- Verification requests timeout
- Students get "Comparison Failed" error
- System logs show ArcFace delays

**Causes**:
- High load on ArcFace server
- Network latency
- Server maintenance

**Solution**:
1. Check ArcFace service status
2. May need to increase timeout from 5s to 10s
3. Consider read-replica for load balancing
4. Schedule maintenance during low-traffic times

---

## Support & Escalation

### Who to Contact

**Technical Issues**:
- Exam system down / webcam errors
- ArcFace service problems
- Database errors
→ Contact: IT Support Team

**False Positives / Algorithm Questions**:
- "Should this student be rejected?"
- "Why did face match fail?"
- Confidence threshold questions
→ Contact: QA/Product Lead

**Security / Serious Concerns**:
- Multiple violation patterns
- Organized cheating suspected
- Exam integrity concerns
→ Contact: Academic Integrity Office

### Escalation Path

```
Reject Decision
    ↓
Student Appeals
    ↓
Session Re-Review by Different Admin
    ↓
Requires Camera Retake Exam?
    ↓
Director Approval if Exam Invalidation
```

---

## Best Practices

### ✅ DO
- Review flagged sessions daily
- Look at both enrollment photo AND exam start photo
- Check timestamps to understand context
- Document your decisions with notes
- Look for patterns across students

### ❌ DON'T
- Approve reject without looking at evidence
- Ignore multiple flags in same session
- Assume all failures are malicious
- Bypass verification without logging reason
- Store face images longer than needed

---

## Key Thresholds

| Item | Threshold | Alert |
|------|-----------|-------|
| Face Match Score | ≥70% pass | <50% = review |
| Multiple Faces | 0 = pass | Any =  critical |
| Face Absent Duration | <30s = ok | >60s = flag |
| Risk Score | <50 = safe | >75 = review |
| Consecutive Mismatches | <2 = ok | ≥2 = suspicious |
| Start Attempts | ≤2 = normal | 3 = review |

---

## Contact & Feedback

**Questions about this feature?**
- Email: proctor-support@university.edu
- Slack: #exam-integrity-team
- Jira: Create issue with "face-verification" label

**Provide feedback:**
- What worked well?
- What needs improvement?
- False positive / negative rates?
→ Reply to: feature-feedback@university.edu

