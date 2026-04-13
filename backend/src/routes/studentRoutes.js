import express from 'express';
import {
  registerStudent,
  loginStudent,
  getStudentProfile,
  updateStudentProfile,
  verifyFace,
  saveEnrollmentPhotoSignup,
  saveEnrollmentPhotoLogin,
  getEnrollmentPhotos,
  matchFaceForExam,
  comparePhotoForExam,
} from '../controllers/studentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerStudent);
router.post('/login', loginStudent);
router.get('/profile', authenticate, getStudentProfile);
router.put('/profile', authenticate, updateStudentProfile);
router.post('/verify-face', authenticate, verifyFace);
router.post('/enrollment-photos/signup', authenticate, saveEnrollmentPhotoSignup);
router.post('/enrollment-photos/login', authenticate, saveEnrollmentPhotoLogin);
router.get('/enrollment-photos', authenticate, getEnrollmentPhotos);

// Exam identity verification routes
router.post('/match-face-exam', authenticate, matchFaceForExam);
router.post('/compare-photo-exam', authenticate, comparePhotoForExam);

export default router;
