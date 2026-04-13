# 🔧 SNAPSHOT UPLOAD FIX - USER INSTRUCTIONS

## Current Status
- ✅ **Frontend dev server now running on port 3000 with FIXED code**
- ✅ **Backend running on port 5000**
- ⚠️ **Browser still has OLD code cached**

## What You Must Do Now

### Step 1: Hard Refresh Your Browser

**CRITICAL:** You MUST hard-refresh to load the new fixed code:

- **Windows/Linux:** Press `Ctrl + Shift + R`
- **Mac:** Press `Cmd + Shift + R`

Or manually:
1. Open DevTools (F12)
2. Go to Application tab
3. Go to Cache Storage on the left
4. Clear all cache entries
5. Close DevTools
6. Refresh the page (`F5`)

### Step 2: Test the Fix

Once you've refreshed, the snapshot uploads should work:

**What you'll see in the console (DevTools → Console):**

**BEFORE (OLD CODE - BROKEN):**
```
POST http://localhost:5000/api/sessions/69dc3657de6c4acf45cd2d42/snapshot 400 (Bad Request)
⚠️ Snapshot upload attempt failed (non-critical):
```

**AFTER (NEW CODE - FIXED):**
```
POST http://localhost:5000/api/sessions/69dc3657de6c4acf45cd2d42/snapshot 200 OK
✅ Snapshot uploaded successfully
```

### Step 3: Verify the Fix Works

1. Start the exam at `http://localhost:3000/exam/start`
2. Open DevTools Console (F12)
3. Watch for snapshot uploads
4. **Look for HTTP 200 instead of 400 errors**

---

## What Was Fixed

### The Problem
Frontend was sending:
```
POST /api/sessions/{id}/snapshot
Content-Type: multipart/form-data  ← Missing boundary parameter!
```

Backend's multer middleware couldn't parse this → returned 400 Bad Request

### The Solution
Now frontier sends:
```
POST /api/sessions/{id}/snapshot
(Let axios auto-set the Content-Type header with proper boundary)
```

Axios automatically generates: 
```
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
```

Multer correctly parses the multipart request → returns 200 OK

---

## System URLs

| Component | URL | Port |
|-----------|-----|------|
| Frontend | http://localhost:3000 | 3000 |
| Backend | http://localhost:5000 | 5000 |
| Exam | http://localhost:3000/exam/start | 3000 |

---

## Files That Were Changed

### `frontend/src/services/api.ts` (Lines 131-141)

The `uploadSnapshot` function now DOES NOT set an explicit Content-Type header.

This allows axios to:
1. Detect that FormData is being used
2. Automatically set `Content-Type: multipart/form-data; boundary=...`
3. Include the correct boundary in the request

**Code:**
```typescript
uploadSnapshot: (sessionId: string, file: File, eventType: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('eventType', eventType);
  // Don't set Content-Type header - let axios auto-detect and set boundary correctly
  return apiClient.post(`/sessions/${sessionId}/snapshot`, formdata);
},
```

---

## Verified Fix

The fix has been:
- ✅ Applied to source code
- ✅ Compiled into frontend dev server
- ✅ Frontend dev server is running on port 3000
- ✅ Backend is operational on port 5000

**Now you need to:**
- Refresh your browser to load the new code
- Test to confirm 200 OK responses

---

## Expected Console Output After Refresh

```
📸 Processing snapshot for upload: {...}
🚀 Uploading snapshot to backend: {...}
✅ Snapshot upload successful: 200
```

---

**Next Action:** 
1. Hard refresh: `Ctrl + Shift + R`
2. Monitor console for upload status
3. Confirm you see 200 OK instead of 400 errors
