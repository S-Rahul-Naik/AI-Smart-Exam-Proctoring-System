#!/usr/bin/env node

/**
 * REAL SNAPSHOT UPLOAD TEST
 * Simulates exactly what the browser is doing to test the multipart fix
 */

const http = require('http');
const fs = require('fs');

// Create a minimal valid PNG (1x1 red pixel)
const pngData = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
  0x0A, 0x49, 0x44, 0x41, 0x54, 0x08, 0x5B, 0x63, 0xF8, 0x0F, 0x00, 0x00,
  0x01, 0x01, 0x01, 0x01, 0x18, 0xDD, 0x8D, 0xB4, 0x00, 0x00, 0x00, 0x00,
  0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
]);

// Session ID from the logs
const sessionId = '69dc3657de6c4acf45cd2d42';
const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2, 16);

// Build multipart body
const body = 
  `--${boundary}\r\n` +
  `Content-Disposition: form-data; name="file"; filename="snapshot.png"\r\n` +
  `Content-Type: image/png\r\n\r\n`;

const footer = `\r\n--${boundary}\r\n` +
  `Content-Disposition: form-data; name="eventType"\r\n\r\n` +
  `Gaze detected: looking right\r\n` +
  `--${boundary}--`;

const bodyBuffer = Buffer.concat([
  Buffer.from(body),
  pngData,
  Buffer.from(footer)
]);

console.log('🧪 REAL SNAPSHOT UPLOAD TEST');
console.log(`📤 SessionID: ${sessionId}`);
console.log(`📊 Multipart body size: ${bodyBuffer.length} bytes`);
console.log(`🔤 Boundary: ${boundary}`);
console.log('');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: `/api/sessions/${sessionId}/snapshot`,
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': bodyBuffer.length
  }
};

console.log('📨 Sending request...\n');

const req = http.request(options, (res) => {
  let data = '';

  console.log(`\n📥 Response received:`);
  console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
  console.log(`   Headers:`, res.headers);

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`   Body: ${data}\n`);
    
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ SUCCESS: Snapshot uploaded successfully!');
      console.log('✅ The multipart fix is WORKING');
      process.exit(0);
    } else if (res.statusCode === 400) {
      console.log('❌ FAILED: Got 400 Bad Request');
      console.log('❌ The multipart fix is NOT WORKING');
      console.log('❌ Backend is still not receiving req.file correctly');
      process.exit(1);
    } else {
      console.log(`⚠️ Unexpected status: ${res.statusCode}`);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error(`❌ Request error: ${err.message}`);
  process.exit(1);
});

req.write(bodyBuffer);
req.end();
