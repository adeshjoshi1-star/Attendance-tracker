const express = require('express');
const router = express.Router();
const { login, getProfile, changePassword, employeeLogin } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/login', login);
router.post('/employee-login', employeeLogin);
router.get('/profile', auth, getProfile);
router.put('/change-password', auth, changePassword);

module.exports = router;
