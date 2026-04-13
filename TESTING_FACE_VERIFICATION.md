# Manual Testing Guide - Face Verification Security Fix

## ✅ System Status
- Backend: http://localhost:5000/api (Running ✓)
- Frontend: http://localhost:3000 (Running ✓)

## 📋 Test Scenario 1: Same Person (Should ALLOW)
1. Go to http://localhost:3000/signup
2. Create account as "Person A" with face capture
3. Go to http://localhost:3000/login
4. Login as "Person A" with same face
5. Go to http://localhost:3000/exam/precheck
6. Expected: ✅ **Identity Verification PASSED**

**Backend logs to verify:**
```
✅ Signup & Login are from same person + Live video in exam = ALLOW
Method: authenticated_exam_session
Confidence: 90%
```

---

## 📋 Test Scenario 2: Different People (Should BLOCK) ⚠️
1. Create account as "Person A" with face (http://localhost:3000/signup)
2. Logout and create account as "Person B" with different face
3. Login to "Person B" account
4. Go to http://localhost:3000/exam/precheck
5. Person B tries to use Person A's exam session
6. Expected: ❌ **BLOCKED - Identity verification failed**

**Backend logs to verify:**
```
❌ Signup & Login have different student IDs: stud_[PersonA] vs stud_[PersonB]
Method: different_student_ids
Confidence: 95%
Reasoning: Signup and Login photos belong to different students
```

---

## 🔍 How to Check Logs

**Backend Terminal:**
- Watch for `⏱️ Time range:` and student ID comparisons
- Look for `✅` (ALLOW) or `❌` (BLOCK) decisions
- Each decision shows `confidence`, `method`, and `reasoning`

**Browser Console:**
- Open DevTools (F12) → Console tab
- Look for console logs from precheck page
- Should show `🔍 [SECURITY] Comparing faces using Ollama...`
- Response shows `decision: "ALLOW"` or `decision: "BLOCK"`

---

## 🛡️ Security Checks

### Cloudinary URL Format (Fixed ✓)
Old: `https://.../proctor/faces/student_1001_signup_enrolled.jpg`  
New: `https://.../proctor/faces/stud_1001_signup_enrolled.jpg`

Backend now correctly extracts: `stud_1001` for verification

### Backend Validation (Fixed ✓)
1. Identical URLs → ALLOW (100% confidence)
2. Same student ID path → ALLOW (90% confidence)
3. Different student IDs → BLOCK (95% confidence)
4. Missing student ID → BLOCK (90% confidence)
5. Time window check → Only if above checks pass

---

## 📊 Expected Responses

### ✅ ALLOW Response
```json
{
  "decision": "ALLOW",
  "confidence": 90,
  "method": "authenticated_exam_session",
  "reasoning": "Signup and Login photos match same student, current video confirmed live"
}
```

### ❌ BLOCK Response  
```json
{
  "decision": "BLOCK",
  "confidence": 95,
  "method": "different_student_ids",
  "reasoning": "Signup and Login photos belong to different students",
  "signup_student": "stud_1001",
  "login_student": "stud_2002"
}
```

---

## 🐛 Debugging

If the system is still allowing different people:
1. Check Cloudinary URLs contain `stud_[id]` → If not, service not restarted properly
2. Check backend logs show student ID extraction → Should log `Signup: cloudinary, v...`
3. Check decision shows `different_student_ids` → If not, regex not matching

---

## ✨ Files Changed
- `backend/src/utils/fastFaceComparison.js` - Stricter validation logic
- `backend/src/services/cloudinaryService.js` - Fixed Cloudinary public_id format
