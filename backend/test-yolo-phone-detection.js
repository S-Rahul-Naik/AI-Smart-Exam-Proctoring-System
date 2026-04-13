#!/usr/bin/env node
/**
 * YOLO Phone Detection Test
 * Tests the YOLO-based phone detection system
 * 
 * Run: node test-yolo-phone-detection.js
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:5000/api/detect/phone';
const TEST_TOKEN = 'test-token'; // You'll need a valid token

/**
 * Test with a local image file
 */
async function testYOLODetection() {
  console.log('🚀 Testing YOLO Phone Detection System\n');
  
  // Try to find a test image
  const testImages = [
    './test-phone-image.jpg',
    './backend/test-phone-image.jpg',
    './public/models/face-api/tiny_face_detector_model-weights_0.buf', // Not ideal, just for demo
  ];

  const testImagePath = testImages.find(img => fs.existsSync(img));

  if (testImagePath) {
    console.log(`✅ Found test image: ${testImagePath}`);
    
    // Read and encode image
    const imageBuffer = fs.readFileSync(testImagePath);
    const base64Image = imageBuffer.toString('base64');

    try {
      console.log(`📤 Sending request to ${API_URL}...`);
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_TOKEN}`,
        },
        body: JSON.stringify({
          image: base64Image,
          sessionId: 'test-session-001',
        }),
      });

      if (!response.ok) {
        console.error(`❌ Request failed: ${response.status} ${response.statusText}`);
        return;
      }

      const result = await response.json();
      console.log('\n✅ Detection Result:');
      console.log(JSON.stringify(result, null, 2));

      if (result.data.detected) {
        console.log(`\n🚨 PHONE DETECTED!`);
        console.log(`   Confidence: ${result.data.confidence}%`);
        console.log(`   Count: ${result.data.count}`);
        console.log(`   Boxes: ${JSON.stringify(result.data.boxes)}`);
      } else {
        console.log('\n✅ No phone detected');
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  } else {
    console.log('ℹ️  No test image found. To test with an image:');
    console.log('   1. Place a phone image at ./test-phone-image.jpg');
    console.log('   2. Run: node test-yolo-phone-detection.js');
    console.log('\n📝 YOLO Detection Endpoints:');
    console.log('   POST /api/detect/phone');
    console.log('   Body: { image: "base64-string", sessionId: "optional" }');
    console.log('\nExample usage in frontend:');
    console.log(`
      const result = await fetch('/api/detect/phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify({
          image: frameBase64,
          sessionId: sessionId,
        }),
      });
      const { data } = await result.json();
      console.log('Phone detected:', data.detected, 'Confidence:', data.confidence);
    `);
  }
}

// Run test
testYOLODetection().catch(console.error);
