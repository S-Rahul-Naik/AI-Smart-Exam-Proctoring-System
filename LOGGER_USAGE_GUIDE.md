# 🎨 Colored Console Logger - Backend Logging Guide

## Overview

The new colored logger utility (`backend/src/utils/logger.js`) provides beautiful, organized, and easy-to-read console output for all backend operations. This guide explains how to use it throughout the application.

## Features

✅ **Colored Output** - Different colors for different log types  
✅ **Organized Sections** - Visual separators and structure  
✅ **Icons & Emojis** - Quick visual recognition  
✅ **Severity Levels** - Info, Success, Warning, Error, Detection  
✅ **Flexible Data Display** - Native objects, strings, or both  
✅ **Debug Mode** - Environment-aware logging  

---

## Logger Methods

### Basic Logging

#### `logger.info(title, message, details)`
Blue informational messages
```javascript
logger.info('Connection', 'Database connected', { host: 'localhost', port: 27017 });
```

#### `logger.success(title, message, details)`
Green success messages
```javascript
logger.success('Face Match', 'Verification successful - 95% similarity');
```

#### `logger.warn(title, message, details)`
Yellow warning messages
```javascript
logger.warn('Timeout', 'YOLO process exceeded 20 second limit');
```

#### `logger.error(title, message, details)`
Red error messages
```javascript
logger.error('Database Error', 'Connection failed', { code: 'ECONNREFUSED' });
```

---

### Specialized Logging

#### **Phone Detection Alert** `logger.phoneDetected(confidence, count, boxes)`
High-priority detection alert with visual emphasis
```javascript
logger.phoneDetected(76.06, 1, [{x: 99, y: 198, width: 220, height: 41}]);
```
Output:
```
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
 📱 PHONE DETECTED - CRITICAL VIOLATION 
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
   Confidence: 76.06%
   Object Count: 1
   [Box 1] Position: (99, 198) Size: 220x41
```

#### **Face Matching** `logger.faceMatch(action, studentId, details)`
Face verification operations
```javascript
logger.faceMatch('start', '69dcc761...', { liveSize: '8195 bytes', enrollmentUrl: 'provided' });
logger.faceMatch('success', '69dcc761...', { similarity: '95%', match: 'YES' });
logger.faceMatch('fail', '69dcc761...', { reason: 'Low match score' });
```

#### **Event Recording** `logger.event(type, count, confidence)`
Generic event logging
```javascript
logger.event('phone_detected', 1, 76.06);
logger.event('multiple_faces', null, 89);
logger.event('tab_switch', null);
```

#### **Snapshot Operations** `logger.snapshot(action, event, fileSize, details)`
Snapshot upload/save operations
```javascript
logger.snapshot('request', 'Phone detected (1 object)', 7547, 'Session: 69de2b57...');
logger.snapshot('upload', 'Window Lost Focus', 6798, 'Cloudinary success');
logger.snapshot('save', 'Face not visible', 1538, 'Local storage (Cloudinary disabled)');
```

#### **Python Process** `logger.pythonProcess(status, message, details)`
Python subprocess operations
```javascript
logger.pythonProcess('spawn', 'Detection model initialized');
logger.pythonProcess('output', 'Received 134 bytes');
logger.pythonProcess('complete', 'Process exited with code 0');
logger.pythonProcess('timeout', 'YOLO process exceeded timeout limit');
```

#### **Image Processing** `logger.imageProcess(action, size, path)`
Image file operations
```javascript
logger.imageProcess('receive', '5.02 KB');
logger.imageProcess('encode', 5140, 'frame_12345.b64');
logger.imageProcess('decode', '3906 bytes');
logger.imageProcess('process', '320x240 pixels');
```

#### **Session Operations** `logger.session(action, sessionId, details)`
Database session operations
```javascript
logger.session('create', '69de2b57f7bc34faf8c8790f', { examId: 'exam-001', status: 'active' });
logger.session('prune', '69de2b57f7bc34faf8c8790f', { removedEvents: 1500, remaining: 500 });
```

#### **Detection Alerts** `logger.detection(severity, object, confidence, details)`
High-priority detection events
```javascript
logger.detection('HIGH', 'PHONE', 76.06, 'Phone detected in exam frame');
```

---

### Organization Tools

#### **Section Header** `logger.section(title, icon)`
Create major section dividers
```javascript
logger.section('Phone Detection Service', '═');
// Output:
// ║════════════════════════════════════════════════════════════════════║
// ║  Phone Detection Service                                            ║
// ║════════════════════════════════════════════════════════════════════║
```

#### **Sub-Section** `logger.subsection(title)`
Create minor section dividers
```javascript
logger.subsection('Face Verification Starting');
// Output:
// ▶ Face Verification Starting
```

#### **Divider** `logger.divider()`
Visual line separator
```javascript
logger.divider();
// Output:
// ─────────────────────────────────────────────────────────────────────
```

#### **Table Display** `logger.table(headers, rows)`
Display data in formatted table
```javascript
logger.table(
  ['Event Type', 'Count', 'Severity'],
  [
    ['phone_detected', '1', 'CRITICAL'],
    ['multiple_faces', '0', 'CRITICAL'],
    ['gaze_deviation', '5', 'MEDIUM']
  ]
);
```

