const { pool } = require('../config/db');
const XLSX = require('xlsx');

function setExportHeaders(res, format, filename) {
  if (format === 'xlsx') {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  } else {
    res.setHeader('Content-Type', 'text/csv');
  }
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
}

function sendXlsx(res, data, filename) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  setExportHeaders(res, 'xlsx', filename);
  res.send(buffer);
}

function sendCsv(res, data, filename) {
  if (data.length === 0) {
    setExportHeaders(res, 'csv', filename);
    return res.send('');
  }
  const headers = Object.keys(data[0]);
  const csvLines = [headers.join(',')];
  for (const row of data) {
    const values = headers.map((h) => {
      const v = row[h] != null ? String(row[h]) : '';
      return v.includes(',') || v.includes('"') || v.includes('\n') ? `"${v.replace(/"/g, '""')}"` : v;
    });
    csvLines.push(values.join(','));
  }
  setExportHeaders(res, 'csv', filename);
  res.send(csvLines.join('\n'));
}

const dailyReport = async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const department = (req.query.department || '').trim();
    const attendance_status = (req.query.status || '').trim();
    const exportFormat = req.query.export === 'true' ? (req.query.format || 'csv') : null;

    const whereClauses = ['a.attendance_date = ?'];
    const params = [date];

    if (department) { whereClauses.push('u.department = ?'); params.push(department); }
    if (attendance_status) { whereClauses.push('a.attendance_status = ?'); params.push(attendance_status); }

    const whereStr = 'WHERE ' + whereClauses.join(' AND ');

    const [rows] = await pool.query(
      `SELECT u.name, u.employee_id, u.department, a.attendance_status, a.remarks
       FROM attendance a
       JOIN users u ON a.employee_id = u.id
       ${whereStr}
       ORDER BY u.department, u.name`,
      params
    );

    if (exportFormat) {
      const filename = `daily_report_${date}.${exportFormat}`;
      if (exportFormat === 'xlsx') {
        return sendXlsx(res, rows, filename);
      }
      return sendCsv(res, rows, filename);
    }

    res.json({ success: true, data: rows, date, count: rows.length });
  } catch (error) {
    next(error);
  }
};

const monthlyReport = async (req, res, next) => {
  try {
    const now = new Date();
    const month = req.query.month ? String(req.query.month).padStart(2, '0') : String(now.getMonth() + 1).padStart(2, '0');
    const year = req.query.year || String(now.getFullYear());
    const department = (req.query.department || '').trim();
    const employee_id = req.query.employee_id || '';
    const exportFormat = req.query.export === 'true' ? (req.query.format || 'csv') : null;

    const whereClauses = [
      'YEAR(a.attendance_date) = ?',
      'MONTH(a.attendance_date) = ?',
    ];
    const params = [year, month];

    if (department) { whereClauses.push('u.department = ?'); params.push(department); }
    if (employee_id) { whereClauses.push('a.employee_id = ?'); params.push(employee_id); }

    const whereStr = 'WHERE ' + whereClauses.join(' AND ');

    const [attendance] = await pool.query(
      `SELECT a.employee_id, a.attendance_status, u.name, u.employee_id as emp_id, u.department
       FROM attendance a
       JOIN users u ON a.employee_id = u.id
       ${whereStr}
       ORDER BY u.name, a.attendance_date`,
      params
    );

    const employeeMap = {};
    for (const record of attendance) {
      if (!employeeMap[record.employee_id]) {
        employeeMap[record.employee_id] = {
          employee_id: record.emp_id,
          name: record.name,
          department: record.department,
          present: 0, absent: 0, half_day: 0, wfh: 0, cl: 0, sl: 0, total: 0,
        };
      }
      const e = employeeMap[record.employee_id];
      e.total++;
      switch (record.attendance_status) {
        case 'Present': e.present++; break;
        case 'Absent': e.absent++; break;
        case 'Half Day': e.half_day++; break;
        case 'Work From Home': e.wfh++; break;
        case 'Casual Leave': e.cl++; break;
        case 'Sick Leave': e.sl++; break;
      }
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    let workingDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(year, month - 1, d).getDay();
      if (dow !== 0 && dow !== 6) workingDays++;
    }

    const reportData = Object.values(employeeMap).map((e) => ({
      ...e,
      attendance_percentage: workingDays > 0 ? Math.round(((e.present + e.wfh) / workingDays) * 100) : 0,
    }));

    if (exportFormat) {
      const filename = `monthly_report_${year}_${month}.${exportFormat}`;
      if (exportFormat === 'xlsx') {
        return sendXlsx(res, reportData, filename);
      }
      return sendCsv(res, reportData, filename);
    }

    res.json({ success: true, data: reportData, month, year, count: reportData.length });
  } catch (error) {
    next(error);
  }
};

