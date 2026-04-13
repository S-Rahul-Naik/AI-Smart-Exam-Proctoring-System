/**
 * Phone Detection Router
 * Endpoints for YOLO-based phone detection
 * Note: Detection endpoints have optional auth (token not required but used if present)
 */

import express from 'express';
import { detectPhoneYOLO, detectPhoneFromFile } from '../services/yoloPhoneDetectionService.js';

const router = express.Router();

/**
 * Optional authentication middleware - doesn't fail if token is missing
 */
const optionalAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      // Token exists, validate it if needed
      // For now, just pass through
      req.token = token;
    }
  } catch (error) {
    // Silently fail - token validation is optional for detection
  }
  next();
};

/**
 * POST /api/detect/phone
 * Detect phone in base64-encoded image
 * 
 * Body: {
 *   "image": "base64-encoded-image-data",
 *   "sessionId": "optional-session-id"
 * }
 */
router.post('/phone', optionalAuth, async (req, res) => {
  try {
    const { image, sessionId } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'Image data required'
      });
    }

    console.log(`📱 Detecting phone in image${sessionId ? ` (Session: ${sessionId})` : ''}...`);

    const result = await detectPhoneYOLO(image);

    if (result.detected) {
      console.log(`✅ PHONE DETECTED! Confidence: ${result.confidence}%, Count: ${result.count}`);
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Phone detection error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/detect/phone-file
 * Detect phone in uploaded image file
 * 
 * Body: {
 *   "filePath": "path/to/image",
 *   "sessionId": "optional-session-id"
 * }
 */
router.post('/phone-file', optionalAuth, async (req, res) => {
  try {
    const { filePath, sessionId } = req.body;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: 'File path required'
      });
    }

    console.log(`📱 Detecting phone in file: ${filePath}`);

    const result = await detectPhoneFromFile(filePath);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Phone detection error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
