const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.SERVER,
  database: process.env.DATABASE,
  authentication: {
    type: 'default',
    options: {
      userName: process.env.UID,
      password: process.env.PASSWORD,
    }
  },
  options: {
    encrypt: true,
    trustServerCertificate: true,
    connectionTimeout: 30000,
    requestTimeout: 30000,
  }
};

let pool;

async function connectDB() {
  try {
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✅ SQL Server bağlantısı başarılı!');
  } catch (err) {
    console.error('❌ Veritabanı bağlantı hatası:', err);
    setTimeout(connectDB, 5000); // 5 saniye sonra tekrar dene
  }
}

function getPool() {
  return pool;
}

module.exports = { connectDB, getPool };
