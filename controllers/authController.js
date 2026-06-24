const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const config = require('../config/config');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const [users] = await pool.query(
      'SELECT id, employee_id, name, email, password_hash, role, department, status FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = users[0];

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const tokenPayload = {
      id: user.id,
      employee_id: user.employee_id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      status: user.status,
    };

    const token = jwt.sign(tokenPayload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

    res.json({
      success: true,
      token,
      user: tokenPayload,
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.employee_id, u.name, u.email, u.phone, u.department, u.role, u.status, u.created_at,
              lb.casual_allocated, lb.casual_used, lb.sick_allocated, lb.sick_used
       FROM users u
       LEFT JOIN leave_balances lb ON u.id = lb.employee_id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = users[0];
    user.leave_balance = {
      casual: {
        allocated: user.casual_allocated || 0,
        used: user.casual_used || 0,
        remaining: (user.casual_allocated || 0) - (user.casual_used || 0),
      },
      sick: {
        allocated: user.sick_allocated || 0,
        used: user.sick_used || 0,
        remaining: (user.sick_allocated || 0) - (user.sick_used || 0),
      },
    };
    delete user.casual_allocated;
    delete user.casual_used;
    delete user.sick_allocated;
    delete user.sick_used;

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Old password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const [users] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword, users[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, req.user.id]);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

const employeeLogin = async (req, res, next) => {
  try {
    const { employee_code } = req.body;

    if (!employee_code) {
      return res.status(400).json({ success: false, message: 'Employee code is required' });
    }

    const [users] = await pool.query(
      'SELECT id, employee_id, name, email, password_hash, role, department, status FROM users WHERE employee_id = ?',
      [employee_code]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid employee code' });
    }

    const user = users[0];

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact admin.' });
    }

    const tokenPayload = {
      id: user.id,
      employee_id: user.employee_id,
      name: user.name,
      email: user.email,
      role: 'employee',
      department: user.department,
      status: user.status,
    };

    const token = jwt.sign(tokenPayload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

    res.json({
      success: true,
      token,
      user: tokenPayload,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, getProfile, changePassword, employeeLogin };
