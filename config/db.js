const mysql = require('mysql2/promise');

let pool;

function getPool() {
  if (pool) return pool;

  const url = process.env.DATABASE_URL || process.env.MYSQL_URL || '';
  if (url) {
    pool = mysql.createPool(url);
  } else {
    const config = {
      host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || process.env.DB_PORT, 10) || 3306,
      user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
      password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'attendance_tracker',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };
    pool = mysql.createPool(config);
  }

  return pool;
}

async function query(sql, params) {
  return getPool().query(sql, params);
}

async function testConnection() {
  try {
    const conn = await getPool().getConnection();
    console.log('Database connected successfully');
    conn.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    throw error;
  }
}

module.exports = { getPool, query, testConnection };
Object.defineProperty(module.exports, 'pool', { get: () => getPool() });
