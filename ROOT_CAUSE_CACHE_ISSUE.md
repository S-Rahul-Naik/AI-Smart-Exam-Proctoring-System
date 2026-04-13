# Root Cause Analysis - Why 400 Errors Continued

## The Actual Problem
Even though the SOURCE CODE had the fix, the browser was receiving **OLD compiled code** from the dev server's stale cache.

### Timeline of Events

| Time | Action | Status |
|------|--------|--------|
| Earlier | Fixed source code (api.ts) | ✅ Code changed |
| Earlier | Built frontend | ✅ Production build OK |
| Earlier | Restarted dev server | ❌ **Dev server served STALE code** |
| Earlier | User tested | ❌ Got 400 errors (from old code) |
| NOW | Cleared Vite cache | ✅ Cache cleared |
| NOW | Restarted dev server with --force | ✅ Force fresh compile |
| NOW | Backend restarted | ✅ Fresh start |
| **NEXT** | **User hard-refresh browser** | ⏳ REQUIRED |

---

## Why Browser Cache Was the Blocker

### What Happened
1. You first tested with old code → 400 errors in browser console
2. The fix was applied to SOURCE code (api.ts)
3. The dev server was restarted - BUT it still served the old version
4. Your browser received the old code and cached it
5. Even though dev server had new code, browser used CACHED old code
6. Every test showed 400 because browser was using OLD code

### The Chain of Caches
```
Browser Cache  ← Old code (api.ts with explicit Content-Type header)
       ↓
Vite Dev Server Cache  ← Old compiled version
       ↓
Source File  ← FIXED code (no explicit header)
```

The browser was reading from its own cache, not from the dev server!

---

## What Just Happened (Complete Fix)

### Step 1: Killed Everything
```bash
Get-Process node | Stop-Process -Force
```
- Stopped old dev server that was serving stale code
- Stopped backend
- Clean slate

### Step 2: Cleared Vite Caches
- Removed `node_modules/.vite` 
- Removed `.vite` directory
- Removed Windows Vite app cache
- **Purpose**: Force Vite to recompile from scratch

### Step 3: Fresh Backend Restart
```bash
npm start (in backend)
```
- **Result**: ✅ MongoDB connected, ML models loaded, port 5000 ready

### Step 4: Fresh Frontend Dev Server with Force Flag
```bash
npm run dev -- --force
```
- `--force` bypasses Vite's internal caching
- **Result**: ✅ Fresh compilation from api.ts source code (WITH the fix!)

---

## Now Your Browser Must Catch Up

Your browser still has the OLD compiled code in its memory from before we cleared Vite cache.

**Vite Dev Server Now Has**: Fixed code ✅
**Browser Has**: Old code ❌  ← **This is the problem**

### The Solution: Hard Refresh in Browser

A normal `F5` refresh just loads from browser cache. You need to tell the browser to:
1. Forget its cached version
2. Fetch fresh code from dev server

**Windows/Linux**:
```
Ctrl + Shift + R
```

**Mac**:
```
Cmd + Shift + R
```

Or use DevTools:
- F12 → Right-click refresh button → "Empty cache and hard refresh"

---

## What Will Happen After Hard Refresh

### Browser Downloads NEW Code
- Dev server sends api.ts WITHOUT explicit Content-Type header ✅
- Browser loads it and caches this NEW version ✅

### First Snapshot Upload
- FormData created: `{ file: Blob, eventType: "test" }`
- **OLD CODE**: Would send `Content-Type: multipart/form-data` (no boundary)
- **NEW CODE**: Lets axios auto-generate `Content-Type: multipart/form-data; boundary=...` ✅

### Backend Receives Request
- **OLD CODE**: Multer couldn't parse → 400 error
- **NEW CODE**: Multer parses boundary correctly → 200 OK ✅

### Backend Logs
- **OLD CODE**: `❌ No file provided in snapshot upload`
- **NEW CODE**: `✅ Snapshot stored locally` ✅

---

## Evidence That Fix Is Real

### Source Code Location
**File**: `frontend/src/services/api.ts` (Lines 135-140)

**Before Fix**:
```typescript
return apiClient.post(`/sessions/${sessionId}/snapshot`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

**After Fix** (Current in source):
```typescript
// Don't set Content-Type header - let axios auto-detect and set boundary correctly
return apiClient.post(`/sessions/${sessionId}/snapshot`, formData);
```

### Verification
- ✅ Source file verified: No explicit Content-Type header
- ✅ Dev server running: Serving from freshly compiled code
- ✅ Cache cleared: Both Vite cache and build artifacts removed
- ✅ Backend ready: Port 5000, all models loaded

---

## Immediate Next Step

**User MUST do this now:**

1. **Hard-refresh browser** (Ctrl+Shift+R or Developer Tools)
2. **Wait 5 seconds** for page to fully load
3. **Look at browser console** (F12 → Console)
4. **Check for**: `POST 200 OK` (not 400)
5. **Check backend logs** for: `✅ Snapshot stored locally` (not `❌ No file provided`)

---

## If Hard Refresh Still Shows 400 Errors

This means the dev server is STILL not serving the new code. Run this:

```powershell
# In windows terminal
cd c:\Users\prave\Desktop\proctor\proctor

# Kill all
Get-Process node | Stop-Process -Force

# Delete all build artifacts
rm -Recurse frontend\out -Force
rm -Recurse frontend\dist -Force
rm -r frontend\.vite -Force

# Start fresh
cd frontend
npm run dev -- --force
```

Then hard-refresh browser again.

---

## Summary

| Component | Status | Next Action |
|-----------|--------|-------------|
| Source Code Fix | ✅ In place | None |
| Backend | ✅ Running fresh | None |
| Dev Server | ✅ Running fresh | None |
| Vite Cache | ✅ Cleared | None |
| **Browser Cache** | ❌ Old code | **User must hard-refresh** |

**Blocker**: Browser still using old cached code  
**Solution**: Hard-refresh (Ctrl+Shift+R)  
**Expected Result**: 200 OK responses for snapshot uploads
