const { pool } = require('../config/db');

const applyLeave = async (req, res, next) => {
  try {
    const { leave_type, start_date, end_date, reason } = req.body;
    const employeeId = req.user.id;

    if (!leave_type || !start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'Leave type, start date, and end date are required' });
    }

    if (!['Casual Leave', 'Sick Leave'].includes(leave_type)) {
      return res.status(400).json({ success: false, message: 'Leave type must be Casual Leave or Sick Leave' });
    }

    const start = new Date(start_date);
    const end = new Date(end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      return res.status(400).json({ success: false, message: 'Start date must be today or a future date' });
    }
    if (end < start) {
      return res.status(400).json({ success: false, message: 'End date must be on or after start date' });
    }

    const daysRequested = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const [balances] = await pool.query(
      'SELECT * FROM leave_balances WHERE employee_id = ?',
      [employeeId]
    );

    if (balances.length === 0) {
      return res.status(400).json({ success: false, message: 'Leave balance not found' });
    }

    const balance = balances[0];
    const col = leave_type === 'Casual Leave' ? 'casual' : 'sick';
    const remaining = balance[`${col}_allocated`] - balance[`${col}_used`];

    if (remaining < daysRequested) {
      return res.status(400).json({
        success: false,
        message: `Insufficient ${leave_type} balance. Available: ${remaining}, Requested: ${daysRequested}`,
      });
    }

    await pool.query(
      `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason) VALUES (?, ?, ?, ?, ?)`,
      [employeeId, leave_type, start_date, end_date, reason || null]
    );

    res.status(201).json({ success: true, message: 'Leave request submitted successfully' });
  } catch (error) {
    next(error);
  }
};

const getMyLeaves = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const offset = (page - 1) * limit;
    const { status, leave_type } = req.query;

    const whereClauses = ['employee_id = ?'];
    const params = [req.user.id];

    if (status) { whereClauses.push('status = ?'); params.push(status); }
    if (leave_type) { whereClauses.push('leave_type = ?'); params.push(leave_type); }

    const whereStr = 'WHERE ' + whereClauses.join(' AND ');

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM leave_requests ${whereStr}`,
      params
    );
    const total = countResult[0].total;

    const [rows] = await pool.query(
      `SELECT lr.*, u.name as approved_by_name
       FROM leave_requests lr
       LEFT JOIN users u ON lr.approved_by = u.id
       ${whereStr}
       ORDER BY lr.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 },
    });
  } catch (error) {
    next(error);
  }
};

const getMyLeaveBalance = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM leave_balances WHERE employee_id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Leave balance not found' });
    }

    const b = rows[0];
    const data = {
      casual: {
        allocated: b.casual_allocated,
        used: b.casual_used,
        remaining: b.casual_allocated - b.casual_used,
      },
      sick: {
        allocated: b.sick_allocated,
        used: b.sick_used,
        remaining: b.sick_allocated - b.sick_used,
      },
    };

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getPendingLeaves = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT lr.*, u.name, u.employee_id as emp_id, u.department
       FROM leave_requests lr
       JOIN users u ON lr.employee_id = u.id
       WHERE lr.status = 'pending'
       ORDER BY lr.created_at ASC`
    );

    res.json({ success: true, data: rows, count: rows.length });
  } catch (error) {
    next(error);
  }
};

const getAllLeaves = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const offset = (page - 1) * limit;
    const { status, leave_type, employee_id, startDate, endDate } = req.query;

    const whereClauses = [];
    const params = [];

    if (status) { whereClauses.push('lr.status = ?'); params.push(status); }
    if (leave_type) { whereClauses.push('lr.leave_type = ?'); params.push(leave_type); }
    if (employee_id) { whereClauses.push('lr.employee_id = ?'); params.push(employee_id); }
    if (startDate) { whereClauses.push('lr.start_date >= ?'); params.push(startDate); }
    if (endDate) { whereClauses.push('lr.end_date <= ?'); params.push(endDate); }

    const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM leave_requests lr JOIN users u ON lr.employee_id = u.id ${whereStr}`,
      params
    );
    const total = countResult[0].total;

    const [rows] = await pool.query(
      `SELECT lr.*, u.name, u.employee_id as emp_id, u.department, u2.name as approved_by_name
       FROM leave_requests lr
       JOIN users u ON lr.employee_id = u.id
       LEFT JOIN users u2 ON lr.approved_by = u2.id
       ${whereStr}
       ORDER BY lr.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 },
    });
  } catch (error) {
    next(error);
  }
};

const approveLeave = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const [requests] = await connection.query(
      'SELECT * FROM leave_requests WHERE id = ?',
      [id]
    );

    if (requests.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    const leaveReq = requests[0];
    if (leaveReq.status !== 'pending') {
      connection.release();
      return res.status(400).json({ success: false, message: `Leave request is already ${leaveReq.status}` });
    }

    await connection.beginTransaction();

    await connection.query(
      'UPDATE leave_requests SET status = ?, approved_by = ? WHERE id = ?',
      ['approved', adminId, id]
    );

    const start = new Date(leaveReq.start_date);
    const end = new Date(leaveReq.end_date);
    const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const col = leaveReq.leave_type === 'Casual Leave' ? 'casual_used' : 'sick_used';
    await connection.query(
      `UPDATE leave_balances SET ${col} = ${col} + ? WHERE employee_id = ?`,
      [days, leaveReq.employee_id]
    );

    await connection.query(
      `INSERT INTO notifications (notification_type, title, message, related_id)
       VALUES ('leave', ?, ?, ?)`,
      [
        'Leave Approved',
        `Your ${leaveReq.leave_type} request from ${leaveReq.start_date} to ${leaveReq.end_date} has been approved.`,
        leaveReq.employee_id,
      ]
    );

    await connection.commit();
    connection.release();

    res.json({ success: true, message: 'Leave request approved successfully' });
  } catch (error) {
    await connection.rollback().catch(() => {});
    connection.release();
    next(error);
  }
};

const rejectLeave = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const [requests] = await pool.query('SELECT * FROM leave_requests WHERE id = ?', [id]);

    if (requests.length === 0) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    const leaveReq = requests[0];
    if (leaveReq.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Leave request is already ${leaveReq.status}` });
    }

    await pool.query(
      "UPDATE leave_requests SET status = 'rejected' WHERE id = ?",
      [id]
    );

    await pool.query(
      `INSERT INTO notifications (notification_type, title, message, related_id)
       VALUES ('leave', ?, ?, ?)`,
      [
        'Leave Rejected',
        `Your ${leaveReq.leave_type} request from ${leaveReq.start_date} to ${leaveReq.end_date} has been rejected${reason ? ': ' + reason : '.'}`,
        leaveReq.employee_id,
      ]
    );

    res.json({ success: true, message: 'Leave request rejected' });
  } catch (error) {
    next(error);
  }
};

