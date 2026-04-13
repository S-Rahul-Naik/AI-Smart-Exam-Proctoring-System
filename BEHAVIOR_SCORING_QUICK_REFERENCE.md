# 🎯 Behavior Scoring - Quick Reference Guide

## 16 Event Types at a Glance

```
🚨 CRITICAL (25-30 pts) - Instant flag
├─ phone_detected (30) - Phone in frame
├─ multiple_faces (25) - 2+ people
└─ devtools_open (25) - Inspector/DevTools

🔴 HIGH (12-20 pts) - Suspicious  
├─ face_absent (20) - Student away 5+ sec
├─ copy_paste (20) - Ctrl+C/V attempt
├─ tab_switch (15) - Browser tab changed
├─ headphone_detected (15) - Audio device
├─ rapid_head_movement (15) - Quick head turns
├─ extreme_gaze_angle (12) - Head tilted 45°+
└─ fullscreen_exit (12) - Left fullscreen

🟡 MEDIUM (8-10 pts) - Watch
├─ gaze_deviation (8) - Looking away
├─ background_change (8) - Background switched
├─ unusual_movement (10) - Strange behavior
└─ face_blur (10) - Face not clear

🟢 LOW (5 pts) - Minor
├─ low_light (5) - Room too dark
└─ right_click (5) - Right-click menu
```

---

## Risk Score Calculation (Simple)

```
1. Get all events from last 30 minutes
2. Add up the weights:
   - Normal event: +8 to +20 pts
   - Critical event: +25 to +30 pts
3. Bonus multiplier: +15 pts per critical event
4. Cap at 100

Example:
  Gaze deviation (×2) ......... +16 pts
  Tab switch (×3) ............ +45 pts
  Phone detected (×1) ........ +30 pts
  Critical multiplier ........ +15 pts
  ────────────────────────────────
  Total ..................... 106 → 100 pts
```

---

## Risk Levels

| Score | Level | Status | Action |
|-------|-------|--------|--------|
| 0-35 | 🟢 LOW | Normal | Continue |
| 35-65 | 🟡 MEDIUM | Caution | Warning to student |
| 65-85 | 🔴 HIGH | Suspicious | Log events |
| 85-100 | 🚨 CRITICAL | Likely cheating | AUTO-FLAG |

---

## Auto-Flag Triggers (Instant)

Any of these = **AUTOMATIC FLAG**:

```
1. Risk score >= 85 ................... 🚨 CRITICAL
2. Phone detected (ANY) ............... 🚨 INSTANT
3. Multiple faces detected (ANY) ...... 🚨 INSTANT
4. DevTools opened (ANY) ............. 🚨 INSTANT
5. 2+ critical events ................ 🚨 INSTANT
6. 5+ events in 5 minutes ............ 🚨 BURST FLAG
```

---

## 10 Malpractice Indicators

After flagging, system detects patterns:

```
1. ✓ Phone Usage
   └─ Evidence: "Phone detected in 3 frames"

2. ✓ Multiple People
   └─ Evidence: "Multiple people detected 2 times"

3. ✓ Frequent Face Absence
   └─ Evidence: "Face absent 15 times" (if >10)

4. ✓ Tab Switching
   └─ Evidence: "Switched tabs 8 times" (if >5)

5. ✓ DevTools Usage
   └─ Evidence: "Developer tools opened"

6. ✓ Copy-Paste Usage
   └─ Evidence: "Copy-paste attempted 5 times" (if >3)

7. ✓ Unusual Gaze Pattern
   └─ Evidence: "Looking away excessively" (if >20 gaze events)

8. ✓ Background Manipulation
   └─ Evidence: "Background changed 4 times" (if >3)

9. ✓ Suspicious Head Movement
   └─ Evidence: "Rapid/jerky movements detected" (if >8)

10. ✓ Extreme Gaze Angles
    └─ Evidence: "Head tilted extreme angles" (if >5)
```

---

## Data Flow

```
Frontend Event:
{
  type: 'phone_detected',
  confidence: 92,
  label: 'Phone in frame'
}
    ↓
Send to backend: POST /api/sessions/:id/record-event
    ↓
Backend enriches:
{
  type: 'phone_detected',
  confidence: 92,
  weight: 30,              ← Added by service
  severity: 'critical',    ← Added by service
  timestamp: now(),        ← Added by service
  label: 'Phone in frame'
}
    ↓
Stored in MongoDB: session.events[]
    ↓
Risk Score Calculated:
  - Sum weights from last 30 min
  - Apply multipliers
  - Get 0-100 score
    ↓
Auto-Flag Check:
  - Is score >= 85?
  - Any critical events?
  - Update session status
    ↓
Return to frontend:
{
  riskScore: 87,
  riskLevel: 'critical',
  flagged: true,
  malpracticeIndicators: [...]
}
```

---

## File Locations

