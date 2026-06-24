const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const {
  markAttendance, getMyAttendance, getTodayStatus, getMonthlyStats,
  updateAttendance, getAllAttendance, getAttendanceById, getPendingAttendance,
} = require('../controllers/attendanceController');

router.post('/mark', auth, markAttendance);
router.get('/my', auth, getMyAttendance);
router.get('/today', auth, getTodayStatus);
router.get('/monthly-stats', auth, getMonthlyStats);
router.get('/', adminAuth, getAllAttendance);
router.get('/pending', adminAuth, getPendingAttendance);
router.put('/:id', adminAuth, updateAttendance);
router.get('/:id', adminAuth, getAttendanceById);

module.exports = router;
