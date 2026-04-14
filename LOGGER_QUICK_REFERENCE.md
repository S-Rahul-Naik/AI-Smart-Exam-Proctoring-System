# 📋 Logger Quick Reference Card

## Import Statement
```javascript
import logger from '../utils/logger.js';
```

---

## Core Logging Methods

### `logger.info(title, message, details)`
**Blue informational logs**
```javascript
logger.info('Service', 'Connected successfully', { port: 3000 });
```

### `logger.success(title, message, details)`
**Green success logs**
```javascript
logger.success('Operation', 'Completed', { duration: '1.2s' });
```

### `logger.warn(title, message, details)`
**Yellow warning logs**
```javascript
logger.warn('Timeout', 'Process exceeded 20s limit');
```

### `logger.error(title, message, details)`
**Red error logs**
```javascript
logger.error('Connection', 'Database unreachable', { code: 'ECONNREFUSED' });
```

---

## Specialized Methods

### Detection & Alerts

#### `logger.phoneDetected(confidence, count, boxes)`
**High-priority phone detection alert with visual borders**
```javascript
logger.phoneDetected(76.06, 1, [{x: 99, y: 198, width: 220, height: 41}]);
```

#### `logger.detection(severity, object, confidence, details)`
**Generic critical event alert**
```javascript
logger.detection('HIGH', 'PHONE', 76.06, 'Detected in exam frame');
logger.detection('HIGH', 'MULTIPLE_FACES', 89, 'Two people in frame');
```

### Face Operations

#### `logger.faceMatch(action, studentId, details)`
**Face matching operations - actions: 'start', 'success', 'fail', 'compare'**
```javascript
logger.faceMatch('start', '69dcc761...', { liveSize: '8KB', url: 'yes' });
logger.faceMatch('success', '69dcc761...', { similarity: '95%', match: 'YES' });
logger.faceMatch('fail', '69dcc761...', { reason: 'Low match' });
logger.faceMatch('compare', 'enrollment', null);
```

### File Operations

#### `logger.imageProcess(action, size, path)`
**Image processing ops - actions: 'receive', 'encode', 'decode', 'process', 'save', 'cleanup'**
```javascript
logger.imageProcess('receive', '5.02 KB');
logger.imageProcess('encode', 5140, 'frame.b64');
logger.imageProcess('process', '320x240 pixels');
logger.imageProcess('cleanup', 'temp file removed');
```

#### `logger.snapshot(action, event, fileSize, details)`
**Snapshot operations - actions: 'request', 'upload', 'save', 'complete', 'error'**
```javascript
logger.snapshot('request', 'Phone detected', 7547, 'Session: 69de2b57...');
logger.snapshot('upload', 'Window lost', 6798, 'Cloudinary success');
logger.snapshot('save', 'Face blur', 1538, 'Local storage');
```

### Process Management

#### `logger.pythonProcess(status, message, details)`
**Python subprocess logs - status: 'start', 'spawn', 'output', 'error', 'complete', 'timeout'**
```javascript
logger.pythonProcess('spawn', 'Model loaded');
logger.pythonProcess('output', 'Received 134 bytes');
logger.pythonProcess('complete', 'Exited with code 0');
logger.pythonProcess('timeout', 'Killed after 20s');
```

### Database Operations

#### `logger.session(action, sessionId, details)`
**Session management - actions: 'create', 'retrieve', 'update', 'delete', 'prune', 'archive'**
```javascript
logger.session('create', '69de2b57f7bc34faf8c8790f', { examId: 'exam-001' });
logger.session('prune', '69de2b57f7bc34faf8c8790f', { removed: 1500, remaining: 500 });
logger.session('archive', '69de2b57f7bc34faf8c8790f', { count: 2000 });
```

### Events

#### `logger.event(type, count, confidence)`
**Event recording - types: 'phone_detected', 'multiple_faces', 'face_absent', 'gaze_deviation', 'tab_switch', 'fullscreen_exit', 'devtools_open', 'copy_paste', 'window_blur'**
```javascript
logger.event('phone_detected', 1, 76.06);
logger.event('multiple_faces', null, 89);
logger.event('gaze_deviation', 5);
```

---

## Organization Tools

### Sections

#### `logger.section(title, icon)`
**Major section divider - icon: single character for border (default: '═')**
```javascript
logger.section('Phone Detection Flow', '═');
logger.section('Face Verification', '▓');
logger.section('Session Recording', '─');
```

