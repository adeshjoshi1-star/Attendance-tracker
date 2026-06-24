# Attendance Tracker

A simple, reliable attendance management system for small-to-medium organizations. Employees can mark daily attendance, apply for leave, and view history. Administrators manage employees, attendance, leave balances, reports, and notifications from a clean dashboard.

## Features

- Employee attendance marking (Present, Absent, Half Day, Work From Home, Casual Leave, Sick Leave)
- Leave management (apply, approve, reject) with balance tracking
- Admin dashboard with real-time statistics
- Employee dashboard with personal attendance overview
- Daily, monthly, and department-wise reports
- Excel and CSV export
- Attendance reminders and WFH alerts
- Dark mode UI
- Role-based access control (Admin / Employee)
- Responsive design (desktop + mobile)

## Tech Stack

- **Frontend:** React 18, Tailwind CSS, React Router v6, Recharts
- **Backend:** Node.js, Express.js
- **Database:** MySQL 8+
- **Auth:** JWT (JSON Web Tokens)

## Project Structure

```
attendance-tracker/
├── backend/
│   ├── config/
│   │   ├── config.js          # Environment configuration
│   │   └── db.js              # MySQL connection pool
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── employeeController.js
│   │   ├── attendanceController.js
│   │   ├── leaveController.js
│   │   ├── notificationController.js
│   │   └── reportController.js
│   ├── middleware/
│   │   ├── auth.js            # JWT + role verification
│   │   └── errorHandler.js
│   ├── migrations/
│   │   └── 001_create_tables.js
│   ├── routes/
│   │   ├── index.js
│   │   ├── auth.js
│   │   ├── employees.js
│   │   ├── attendance.js
│   │   ├── leaves.js
│   │   ├── notifications.js
│   │   └── reports.js
│   ├── seeders/
│   │   └── seed.js
│   ├── services/
│   │   └── reminderService.js
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AdminLayout.jsx
│   │   │   │   ├── EmployeeLayout.jsx
│   │   │   │   └── ProtectedRoute.jsx
│   │   │   └── ui/
│   │   │       ├── StatsCard.jsx
│   │   │       ├── DataTable.jsx
│   │   │       ├── Modal.jsx
│   │   │       ├── ConfirmDialog.jsx
│   │   │       ├── FormInput.jsx
│   │   │       ├── LoadingSpinner.jsx
│   │   │       ├── StatusBadge.jsx
│   │   │       ├── Pagination.jsx
│   │   │       ├── FilterBar.jsx
│   │   │       ├── DarkModeToggle.jsx
│   │   │       └── NotificationBell.jsx
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── EmployeeList.jsx
│   │   │   │   ├── EmployeeForm.jsx
│   │   │   │   ├── EmployeeDetail.jsx
│   │   │   │   ├── AttendanceList.jsx
│   │   │   │   ├── LeaveManagement.jsx
│   │   │   │   ├── LeaveBalances.jsx
│   │   │   │   ├── Reports.jsx
│   │   │   │   └── Notifications.jsx
│   │   │   ├── auth/
│   │   │   │   └── LoginPage.jsx
│   │   │   └── employee/
│   │   │       ├── EmployeeDashboard.jsx
│   │   │       ├── MarkAttendance.jsx
│   │   │       ├── AttendanceHistory.jsx
│   │   │       ├── ApplyLeave.jsx
│   │   │       └── MyLeaves.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── employeeService.js
│   │   │   ├── attendanceService.js
│   │   │   ├── leaveService.js
│   │   │   ├── notificationService.js
│   │   │   └── reportService.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
```

## Prerequisites

- Node.js v16 or higher
- MySQL 8 or higher
- npm or yarn

## Setup Instructions

### 1. Database Setup

```sql
CREATE DATABASE attendance_tracker;
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env .env.local   # Edit database credentials if needed
npm run migrate      # Create database tables
npm run seed         # Insert sample data
npm run dev          # Start backend at http://localhost:5000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev          # Start frontend at http://localhost:5173
```

Open http://localhost:5173 in your browser.

## Default Accounts

