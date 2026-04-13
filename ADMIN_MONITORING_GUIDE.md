# Admin Quick Start Guide - Exam Monitoring System

## How to Access the System

### Real-Time Monitoring Dashboard
Navigate to: **`/admin/monitoring`**

Features:
- Live view of all active exam sessions
- Risk scores updating in real-time
- Session filtering by risk level (All, High, Medium, Low)
- Student names and exam information
- Quick alert notifications

### Session Review Dashboard
Navigate to: **`/admin/review`**

This is where you review flagged sessions.

---

## Session Review Process

### Step 1: View Sessions Needing Review
1. Go to `/admin/review`
2. See list of all flagged sessions
3. Sessions auto-prioritized by risk score (highest first)
4. Click on any session to open detailed review

### Step 2: Analyze Detailed Evidence

When you open a session, you'll see:

**Risk Assessment Panel** (Left Side)
- Overall risk score (0-100)
- Risk level badge (Low/Medium/High/Critical)
- Auto-flagged indicator with reason
- Total events count

**Malpractice Indicators Panel** (Left Side)
- Each detected violation with severity
- Evidence summary
- Related timestamps

**Event Timeline** (Left Side)
- Chronological list of all events
- Timestamps
- Event types (phone_detected, tab_switch, etc.)
- Last 20 most recent events shown
- Scroll for more

**Evidence Snapshots** (Left Side)
- Gallery of captured images
- Hover to see event type and timestamp
- Download or enlarge as needed

**Performance Data** (Right Sidebar)
- Student's exam score
- Time spent
- Answer patterns

### Step 3: Make Your Decision

**Decision Options** (Right Sidebar):

1. **Approved - No Malpractice**
   - Use if: All indicators have innocent explanations
   - Student behavior appears legitimate
   
2. **Rejected - Malpractice Detected**
   - Use if: Clear evidence of cheating
   - Multiple indicators point to misconduct
   - Phone detected, multiple faces, etc.
   
3. **Pending Review**
   - Use if: Needs more investigation
   - Awaiting additional information
   
4. **Needs Manual Review**
   - Use if: Unsure about automated flags
   - Borderline case that needs senior review

### Step 4: Add Your Notes

In the **Admin Notes** textarea:
- Explain your reasoning
- Reference specific evidence
- Note any context
- Example: "Student was at a noisy library - explain tab switches. No phone evidence. Approved."

### Step 5: Submit Decision

Click **"Submit Review"** button
- Decision is saved in database
- Audit trail records who reviewed and when
- Gets removed from review queue

---

## Common Scenarios

### Scenario 1: Multiple Faces Detected
**Indicator**: "Multiple faces detected: 2 instances"
**Decision**: Usually **REJECT** - This is critical evidence
**Exception**: If you personally observed student and second person was briefly visible (pet, family member)

### Scenario 2: Phone Detected
**Indicator**: "Phone detected in frame: Confidence 89%"
**Decision**: Usually **REJECT** - High confidence phone detection
**Exception**: If it's clearly not a phone (confidence < 50%)

### Scenario 3: Developer Tools Opened
**Indicator**: "DevTools opened: 1 instance"
**Decision**: **REJECT** - Almost certainly cheating attempt
**Exception**: Accidental F12 press only (must be immediate)

### Scenario 4: Gaze Deviation (Looking Away)
**Indicator**: "Gaze detected left: 25 instances"
**Decision**: Usually **APPROVE** - Looking at papers/notes is normal
**Note**: Only concerning if combined with phone/multiple faces

### Scenario 5: Tab Switching
**Indicator**: "Tab switches detected: 7 instances"
**Decision**: **DEPENDS**
- If 7 switches over 3 hours = **APPROVE** (normal)
- If 7 switches in 5 minutes = **REJECT** (suspicious)
- Check timeline for patterns

