const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const employeeRoutes = require('./employees');
const attendanceRoutes = require('./attendance');
const leaveRoutes = require('./leaves');
const notificationRoutes = require('./notifications');
const reportRoutes = require('./reports');

router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leaves', leaveRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);

module.exports = router;
