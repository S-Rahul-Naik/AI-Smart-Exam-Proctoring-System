import express from 'express';
import {
  createAlert,
  getAlerts,
  acknowledgeAlert,
  resolveAlert,
} from '../controllers/alertController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, createAlert);
router.get('/', authenticate, authorize('admin', 'reviewer', 'superadmin'), getAlerts);
router.patch('/:alertId/acknowledge', authenticate, authorize('admin', 'superadmin'), acknowledgeAlert);
router.patch('/:alertId/resolve', authenticate, authorize('admin', 'superadmin'), resolveAlert);

export default router;
