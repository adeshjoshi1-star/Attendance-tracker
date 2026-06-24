const mysql = require('mysql2/promise');
const config = require('./config');

let pool;

function getPool() {
  if (pool) return pool;

  if (process.env.DATABASE_URL) {
    pool = mysql.createPool(process.env.DATABASE_URL);
  } else {
    pool = mysql.createPool(config.db);
  }

  return pool;
}

function query(sql, params) {
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

module.exports = { pool: getPool(), getPool, query, testConnection };
