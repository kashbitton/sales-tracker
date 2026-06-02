import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'
import fs from 'fs'

// On Railway, use /data (persistent volume). Locally, use project root.
const DATA_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH || process.cwd()
const DB_PATH = path.join(DATA_DIR, 'sales.db')
const UPLOADS_PATH = path.join(DATA_DIR, 'uploads')

// Ensure uploads dir exists
fs.mkdirSync(UPLOADS_PATH, { recursive: true })

let db: Database.Database

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initTables(db)
  }
  return db
}

function initTables(db: Database.Database) {
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
      event_type TEXT NOT NULL CHECK(event_type IN (
        'bagel','early_bird','night_owl','qualified_appt','sit','close'
      )),
      event_date TEXT NOT NULL,
      points INTEGER NOT NULL,
      notes TEXT,
      power_bill_image_path TEXT,
      logged_by INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );
  `)

  const existing = db.prepare("SELECT id FROM users WHERE username = 'admin'").get()
  if (!existing) {
    const hash = bcrypt.hashSync('admin123', 12)
    db.prepare("INSERT INTO users (name, username, password_hash, role) VALUES (?, ?, ?, ?)").run(
      'Manager', 'admin', hash, 'manager'
    )
  }
}

export default getDb
