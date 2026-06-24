const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const DEFAULT_PASSWORD = 'password123';

const getEmployees = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const department = (req.query.department || '').trim();
    const status = (req.query.status || '').trim();

    const whereClauses = [];
    const params = [];

    if (search) {
      whereClauses.push('(u.name LIKE ? OR u.email LIKE ? OR u.employee_id LIKE ?)');
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern);
    }

    if (department) {
      whereClauses.push('u.department = ?');
      params.push(department);
    }

    if (status) {
      whereClauses.push('u.status = ?');
      params.push(status);
    }

    const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM users u ${whereStr}`,
      params
    );
    const total = countResult[0].total;

    const [rows] = await pool.query(
`SELECT u.id, u.employee_id, u.name, u.email, u.phone, u.department, u.role, u.status, u.created_at,
               lb.casual_allocated, lb.casual_used, lb.sick_allocated, lb.sick_used
        FROM users u
        LEFT JOIN leave_balances lb ON u.id = lb.employee_id ${whereStr}
        ORDER BY u.created_at DESC
        LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getEmployee = async (req, res, next) => {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.employee_id, u.name, u.email, u.phone, u.department, u.role, u.status, u.created_at,
              lb.casual_allocated, lb.casual_used, lb.sick_allocated, lb.sick_used
       FROM users u
       LEFT JOIN leave_balances lb ON u.id = lb.employee_id
       WHERE u.id = ?`,
      [req.params.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
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

const createEmployee = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { name, email, phone, department, role, casual_allocated, sick_allocated } = req.body;

    if (!name || !name.trim()) {
      connection.release();
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    if (!email || !email.trim()) {
      connection.release();
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    await connection.beginTransaction();

    const [maxResult] = await connection.query(
      "SELECT MAX(CAST(SUBSTRING(employee_id, 4) AS UNSIGNED)) as max_num FROM users WHERE employee_id LIKE 'EMP%'"
    );
    const nextNum = (maxResult[0].max_num || 0) + 1;
    const employeeId = 'EMP' + String(nextNum).padStart(4, '0');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, salt);

    const [result] = await connection.query(
      `INSERT INTO users (employee_id, name, email, phone, department, role, password_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [employeeId, name.trim(), email.trim().toLowerCase(), phone || null, department || 'Other', role || 'employee', hashedPassword]
    );

    const userId = result.insertId;

    await connection.query(
      `INSERT INTO leave_balances (employee_id, casual_allocated, casual_used, sick_allocated, sick_used)
       VALUES (?, ?, 0, ?, 0)`,
      [userId, casual_allocated || 12, sick_allocated || 10]
    );

    await connection.commit();
    connection.release();

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: { id: userId, employee_id: employeeId, name: name.trim(), email: email.trim().toLowerCase() },
    });
  } catch (error) {
    await connection.rollback().catch(() => {});
    connection.release();
    next(error);
  }
};

const updateEmployee = async (req, res, next) => {
  try {
    const { name, email, phone, department, status } = req.body;
    const { id } = req.params;

    const fields = [];
    const params = [];

    if (name !== undefined) { fields.push('name = ?'); params.push(name.trim()); }
    if (email !== undefined) { fields.push('email = ?'); params.push(email.trim().toLowerCase()); }
    if (phone !== undefined) { fields.push('phone = ?'); params.push(phone); }
    if (department !== undefined) { fields.push('department = ?'); params.push(department); }
    if (status !== undefined) { fields.push('status = ?'); params.push(status); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    params.push(id);

    const [result] = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({ success: true, message: 'Employee updated successfully' });
  } catch (error) {
    next(error);
  }
};

const deactivateEmployee = async (req, res, next) => {
  try {
    const [result] = await pool.query(
      "UPDATE users SET status = 'inactive' WHERE id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({ success: true, message: 'Employee deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

const activateEmployee = async (req, res, next) => {
  try {
    const [result] = await pool.query(
      "UPDATE users SET status = 'active' WHERE id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({ success: true, message: 'Employee activated successfully' });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, salt);

    const [result] = await pool.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [hashedPassword, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({ success: true, message: 'Password reset successfully to default' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmployees, getEmployee, createEmployee, updateEmployee,
  deactivateEmployee, activateEmployee, resetPassword,
};
