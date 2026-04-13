/**
 * Screen Recording Service
 * Records exam session for evidence and review
 */

export const screenRecordingService = {
  mediaRecorder: null,
  recordedChunks: [],
  recordingState: 'idle', // idle | recording | paused | stopped

  /**
   * Start recording exam session
   */
  async startRecording(videoStream, audioStream = null) {
    try {
      // Combine video and audio
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const video = videoStream.getVideoTracks()[0];
      
      if (!video) {
        throw new Error('No video stream available');
      }

      const { width, height } = video.getSettings();
      canvas.width = width || 1280;
      canvas.height = height || 720;

      // Create MediaRecorder with combined streams
      const recordingCanvas = document.createElement('canvas');
      recordingCanvas.width = canvas.width;
      recordingCanvas.height = canvas.height;

      const canvasStream = recordingCanvas.captureStream(30); // 30 FPS

      // Add audio if available
      if (audioStream) {
        const audioTracks = audioStream.getAudioTracks();
        audioTracks.forEach(track => canvasStream.addTrack(track));
      }

      this.mediaRecorder = new MediaRecorder(canvasStream, {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 2500000, // 2.5 Mbps
      });

      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      this.recordingState = 'recording';

      console.log('📹 Screen recording started');
      return { success: true };
    } catch (error) {
      console.error('Recording start error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Stop recording
   */
  stopRecording() {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve({ success: false, error: 'No active recording' });
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);

        this.recordingState = 'stopped';
        resolve({ success: true, videoUrl, blob });
      };

      this.mediaRecorder.stop();
    });
  },

  /**
   * Pause recording
   */
  pauseRecording() {
    if (this.mediaRecorder && this.recordingState === 'recording') {
      this.mediaRecorder.pause();
      this.recordingState = 'paused';
      return { success: true };
    }
    return { success: false };
  },

  /**
   * Resume recording
   */
  resumeRecording() {
    if (this.mediaRecorder && this.recordingState === 'paused') {
      this.mediaRecorder.resume();
      this.recordingState = 'recording';
      return { success: true };
    }
    return { success: false };
  },

  /**
   * Upload recording to server
   */
  async uploadRecording(sessionId, blob) {
    try {
      const formData = new FormData();
      formData.append('video', blob, 'exam-recording.webm');
      formData.append('sessionId', sessionId);

      const response = await fetch('/api/sessions/upload-recording', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return { success: true, url: (await response.json()).url };
    } catch (error) {
      console.error('Recording upload error:', error);
      return { success: false, error: error.message };
    }
  },
};
