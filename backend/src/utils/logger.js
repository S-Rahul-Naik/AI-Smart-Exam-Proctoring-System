/**
 * Colored Console Logger Utility
 * Provides formatted, colored logging for better readability
 */

// ANSI Color codes
const colors = {
  reset: '\x1b[0m',
  // Text colors
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  // Bright colors
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  // Background colors
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  // Styles
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
};

const logger = {
  /**
   * INFO LOG - General information (blue)
   */
  info(title, message, details = null) {
    const titleStr = `${colors.brightBlue}ℹ ${title}${colors.reset}`;
    const msgStr = message ? `  ${colors.cyan}${message}${colors.reset}` : '';
    console.log(`${titleStr}${msgStr}`);
    if (details) {
      if (typeof details === 'object') {
        console.log(`${colors.gray}${JSON.stringify(details, null, 2)}${colors.reset}`);
      } else {
        console.log(`${colors.gray}${details}${colors.reset}`);
      }
    }
  },

  /**
   * SUCCESS LOG - Operation completed (green)
   */
  success(title, message, details = null) {
    const titleStr = `${colors.brightGreen}✓ ${title}${colors.reset}`;
    const msgStr = message ? `  ${colors.green}${message}${colors.reset}` : '';
    console.log(`${titleStr}${msgStr}`);
    if (details) {
      if (typeof details === 'object') {
        console.log(`${colors.green}   ${JSON.stringify(details, null, 2)}${colors.reset}`);
      } else {
        console.log(`${colors.green}   ${details}${colors.reset}`);
      }
    }
  },

  /**
   * WARNING LOG - Something needs attention (yellow)
   */
  warn(title, message, details = null) {
    const titleStr = `${colors.brightYellow}⚠ ${title}${colors.reset}`;
    const msgStr = message ? `  ${colors.yellow}${message}${colors.reset}` : '';
    console.log(`${titleStr}${msgStr}`);
    if (details) {
      if (typeof details === 'object') {
        console.log(`${colors.yellow}   ${JSON.stringify(details, null, 2)}${colors.reset}`);
      } else {
        console.log(`${colors.yellow}   ${details}${colors.reset}`);
      }
    }
  },

  /**
   * ERROR LOG - Something went wrong (red)
   */
  error(title, message, details = null) {
    const titleStr = `${colors.brightRed}✗ ${title}${colors.reset}`;
    const msgStr = message ? `  ${colors.red}${message}${colors.reset}` : '';
    console.log(`${titleStr}${msgStr}`);
    if (details) {
      if (typeof details === 'object') {
        console.log(`${colors.red}   ${JSON.stringify(details, null, 2)}${colors.reset}`);
      } else {
        console.log(`${colors.red}   ${details}${colors.reset}`);
      }
    }
  },

  /**
   * DETECTION LOG - Phone/Object detected (magenta/red alert)
   */
  detection(severity, object, confidence, details = null) {
    const severityColor = severity === 'HIGH' ? colors.brightRed : colors.brightMagenta;
    const border = `${severityColor}${'═'.repeat(60)}${colors.reset}`;
    
    console.log(`\n${border}`);
    console.log(`${severityColor}🚨 ${severity} SEVERITY: ${object} DETECTED${colors.reset}`);
    console.log(`${colors.red}   Confidence: ${confidence}%${colors.reset}`);
    
    if (details) {
      console.log(`${colors.yellow}   Details: ${details}${colors.reset}`);
    }
    console.log(`${border}\n`);
  },

  /**
   * FACE MATCH LOG - Face matching operation
   */
  faceMatch(action, studentId, details = {}) {
    const actionColors = {
      'start': colors.cyan,
      'success': colors.green,
      'fail': colors.red,
      'compare': colors.blue,
    };
    
    const color = actionColors[action] || colors.cyan;
    
    switch (action) {
      case 'start':
        console.log(`\n${color}🔍 [FACE MATCH] Starting verification for student ${studentId}${colors.reset}`);
        break;
      case 'success':
        console.log(`${colors.green}✓ [FACE MATCH] Match successful - ${details.similarity}% similarity${colors.reset}`);
        break;
      case 'fail':
        console.log(`${colors.red}✗ [FACE MATCH] Match failed - ${details.reason}${colors.reset}`);
        break;
      case 'compare':
        console.log(`${colors.cyan}   📤 Comparing with enrollment photo...${colors.reset}`);
        break;
    }

    if (details && Object.keys(details).length > 0) {
      Object.entries(details).forEach(([key, value]) => {
        if (key !== 'reason' && key !== 'similarity') {
          console.log(`${colors.gray}   • ${key}: ${value}${colors.reset}`);
        }
      });
    }
  },

  /**
   * PHONE DETECTION ALERT - High priority alert
   */
  phoneDetected(confidence, count, boxes) {
    const alertBorder = `${colors.brightRed}${'▓'.repeat(70)}${colors.reset}`;
    
    console.log(`\n${alertBorder}`);
    console.log(`${colors.bgRed}${colors.white}${colors.bold} 📱 PHONE DETECTED - CRITICAL VIOLATION ${colors.reset}`);
    console.log(`${alertBorder}`);
    console.log(`${colors.brightRed}   Confidence:${colors.reset} ${colors.yellow}${confidence}%${colors.reset}`);
    console.log(`${colors.brightRed}   Object Count:${colors.reset} ${colors.yellow}${count}${colors.reset}`);
    
    if (boxes && boxes.length > 0) {
      boxes.forEach((box, idx) => {
        console.log(`${colors.gray}   [Box ${idx + 1}] Position: (${box.x}, ${box.y}) Size: ${box.width}x${box.height}${colors.reset}`);
      });
    }
    
    console.log(`${alertBorder}\n`);
  },

  /**
   * PYTHON PROCESS LOG - Python subprocess execution
   */
  pythonProcess(status, message, details = null) {
    const statusIcons = {
      'start': '🚀',
      'spawn': '✅',
      'output': '📤',
      'error': '⚠️',
      'complete': '🔌',
      'timeout': '⏱️',
    };

    const statusColors = {
      'start': colors.blue,
      'spawn': colors.green,
      'output': colors.cyan,
      'error': colors.yellow,
      'complete': colors.gray,
      'timeout': colors.red,
    };

    const icon = statusIcons[status] || '•';
    const color = statusColors[status] || colors.white;

    console.log(`${color}   ${icon} ${status.toUpperCase()}: ${message}${colors.reset}`);
    
    if (details) {
      if (typeof details === 'object') {
        console.log(`${colors.gray}      ${JSON.stringify(details)}${colors.reset}`);
      } else {
        console.log(`${colors.gray}      ${details}${colors.reset}`);
      }
    }
  },

  /**
   * IMAGE PROCESSING LOG
   */
  imageProcess(action, size, path = null) {
    const colors_map = {
      'receive': colors.cyan,
      'encode': colors.blue,
      'decode': colors.green,
      'process': colors.yellow,
      'save': colors.green,
      'cleanup': colors.gray,
    };

    const color = colors_map[action] || colors.white;
    const sizeStr = typeof size === 'number' ? `${(size / 1024).toFixed(2)} KB` : size;
    
    console.log(`${color}   📦 ${action.toUpperCase()}: ${sizeStr}${path ? ` - ${path}` : ''}${colors.reset}`);
  },

  /**
   * SNAPSHOT LOG - Snapshot upload/save
   */
  snapshot(action, event, fileSize, details = null) {
    const icons = {
      'request': '📸',
      'upload': '☁️',
      'save': '💾',
      'complete': '✓',
      'error': '✗',
    };

    const colors_map = {
      'request': colors.cyan,
      'upload': colors.blue,
      'save': colors.green,
      'complete': colors.green,
      'error': colors.red,
    };

    const icon = icons[action] || '•';
    const color = colors_map[action] || colors.white;
    const sizeStr = `${(fileSize / 1024).toFixed(1)} KB`;

    console.log(`${color}   ${icon} ${action.toUpperCase()}: ${event} (${sizeStr})${colors.reset}`);
    
    if (details) {
      console.log(`${colors.gray}      ${details}${colors.reset}`);
    }
  },

  /**
   * SESSION LOG - Session operations
   */
  session(action, sessionId, details = null) {
    const icons = {
      'create': '✨',
      'retrieve': '📖',
      'update': '✏️',
      'delete': '🗑️',
      'prune': '🔄',
      'archive': '📦',
    };

    const colors_map = {
      'create': colors.green,
      'retrieve': colors.cyan,
      'update': colors.blue,
      'delete': colors.yellow,
      'prune': colors.yellow,
      'archive': colors.magenta,
    };

    const icon = icons[action] || '•';
    const color = colors_map[action] || colors.white;
    const shortId = sessionId.substring(0, 8) + '...';

    console.log(`${color}   ${icon} ${action.toUpperCase()}: ${shortId}${colors.reset}`);
    
    if (details) {
      if (typeof details === 'object') {
        Object.entries(details).forEach(([key, value]) => {
          console.log(`${colors.gray}      • ${key}: ${value}${colors.reset}`);
        });
      } else {
        console.log(`${colors.gray}      ${details}${colors.reset}`);
      }
    }
  },

  /**
   * EVENT LOG - Event recording and processing
   */
  event(type, count, confidence = null) {
    const eventColors = {
      'phone_detected': colors.brightRed,
      'multiple_faces': colors.red,
      'face_absent': colors.yellow,
      'gaze_deviation': colors.blue,
      'tab_switch': colors.magenta,
      'fullscreen_exit': colors.yellow,
      'devtools_open': colors.red,
      'copy_paste': colors.red,
      'window_blur': colors.magenta,
    };

    const icons = {
      'phone_detected': '📱',
      'multiple_faces': '👥',
      'face_absent': '👤❌',
      'gaze_deviation': '👁️',
      'tab_switch': '🔄',
      'fullscreen_exit': '⛔',
      'devtools_open': '🛠️',
      'copy_paste': '📋',
      'window_blur': '❓',
    };

    const color = eventColors[type] || colors.cyan;
    const icon = icons[type] || '•';
    const countStr = count ? ` [Count: ${count}]` : '';
    const confStr = confidence ? ` [Confidence: ${confidence}%]` : '';

    console.log(`${color}   ${icon} ${type}${countStr}${confStr}${colors.reset}`);
  },

  /**
   * SECTION HEADER - Organize console into sections
   */
  section(title, icon = '═') {
    const border = `${colors.brightCyan}${icon.repeat(70)}${colors.reset}`;
    console.log(`\n${border}`);
    console.log(`${colors.brightCyan}${colors.bold}  ${title}${colors.reset}`);
    console.log(`${border}\n`);
  },

  /**
   * SUB-SECTION - Smaller divider
   */
  subsection(title) {
    console.log(`\n${colors.cyan}▶ ${title}${colors.reset}`);
  },

  /**
   * DIVIDER - Visual separator
   */
  divider() {
    console.log(`${colors.gray}${'─'.repeat(70)}${colors.reset}`);
  },

  /**
   * FORMATTED TABLE - Display data in table format
   */
  table(headers, rows) {
    const colWidths = headers.map((h, i) => 
      Math.max(h.length, ...rows.map(r => String(r[i] || '').length))
    );

    // Header
    const headerStr = headers.map((h, i) => 
      `${colors.bold}${h.padEnd(colWidths[i])}${colors.reset}`
    ).join('  ');
    console.log(`${colors.cyan}${headerStr}${colors.reset}`);
    console.log(`${colors.gray}${colWidths.map(w => '─'.repeat(w)).join('  ')}${colors.reset}`);

    // Rows
    rows.forEach(row => {
      const rowStr = row.map((cell, i) => 
        String(cell || '').padEnd(colWidths[i])
      ).join('  ');
      console.log(rowStr);
    });
  },

  /**
   * STATS - Display statistics
   */
  stats(title, statsObj) {
    console.log(`\n${colors.brightCyan}📊 ${title}${colors.reset}`);
    Object.entries(statsObj).forEach(([key, value]) => {
      const valueColor = typeof value === 'number' && value > 0 ? colors.yellow : colors.green;
      console.log(`${colors.cyan}   ${key}:${colors.reset} ${valueColor}${value}${colors.reset}`);
    });
  },

  /**
   * DEBUG - Debug information (only when VERBOSE_DEBUG=true)
   * Suppressed by default to keep console clean
   */
  debug(title, data) {
    // Only show if VERBOSE_DEBUG is explicitly enabled
    if (process.env.VERBOSE_DEBUG === 'true') {
      console.log(`${colors.gray}🐛 DEBUG: ${title}${colors.reset}`);
      if (typeof data === 'object') {
        console.log(colors.gray, JSON.stringify(data, null, 2), colors.reset);
      } else {
        console.log(`${colors.gray}${data}${colors.reset}`);
      }
    }
  },
};

export default logger;
