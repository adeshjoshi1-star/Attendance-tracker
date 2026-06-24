const { pool } = require('../config/db');

async function checkAttendanceReminders() {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [rows] = await pool.query(
      `SELECT u.id, u.name
       FROM users u
       LEFT JOIN attendance a ON u.id = a.employee_id AND a.attendance_date = ?
       WHERE u.status = 'active' AND u.role = 'employee' AND a.id IS NULL`,
      [today]
    );

    if (rows.length > 0) {
      const notifications = rows.map((row) => [
        'attendance',
        'Attendance Pending',
        `${row.name} has not marked attendance for today (${today}).`,
        row.id,
      ]);

      const placeholders = notifications.map(() => '(?, ?, ?, ?)').join(', ');
      const values = notifications.flat();

      await pool.query(
        `INSERT INTO notifications (notification_type, title, message, related_id) VALUES ${placeholders}`,
        values
      );

      console.log(`[Reminder] Created ${rows.length} attendance reminder notification(s)`);
    }

    return rows.length;
  } catch (error) {
    console.error('[Reminder] Attendance check failed:', error.message);
    return 0;
  }
}

async function checkWfhAlerts() {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.employee_id, COUNT(*) as wfh_days
       FROM attendance a
       JOIN users u ON a.employee_id = u.id
       WHERE a.attendance_status = 'Work From Home'
         AND YEAR(a.attendance_date) = ?
         AND MONTH(a.attendance_date) = ?
       GROUP BY a.employee_id
       HAVING wfh_days > 2`,
      [year, month]
    );

    if (rows.length > 0) {
      const notifications = rows.map((row) => [
        'wfh_alert',
        'WFH Alert',
        `${row.name} (${row.employee_id}) has ${row.wfh_days} WFH days this month, exceeding the 2-day limit.`,
        row.id,
      ]);

      const placeholders = notifications.map(() => '(?, ?, ?, ?)').join(', ');
      const values = notifications.flat();

      await pool.query(
        `INSERT INTO notifications (notification_type, title, message, related_id) VALUES ${placeholders}`,
        values
      );

      console.log(`[Reminder] Created ${rows.length} WFH alert notification(s)`);
    }

    return rows.length;
  } catch (error) {
    console.error('[Reminder] WFH alert check failed:', error.message);
    return 0;
  }
}

async function runDailyReminder() {
  console.log('[Reminder] Running daily reminder checks...');
  const attendanceCount = await checkAttendanceReminders();
  const wfhCount = await checkWfhAlerts();
  console.log(`[Reminder] Daily reminder complete: ${attendanceCount} attendance, ${wfhCount} WFH alerts`);
}

module.exports = { checkAttendanceReminders, checkWfhAlerts, runDailyReminder };
