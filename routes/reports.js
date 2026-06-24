const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const { dailyReport, monthlyReport, departmentReport, exportReport } = require('../controllers/reportController');

router.use(adminAuth);

router.get('/daily', dailyReport);
router.get('/monthly', monthlyReport);
router.get('/department', departmentReport);
router.get('/export', exportReport);

module.exports = router;