#### `logger.subsection(title)`
**Minor section divider**
```javascript
logger.subsection('Starting ArcFace Comparison');
logger.subsection('Processing Detection Results');
```

#### `logger.divider()`
**Simple line separator**
```javascript
logger.divider();
// Output: ─────────────────────────────────────────────────────
```

### Data Display

#### `logger.table(headers, rows)`
**Formatted table display**
```javascript
logger.table(
  ['Event Type', 'Count', 'Severity'],
  [['phone_detected', '1', 'CRITICAL'], ['gaze_deviation', '5', 'MEDIUM']]
);
```

#### `logger.stats(title, statsObj)`
**Statistics summary**
```javascript
logger.stats('Risk Assessment', {
  riskScore: 75,
  totalEvents: 42,
  criticalEvents: 2
});
```

#### `logger.debug(title, data)`
**Debug info (only in dev mode)**
```javascript
logger.debug('YOLO Detection', parsedResult);
// Only shows if DEBUG_MODE=true or NODE_ENV=development
```

---

## Color Code Reference

| Method | Color | Icon |
|--------|-------|------|
| **info** | Blue | ℹ |
| **success** | Green | ✓ |
| **warn** | Yellow | ⚠ |
| **error** | Red | ✗ |
| **detection** | Red + Borders | 🚨 |
| **phoneDetected** | Red + Bold Borders | 📱 |
| **faceMatch** | Color varies | 🔍 |
| **event** | Event-specific | Emoji |

---

## Common Patterns

### Phone Detection Flow
```javascript
logger.section('Phone Detection');
logger.imageProcess('receive', imageSize);
logger.pythonProcess('spawn', 'Model loaded');
if (result.detected) {
  logger.phoneDetected(result.confidence, result.count, result.boxes);
} else {
  logger.success('No Detection', 'Frame is clean');
}
```

### Face Matching Flow
```javascript
logger.section('Face Verification');
logger.faceMatch('start', studentId);
logger.subsection('ArcFace Comparison');
try {
  const result = await compareFaces();
  logger.faceMatch('success', studentId, { similarity: '95%' });
} catch (e) {
  logger.faceMatch('fail', studentId, { reason: e.message });
}
```

### Event Recording Flow
```javascript
logger.section('Event Recording');
events.forEach(event => {
  if (event.type === 'phone_detected') {
    logger.event('phone_detected', 1, event.confidence);
    logger.detection('HIGH', 'PHONE', event.confidence);
  }
});
logger.stats('Summary', { total: events.length, critical: criticalCount });
```

### Error Handling
```javascript
try {
  const result = await operation();
  logger.success('Operation', 'Completed successfully');
} catch (error) {
  logger.error('Operation Failed', error.message, { code: error.code });
}
```

---

## Method Parameters Cheat Sheet

```
info(title, message?, details?)
success(title, message?, details?)
warn(title, message?, details?)
error(title, message?, details?)

phoneDetected(confidence, count, boxes?)
detection(severity, object, confidence, details?)
faceMatch(action, studentId, details?)
imageProcess(action, size, path?)
snapshot(action, event, fileSize, details?)
pythonProcess(status, message, details?)
session(action, sessionId, details?)
event(type, count?, confidence?)

section(title, icon?)
subsection(title)
divider()
table(headers[], rows[][])
stats(title, statsObject)
debug(title, data)
```

---

## Tips & Tricks

1. **Pass details as second param** - `logger.success('Title', details)` 
2. **Details can be object or string** - Both accepted
3. **Short titles** - 2-3 words maximum
4. **Use subsection** before major operations
5. **Group related logs** - Use section() then subsection()
6. **Debug only in dev** - logger.debug() auto-skips in production
7. **Shorten IDs** - `id.substring(0, 8) + '...'` for readability
8. **Use details sparingly** - Only include relevant info
9. **Combine methods** - section → subsection → specific logs
10. **Icons matter** - They help quickly scan logs

---

## Production Considerations

- ✅ ANSI colors work in most terminals
- ✅ Colors are stripped automatically when piped
- ✅ No performance impact
- ✅ Zero external dependencies
- ✅ Safe for production use
- ⚠️ Some old terminals may not support colors
- ℹ️ Use `FORCE_COLOR=true` if needed

---

## Need Help?

- **Full Guide**: See `LOGGER_USAGE_GUIDE.md`
- **Examples**: See `LOGGER_BEFORE_AFTER.md`
- **Source**: `backend/src/utils/logger.js`

**Happy logging! 🎨**
