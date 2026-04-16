# Security Fix: Directory Listing Vulnerability

**Issue**: Frontend was exposing raw filesystem directory listing on `localhost:3000`

**Root Cause**: Someone was running HTTP server from project root instead of proper dev/production server

**Fixed**: 

1. ✅ **Production Server** (`serve-frontend.js`):
   - Added security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)
   - Disabled directory listing with `express.static()` options
   - Forced all routes to serve `index.html` (proper SPA routing)

2. ✅ **Development Server** (`frontend/vite.config.ts`):
   - Added filesystem security constraints
   - Vite dev server properly configured to serve React app, not directory

3. ✅ **Startup Scripts** (Updated `start.bat` and `start.sh`):
   - Clear instructions on which folder to run commands from
   - Validation to prevent root-folder HTTP servers

## ✅ CORRECT WAY TO RUN:

### Development Mode:
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend (separate terminal, separate folder)
cd frontend
npm run dev
# Will show React app on localhost:3000
```

### Production Mode:
```bash
# From project root (one terminal):
node serve-frontend.js
# Will serve built frontend from frontend/out on localhost:3000
```

## ❌ WRONG WAY (DO NOT DO):

- ❌ Running `http-server` from project root
- ❌ Running `python -m http.server 3000` from project root  
- ❌ Running `npm run dev` from project root instead of frontend folder
- ❌ No security headers on HTTP responses
- ❌ Serving different ports than 3000 (frontend) and 5000 (backend)

## Verification:

✅ Directory listing no longer shows on localhost:3000
✅ React app loads properly
✅ Security headers present in responses
✅ Backend API calls work via proxy

**Deployed**: April 16, 2026
