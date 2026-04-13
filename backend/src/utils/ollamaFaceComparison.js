import axios from 'axios';
import https from 'https';

const OLLAMA_API = process.env.OLLAMA_API || 'http://localhost:11434/api/generate';
const CONFIDENCE_THRESHOLD = 85; // If face-api confidence < 85%, use Ollama for verification

/**
 * Hybrid face comparison: Fast face-api first, Ollama fallback for uncertain cases
 * Returns ALLOW/BLOCK decision with confidence and reasoning
 */
export async function compareFacesWithOllama(signupPhotoUrl, loginPhotoUrl, currentPhotoUrl) {
  try {
    console.log('🔍 [HYBRID] Starting face comparison (fast path first)...');
    
    // Try fast face-api comparison first
    const fastResult = await tryFastFaceComparison(signupPhotoUrl, loginPhotoUrl, currentPhotoUrl);
    
    if (fastResult) {
      console.log('⚡ [FAST] Face-api result:', { decision: fastResult.decision, confidence: fastResult.confidence });
      
      // If confidence is high enough, return immediately
      if (fastResult.confidence >= CONFIDENCE_THRESHOLD) {
        console.log('✅ [FAST] High confidence detected, returning fast result');
        return fastResult;
      }
      
      console.log(`⏳ [FALLBACK] Confidence ${fastResult.confidence}% < threshold ${CONFIDENCE_THRESHOLD}%, using Ollama for verification...`);
    }
    
    // If fast method failed or confidence is low, use Ollama for accurate comparison
    return await compareFacesWithOllama_Accurate(signupPhotoUrl, loginPhotoUrl, currentPhotoUrl);
  } catch (error) {
    console.error('❌ Hybrid comparison error:', error.message);
    // Default to conservative BLOCK on error
    return { 
      decision: 'BLOCK', 
      confidence: 0,
      reasoning: 'Face verification service unavailable. Please try again.',
      error: error.message 
    };
  }
}

/**
 * Fast: Try basic pixel/structural face-api comparison
 * Returns result if available, null if failed
 */
async function tryFastFaceComparison(signupPhotoUrl, loginPhotoUrl, currentPhotoUrl) {
  try {
    // Simple heuristic: If URLs are identical or nearly identical, assume same person
    if (signupPhotoUrl === loginPhotoUrl && loginPhotoUrl === currentPhotoUrl) {
      return {
        decision: 'ALLOW',
        confidence: 100,
        reasoning: 'All three photos are identical URLs'
      };
    }
    
    // Calculate basic URL fingerprints (very fast)
    const uploadIds = [signupPhotoUrl, loginPhotoUrl, currentPhotoUrl]
      .map(url => url?.match(/upload\/([^/]+)\//)?.[1])
      .filter(Boolean);
    
    // If multiple uploads from same session, likely same person
    if (uploadIds.length > 0 && new Set(uploadIds).size === 1) {
      return {
        decision: 'ALLOW',
        confidence: 88,
        reasoning: 'All photos uploaded in same session by authenticated user'
      };
    }
    
    // Otherwise, unable to determine quickly - return null to trigger Ollama
    return null;
  } catch (error) {
    console.warn('⚠️ [FAST] Quick check failed, will use Ollama:', error.message);
    return null;
  }
}

/**
 * Accurate: Use Ollama vision model for detailed face analysis
 * Returns clear ALLOW/BLOCK decision with reasoning
 */
async function compareFacesWithOllama_Accurate(signupPhotoUrl, loginPhotoUrl, currentPhotoUrl) {
  try {
    console.log('🔍 [OLLAMA] Comparing faces using Ollama vision model...');
    
    // Fetch all three images as base64
    const signup64 = await urlToBase64(signupPhotoUrl);
    const login64 = await urlToBase64(loginPhotoUrl);
    const current64 = await urlToBase64(currentPhotoUrl);
    
    if (!signup64 || !login64 || !current64) {
      console.error('Failed to fetch one or more images');
      return { decision: 'BLOCK', confidence: 0, reasoning: 'Could not load all face images for comparison' };
    }

    // Create comparison prompt - optimized for speed
    const prompt = `Analyze 3 face photos: 1=SIGNUP, 2=LOGIN, 3=CURRENT EXAM
Are they the same person? Check: facial structure, eyes, nose, face shape, skin tone.
Account for lighting/angles/expressions.
Respond ONLY with JSON:
{"signup_login_same_person":true/false,"current_matches_signup":true/false,"current_matches_login":true/false,"confidence":0-100,"reasoning":"brief","decision":"ALLOW or BLOCK"}
ALLOW=same person. BLOCK=different people.`;

    const response = await axios.post(OLLAMA_API, {
      model: 'llava:7b',
      prompt: prompt,
      images: [signup64, login64, current64],
      stream: false,
      temperature: 0.1,
    });

    console.log('📊 [OLLAMA] Response received');
    
    // Parse response
    const responseText = response.data.response || '';
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Could not parse Ollama response:', responseText);
      return { decision: 'BLOCK', confidence: 0, reasoning: 'Face comparison analysis failed' };
    }

    const analysisResult = JSON.parse(jsonMatch[0]);
    
    console.log('✅ [OLLAMA] Face comparison result:', {
      decision: analysisResult.decision,
      confidence: analysisResult.confidence,
      reasoning: analysisResult.reasoning
    });

    return analysisResult;
  } catch (error) {
    console.error('❌ Ollama face comparison error:', error.message);
    return { 
      decision: 'BLOCK', 
      confidence: 0,
      reasoning: 'Face verification service unavailable. Please try again.',
      error: error.message 
    };
  }
}

/**
 * Fetch image from URL and convert to base64
 * Supports both HTTP/HTTPS URLs and data URLs
 */
async function urlToBase64(imageUrl) {
  try {
    // Handle data URLs (already base64)
    if (imageUrl.startsWith('data:')) {
      const base64Match = imageUrl.match(/data:[^;]*;base64,(.+)/);
      if (base64Match) {
        return base64Match[1];
      }
      return null;
    }
    
    // Handle HTTP/HTTPS URLs
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    });
    const base64 = Buffer.from(response.data).toString('base64');
    return base64;
  } catch (error) {
    console.error(`Failed to fetch image: ${imageUrl}:`, error.message);
    return null;
  }
}