const adjustLeaveBalance = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { employee_id, leave_type, adjustment_days, reason, target } = req.body;

    if (!employee_id || !leave_type || adjustment_days === undefined || !reason) {
      connection.release();
      return res.status(400).json({ success: false, message: 'Employee ID, leave type, adjustment days, and reason are required' });
    }

    if (!['Casual Leave', 'Sick Leave'].includes(leave_type)) {
      connection.release();
      return res.status(400).json({ success: false, message: 'Leave type must be Casual Leave or Sick Leave' });
    }

    const adj = parseFloat(adjustment_days);
    if (isNaN(adj) || adj === 0) {
      connection.release();
      return res.status(400).json({ success: false, message: 'Adjustment days must be a non-zero number' });
    }

    const [employees] = await connection.query('SELECT id FROM users WHERE id = ?', [employee_id]);
    if (employees.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    await connection.beginTransaction();

    const col = leave_type === 'Casual Leave' ? 'casual' : 'sick';
    if (target === 'allocated') {
      if (adj > 0) {
        await connection.query(
          `UPDATE leave_balances SET ${col}_allocated = ${col}_allocated + ? WHERE employee_id = ?`,
          [adj, employee_id]
        );
      } else {
        await connection.query(
          `UPDATE leave_balances SET ${col}_allocated = GREATEST(${col}_allocated - ?, 0) WHERE employee_id = ?`,
          [Math.abs(adj), employee_id]
        );
      }
    } else {
      if (adj > 0) {
        await connection.query(
          `UPDATE leave_balances SET ${col}_used = GREATEST(${col}_used - ?, 0) WHERE employee_id = ?`,
          [adj, employee_id]
        );
      } else {
        await connection.query(
          `UPDATE leave_balances SET ${col}_used = ${col}_used + ? WHERE employee_id = ?`,
          [Math.abs(adj), employee_id]
        );
      }
    }

    await connection.query(
      `INSERT INTO leave_adjustment_logs (employee_id, leave_type, adjustment_days, reason, admin_id) VALUES (?, ?, ?, ?, ?)`,
      [employee_id, leave_type, adj, reason, req.user.id]
    );

    await connection.commit();
    connection.release();

    res.json({ success: true, message: 'Leave balance adjusted successfully' });
  } catch (error) {
    await connection.rollback().catch(() => {});
    connection.release();
    next(error);
  }
};

const getLeaveAdjustmentLogs = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const offset = (page - 1) * limit;
    const { employee_id } = req.query;

    const whereClauses = [];
    const params = [];

    if (employee_id) { whereClauses.push('lal.employee_id = ?'); params.push(employee_id); }

    const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM leave_adjustment_logs lal ${whereStr}`,
      params
    );
    const total = countResult[0].total;

    const [rows] = await pool.query(
      `SELECT lal.*, u.name as employee_name, u.employee_id as emp_id, a.name as admin_name
       FROM leave_adjustment_logs lal
       JOIN users u ON lal.employee_id = u.id
       LEFT JOIN users a ON lal.admin_id = a.id
       ${whereStr}
       ORDER BY lal.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyLeave, getMyLeaves, getMyLeaveBalance, getPendingLeaves,
  getAllLeaves, approveLeave, rejectLeave, adjustLeaveBalance, getLeaveAdjustmentLogs,
};
