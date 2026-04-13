# ArcFace Integration - Setup & Testing Guide

## 🚀 Installation Status

**Backend Dependencies:**
- ✅ DeepFace installed
- ✅ TensorFlow installed (for ArcFace model)
- ✅ OpenCV installed

**Model Download:**
- Model will be downloaded automatically on first API call
- Location: `~/.deepface/weights/` (user home directory)
- Size: ~500MB (one-time download)
- Speed: <2GB bandwidth

## 🔧 Backend Endpoints

### Endpoint: `/api/verify/compare-faces-arcface`

**Request:**
```json
{
  "signupPhotoUrl": "https://res.cloudinary.com/.../stud_1001_signup_enrolled.jpg",
  "loginPhotoUrl": "https://res.cloudinary.com/.../stud_1001_login_verified.jpg",
  "currentPhotoBase64": "data:image/jpeg;base64,/9j/4AA..."
}
```

**Response (ALLOW):**
```json
{
  "decision": "ALLOW",
  "confidence": 85,
  "matches": 3,
  "match_1_2": true,
  "match_2_3": true,
  "match_1_3": true,
  "distance_1_2": 0.234,
  "distance_2_3": 0.189,
  "distance_1_3": 0.267,
  "reasoning": "3/3 face comparisons match - same person verified",
  "method": "arcface_multi_match",
  "timestamp": "2026-04-11T10:30:00.000Z"
}
```

**Response (BLOCK):**
```json
{
  "decision": "BLOCK",
  "confidence": 90,
  "matches": 1,
  "match_1_2": false,
  "match_2_3": false,
  "match_1_3": true,
  "distance_1_2": 0.687,
  "distance_2_3": 0.723,
  "distance_1_3": 0.234,
  "reasoning": "Only 1/3 face comparisons match - different person detected",
  "method": "arcface_multi_match",
  "timestamp": "2026-04-11T10:30:00.000Z"
}
```

## 🎯 Matching Logic (2/3)

| Matches | Distance | Decision | Confidence |
|---------|----------|----------|------------|
| 3/3 ✅  | <0.35    | ALLOW    | 95%+       |
| 3/3 ✅  | 0.35-0.5 | ALLOW    | 85-90%     |
| 2/3 ✅  | Mixed    | ALLOW    | 70-85%     |
| 1/3 ❌  | Mixed    | BLOCK    | 90%        |
| 0/3 ❌  | >0.6     | BLOCK    | 90%        |

**Why 2/3?** Prevents false negatives:
- One comparison might fail due to lighting or angle
- Two independent matches = high confidence same person
- Threshold: Average distance per pair

## 📱 Frontend Flow

1. **Face Detection**: Check face visibility + lighting (existing logic)
2. **Best Frame Capture**: Capture 3 seconds of video, select highest quality frame
   - Quality score = brightness + motion analysis
   - Discards blurry frames
   - Keeps centered, well-lit face
3. **Send to Backend**:
   - Signup URL (Cloudinary)
   - Login URL (Cloudinary)
   - Current photo (base64 from webcam)
4. **Handle Response**:
   - 2+ matches = pass precheck
   - <2 matches = block + ask to retry

## ⏱️ Performance

| Operation | Time | Notes |
|-----------|------|-------|
| First call (model download) | 30-60s | One-time, then cached |
| Subsequent calls | 8-15s | 3 face comparisons |
| Frame capture | 3s | Quality scanning |
| Total precheck | 15-20s | First time, 10-15s after |

## 🧪 Testing Checklist

### Setup
- [ ] `pip install deepface opencv-python` completed
- [ ] Backend running: `npm start` in `/backend`
- [ ] Frontend running: `npm run dev` in `/frontend`

### Test 1: Same Person (Should ALLOW) ✅
1. Sign up as "Person A" with face
2. Login as "Person A" with same face
3. Go to precheck
4. Expected: "✅ Identity verified (3/3 matches)"
5. Can continue to rules

### Test 2: Different People (Should BLOCK) ✅
1. Sign up as "Person A"
2. Create new account as "Person B"
3. Login as "Person B"
4. Go to precheck while logged in as B
5. Expected: "🚨 BLOCKED: Identity mismatch (1/3 matches)"
6. Cannot continue

### Test 3: Frame Quality Scoring 📸
1. Go to precheck
2. Check browser console
3. Look for: `📸 [Quality] Captured best frame with quality score: 87/100`
4. Higher scores = better frame quality

### Test 4: First API Call (Model Download) 🤖
1. First call will take 30-60s
2. Backend logs: `🧠 [DeepFace] Comparing faces using ArcFace...`
3. Model downloads to: `~/.deepface/weights/arcface.h5`
4. Subsequent calls: 8-15s

## 🔍 Debug Commands

**Check if DeepFace installed:**
```bash
python -c "from deepface import DeepFace; print('✅ DeepFace ready')"
```

**Test ArcFace model (local only, no URLs):**
```python
from deepface import DeepFace

result = DeepFace.verify("img1.jpg", "img2.jpg", model_name="ArcFace")
print(f"Match: {result['verified']}, Distance: {result['distance']}")
```

**Monitor backend logs for ArcFace:**
```bash
# Look for these patterns in backend output:
# 🧠 [DeepFace] Comparing faces using ArcFace...
# Matches: 3/3
# ✅ [DeepFace] Result: ALLOW (3/3 matches)
```

## ⚠️ Known Limitations

1. **Cloudinary URLs must be public** (no auth required)
   - Check: Visit URL in browser - should load image
   - If 403/401 → DeepFace can't access it

2. **Face visibility critical**
   - Extreme angles → lower accuracy
   - Covered face → BLOCK detection
   - Heavy blur → quality score drops

3. **First call is slow**
   - Model download: 30-60s one-time
   - Server can timeout if waiting (increase timeout to 120s)
   - Recommend: "Running advanced recognition (~30s on first try)"

4. **Lighting matters**
   - Harsh shadows → lower confidence
   - Very bright → washout
   - Ideal: Soft, even lighting

## 🆘 Troubleshooting

**Error: "Face verification failed"**
→ Check Cloudinary URLs are public
→ Check face is clearly visible
→ Check lighting is in decent range

**Error: "Python process failed"**
→ Check pip install completed: `pip list | grep deepface`
→ Check TensorFlow installed: `python -c "import tensorflow"`
→ Backend logs for Python stderr output

**Slow first call (>90s)?**
→ Normal - model is downloading
→ Check internet connection
→ Model size: ~500MB

**Always returns BLOCK?**
→ Check face visibility in webcam precheck
→ Check lighting level in precheck
→ Try from different angle/lighting
→ Quality score should be >60 before verification

## 📊 Expected Console Logs

**Frontend:**
```
📸 [Quality] Scanning for best frame quality...
📸 [Quality] Captured best frame with quality score: 82/100
🧠 [SECURITY] Starting ArcFace face verification...
🧠 [ArcFace] Face comparison result: { decision: 'ALLOW', matches: 3, ... }
   Matches: 3/3
   Distance 1-2 (signup vs login): 0.234
   Distance 2-3 (login vs current): 0.189
   Distance 1-3 (signup vs current): 0.267
```

**Backend:**
```
🧠 [API] Received ArcFace face comparison request
🧠 [DeepFace] Comparing faces using ArcFace model...
✅ [DeepFace] Result: ALLOW (3/3 matches)
```

## 🎉 Success Indicators

✅ Precheck passes with "Identity verified (3/3 matches)"
✅ Console shows quality score 70+
✅ All 3 distances shown (<0.5 for same person)
✅ Frontend shows green checkmark with confidence 85%+
✅ Can proceed to exam rules
