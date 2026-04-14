# STRICT PHONE DETECTION - OPTIMIZED FOR BRIEF EXPOSURE ✅

## System Architecture

### Frontend Components
```
useStrictPhoneDetection (OPTIMIZED HOOK)
    ↓
ExamMonitoringPage
    ↓
  - Initializes when exam starts
  - Captures frame EVERY 1 SECOND
  - Sends to /api/detect/phone
  - 20% confidence threshold (catches partial phones)
  - Requires only 2 consecutive frames
  - Triggers auto-submit on confirmation
  - Records event to /api/sessions/{id}/events
```

### Backend Flow
```
POST /api/detect/phone
    ↓
detectPhoneYOLO() (Node.js spawns Python)
    ↓
yoloPhoneDetection.py (YOLO best.pt model)
    ↓
Returns: {
  detected: boolean,
  confidence: 0-1 (0-100%),
  count: number,
  boxes: [{x, y, width, height, confidence}],
  suspicious: [],
  model: "best.pt"
}
```

## Detection Configuration (ULTRA-STRICT FOR BRIEF EXPOSURE)

| Parameter | Value | Purpose |
|-----------|-------|---------|
| **Check Interval** | Every 1 second | Doesn't miss brief exposures |
| **Confidence Threshold** | 20% (0.20) | ULTRA-STRICT: catches partial/half phones |
| **Consecutive Frames** | 2 (not 3) | Catches 1-2 second exposure |
| **Confirmation Time** | ~2 seconds | Fast enough before student hides phone |
| **Auto-submit** | Immediate | Zero tolerance |

### Why This Works
- Student shows phone for 1-2 seconds → CAUGHT
- Student only shows half a phone → CAUGHT  
- Student shows corner/edge of phone → CAUGHT
- **Student CAN'T hide phone in time before confirmation!**

## Why Previous 30-Second Version FAILED

❌ **Old Detection Every 30 Seconds**
- Student shows phone for 5 seconds at 0:15
- Next check happens at 0:30 = MISSES COMPLETELY!
- Student had 15+ seconds to hide before detection
- Also required 3 frames = too many chances to escape

✅ **NEW Ultra-Strict System**
- Checks EVERY 1 SECOND (no escape window)
- 20% confidence (catches partial/half phones)
- Only needs 2 frames (~2 seconds confirmation)
- Student can't hide phone before system confirms!

## Testing Checklist

### ✅ Backend Setup
- [ ] Backend running: `npm run dev` in `backend/` folder
- [ ] Python environment activated
- [ ] YOLO model loaded (best.pt)
- [ ] Detection route `/api/detect/phone` accessible

### ✅ Frontend Integration
- [ ] Frontend renders without errors
- [ ] useStrictPhoneDetection hook imported
- [ ] Phone detection hook initialized
- [ ] Callback function defined
- [ ] Malpractice overlay displays phone violation

### ✅ Detection Functionality
1. **Start Exam**
   - Navigate to exam page
   - Video feed should appear
   - Phone detection should start after exam begins

2. **Test 1: Quick Phone Flash (1 second)**
   - Start exam
   - Quickly show phone for just 1-2 seconds
   - SHOULD BE CAUGHT - won't have time to hide!
   - See in console: "📱 Phone detection [1/2]", "[2/2]"
   - Then: "🚨🚨🚨 PHONE CONFIRMED DETECTED!"

3. **Test 2: Half Phone (Partial Exposure)**
   - Show only half of phone to camera
   - Should still detect with 20% confidence
   - 2 consecutive frames = auto-submit
   
4. **Test 3: Phone Edge/Corner**
   - Show just corner edge of phone visible
   - Should detect even partial visibility
   - Confirms ultra-strict detection

3. **Test False Positive Prevention**
   - Hold object that doesn't look like phone
   - Should NOT trigger detection
   - Detection buffer should reset

4. **Test Event Logging**
   - Phone detection event should be recorded to backend
   - Session should have event type: `phone_detected`
   - Event should have: confidence, consecutiveFrames, timestamp

### ✅ Auto-Submit Verification
- [ ] Exam form closes
- [ ] Results page shows exam submitted
- [ ] Risk score shows as critical
- [ ] Malpractice flag recorded
- [ ] Event audit trail complete

## Debug Commands

### Check if YOLO model works:
```bash
cd backend
python src/services/yoloPhoneDetection.py --help
```

### Test detection with image file:
```bash
python src/services/yoloPhoneDetection.py --file path/to/image.jpg
```

### Monitor backend logs:
```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Watch for phone detection logs
# Look for: "📱 Detecting phone in image"
# Look for: "✅ PHONE DETECTED!"
```

### Enable Debug Images
The system saves debug images to: `.debug/captured_images/`
- Check these to verify what YOLO is "seeing"
- Helps diagnose detection accuracy

## Features

✅ **Zero Tolerance**
- Any phone detection = immediate auto-submit
- No warnings, no scoring gradients
- Instantaneous response

✅ **Temporal Validation**
- 3 consecutive frames required
- Prevents single-frame false positives
- 6-second confirmation window

✅ **Complete Audit Trail**
- Front-end events logged
- Back-end detection results stored
- Confidence scores recorded
- Debug images captured (if needed)

✅ **User Feedback**
- Clear malpractice modal
- Specific violation type: "📱 Phone Device Detected"
- Exam auto-submitted notification
- Results page shows detection flag

## Potential Issues & Solutions

| Issue | Solution |
|-------|----------|
| Model not found | Check if best.pt exists in backend folder; download if missing |
| Detection too sensitive | Increase threshold in hook (currently 0.25) |
| Detection misses phones | Lower threshold or check YOLO model accuracy |
| False positives on objects | Add more consecutive frame validation |
| Performance lag | Increase check interval (currently 2 seconds) |

## Next Steps After Verification

1. Deploy to production server
2. Monitor first week for false positives/negatives
3. Adjust confidence threshold if needed
4. Review captured debug images for accuracy
5. Gather feedback from proctors

---

**Status**: ✅ READY FOR TESTING
**Last Updated**: April 13, 2026
**Implementation**: From Scratch - Zero Tolerance Phone Detection