const departmentReport = async (req, res, next) => {
  try {
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const exportFormat = req.query.export === 'true' ? (req.query.format || 'csv') : null;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Start date and end date are required' });
    }

    const [rows] = await pool.query(
      `SELECT u.department,
              a.attendance_status,
              COUNT(*) as count
       FROM attendance a
       JOIN users u ON a.employee_id = u.id
       WHERE a.attendance_date >= ? AND a.attendance_date <= ?
       GROUP BY u.department, a.attendance_status
       ORDER BY u.department, a.attendance_status`,
      [startDate, endDate]
    );

    const deptMap = {};
    for (const row of rows) {
      if (!deptMap[row.department]) {
        deptMap[row.department] = { department: row.department, present: 0, absent: 0, half_day: 0, wfh: 0, cl: 0, sl: 0, total: 0 };
      }
      const d = deptMap[row.department];
      d.total += row.count;
      switch (row.attendance_status) {
        case 'Present': d.present = row.count; break;
        case 'Absent': d.absent = row.count; break;
        case 'Half Day': d.half_day = row.count; break;
        case 'Work From Home': d.wfh = row.count; break;
        case 'Casual Leave': d.cl = row.count; break;
        case 'Sick Leave': d.sl = row.count; break;
      }
    }

    const reportData = Object.values(deptMap);

    if (exportFormat) {
      const filename = `department_report_${startDate}_to_${endDate}.${exportFormat}`;
      if (exportFormat === 'xlsx') {
        return sendXlsx(res, reportData, filename);
      }
      return sendCsv(res, reportData, filename);
    }

    res.json({ success: true, data: reportData, startDate, endDate });
  } catch (error) {
    next(error);
  }
};

const exportReport = async (req, res, next) => {
  try {
    const { type, format, startDate, endDate, department, employee_id, month, year } = req.query;
    const exportFormat = format === 'xlsx' ? 'xlsx' : 'csv';

    if (!type) {
      return res.status(400).json({ success: false, message: 'Report type is required (daily, monthly, department)' });
    }

    let data = [];
    let filename = `report_${Date.now()}.${exportFormat}`;

    if (type === 'daily') {
      const date = startDate || new Date().toISOString().split('T')[0];
      const params = [date];
      const whereClauses = ['a.attendance_date = ?'];
      if (department) { whereClauses.push('u.department = ?'); params.push(department); }
      const whereStr = 'WHERE ' + whereClauses.join(' AND ');
      const [rows] = await pool.query(
        `SELECT u.name, u.employee_id, u.department, a.attendance_status, a.remarks
         FROM attendance a JOIN users u ON a.employee_id = u.id ${whereStr} ORDER BY u.department, u.name`,
        params
      );
      data = rows;
      filename = `daily_report_${date}.${exportFormat}`;
    } else if (type === 'monthly') {
      const m = month || String(new Date().getMonth() + 1).padStart(2, '0');
      const y = year || String(new Date().getFullYear());
      const params = [y, m];
      const whereClauses = ['YEAR(a.attendance_date) = ?', 'MONTH(a.attendance_date) = ?'];
      if (department) { whereClauses.push('u.department = ?'); params.push(department); }
      if (employee_id) { whereClauses.push('a.employee_id = ?'); params.push(employee_id); }
      const whereStr = 'WHERE ' + whereClauses.join(' AND ');

      const [attendance] = await pool.query(
        `SELECT a.employee_id, a.attendance_status, u.name, u.employee_id as emp_id, u.department
         FROM attendance a JOIN users u ON a.employee_id = u.id ${whereStr} ORDER BY u.name`,
        params
      );

      const empMap = {};
      for (const rec of attendance) {
        if (!empMap[rec.employee_id]) {
          empMap[rec.employee_id] = { employee_id: rec.emp_id, name: rec.name, department: rec.department, present: 0, absent: 0, half_day: 0, wfh: 0, cl: 0, sl: 0, total: 0 };
        }
        const e = empMap[rec.employee_id];
        e.total++;
        switch (rec.attendance_status) { case 'Present': e.present++; break; case 'Absent': e.absent++; break; case 'Half Day': e.half_day++; break; case 'Work From Home': e.wfh++; break; case 'Casual Leave': e.cl++; break; case 'Sick Leave': e.sl++; break; }
      }

      const daysInMonth = new Date(y, m, 0).getDate();
      let workingDays = 0;
      for (let d = 1; d <= daysInMonth; d++) { const dow = new Date(y, m - 1, d).getDay(); if (dow !== 0 && dow !== 6) workingDays++; }

      data = Object.values(empMap).map((e) => ({ ...e, attendance_percentage: workingDays > 0 ? Math.round(((e.present + e.wfh) / workingDays) * 100) : 0 }));
      filename = `monthly_report_${y}_${m}.${exportFormat}`;
    } else if (type === 'department') {
      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'Start date and end date are required for department report' });
      }
      const [rows] = await pool.query(
        `SELECT u.department, a.attendance_status, COUNT(*) as count
         FROM attendance a JOIN users u ON a.employee_id = u.id
         WHERE a.attendance_date >= ? AND a.attendance_date <= ?
         GROUP BY u.department, a.attendance_status ORDER BY u.department`,
        [startDate, endDate]
      );
      const deptMap = {};
      for (const row of rows) {
        if (!deptMap[row.department]) deptMap[row.department] = { department: row.department, present: 0, absent: 0, half_day: 0, wfh: 0, cl: 0, sl: 0, total: 0 };
        const d = deptMap[row.department]; d.total += row.count;
        switch (row.attendance_status) { case 'Present': d.present = row.count; break; case 'Absent': d.absent = row.count; break; case 'Half Day': d.half_day = row.count; break; case 'Work From Home': d.wfh = row.count; break; case 'Casual Leave': d.cl = row.count; break; case 'Sick Leave': d.sl = row.count; break; }
      }
      data = Object.values(deptMap);
      filename = `department_report_${startDate}_to_${endDate}.${exportFormat}`;
    }

    if (exportFormat === 'xlsx') {
      return sendXlsx(res, data, filename);
    }
    return sendCsv(res, data, filename);
  } catch (error) {
    next(error);
  }
};

module.exports = { dailyReport, monthlyReport, departmentReport, exportReport };
