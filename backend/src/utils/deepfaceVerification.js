import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * DeepFace ArcFace verification via Python subprocess
 * Downloads model locally on first use
 * Compares 2 photos (signup vs login) using ArcFace
 * Login photo is already verified from login flow
 * No live webcam comparison needed
 */

// Python script that will be executed
const pythonScript = `
import sys
import json
from deepface import DeepFace

def verify_faces(signup_url, login_url):
    """
    Compare signup vs login using ArcFace
    Login is already verified identity, so if it matches signup = same person
    Returns: {
        "verified": bool,
        "distance": float,
        "decision": "ALLOW" | "BLOCK",
        "confidence": int (0-100),
        "reasoning": string
    }
    """
    try:
        print(f"[DEEPFACE] Comparing signup vs login photos...", file=sys.stderr)
        result = DeepFace.verify(signup_url, login_url, model_name="ArcFace", enforce_detection=False)
        
        verified = result["verified"]
        distance = result.get("distance", 999)
        
        if verified:
            # Convert distance to confidence (lower distance = higher confidence)
            # Distance 0.30 = 97% confidence (excellent match)
            # Distance 0.35 = 90% confidence (good match - threshold)
            # Distance 0.40 = 88% confidence (decent match)
            # Min confidence for match: 88%
            confidence = max(88, int(100 - (distance * 28)))
            confidence = int(confidence)  # Explicit int conversion
            
            print(f"[VERIFIED] Distance: {distance:.4f}, Confidence: {confidence}%", file=sys.stderr)
            
            return {
                "decision": "ALLOW",
                "verified": True,
                "distance": round(distance, 4),
                "confidence": confidence,
                "reasoning": f"Signup and login photos MATCH (distance: {distance:.4f}) - same person verified",
                "method": "arcface_2photo"
            }
        else:
            # Photos don't match = different person
            # Calculate what distance we got
            # If distance > 0.6, they're quite different
            if distance > 0.60:
                confidence = 92  # Very confident they're different
            elif distance > 0.50:
                confidence = 85  # Confident they're different
            else:
                confidence = 75  # Somewhat different
                
            confidence = int(confidence)  # Explicit int conversion
            
            print(f"[NOT_VERIFIED] Distance: {distance:.4f}, Confidence: {confidence}%", file=sys.stderr)
            
            return {
                "decision": "BLOCK",
                "verified": False,
                "distance": round(distance, 4),
                "confidence": confidence,
                "reasoning": f"Signup and login photos do NOT MATCH (distance: {distance:.4f}) - different person BLOCKED",
                "method": "arcface_2photo"
            }
            
    except Exception as e:
        error_msg = str(e)
        print(f"[ERROR] Face verification exception: {error_msg}", file=sys.stderr)
        # Return BLOCK but with reasonable confidence (error case, not a successful non-match)
        return {
            "decision": "BLOCK",
            "verified": False,
            "distance": 999,
            "confidence": 0,
            "error": error_msg,
            "reasoning": f"Face verification failed - please ensure photos are clear and show face: {error_msg}",
            "method": "arcface_error"
        }

# Read arguments from command line
signup_url = sys.argv[1]
login_url = sys.argv[2]

result = verify_faces(signup_url, login_url)
print(json.dumps(result))
`;

/**
 * Execute Python DeepFace verification
 * Compares signup vs login photos only
 * @param {string} signupPhotoUrl - Cloudinary URL of signup photo
 * @param {string} loginPhotoUrl - Cloudinary URL of login photo (most recent verified)
 * @returns {Promise<Object>} Verification result
 */
