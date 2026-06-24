const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const {
  applyLeave, getMyLeaves, getMyLeaveBalance, getPendingLeaves,
  getAllLeaves, approveLeave, rejectLeave, adjustLeaveBalance, getLeaveAdjustmentLogs,
} = require('../controllers/leaveController');

router.post('/apply', auth, applyLeave);
router.get('/my', auth, getMyLeaves);
router.get('/my-balance', auth, getMyLeaveBalance);
router.get('/pending', adminAuth, getPendingLeaves);
router.get('/', adminAuth, getAllLeaves);
router.patch('/:id/approve', adminAuth, approveLeave);
router.patch('/:id/reject', adminAuth, rejectLeave);
router.post('/adjust-balance', adminAuth, adjustLeaveBalance);
router.get('/adjustment-logs', adminAuth, getLeaveAdjustmentLogs);

module.exports = router;
