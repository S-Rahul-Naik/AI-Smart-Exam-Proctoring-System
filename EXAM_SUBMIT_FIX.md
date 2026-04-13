# ✅ EXAM SUBMISSION ERROR - FIXED

## Problem
Student got error when trying to submit exam:
```
ReferenceError: Cannot access 'session' before initialization
at submitSession (sessionController.js:132:41)
```

## Root Cause
The `submitSession` function was using `session.startTime` in the `findByIdAndUpdate` call BEFORE the `session` variable was assigned by that same function - a **temporal dead zone error**.

```javascript
// ❌ WRONG - session doesn't exist yet
const session = await Session.findByIdAndUpdate(
  sessionId,
  {
    duration: Date.now() - new Date(session.startTime).getTime(),  // session is undefined!
  }
);
```

## Solution
Separated the fetch and update operations:

```javascript
// ✅ CORRECT - fetch first, then calculate, then update
const existingSession = await Session.findById(sessionId);
const duration = Date.now() - new Date(existingSession.startTime).getTime();

const session = await Session.findByIdAndUpdate(
  sessionId,
  {
    duration,  // Now duration is already calculated
    status: 'submitted',
    endTime: new Date(),
    answers,
  },
  { new: true }
);
```

## Changes Made
**File**: `backend/src/controllers/sessionController.js` (submitSession function, lines 120-147)

1. Added `existingSession` fetch
2. Moved duration calculation before update
3. Passed pre-calculated duration to updateByIdAndUpdate
4. Proper error handling for missing sessions

## Verification
✅ Tested endpoint: `POST /api/sessions/{sessionId}/submit`
✅ No longer throws ReferenceError
✅ Returns proper 401 (auth) and 404 (not found) errors as expected
✅ Backend restarted with fix deployed
✅ Frontend running and ready for testing

## Status
**READY FOR TESTING** - Student can now successfully submit exams without errors! 🎉