export async function verifyFacesWithDeepFace(signupPhotoUrl, loginPhotoUrl) {
  return new Promise((resolve) => {
    try {
      console.log('🧠 [DeepFace] Comparing signup vs login using ArcFace model...');
      
      // Use venv Python (located at project root: proctor/.venv/Scripts/python.exe)
      // __dirname is backend/src/utils, so go up 3 levels to reach project root
      const venvPythonPath = path.join(__dirname, '../../../.venv/Scripts/python.exe');
      const pythonExe = venvPythonPath;
      
      console.log(`   Using Python: ${pythonExe}`);
      
      // Set UTF-8 encoding for Python to handle emoji in DeepFace logging
      // Suppress TensorFlow warnings and oneDNN info messages
      const env = {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUNBUFFERED: '1',
        TF_CPP_MIN_LOG_LEVEL: '3',  // Suppress all TensorFlow logging
        TF_FORCE_GPU_ALLOW_GROWTH: 'true'
      };
      
      // Spawn Python process with explicit venv path and UTF-8 encoding
      const python = spawn(pythonExe, [
        '-c',
        pythonScript,
        signupPhotoUrl,
        loginPhotoUrl
      ], {
        env: env,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        const errorText = data.toString();
        errorOutput += errorText;
        // Only log actual errors, filter out warnings and info messages
        if (errorText.includes('[ERROR]') || errorText.includes('Traceback') || errorText.includes('Error:')) {
          console.error('Python error:', errorText);
        }
      });

      python.on('close', (code) => {
        try {
          if (code === 0 && output) {
            const result = JSON.parse(output.trim());
            console.log(`✅ [DeepFace] Result: ${result.decision}`);
            console.log(`   Distance: ${result.distance}`);
            console.log(`   Confidence: ${result.confidence}%`);
            console.log(`   Verified: ${result.verified}`);
            resolve(result);
          } else {
            console.error('❌ [DeepFace] Process failed with code:', code);
            console.error('Error output:', errorOutput);
            resolve({
              decision: 'BLOCK',
              verified: false,
              distance: 999,
              confidence: 0,
              reasoning: `Python process failed: ${errorOutput}`,
              method: 'arcface_error'
            });
          }
        } catch (e) {
          console.error('❌ [DeepFace] JSON parse error:', e.message);
          console.error('Raw output:', output);
          resolve({
            decision: 'BLOCK',
            verified: false,
            distance: 999,
            confidence: 0,
            reasoning: `Response parsing failed: ${e.message}`,
            method: 'arcface_error'
          });
        }
      });

      // Timeout after 5 minutes (300 seconds)
      // First run takes longer because:
      // - TensorFlow initialization: 10-15s
      // - ArcFace model download (137MB): 30-60s (depends on network speed)
      // - Face comparison: 5-10s
      // Subsequent runs are much faster (8-15s) since model is cached
      setTimeout(() => {
        python.kill();
        resolve({
          decision: 'BLOCK',
          verified: false,
          distance: 999,
          confidence: 0,
          reasoning: 'Face verification timeout (>300s) - model download may have failed or network is too slow',
          method: 'arcface_timeout'
        });
      }, 300000); // 300 seconds = 5 minutes

    } catch (error) {
      console.error('❌ [DeepFace] Error spawning Python:', error.message);
      resolve({
        decision: 'BLOCK',
        verified: false,
        confidence: 0,
        reasoning: `Verification error: ${error.message}`,
        method: 'arcface_error'
      });
    }
  });
}

/**
 * Compare live exam face with enrollment photo
 * Used for continuous identity verification during exams
 * @param {string} livePhotoBase64 - Base64 encoded JPEG from live video capture
 * @param {string} enrollmentPhotoUrl - Cloudinary URL of enrollment photo
 * @returns {Promise<Object>} Comparison result with similarity score
 */
