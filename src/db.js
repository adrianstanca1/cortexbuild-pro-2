import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import * as schema from './schema.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.replace('sqlite:', '')
  : path.join(__dirname, '..', 'cortexbuild.db')

const dir = path.dirname(dbPath)
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

const sqlite = new Database(dbPath)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })

// Initialize tables
try {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT,
      plan TEXT DEFAULT 'free',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'director',
      cscs TEXT,
      safety_score INTEGER DEFAULT 90,
      phone TEXT,
      avatar_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      client TEXT,
      value REAL DEFAULT 0,
      pct INTEGER DEFAULT 0,
      status TEXT DEFAULT 'quoting',
      addr TEXT,
      team_count INTEGER DEFAULT 0,
      due TEXT,
      margin REAL DEFAULT 0,
      risk_score REAL DEFAULT 0,
      risk_factors TEXT DEFAULT '[]',
      health_color TEXT DEFAULT 'green',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      assignee TEXT,
      due TEXT,
      prio TEXT DEFAULT 'med',
      done INTEGER DEFAULT 0,
      predicted_duration INTEGER,
      dependency_ids TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS team_members (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      role TEXT,
      color TEXT,
      site TEXT,
      hours REAL DEFAULT 0,
      status TEXT DEFAULT 'off',
      cscs TEXT,
      phone TEXT,
      email TEXT,
      day_rate REAL,
      certificates TEXT DEFAULT '[]',
      qualifications TEXT DEFAULT '[]',
      skills TEXT DEFAULT '[]',
      meta TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
      client TEXT,
      amount REAL,
      status TEXT DEFAULT 'due',
      issued TEXT,
      due TEXT,
      paid TEXT
    );
    CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
      client TEXT,
      title TEXT,
      total REAL,
      status TEXT DEFAULT 'draft',
      issued TEXT,
      valid_until TEXT,
      items TEXT
    );
    CREATE TABLE IF NOT EXISTS risks (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      probability REAL DEFAULT 50,
      impact REAL DEFAULT 50,
      risk_score REAL DEFAULT 2500,
      status TEXT DEFAULT 'open',
      detected_at TEXT DEFAULT (datetime('now')),
      predicted_date TEXT,
      predicted_overrun REAL,
      predicted_delay_days INTEGER,
      ai_source TEXT,
      mitigation TEXT,
      rsi REAL,
      cp_70_30 REAL,
      cp_60_40 REAL,
      moisture_regulation TEXT,
      euronorm_minimum TEXT,
      safety TEXT,
      cost TEXT,
      weather TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS snags (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
      photo_url TEXT,
      photo_thumb TEXT,
      ai_description TEXT,
      ai_confidence REAL,
      location TEXT,
      snag_type TEXT,
      priority TEXT DEFAULT 'med',
      status TEXT DEFAULT 'open',
      assigned_to TEXT,
      assignee TEXT,
      due TEXT,
      resolved_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS daily_logs (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
      log_date TEXT NOT NULL,
      crew_count INTEGER DEFAULT 0,
      narrative TEXT,
      ai_summary TEXT,
      ai_extracted TEXT DEFAULT '{}',
      photos TEXT DEFAULT '[]',
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS rfis (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
      ai_generated INTEGER DEFAULT 0,
      ai_trigger TEXT,
      ai_context TEXT,
      question TEXT NOT NULL,
      ref_drawing TEXT,
      ref_location TEXT,
      priority TEXT DEFAULT 'med',
      status TEXT DEFAULT 'open',
      submitted_to TEXT,
      answered_by TEXT,
      answer TEXT,
      answered_at TEXT,
      submitted_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS subcontractors (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      trade TEXT NOT NULL,
      contact TEXT,
      email TEXT,
      phone TEXT,
      rating REAL DEFAULT 0,
      completed_jobs INTEGER DEFAULT 0,
      avg_days REAL,
      reliability REAL DEFAULT 50,
      specializations TEXT DEFAULT '[]',
      metadata TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS bid_opportunities (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
      scope_desc TEXT NOT NULL,
      estimated_value REAL,
      trade TEXT,
      status TEXT DEFAULT 'draft',
      awarded_to TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      published_at TEXT,
      awarded_at TEXT
    );
    CREATE TABLE IF NOT EXISTS documents_store (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      collection TEXT NOT NULL,
      doc_id TEXT NOT NULL,
      data TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(workspace_id, collection, doc_id)
    );
    CREATE TABLE IF NOT EXISTS site_photos (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
      photo_url TEXT NOT NULL,
      thumb_url TEXT,
      taken_at TEXT DEFAULT (datetime('now')),
      location TEXT,
      captioned_by_ai INTEGER DEFAULT 0,
      ai_description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS ai_conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      title TEXT,
      tool_calls TEXT DEFAULT '[]',
      tokens INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS ai_jobs (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      scheduled_at TEXT,
      run_at TEXT,
      result TEXT,
      error TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
      report_type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      generated_by TEXT,
      generated_at TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      customer_id TEXT,
      plan TEXT DEFAULT 'free',
      status TEXT DEFAULT 'active',
      current_period_end TEXT,
      stripe_sub_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS proposals (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
      client TEXT NOT NULL,
      title TEXT NOT NULL,
      value REAL DEFAULT 0,
      status TEXT DEFAULT 'draft',
      valid_until TEXT,
      items TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS progress_logs (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
      log_date TEXT NOT NULL,
      narrative TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS subcontractor_bids (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      bid_id TEXT REFERENCES bid_opportunities(id) ON DELETE CASCADE,
      subcontractor_id TEXT REFERENCES subcontractors(id) ON DELETE CASCADE,
      amount REAL,
      bidder_name TEXT,
      submitted_at TEXT,
      status TEXT DEFAULT 'pending',
      notes TEXT
    );
  `)
  console.log('[db] Schema initialized: 22 tables')
} catch (err) {
  console.error('[db] Schema init error:', err.message)
}

export { schema }
export default db