#### **Statistics** `logger.stats(title, statsObj)`
Display statistics
```javascript
logger.stats('Session Risk Assessment', {
  riskScore: 68,
  totalEvents: 42,
  criticalEvents: 2,
  status: 'HIGH RISK'
});
// Output:
// 📊 Session Risk Assessment
//    riskScore: 68
//    totalEvents: 42
//    criticalEvents: 2
//    status: HIGH RISK
```

#### **Debug** `logger.debug(title, data)`
Environment-aware debug output (only in dev mode)
```javascript
logger.debug('YOLO Output', result);
// Only displays if DEBUG_MODE=true or NODE_ENV=development
```

---

## Real-World Examples

### Phone Detection Flow
```javascript
// In phone detection service
logger.section('📱 Phone Detection Running');
logger.imageProcess('receive', imageSize);
logger.pythonProcess('spawn', 'YOLO model loaded');
logger.pythonProcess('output', `Received ${bytes} bytes`);

if (detectionResult.detected) {
  logger.phoneDetected(detectionResult.confidence, detectionResult.count, detectionResult.boxes);
} else {
  logger.success('Detection Complete', 'No phone detected');
}
```

### Face Matching Flow
```javascript
// In student controller
logger.faceMatch('start', studentId, { liveSize: '8195 bytes', enrollmentUrl: 'provided' });
logger.subsection('Calling ArcFace Verification Service');

try {
  const comparison = await deepfaceModule.compareFacesPython(livePhoto, enrollmentPhotoUrl);
  logger.faceMatch('success', studentId, {
    similarity: `${matchConfidence}%`,
    match: isSamePerson ? 'YES' : 'NO',
    distance: comparison.distance
  });
} catch (error) {
  logger.faceMatch('fail', studentId, { reason: error.message });
}
```

### Event Recording Flow
```javascript
// In monitoring service
const phoneEvents = events.filter(e => e.type === 'phone_detected');
if (phoneEvents.length > 0) {
  phoneEvents.forEach((event, idx) => {
    logger.event('phone_detected', idx + 1, event.confidence);
    logger.detection('HIGH', 'PHONE', event.confidence, event.label);
  });
}

// Log session statistics
logger.stats('Session Events', {
  total: events.length,
  phoneDetected: phoneEvents.length,
  criticalCount: criticalEvents.length
});
```

---

## Color Reference

| Type | Color | Usage |
|------|-------|-------|
| **Info** | Bright Blue | General information |
| **Success** | Bright Green | Operations completed |
| **Warning** | Bright Yellow | Caution needed |
| **Error** | Bright Red | Failures/problems |
| **Detection** | Bright Red + BG | Critical alerts |
| **Details** | Gray/Dim | Secondary info |

---

## Environment Variables

### Debug Mode
```bash
# Enable debug logging (shows debug() calls)
DEBUG_MODE=true
```

### Log Levels (Optional Future Use)
```bash
LOG_LEVEL=debug    # Most verbose
LOG_LEVEL=info     # Standard
LOG_LEVEL=warn     # Important only
LOG_LEVEL=error    # Errors only
```

---

## Best Practices

1. **Use Sections** - Group related operations with headers
2. **Provide Context** - Include relevant details that help debugging
3. **Use Appropriate Levels** - Error for failures, Warn for cautions
4. **Keep Messages Brief** - Long messages reduce readability
5. **Include IDs** - Session/Student IDs help trace issues
6. **Leverage Icons** - They provide instant visual recognition
7. **Structure Data** - Use objects for organized output

---

## Migration from Old Logs

### Before
```javascript
console.log(`📱 Detecting phone in image...`);
console.log(`✅ PHONE DETECTED! Confidence: ${result.confidence}%, Count: ${result.count}`);
console.error('❌ Phone detection error:', error);
```

### After
```javascript
logger.subsection('Phone Detection Starting');
logger.phoneDetected(result.confidence, result.count, result.boxes);
logger.error('Detection Error', error.message);
```

---

## Performance Notes

- Logger is optimized for production use
- ANSI color codes are widely supported in modern terminals
- No performance impact vs. console.log()
- All formatting is instant (no async operations)

---

## Troubleshooting

### Colors Not Appearing
- Ensure terminal supportsANSI colors (most modern terminals do)
- Check if output is being piped (some pipes strip colors)
- Verify `FORCE_COLOR=true` if needed

### Output Too Verbose
- Use `DEBUG_MODE=false` to hide debug() calls
- Reduce subsection() calls
- Focus on critical events only

### Missing Logger Methods
- Import logger: `import logger from '../utils/logger.js'`
- Ensure file path is correct
- Check that all required parameters are provided

---

## Summary

The new `logger` utility transforms raw console output into beautifully formatted, organized, and easily debuggable logs. It significantly improves readability during development and monitoring, making it easier to understand system behavior at a glance.

**Start using it throughout your backend to enjoy cleaner, more professional console output!**
