const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || './db.sqlite';
const db = new sqlite3.Database(DB_PATH);

// Promisify database operations
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

// Initialize database tables
const initialize = () => {
  db.serialize(() => {
    // Shortened URLs table
    db.run(`
      CREATE TABLE IF NOT EXISTS shortened_urls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        originalUrl TEXT NOT NULL,
        clicks INTEGER DEFAULT 0,
        created DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // QR Codes history table
    db.run(`
      CREATE TABLE IF NOT EXISTS qr_codes (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        size INTEGER DEFAULT 10,
        created DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better query performance
    db.run(`CREATE INDEX IF NOT EXISTS idx_code ON shortened_urls(code)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_created ON shortened_urls(created DESC)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_qr_created ON qr_codes(created DESC)`);

    console.log('✅ Database initialized successfully');
  });
};

// ==================== SHORTENED URL FUNCTIONS ====================

const saveShortenedUrl = (code, originalUrl) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO shortened_urls (code, originalUrl) VALUES (?, ?)`,
      [code, originalUrl],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};

const getUrlData = (code) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM shortened_urls WHERE code = ?`,
      [code],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
};

const codeExists = (code) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT 1 FROM shortened_urls WHERE code = ? LIMIT 1`,
      [code],
      (err, row) => {
        if (err) reject(err);
        else resolve(!!row);
      }
    );
  });
};

const getAllUrls = () => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT code, originalUrl, clicks, created FROM shortened_urls ORDER BY created DESC`,
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });
};

const incrementClicks = (code) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE shortened_urls SET clicks = clicks + 1, updated = CURRENT_TIMESTAMP WHERE code = ?`,
      [code],
      function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      }
    );
  });
};

const deleteShortenedUrl = (code) => {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM shortened_urls WHERE code = ?`,
      [code],
      function(err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      }
    );
  });
};

// ==================== QR CODE FUNCTIONS ====================

const saveQRCode = (id, data, size) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO qr_codes (id, data, size) VALUES (?, ?, ?)`,
      [id, data, size],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};

const getQRCodeHistory = () => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, data, size, created FROM qr_codes ORDER BY created DESC LIMIT 50`,
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });
};

module.exports = {
  initialize,
  saveShortenedUrl,
  getUrlData,
  codeExists,
  getAllUrls,
  incrementClicks,
  deleteShortenedUrl,
  saveQRCode,
  getQRCodeHistory
};
