const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const config = require('./config/config');
const { testConnection } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');
const { runDailyReminder } = require('./services/reminderService');
const { run: runMigrations } = require('./migrations/001_create_tables');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const publicPath = path.join(__dirname, 'public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

app.use('/api', routes);

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Attendance Tracker API is running' });
});

app.get('*', (req, res) => {
  const indexPath = path.join(publicPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).json({ message: 'Attendance Tracker API - Frontend not built yet. Run: cd frontend && npm install && npm run build' });
  }
});

app.use(errorHandler);

function scheduleReminder() {
  const [hours, minutes] = (config.reminderTime || '09:00').split(':').map(Number);
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
  let delay = target.getTime() - now.getTime();
  if (delay < 0) delay += 24 * 60 * 60 * 1000;
  setTimeout(async () => {
    await runDailyReminder();
    scheduleReminder();
  }, delay);
}

async function startServer() {
  try {
    await testConnection();
    await runMigrations();
    console.log('Tables initialized successfully');
    scheduleReminder();
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
module.exports = app;
