/**
 * YOLO Phone Detection Service
 * Runs Python YOLO model for phone detection in video frames
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const YOLO_SCRIPT = path.join(__dirname, 'yoloPhoneDetection.py');

// Use venv Python executable (where ultralytics is installed)
const PYTHON_EXECUTABLE = path.join(
  __dirname,
  '../../../.venv/Scripts/python.exe'
);

console.log(`🐍 YOLO Python executable: ${PYTHON_EXECUTABLE}`);

/**
 * Detect phone in base64-encoded image
 * @param {string} imageBase64 - Base64-encoded image data
 * @returns {Promise<{detected: boolean, confidence: number, count: number, boxes: Array}>}
 */
export async function detectPhoneYOLO(imageBase64) {
  return new Promise((resolve, reject) => {
    let resolved = false;
    let tempFile = null;

    try {
      // Log the image data for debugging
      const imageSizeKB = (imageBase64.length / 1024).toFixed(2);
      console.log(`📦 Image size: ${imageSizeKB} KB`);

      // Use temp file instead of command line to avoid Windows argument length limits
      const tempDir = os.tmpdir();
      tempFile = path.join(tempDir, `frame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.b64`);
      
      console.log(`📝 Writing image to temp file: ${tempFile}`);
      fs.writeFileSync(tempFile, imageBase64, 'utf8');

      const python = spawn(PYTHON_EXECUTABLE, [YOLO_SCRIPT, '--file', tempFile], {
        timeout: 25000,
      });

      let stdout = '';
      let stderr = '';

      python.on('spawn', () => {
        console.log('✅ Python process spawned');
      });

      python.stdout.on('data', (data) => {
        const chunk = data.toString();
        console.log(`📤 Python stdout received: ${chunk.length} bytes`);
        if (chunk.length < 300) {
          console.log(`   Content preview: ${chunk}`);
        }
        stdout += chunk;
      });

      python.stderr.on('data', (data) => {
        const chunk = data.toString();
        console.log(`⚠️ Python stderr: ${chunk.substring(0, 150)}`);
        stderr += chunk;
      });

      python.on('close', (code) => {
        if (resolved) return; // Already resolved
        resolved = true;
        clearTimeout(killTimer);

        // Clean up temp file
        if (tempFile) {
          try {
            fs.unlinkSync(tempFile);
            console.log(`🗑️ Temp file cleaned up`);
          } catch (e) {
            console.error(`Failed to clean up temp file: ${e.message}`);
          }
        }

        console.log(`🔌 Process closed. Code: ${code}, stdout: ${stdout.length}B, stderr: ${stderr.length}B`);
        
        // Handle timeout and null exit codes
        if (code === null) {
          console.warn('⚠️ YOLO timed out');
          return resolve({
            detected: false,
            confidence: 0,
            count: 0,
            boxes: [],
            error: 'Timeout'
          });
        }

        if (code !== 0) {
          console.error(`❌ YOLO exited with code ${code}`);
          if (stderr) console.error('Error:', stderr.substring(0, 200));
          return resolve({
            detected: false,
            confidence: 0,
            count: 0,
            boxes: [],
            error: `Code ${code}`
          });
        }

        // Try to parse the output
        if (!stdout || stdout.trim().length === 0) {
          console.warn('⚠️ No stdout. Stderr:', stderr.substring(0, 150));
          return resolve({
            detected: false,
            confidence: 0,
            count: 0,
            boxes: [],
            error: 'No output'
          });
        }

        try {
          const result = JSON.parse(stdout);
          if (result.detected) {
            console.log(`✅ PHONE DETECTED: ${result.confidence}% confidence`);
          }
          resolve(result);
        } catch (e) {
          console.error('Parse failed:', e.message);
          console.log('Stdout to parse:', stdout.substring(0, 300));
          resolve({
            detected: false,
            confidence: 0,
            count: 0,
            boxes: [],
            error: 'Parse error: ' + e.message
          });
        }
      });

      python.on('error', (err) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(killTimer);

        // Clean up temp file on error
        if (tempFile) {
          try {
            fs.unlinkSync(tempFile);
          } catch (e) {
            // Ignore
          }
        }

        console.error('❌ Process error:', err.message);
        resolve({
          detected: false,
          confidence: 0,
          count: 0,
          boxes: [],
          error: err.message
        });
      });

      // Manual killer - force kill if taking too long
      const killTimer = setTimeout(() => {
        if (resolved) return;
        console.warn('⏱️ Manual timeout - killing process NOW');
        try {
          python.kill('SIGKILL');
        } catch (e) {
          console.error('Kill failed:', e.message);
        }
      }, 24000);

    } catch (error) {
      if (resolved) return;
      resolved = true;

      // Clean up on error
      if (tempFile) {
        try {
          fs.unlinkSync(tempFile);
        } catch (e) {
          // Ignore
        }
      }

      console.error('❌ Spawn error:', error.message);
      resolve({
        detected: false,
        confidence: 0,
        count: 0,
        boxes: [],
        error: error.message
      });
    }
  });
}

/**
 * Detect phone in image file
 * @param {string} imagePath - Path to image file
 * @returns {Promise<{detected: boolean, confidence: number, count: number, boxes: Array}>}
 */
export async function detectPhoneFromFile(imagePath) {
  return new Promise((resolve, reject) => {
    try {
      const python = spawn(PYTHON_EXECUTABLE, [YOLO_SCRIPT, '--file', imagePath], {
        timeout: 20000, // Increased timeout
      });

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code === null) {
          console.warn('⚠️ YOLO process timed out');
          return resolve({
            detected: false,
            confidence: 0,
            count: 0,
            boxes: [],
            error: 'Timeout'
          });
        }

        if (code !== 0) {
          console.error(`YOLO process exited with code ${code}`);
          return resolve({
            detected: false,
            confidence: 0,
            count: 0,
            boxes: [],
            error: 'Detection failed'
          });
        }

        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (e) {
          console.error('Failed to parse YOLO output:', stdout);
          resolve({
            detected: false,
            confidence: 0,
            count: 0,
            boxes: [],
            error: 'Parse error'
          });
        }
      });

      python.on('error', (err) => {
        console.error('YOLO process error:', err);
        resolve({
          detected: false,
          confidence: 0,
          count: 0,
          boxes: [],
          error: err.message
        });
      });
    } catch (error) {
      console.error('Error spawning YOLO process:', error);
      resolve({
        detected: false,
        confidence: 0,
        count: 0,
        boxes: [],
        error: error.message
      });
    }
  });
}
