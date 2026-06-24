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
router.put('/:id/deactivate', deactivateEmployee);
router.put('/:id/activate', activateEmployee);
router.put('/:id/reset-password', resetPassword);

module.exports = router;