export async function compareFacesPython(livePhotoBase64, enrollmentPhotoUrl) {
  const fs = await import('fs');
  const tmpFile = path.join(__dirname, `../../../.temp/live_face_${Date.now()}.jpg`);
  const tmpDir = path.dirname(tmpFile);

  return new Promise(async (resolve) => {
    try {
      console.log('🧠 [Exam Face Match] Comparing live face with enrollment photo...');
      
      // Ensure temp directory exists
      if (!fs.default.existsSync(tmpDir)) {
        fs.default.mkdirSync(tmpDir, { recursive: true });
      }

      // Decode base64 and write to temp file
      const buffer = Buffer.from(livePhotoBase64.replace(/^data:image\/(jpeg|jpg|png);base64,/, ''), 'base64');
      fs.default.writeFileSync(tmpFile, buffer);
      console.log(`   ✅ Saved live face to temporary file: ${tmpFile} (${buffer.length} bytes)`);

      // Python script for exam face comparison
      const examComparisonScript = `
import sys
import json
from deepface import DeepFace

def compare_exam_faces(live_photo_path, enrollment_url):
    """
    Compare live exam face with enrollment photo
    Returns similarity score (0-100) and whether they're same person
    """
    try:
        print(f"[EXAM] Comparing exam face: {live_photo_path[:50]}... vs enrollment", file=sys.stderr)
        result = DeepFace.verify(live_photo_path, enrollment_url, model_name="ArcFace", enforce_detection=False)
        
        verified = result["verified"]
        distance = result.get("distance", 999)
        
        # Convert distance to similarity percentage
        # Distance 0.30 (verified=True) = 97% similar
        # Distance 0.35 (verified boundary) = 90% similar
        # Distance 0.50+ (verified=False) = lower similarity
        if verified:
            similarity = max(70, int(100 - (distance * 28)))
        else:
            if distance < 0.40:
                similarity = 65
            elif distance < 0.50:
                similarity = 55
            else:
                similarity = max(0, int(100 - (distance * 100)))
        
        similarity = int(similarity)
        
        print(f"[RESULT] Distance: {distance:.4f}, Similarity: {similarity}%, Same: {verified}", file=sys.stderr)
        
        return {
            "success": True,
            "similarity": similarity,
            "isSamePerson": verified,
            "distance": round(distance, 4),
            "confidence": "high" if verified else "low",
            "method": "arcface_exam"
        }
    except Exception as e:
        error_msg = str(e)
        print(f"[ERROR] Exam face comparison failed: {error_msg}", file=sys.stderr)
        return {
            "success": False,
            "similarity": 0,
            "isSamePerson": False,
            "distance": 999,
            "confidence": "error",
            "error": error_msg,
            "method": "arcface_exam_error"
        }

live_path = sys.argv[1]
enrollment_url = sys.argv[2]
result = compare_exam_faces(live_path, enrollment_url)
print(json.dumps(result))
`;

      const venvPythonPath = path.join(__dirname, '../../../.venv/Scripts/python.exe');
      const env = {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUNBUFFERED: '1',
        TF_CPP_MIN_LOG_LEVEL: '3',
        TF_FORCE_GPU_ALLOW_GROWTH: 'true'
      };

      const python = spawn(venvPythonPath, [
        '-c',
        examComparisonScript,
        tmpFile,
        enrollmentPhotoUrl
      ], {
        env: env,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      python.on('close', (code) => {
        // Clean up temp file
        try {
          if (fs.default.existsSync(tmpFile)) {
            fs.default.unlinkSync(tmpFile);
          }
        } catch (e) {
          console.log('   ⚠️ Could not delete temp file:', e.message);
        }

        try {
          if (code === 0 && output) {
            const result = JSON.parse(output.trim());
            console.log(`   ✅ [Exam Match] Similarity: ${result.similarity}%, Same person: ${result.isSamePerson}`);
            resolve(result);
          } else {
            console.error('❌ [Exam] Python process failed with code:', code);
            console.error('Error output:', errorOutput);
            resolve({
              success: false,
              similarity: 0,
              isSamePerson: false,
              distance: 999,
              confidence: 'error',
              error: `Process failed: ${errorOutput}`,
              method: 'arcface_exam_error'
            });
          }
        } catch (e) {
          console.error('❌ [Exam] JSON parse error:', e.message);
          resolve({
            success: false,
            similarity: 0,
            isSamePerson: false,
            distance: 999,
            confidence: 'error',
            error: `Parse error: ${e.message}`,
            method: 'arcface_exam_error'
          });
        }
      });

      // Timeout after 2 minutes for exam face checks (faster than initial signup)
      setTimeout(() => {
        python.kill();
        try {
          if (fs.default.existsSync(tmpFile)) {
            fs.default.unlinkSync(tmpFile);
          }
        } catch (e) {}
        resolve({
          success: false,
          similarity: 0,
          isSamePerson: false,
          distance: 999,
          confidence: 'error',
          error: 'Timeout (>120s) - face comparison took too long',
          method: 'arcface_exam_timeout'
        });
      }, 120000); // 2 minutes

    } catch (error) {
      console.error('❌ [Exam] Error in face comparison:', error.message);
      // Try to clean up
      try {
        const fs2 = await import('fs');
        if (fs2.default.existsSync(tmpFile)) {
          fs2.default.unlinkSync(tmpFile);
        }
      } catch (e) {}
      resolve({
        success: false,
        similarity: 0,
        isSamePerson: false,
        distance: 999,
        confidence: 'error',
        error: error.message,
        method: 'arcface_exam_error'
      });
    }
  });
}
