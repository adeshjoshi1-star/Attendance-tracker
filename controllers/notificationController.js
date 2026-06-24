const { pool } = require('../config/db');

const getNotifications = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const offset = (page - 1) * limit;

    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM notifications');
    const total = countResult[0].total;

    const [rows] = await pool.query(
      'SELECT * FROM notifications ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
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

const markAsRead = async (req, res, next) => {
  try {
    const [result] = await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE is_read = 0');
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const [result] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE is_read = 0'
    );
    res.json({ success: true, data: { unread_count: result[0].count } });
  } catch (error) {
    next(error);
  }
};

const getAttendanceReminders = async (req, res, next) => {
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

const getLeaveNotifications = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT lr.id, lr.leave_type, lr.start_date, lr.end_date, lr.reason, lr.created_at,
              u.name, u.employee_id, u.department
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

const getWfhAlerts = async (req, res, next) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const [rows] = await pool.query(
      `SELECT u.id, u.employee_id, u.name, u.department, COUNT(*) as wfh_days
       FROM attendance a
       JOIN users u ON a.employee_id = u.id
       WHERE a.attendance_status = 'Work From Home'
         AND YEAR(a.attendance_date) = ?
         AND MONTH(a.attendance_date) = ?
       GROUP BY a.employee_id
       HAVING wfh_days > 2
       ORDER BY wfh_days DESC`,
      [year, month]
    );

    res.json({ success: true, data: rows, count: rows.length });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications, markAsRead, markAllAsRead, getUnreadCount,
  getAttendanceReminders, getLeaveNotifications, getWfhAlerts,
};
