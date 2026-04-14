/**
 * YOLO Phone Detection Service
 * Runs Python YOLO model for phone detection in video frames
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const YOLO_SCRIPT = path.join(__dirname, 'yoloPhoneDetection.py');

// Use venv Python executable (where ultralytics is installed)
const PYTHON_EXECUTABLE = path.join(
  __dirname,
  '../../../.venv/Scripts/python.exe'
);

logger.info('YOLO Service Initialized', `Python executable ready at venv`);

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
      logger.imageProcess('receive', imageSizeKB);

      // Use temp file instead of command line to avoid Windows argument length limits
      const tempDir = os.tmpdir();
      tempFile = path.join(tempDir, `frame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.b64`);
      
      logger.imageProcess('encode', imageBase64.length, tempFile);
      fs.writeFileSync(tempFile, imageBase64, 'utf8');

      const python = spawn(PYTHON_EXECUTABLE, [YOLO_SCRIPT, '--file', tempFile], {
        timeout: 25000,
      });

      let stdout = '';
      let stderr = '';

      python.on('spawn', () => {
        logger.pythonProcess('spawn', 'Detection model initialized');
      });

      python.stdout.on('data', (data) => {
        const chunk = data.toString();
        logger.pythonProcess('output', `Received ${chunk.length} bytes`);
        stdout += chunk;
      });

      python.stderr.on('data', (data) => {
        const chunk = data.toString();
        // Only log stderr if VERBOSE_DEBUG is enabled
        if (process.env.VERBOSE_DEBUG === 'true') {
          logger.debug('YOLO stderr', chunk.substring(0, 150));
        }
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
            logger.imageProcess('cleanup', 'temp file removed');
          } catch (e) {
            logger.warn('Cleanup Failed', `Could not remove temp file: ${e.message}`);
          }
        }

        logger.pythonProcess('complete', `Process exited with code ${code}`);
        
        // Handle timeout and null exit codes
        if (code === null) {
          logger.warn('Timeout', 'YOLO process exceeded timeout limit');
          return resolve({
            detected: false,
            confidence: 0,
            count: 0,
            boxes: [],
            error: 'Timeout'
          });
        }

        if (code !== 0) {
          logger.error('Process Error', `YOLO exited with code ${code}`, stderr.substring(0, 200));
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
          logger.warn('No Output', 'YOLO returned empty stdout', stderr.substring(0, 150));
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
            logger.phoneDetected(result.confidence, result.count, result.boxes);
          }
          resolve(result);
        } catch (e) {
          logger.error('Parse Error', e.message, `Failed to parse: ${stdout.substring(0, 300)}`);
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

        logger.error('Process Error', err.message);
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
        logger.warn('Timeout', 'Manually killing detection process');
        try {
          python.kill('SIGKILL');
        } catch (e) {
          logger.error('Kill Failed', e.message);
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

      logger.error('Spawn Error', error.message);
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
