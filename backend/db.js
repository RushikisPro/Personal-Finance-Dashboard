const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.join(__dirname, 'finance.db');
const db = new DatabaseSync(dbPath);

// Initialize SQLite Schema (Strictly 3 entities: users, transactions, budgets)
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    phone TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    category TEXT NOT NULL,
    monthly_limit REAL NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(user_id, category),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

module.exports = db;

