const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function seed() {
  try {
    const [existingAdmin] = await db.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (existingAdmin.length > 0) {
      console.log('Data already exists, skipping seed.');
      process.exit(0);
    }

    const adminHash = await bcrypt.hash('admin123', 10);
    const empHash = await bcrypt.hash('password123', 10);

    await db.query('START TRANSACTION');

    const [adminResult] = await db.query(
      `INSERT INTO users (employee_id, name, email, phone, department, role, password_hash, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['ADMIN001', 'Admin User', 'admin@company.com', '1234567890', 'Operations', 'admin', adminHash, 'active']
    );
    const adminId = adminResult.insertId;

    const employees = [
      { empId: 'EMP0001', name: 'John Doe', email: 'john.doe@company.com', phone: '9876543210', dept: 'Sales' },
      { empId: 'EMP0002', name: 'Jane Smith', email: 'jane.smith@company.com', phone: '9876543211', dept: 'Sales' },
      { empId: 'EMP0003', name: 'Bob Wilson', email: 'bob.wilson@company.com', phone: '9876543212', dept: 'Operations' },
      { empId: 'EMP0004', name: 'Alice Brown', email: 'alice.brown@company.com', phone: '9876543213', dept: 'Operations' },
      { empId: 'EMP0005', name: 'Charlie Davis', email: 'charlie.davis@company.com', phone: '9876543214', dept: 'Other' },
    ];

    const employeeIds = [];
    for (const emp of employees) {
      const [result] = await db.query(
        `INSERT INTO users (employee_id, name, email, phone, department, role, password_hash, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [emp.empId, emp.name, emp.email, emp.phone, emp.dept, 'employee', empHash, 'active']
      );
      employeeIds.push(result.insertId);

      await db.query(
        `INSERT INTO leave_balances (employee_id, casual_allocated, casual_used, sick_allocated, sick_used) VALUES (?, ?, ?, ?, ?)`,
        [result.insertId, 12, Math.floor(Math.random() * 4), 10, Math.floor(Math.random() * 3)]
      );
    }

    const today = new Date();
    const attendanceStatuses = ['Present', 'Present', 'Present', 'Absent', 'Work From Home', 'Present', 'Half Day', 'Present', 'Present', 'Sick Leave', 'Present', 'Work From Home', 'Present', 'Casual Leave'];

    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      for (const empId of employeeIds) {
        const status = attendanceStatuses[(i + empId) % attendanceStatuses.length];
        await db.query(
          `INSERT INTO attendance (employee_id, attendance_date, attendance_status) VALUES (?, ?, ?)`,
          [empId, dateStr, status]
        );
      }
    }

    const [johnId, janeId, bobId] = employeeIds;

    await db.query(
      `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason, status) VALUES (?, ?, ?, ?, ?, ?)`,
      [johnId, 'Casual Leave', dateStr(-3), dateStr(-1), 'Family function', 'pending']
    );

    function dateStr(offset) {
      const d = new Date(today);
      d.setDate(d.getDate() + offset);
      return d.toISOString().split('T')[0];
    }

    await db.query(
      `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason, status) VALUES (?, ?, ?, ?, ?, ?)`,
      [janeId, 'Sick Leave', dateStr(1), dateStr(2), 'Not feeling well', 'pending']
    );

    await db.query(
      `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason, status, approved_by) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [bobId, 'Casual Leave', dateStr(-5), dateStr(-4), 'Personal work', 'approved', adminId]
    );

    await db.query(
      `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason, status, approved_by) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [employeeIds[3], 'Sick Leave', dateStr(-7), dateStr(-6), 'Doctor appointment', 'rejected', adminId]
    );

    const [attendanceRows] = await db.query(
      `SELECT id, employee_id FROM attendance WHERE attendance_date = ? AND employee_id IN (?, ?, ?)`,
      [new Date().toISOString().split('T')[0], ...employeeIds.slice(0, 3)]
    );

    for (let i = 0; i < attendanceRows.length; i++) {
      const row = attendanceRows[i];
      await db.query(
        `INSERT INTO notifications (notification_type, title, message, related_id) VALUES (?, ?, ?, ?)`,
        ['attendance', 'Attendance Reminder', `Employee has not marked attendance today`, row.employee_id]
      );
    }

    await db.query(
      `INSERT INTO notifications (notification_type, title, message, related_id) VALUES (?, ?, ?, ?)`,
      ['leave', 'Leave Request Pending', 'New leave request requires approval', johnId]
    );

    const [wfhCounts] = await db.query(
      `SELECT employee_id, COUNT(*) as count FROM attendance WHERE attendance_status = 'Work From Home' AND MONTH(attendance_date) = MONTH(CURDATE()) AND YEAR(attendance_date) = YEAR(CURDATE()) GROUP BY employee_id HAVING count > 2`
    );

    if (wfhCounts.length > 0) {
      for (const wfh of wfhCounts) {
        await db.query(
          `INSERT INTO notifications (notification_type, title, message, related_id) VALUES (?, ?, ?, ?)`,
          ['wfh_alert', 'WFH Limit Exceeded', `Employee has exceeded 2 WFH days this month`, wfh.employee_id]
        );
      }
    }

    await db.query('COMMIT');
    console.log('Seed data inserted successfully!');
    console.log('Admin: admin@company.com / admin123');
    console.log('Employees: password123');
    process.exit(0);
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
}

seed();