| Role     | Email              | Password    |
|----------|--------------------|-------------|
| Admin    | admin@company.com  | admin123    |
| Employee | john.doe@company.com | password123 |
| Employee | jane.smith@company.com | password123 |
| Employee | bob.wilson@company.com | password123 |
| Employee | alice.brown@company.com | password123 |
| Employee | charlie.davis@company.com | password123 |

## API Endpoints

### Auth
| Method | Endpoint         | Description      |
|--------|-----------------|------------------|
| POST   | /api/auth/login | User login       |
| GET    | /api/auth/profile | Get user profile |
| PUT    | /api/auth/change-password | Change password |

### Employees (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/employees | List all employees |
| GET | /api/employees/:id | Get single employee |
| POST | /api/employees | Create employee |
| PUT | /api/employees/:id | Update employee |
| PUT | /api/employees/:id/deactivate | Deactivate employee |
| PUT | /api/employees/:id/activate | Activate employee |
| PUT | /api/employees/:id/reset-password | Reset password |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/attendance/mark | Mark today's attendance |
| GET | /api/attendance/my | My attendance history |
| GET | /api/attendance/today | Today's status |
| GET | /api/attendance/monthly-stats | Monthly statistics |
| GET | /api/attendance | All attendance (Admin) |
| GET | /api/attendance/pending | Pending attendance (Admin) |
| PUT | /api/attendance/:id | Edit attendance (Admin) |

### Leaves
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/leaves/apply | Apply for leave |
| GET | /api/leaves/my | My leave requests |
| GET | /api/leaves/my-balance | My leave balance |
| GET | /api/leaves | All leave requests (Admin) |
| GET | /api/leaves/pending | Pending leaves (Admin) |
| PUT | /api/leaves/:id/approve | Approve leave (Admin) |
| PUT | /api/leaves/:id/reject | Reject leave (Admin) |
| POST | /api/leaves/adjust-balance | Adjust leave balance (Admin) |
| GET | /api/leaves/adjustment-logs | Adjustment logs (Admin) |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/notifications | All notifications |
| GET | /api/notifications/unread-count | Unread count |
| GET | /api/notifications/attendance-reminders | Attendance reminders (Admin) |
| GET | /api/notifications/leave-notifications | Leave notifications (Admin) |
| GET | /api/notifications/wfh-alerts | WFH alerts (Admin) |
| PUT | /api/notifications/:id/read | Mark as read |
| PUT | /api/notifications/read-all | Mark all as read |

### Reports (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/reports/daily | Daily attendance report |
| GET | /api/reports/monthly | Monthly attendance report |
| GET | /api/reports/department | Department-wise report |
| GET | /api/reports/export | Export report (xlsx/csv) |

## Deployment

### Option 1: Railway

1. Push the code to a GitHub repository.
2. Create a new project on [Railway](https://railway.app) and connect your repo.
3. Add a MySQL plugin (Railway provides connection details).
4. Set the root directory to `backend` and start command to `node server.js`.
5. Set environment variables (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET) from Railway MySQL credentials.
6. Deploy.

### Option 2: Separate Frontend + Backend

**Backend** - Deploy to Railway/Render/Heroku:
```bash
cd backend
npm install
npm run migrate
npm run seed
npm start
```

**Frontend** - Deploy to Vercel/Netlify:
```bash
cd frontend
npm install
npm run build   # Output in dist/
```

Deploy the `dist/` folder to your hosting provider. Set the API proxy to point to your backend URL.

### Option 3: Single Server

Build the frontend and serve it from the backend:
```bash
cd frontend && npm install && npm run build
cp -r dist/* ../backend/public/
# Update server.js to serve public/ as static files
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Backend server port | 5000 |
| DB_HOST | MySQL host | localhost |
| DB_PORT | MySQL port | 3306 |
| DB_USER | MySQL user | root |
| DB_PASSWORD | MySQL password | root |
| DB_NAME | Database name | attendance_tracker |
| JWT_SECRET | JWT signing secret | (change in production) |
| JWT_EXPIRES_IN | Token expiry duration | 8h |
| REMINDER_TIME | Daily reminder time (HH:MM) | 09:00 |

## License

MIT
