import express from 'express';
import { compareFacesFast } from '../utils/fastFaceComparison.js';
import { verifyFacesWithDeepFace } from '../utils/deepfaceVerification.js';

const router = express.Router();

/**
 * POST /api/verify/compare-faces
 * FAST face comparison using perceptual hashing
 * ⚡ < 500ms response time
 * SAME PERSON = ALLOW
 * DIFFERENT PERSON = BLOCK
 */
router.post('/compare-faces', async (req, res) => {
  try {
    const { signupPhotoUrl, loginPhotoUrl, currentPhotoUrl } = req.body;
    
    if (!signupPhotoUrl || !loginPhotoUrl || !currentPhotoUrl) {
      return res.status(400).json({
        error: 'Missing required photo URLs',
        decision: 'BLOCK'
      });
    }

    console.log('⚡ [API] Received fast face comparison request');
    const result = await compareFacesFast(signupPhotoUrl, loginPhotoUrl, currentPhotoUrl);
    
    return res.json({
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [API] Face comparison error:', error);
    return res.status(500).json({
      decision: 'BLOCK',
      reasoning: 'Face verification failed',
      error: error.message
    });
  }
});

/**
 * POST /api/verify/compare-faces-arcface
 * ACCURATE face comparison using DeepFace + ArcFace pretrained model
 * ⏱️ 8-15s response time (one-time model download on first use)
 * Compares ONLY signup vs login (2 known photos)
 * No live webcam - login is already verified identity
 * SAME PERSON = ALLOW
 * DIFFERENT PERSON = BLOCK
 */
router.post('/compare-faces-arcface', async (req, res) => {
  try {
    const { signupPhotoUrl, loginPhotoUrl } = req.body;
    
    if (!signupPhotoUrl || !loginPhotoUrl) {
      return res.status(400).json({
        error: 'Missing required photos (signup, login)',
        decision: 'BLOCK'
      });
    }

    console.log('🧠 [API] Received ArcFace face comparison request');
    console.log(`   Comparing signup vs login only (no live feed)`);
    const result = await verifyFacesWithDeepFace(signupPhotoUrl, loginPhotoUrl);
    
    return res.json({
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [API] ArcFace comparison error:', error);
    return res.status(500).json({
      decision: 'BLOCK',
      reasoning: 'Face verification failed',
      error: error.message
    });
  }
});

export default router;
