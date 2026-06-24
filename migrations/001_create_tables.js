const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const createTablesSQL = `
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  department ENUM('Sales', 'Operations', 'Other') DEFAULT 'Other',
  role ENUM('admin', 'employee') DEFAULT 'employee',
  password_hash VARCHAR(255) NOT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  attendance_date DATE NOT NULL,
  attendance_status ENUM('Present', 'Absent', 'Half Day', 'Work From Home', 'Casual Leave', 'Sick Leave') NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_attendance (employee_id, attendance_date)
);

CREATE TABLE IF NOT EXISTS leave_balances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL UNIQUE,
  casual_allocated DECIMAL(5,1) DEFAULT 0,
  casual_used DECIMAL(5,1) DEFAULT 0,
  sick_allocated DECIMAL(5,1) DEFAULT 0,
  sick_used DECIMAL(5,1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  leave_type ENUM('Casual Leave', 'Sick Leave') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS leave_adjustment_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  leave_type ENUM('Casual Leave', 'Sick Leave') NOT NULL,
  adjustment_days DECIMAL(5,1) NOT NULL,
  reason TEXT NOT NULL,
  admin_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  notification_type ENUM('attendance', 'leave', 'wfh_alert') NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  related_id INT,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance_edit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  attendance_id INT NOT NULL,
  employee_id INT NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  edited_by INT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (edited_by) REFERENCES users(id) ON DELETE CASCADE
);
`;

async function run() {
  const statements = createTablesSQL
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    try {
      await pool.query(statement);
    } catch (error) {
      console.error('Migration error:', error.message);
      throw error;
    }
  }

  const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", ['admin@company.com']);
  if (existing.length === 0) {
    const hash = await bcrypt.hash('admin123', 10);
    await pool.query(
      'INSERT INTO users (employee_id, name, email, phone, department, role, password_hash, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['ADMIN001', 'Admin', 'admin@company.com', '1234567890', 'Operations', 'admin', hash, 'active']
    );
    console.log('Default admin user created (admin@company.com / admin123)');
  }
}

module.exports = { run };
