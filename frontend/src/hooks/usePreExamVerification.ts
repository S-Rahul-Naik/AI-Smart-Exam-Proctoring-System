import { useState, useEffect, useRef } from 'react';
import { sessionAPI } from '../services/api';
import { useAuth } from './useAuth';

/**
 * Pre-Exam Verification Hook
 * Handles identity verification before exam can start
 */

export function usePreExamVerification(examId) {
  const { user } = useAuth();
  const [verificationState, setVerificationState] = useState({
    step: 'rules', // rules | reading | identity_setup | selfie_capture | id_capture | verification | ready
    rulesAccepted: false,
    identityVerified: false,
    selfieUrl: null,
    idPhotoUrl: null,
    loading: false,
    error: null,
    attempts: 0,
    maxAttempts: 3,
  });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Step 1: Show Rules
  const acceptRules = () => {
    setVerificationState((prev) => ({
      ...prev,
      rulesAccepted: true,
      step: 'identity_setup',
    }));
  };

  // Step 2: Setup Identity Verification
  const startIdentityVerification = async () => {
    try {
      setVerificationState((prev) => ({
        ...prev,
        loading: true,
        step: 'selfie_capture',
      }));
    } catch (error) {
      setVerificationState((prev) => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
    }
  };

  // Step 3: Capture Selfie
  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const ctx = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;

      ctx.drawImage(videoRef.current, 0, 0);
      const selfieUrl = canvasRef.current.toDataURL('image/jpeg', 0.95);

      setVerificationState((prev) => ({
        ...prev,
        selfieUrl,
        step: 'id_capture',
      }));
    } catch (error) {
      setVerificationState((prev) => ({
        ...prev,
        error: error.message,
      }));
    }
  };

  // Step 4: Capture ID Photo
  const captureIDPhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const ctx = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;

      ctx.drawImage(videoRef.current, 0, 0);
      const idPhotoUrl = canvasRef.current.toDataURL('image/jpeg', 0.95);

      setVerificationState((prev) => ({
        ...prev,
        idPhotoUrl,
        step: 'verification',
        loading: true,
      }));

      // Call verification API
      verifyIdentity(
        verificationState.selfieUrl,
        idPhotoUrl
      );
    } catch (error) {
      setVerificationState((prev) => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
    }
  };

  // Step 5: Verify Identity
  const verifyIdentity = async (selfieUrl, idPhotoUrl) => {
    try {
      // TODO: Call backend identity verification endpoint
      // const response = await sessionAPI.verifyIdentity({
      //   examId,
      //   selfieUrl,
      //   idPhotoUrl
      // });

      // Simulate verification (85-95% confidence)
      const confidence = Math.random() * 20 + 75;

      if (confidence >= 80) {
        setVerificationState((prev) => ({
          ...prev,
          identityVerified: true,
          step: 'ready',
          loading: false,
          error: null,
        }));
      } else {
        setVerificationState((prev) => ({
          ...prev,
          error: `Face match below threshold (${Math.round(confidence)}%). Try again.`,
          attempts: prev.attempts + 1,
          step: prev.attempts + 1 >= prev.maxAttempts ? 'failed' : 'selfie_capture',
          selfieUrl: null,
          idPhotoUrl: null,
          loading: false,
        }));
      }
    } catch (error) {
      setVerificationState((prev) => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
    }
  };

  const retryVerification = () => {
    setVerificationState((prev) => ({
      ...prev,
      step: 'selfie_capture',
      selfieUrl: null,
      idPhotoUrl: null,
    }));
  };

  return {
    ...verificationState,
    videoRef,
    canvasRef,
    acceptRules,
    startIdentityVerification,
    captureSelfie,
    captureIDPhoto,
    verifyIdentity,
    retryVerification,
  };
}
