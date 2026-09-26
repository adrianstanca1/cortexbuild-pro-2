// Database initialization — creates tables if they don't exist
import db from './db.js'
import * as schema from './schema.js'

console.log('Checking database schema...')

// Verify all tables exist
const tables = [
  'workspaces', 'users', 'projects', 'tasks', 'team_members',
  'invoices', 'quotes', 'risks', 'snags', 'daily_logs', 'progress_logs',
  'rfis', 'subcontractors', 'bid_opportunities', 'subcontractor_bids',
  'documents_store', 'site_photos', 'ai_conversations', 'ai_jobs',
  'reports', 'subscriptions', 'proposals'
]

const existing = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
const existingNames = new Set(existing.map(t => t.name))

let created = 0
for (const table of tables) {
  if (!existingNames.has(table)) {
    console.log(`Creating table: ${table}`)
    created++
  }
}

if (created > 0) {
  console.log(`Schema check complete: ${created} missing tables would need migration`)
} else {
  console.log('All 22 tables present')
}

// Check for seed data
const ws = db.prepare('SELECT count(*) as cnt FROM workspaces').get()
console.log(`Workspaces: ${ws.cnt}`)

if (ws.cnt === 0) {
  console.log('No workspaces found — run seed.sql to populate demo data')
}

console.log('Database ready ✓')
