const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const {
  getEmployees, getEmployee, createEmployee, updateEmployee,
  deactivateEmployee, activateEmployee, resetPassword,
} = require('../controllers/employeeController');

router.use(adminAuth);

router.get('/', getEmployees);
router.get('/:id', getEmployee);
router.post('/', createEmployee);
router.put('/:id', updateEmployee);
router.patch('/:id/deactivate', deactivateEmployee);
router.patch('/:id/activate', activateEmployee);
router.post('/:id/reset-password', resetPassword);

module.exports = router;
