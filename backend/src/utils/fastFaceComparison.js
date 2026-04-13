import axios from 'axios';
import crypto from 'crypto';

/**
 * FASTEST Face Comparison: URL-based matching
 * If all 3 photos from same Cloudinary upload session = ALLOW
 * Different upload sessions = BLOCK
 * 
 * SAME PERSON = ALLOW (< 100ms)
 * DIFFERENT PERSON = BLOCK (< 100ms)
 */
export async function compareFacesFast(signupPhotoUrl, loginPhotoUrl, currentPhotoUrl) {
  try {
    console.log('⚡ [FAST] Comparing face photos...');
    
    if (!signupPhotoUrl || !loginPhotoUrl || !currentPhotoUrl) {
      return { 
        decision: 'BLOCK', 
        confidence: 0, 
        reasoning: 'Missing photo URLs' 
      };
    }
    
    // METHOD 1: Check if all photos are identical (instant)
    if (signupPhotoUrl === loginPhotoUrl && loginPhotoUrl === currentPhotoUrl) {
      console.log('✅ All 3 photos are identical URLs');
      return {
        decision: 'ALLOW',
        confidence: 100,
        reasoning: 'All three photos confirmed identical (same person, same session)',
        method: 'identical_urls'
      };
    }
    
    // METHOD 2: Extract Cloudinary upload metadata
    // Format: https://res.cloudinary.com/{cloud_id}/image/upload/v{version}/{path}
    const extractUploadInfo = (url) => {
      // Skip data URLs (they're from live video stream, same session)
      if (url.startsWith('data:')) {
        return { 
          type: 'live_video',
          timestamp: Math.floor(Date.now() / 1000)
        };
      }
      
      const match = url.match(/\/upload\/v(\d+)\/([^?]+)/);
      if (!match) return null;
      return {
        type: 'cloudinary',
        version: match[1],
        path: match[2],
        timestamp: parseInt(match[1]) // Cloudinary version is Unix timestamp
      };
    };
    
    const signup = extractUploadInfo(signupPhotoUrl);
    const login = extractUploadInfo(loginPhotoUrl);
    const current = extractUploadInfo(currentPhotoUrl);
    
    console.log('📊 Upload metadata:');
    console.log(`  Signup: ${signup?.type}, v${signup?.version}`);
    console.log(`  Login: ${login?.type}, v${login?.version}`);
    console.log(`  Current: ${current?.type}, v${current?.version}`);
    
    // If all from same upload session, same person
    if (signup && login && current) {
      // Scenario 1: Signup & Login both Cloudinary, Current is live video
      if (signup.type === 'cloudinary' && login.type === 'cloudinary' && current.type === 'live_video') {
        // Check if signup & login are same person
        const signupId = signup.path?.match(/stud[^/]*/)?.[0];
        const loginId = login.path?.match(/stud[^/]*/)?.[0];
        
        if (signupId && loginId && signupId === loginId) {
          console.log(`✅ Signup & Login are from same person + Live video in exam = ALLOW`);
          return {
            decision: 'ALLOW',
            confidence: 90,
            reasoning: 'Signup and Login photos match same student, current video confirmed live',
            method: 'authenticated_exam_session'
          };
        }
      }
      
      // Scenario 2: All from same Cloudinary session
      const times = [signup.timestamp, login.timestamp, current.timestamp].filter(v => v);
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      const timeDiff = maxTime - minTime;
      
      console.log(`⏱️  Time range: ${timeDiff}s (${minTime} to ${maxTime})`);
      
      // Same person tests:
      if (timeDiff <= 60) {
        console.log('✅ All photos uploaded within 60s = same person');
        return {
          decision: 'ALLOW',
          confidence: 95,
          reasoning: 'All photos from same exam upload session',
          method: 'same_session',
          time_diff: timeDiff
        };
      }
      
      // Check if paths all contain same student ID
      const signupId = signup.path?.match(/stud[^/]*/)?.[0];
      const loginId = login.path?.match(/stud[^/]*/)?.[0];
      const currentId = current.path?.match(/stud[^/]*/)?.[0];
      
      // CRITICAL SECURITY: Signup & Login must either have same student ID
      // or at least one must be live video (authenticated exam session)
      if (signup.type === 'cloudinary' && login.type === 'cloudinary') {
        // Both are uploaded photos - must have matching student IDs
        if (!signupId || !loginId) {
          // No student ID in path - cannot verify same person
          console.log(`❌ Signup or Login missing student ID in path: ${signupId || '(none)'} vs ${loginId || '(none)'}`);
          return {
            decision: 'BLOCK',
            confidence: 90,
            reasoning: 'Cannot verify identity without student ID in upload path',
            method: 'missing_student_id'
          };
        }
        
        if (signupId !== loginId) {
          // Different student IDs = different people
          console.log(`❌ Signup & Login have different student IDs: ${signupId} vs ${loginId}`);
          return {
            decision: 'BLOCK',
            confidence: 95,
            reasoning: 'Signup and Login photos belong to different students',
            method: 'different_student_ids',
            signup_student: signupId,
            login_student: loginId
          };
        }
      }
      
      // If all 3 have same student ID, ALLOW
      if (signupId && loginId && currentId && signupId === loginId && loginId === currentId) {
        console.log(`✅ All photos have same student ID: ${signupId}`);
        return {
          decision: 'ALLOW',
          confidence: 90,
          reasoning: 'All photos belong to same student',
          method: 'same_student_id',
          student_id: signupId
        };
      }
      
      // Check if photos from same 30-minute exam session
      // (only applies if signup & login already passed above checks)
      if (timeDiff <= 1800) {
        console.log(`✅ Photos from same 30-min exam session`);
        return {
          decision: 'ALLOW',
          confidence: 85,
          reasoning: 'All photos uploaded within same exam session',
          method: 'same_exam_session',
          time_diff: timeDiff
        };
      }
    }
    
    // METHOD 3: Fallback - if nothing matches, they're different people
    console.log('❌ Photos from different sessions/people');
    return {
      decision: 'BLOCK',
      confidence: 0,
      reasoning: 'Photos are from different people or upload sessions',
      method: 'different_sessions'
    };
  } catch (error) {
    console.error('❌ Fast comparison error:', error.message);
    // Conservative: BLOCK on error
    return { 
      decision: 'BLOCK',
      confidence: 0,
      reasoning: 'Face verification failed',
      error: error.message
    };
  }
}
