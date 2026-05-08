const express = require('express');
const router = express.Router();
const {
  getLogs,
  getAlerts,
  getStats,
  resolveAlert,
} = require('../controllers/logsController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication + analyst/admin role
router.use(protect);
router.use(authorize('admin', 'analyst'));

router.get('/', getLogs);
router.get('/alerts', getAlerts);
router.get('/stats', getStats);
router.patch('/alerts/:id/resolve', authorize('admin'), resolveAlert);

module.exports = router;