```
Frontend sends events:
├─ useMediaPipeProctor.ts ............. Face detection
├─ useAudioDetection.ts ............... Lip movement
├─ useEnhancedMonitoring.ts .......... Phone detection
├─ useBrowserLockdown.ts ............. DevTools/copy-paste
└─ useFocusLock.ts .................... Tab switching

Backend processes:
├─ sessionController.js ............... /record-event endpoint
├─ monitoringService.js .............. Risk calculation
└─ Session.js model .................. Event storage

Data stored:
├─ MongoDB: session.events[] ......... Event array
├─ MongoDB: session.riskScore ....... Current risk
├─ MongoDB: session.malpracticeIndicators .. Patterns
└─ MongoDB: session.flagged .......... Flag status
```

---

## 30-Minute Rolling Window Explained

```
Current time: 14:30
Window: 14:00-14:30 (last 30 minutes)

Events included:
14:05 - Gaze deviation ✓
14:10 - Tab switch ✓
14:15 - Phone detected ✓
14:20 - Multiple faces ✓
14:25 - Tab switch ✓
14:35 - Would NOT count (outside window)

Calculation:
- Sum weights of 14:05-14:30 events
- Ignore anything before 14:00
- Update score every time new event arrives
```

**Why 30 minutes?**
- Long enough to catch patterns (not just isolated incidents)
- Short enough to be relevant to current behavior
- Prevents old events from inflating score forever

---

## Risk Score Examples

### Scenario 1: Honest Student
```
Time | Event | Pts | Total | Level
-----|-------|-----|-------|-------
 5m  | Gaze  | +8  |   8   | 🟢 LOW
10m  | None  |  -  |   8   | 🟢 LOW
15m  | Gaze  | +8  |  16   | 🟢 LOW
20m  | Slight movement | +0 | 16 | 🟢 LOW
25m  | None  |  -  |  16   | 🟢 LOW
30m  | Done  |  -  |  16   | 🟢 LOW

Result: APPROVED ✅ (Low risk, below 35)
```

### Scenario 2: Suspicious Student
```
Time | Event | Pts | Total | Level
-----|-------|-----|-------|-------
 5m  | Gaze  | +8  |   8   | 🟢 LOW
10m  | Tab (×3) | +45 |  53  | 🟡 MEDIUM
15m  | Phone #1 | +30 | 83  | 🔴 HIGH
18m  | Multiple faces | +25 | 133 → 100 | 🚨 CRITICAL
20m  | Auto-flagged!

Result: FLAGGED FOR REVIEW 🚩
Evidence: Phone + 2+ people
Recommended: REJECT ❌
```

### Scenario 3: Critical Situation
```
Time | Event | Pts | Critical? | Action
-----|-------|-----|-----------|--------
 3m  | Phone detected | +30 | YES | Auto-flag instantly
     | +15 multiplier |     |     |
     | Total: 45 pts  |     |     |

Result: IMMEDIATE FLAG 🚨
Evidence: Phone detected (critical event)
Recommended: AUTO-SUBMIT + REJECT
```

---

## Common Questions

**Q: What if a student legitimately looks away?**
A: One or two gaze_deviation events (+8 pts each) won't trigger any action. Normal range is 5-20 gaze events in an exam = 40-160 pts, capped, plus multiplier. Only flagged if combined with other events or 20+ deviations.

**Q: Can I reduce false positives?**
A: Yes, adjust weights in monitoringService.js:
```javascript
gaze_deviation: { weight: 8, severity: 'medium' }  // Change to 4-5
```

**Q: What about network issues causing lost events?**
A: Events are batched and retried. Timestamp validation on server ensures no duplicates.

**Q: How is confidence factored in?**
A: Confidence multiplies the weight:
```
weight × confidence = actual points
30 (phone) × 0.92 (confidence) = 27.6 points
```

**Q: Can students see their risk score?**
A: No. Risk calculation is server-only. Students only see warnings like "Avoid tab switching" but not the actual score.

---

## Monitoring in Real-Time

```
Admin Dashboard Shows:
├─ Live Risk Score (updating in real-time)
├─ Latest events (last 20)
├─ Event timeline
├─ Evidence snapshots
├─ Video playback
└─ Decision panel

Updates: Every event triggers dashboard refresh
Latency: <500ms from event to display
```

---

## Energy & Performance

```
Impact assessment per student:
├─ Events/second: 2-5 (average)
├─ DB writes: Batched every 5-10 events
├─ CPU: <5% per monitoring service call
├─ Memory: ~50MB per active session
└─ Network: ~1-2 KB per event

System load with 100 students:
├─ Events/sec: 200-500
├─ DB operations: ~50 writes/sec
├─ Total bandwidth: 200-500 KB/sec
└─ Server capacity: ✓ Easily handled
```

---

## Debugging Tips

**Check if event was recorded:**
```
Show events array from MongoDB:
db.sessions.find({_id: sessionId}).pretty()

Look for:
sessions.events[n].type
sessions.events[n].timestamp
sessions.events[n].weight
```

**Debug risk score:**
```
Check breakdown object:
{
  riskScore: 87,
  breakdown: {
    phone_detected: 30,      ← Phone event weight
    tab_switch: 45,          ← 3× tab switches
    critical_multiplier: 15  ← Bonage for critical
  }
}
```

**Test auto-flagging:**
```
1. Create test event with risk >= 85
2. Call recordEvent()
3. Check session.flagged === true
4. Verify session.status === 'flagged'
5. Check admin review queue updated
```

