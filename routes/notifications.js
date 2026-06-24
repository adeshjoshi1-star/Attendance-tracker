const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const {
  getNotifications, markAsRead, markAllAsRead, getUnreadCount,
  getAttendanceReminders, getLeaveNotifications, getWfhAlerts,
} = require('../controllers/notificationController');

router.get('/', auth, getNotifications);
router.get('/unread-count', auth, getUnreadCount);
router.get('/attendance-reminders', adminAuth, getAttendanceReminders);
router.get('/leave-notifications', adminAuth, getLeaveNotifications);
router.get('/wfh-alerts', adminAuth, getWfhAlerts);
router.put('/:id/read', auth, markAsRead);
router.put('/read-all', auth, markAllAsRead);

module.exports = router;
