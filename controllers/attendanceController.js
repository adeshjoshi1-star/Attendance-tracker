const { pool } = require('../config/db');

const markAttendance = async (req, res, next) => {
  try {
    const { attendance_status, remarks, attendance_date } = req.body;
    const employeeId = req.user.id;
    const date = attendance_date || new Date().toISOString().split('T')[0];

    if (!attendance_status) {
      return res.status(400).json({ success: false, message: 'Attendance status is required' });
    }

    const validStatuses = ['Present', 'Absent', 'Half Day', 'Work From Home', 'Casual Leave', 'Sick Leave'];
    if (!validStatuses.includes(attendance_status)) {
      return res.status(400).json({ success: false, message: 'Invalid attendance status' });
    }

    if (attendance_status === 'Casual Leave' || attendance_status === 'Sick Leave') {
      const [existing] = await pool.query(
        `SELECT lr.id FROM leave_requests lr
         WHERE lr.employee_id = ? AND lr.start_date = ? AND lr.status = 'pending'`,
        [employeeId, date]
      );
      if (existing.length > 0) {
        return res.status(409).json({ success: false, message: 'A leave request for this date is already pending' });
      }

      await pool.query(
        `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason)
         VALUES (?, ?, ?, ?, ?)`,
        [employeeId, attendance_status, date, date, remarks || 'Marked via attendance']
      );

      return res.status(201).json({ success: true, message: 'Leave request submitted for approval' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM attendance WHERE employee_id = ? AND attendance_date = ?',
      [employeeId, date]
    );

    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Attendance already marked for this date' });
    }

    await pool.query(
      'INSERT INTO attendance (employee_id, attendance_date, attendance_status, remarks) VALUES (?, ?, ?, ?)',
      [employeeId, date, attendance_status, remarks || null]
    );

    res.status(201).json({ success: true, message: 'Attendance marked successfully' });
  } catch (error) {
    next(error);
  }
};

const getMyAttendance = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const offset = (page - 1) * limit;
    const { startDate, endDate } = req.query;

    const whereClauses = ['employee_id = ?'];
    const params = [req.user.id];

    if (startDate) {
      whereClauses.push('attendance_date >= ?');
      params.push(startDate);
    }
    if (endDate) {
      whereClauses.push('attendance_date <= ?');
      params.push(endDate);
    }

    const whereStr = 'WHERE ' + whereClauses.join(' AND ');

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM attendance ${whereStr}`,
      params
    );
    const total = countResult[0].total;

    const [rows] = await pool.query(
      `SELECT * FROM attendance ${whereStr} ORDER BY attendance_date DESC LIMIT ? OFFSET ?`,
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

const getTodayStatus = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [rows] = await pool.query(
      'SELECT * FROM attendance WHERE employee_id = ? AND attendance_date = ?',
      [req.user.id, today]
    );

    res.json({
      success: true,
      data: rows.length > 0 ? rows[0] : null,
      marked: rows.length > 0,
    });
  } catch (error) {
    next(error);
  }
};

const getMonthlyStats = async (req, res, next) => {
  try {
    const now = new Date();
    const month = req.query.month ? String(req.query.month).padStart(2, '0') : String(now.getMonth() + 1).padStart(2, '0');
    const year = req.query.year || String(now.getFullYear());

    const [rows] = await pool.query(
      `SELECT attendance_status, COUNT(*) as count
       FROM attendance
       WHERE employee_id = ? AND YEAR(attendance_date) = ? AND MONTH(attendance_date) = ?
       GROUP BY attendance_status`,
      [req.user.id, year, month]
    );

    const stats = {
      present: 0, absent: 0, half_day: 0, wfh: 0, casual_leave: 0, sick_leave: 0, total: 0, percentage: 0,
    };

    for (const row of rows) {
      stats.total += row.count;
      switch (row.attendance_status) {
        case 'Present': stats.present = row.count; break;
        case 'Absent': stats.absent = row.count; break;
        case 'Half Day': stats.half_day = row.count; break;
        case 'Work From Home': stats.wfh = row.count; break;
        case 'Casual Leave': stats.casual_leave = row.count; break;
        case 'Sick Leave': stats.sick_leave = row.count; break;
      }
    }

    stats.percentage = stats.total > 0 ? Math.round(((stats.present + stats.wfh) / stats.total) * 100) : 0;

    res.json({ success: true, data: stats, month, year });
  } catch (error) {
    next(error);
  }
};

const updateAttendance = async (req, res, next) => {
  try {
    const { attendance_status, remarks, reason } = req.body;
    const { id } = req.params;

    if (!attendance_status) {
      return res.status(400).json({ success: false, message: 'Attendance status is required' });
    }

    const [existing] = await pool.query('SELECT * FROM attendance WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    const record = existing[0];
    const oldStatus = record.attendance_status;

    await pool.query(
      'UPDATE attendance SET attendance_status = ?, remarks = ? WHERE id = ?',
      [attendance_status, remarks !== undefined ? remarks : record.remarks, id]
    );

    await pool.query(
      'INSERT INTO attendance_edit_logs (attendance_id, employee_id, old_status, new_status, edited_by, reason) VALUES (?, ?, ?, ?, ?, ?)',
      [id, record.employee_id, oldStatus, attendance_status, req.user.id, reason || null]
    );

    res.json({ success: true, message: 'Attendance updated successfully' });
  } catch (error) {
    next(error);
  }
};

const getAllAttendance = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const offset = (page - 1) * limit;
    const { startDate, endDate, department, attendance_status, employee_id } = req.query;

    const whereClauses = [];
    const params = [];

    if (startDate) { whereClauses.push('a.attendance_date >= ?'); params.push(startDate); }
    if (endDate) { whereClauses.push('a.attendance_date <= ?'); params.push(endDate); }
    if (department) { whereClauses.push('u.department = ?'); params.push(department); }
    if (attendance_status) { whereClauses.push('a.attendance_status = ?'); params.push(attendance_status); }
    if (employee_id) { whereClauses.push('a.employee_id = ?'); params.push(employee_id); }

    const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM attendance a JOIN users u ON a.employee_id = u.id ${whereStr}`,
      params
    );
    const total = countResult[0].total;

    const [rows] = await pool.query(
      `SELECT a.*, u.name, u.employee_id as emp_id, u.department
       FROM attendance a
       JOIN users u ON a.employee_id = u.id
       ${whereStr}
       ORDER BY a.attendance_date DESC, u.name ASC
       LIMIT ? OFFSET ?`,
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

const getAttendanceById = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, u.name, u.employee_id as emp_id, u.department
       FROM attendance a
       JOIN users u ON a.employee_id = u.id
       WHERE a.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
};

const getPendingAttendance = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [rows] = await pool.query(
      `SELECT u.id, u.employee_id, u.name, u.email, u.department
       FROM users u
       LEFT JOIN attendance a ON u.id = a.employee_id AND a.attendance_date = ?
       WHERE u.status = 'active' AND u.role = 'employee' AND a.id IS NULL
       ORDER BY u.name ASC`,
      [today]
    );

    res.json({ success: true, data: rows, count: rows.length });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  markAttendance, getMyAttendance, getTodayStatus, getMonthlyStats,
  updateAttendance, getAllAttendance, getAttendanceById, getPendingAttendance,
};
