import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, '..', 'sales.db')
const UPLOADS = path.join(__dirname, '..', 'public', 'uploads')
fs.mkdirSync(UPLOADS, { recursive: true })

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('manager', 'rep')),
    team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rep_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_date TEXT NOT NULL,
    points INTEGER NOT NULL,
    notes TEXT,
    power_bill_image_path TEXT,
    logged_by INTEGER NOT NULL REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now'))
  );
`)

const existing = db.prepare("SELECT id FROM users WHERE username = 'admin'").get()
if (existing) {
  console.log('Manager account already exists. Username: admin')
} else {
  const hash = bcrypt.hashSync('admin123', 12)
  db.prepare("INSERT INTO users (name, username, password_hash, role) VALUES (?, ?, ?, ?)").run(
    'Manager', 'admin', hash, 'manager'
  )
  console.log('Created manager account:')
  console.log('  Username: admin')
  console.log('  Password: admin123')
  console.log('  ⚠️  Change the password after first login!')
}