### Scenario 6: High Risk Score but No Critical Events
**Risk Score**: 75/100, Level: HIGH
**Decision**: **NEEDS MANUAL REVIEW**
**Reason**: Could be accumulation of minor violations

---

## Understanding Risk Scores

### How Risk is Calculated

Each event has a weight:
- **Phone Detected**: 30 points
- **Multiple Faces**: 25 points  
- **DevTools**: 25 points
- **Tab Switch (5+)**: 15 points (cumulative)
- **Face Absent (10+)**: 20 points
- **Copy-Paste (3+)**: 20 points
- **Other events**: 5-15 points

### Risk Scale
- **0-35**: Safe - Probably no cheating
- **35-65**: Medium - Monitor but not definite
- **65-85**: High - Likely cheating
- **85-100**: Critical - Almost certainly cheating

---

## Evidence Types You'll See

### Snapshots
- Automatic camera screenshots
- Taken when suspicious activity detected
- Usually 1-10 per session
- Shows what student or room looks like

### Event Log
- Text record of every detection
- Timestamp of each event
- Type of event
- Confidence level

### Timeline
- Chronological view of events
- Shows patterns over exam duration
- Helpful to identify sustained cheating

---

## Tips for Better Reviews

✓ **Look at the Full Timeline** - Pattern matters more than single events

✓ **Check Timestamps** - If all tab switches happened in first 5 minutes, might be accidental

✓ **Review Performance Data** - Unusually high score + cheating indicators = likely malpractice

✓ **Consider Context** - Some students are naturally nervous (more gaze deviation)

✓ **Trust Critical Events** - Phone detection and multiple faces are almost always valid

✓ **Use Notes** - Document your reasoning for audit purposes

✓ **Be Consistent** - Similar evidence should lead to similar decisions

---

## Keyboard Shortcuts

- **Tab** - Navigate between decision buttons
- **Enter** - Submit review
- **Escape** - Go back to queue (if implemented)

---

## Frequently Asked Questions

**Q: What's a "confidence" score?**
A: How sure the AI is about detection. 95% = very sure. 60% = unsure. Be skeptical below 70%.

**Q: Why are there so many gaze deviations?**
A: Normal during exams - students look at papers, scratch their head, etc. Only bad if combined with other evidence.

**Q: What if I make a mistake?**
A: Decisions are logged. Contact admin/superadmin to review or override.

**Q: How long should reviews take?**
A: 2-5 minutes per session depends on complexity. Critical + obvious cases are quick.

**Q: What if evidence is unclear?**
A: Use "Needs Manual Review" - better to be uncertain than make false accusations.

---

## Escalation Process

**If you're unsure:**
1. Mark as "Needs Manual Review"
2. Add detailed notes explaining uncertainty
3. Senior admin reviews again
4. Second opinion recorded in audit trail

---

## Dashboard Tips

### Filter by Risk Level
- **All**: See everything
- **High**: Risk 65-100 (definitely review these)
- **Medium**: Risk 35-65 (spot check)
- **Low**: Risk 0-35 (rarely an issue)

### Real-Time Updates
- Dashboard refreshes every 3 seconds
- New sessions appear automatically
- Session disappears after you submit review

### Batch Processing
- Review highest risk first
- They're already sorted by risk score
- Typically 5-15 sessions per exam

---

## Important Reminders

⚠️ **These are real humans** - Be fair and document thoroughly

⚠️ **Decisions matter** - Could affect student's entire grade

⚠️ **Audit trail is permanent** - Your notes are recorded forever

⚠️ **Follow policy** - Organization may have specific rules

✓ **When in doubt** - Escalate to manual review

✓ **Document everything** - Notes are your protection

✓ **Be objective** - Use evidence, not intuition

---

## Support Resources

- **Video Guide**: [Coming Soon]
- **Contact Admin**: [admin-email]
- **Report Bug**: [bug-report-form]
- **FAQ**: [knowledge-base]

---

*System Ready for Use - April 12, 2026*
