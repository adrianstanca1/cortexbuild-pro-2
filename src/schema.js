// Drizzle Schema — CortexBuild Pro 2.0
// 22 tables with full column definitions for SQLite

import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

export const workspaces = sqliteTable('workspaces', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  company: text('company'),
  plan: text('plan').default('free'),
  created_at: text('created_at').default('datetime(\'now\')'),
})

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  workspace_id: text('workspace_id').notNull().references(() => workspaces.id),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: text('role').default('director'),
  cscs: text('cscs'),
  safety_score: integer('safety_score').default(90),
  phone: text('phone'),
  avatar_url: text('avatar_url'),
  created_at: text('created_at').default('datetime(\'now\')'),
})

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  workspace_id: text('workspace_id').notNull().references(() => workspaces.id),
  name: text('name').notNull(),
  client: text('client'),
  value: real('value').default(0),
  pct: integer('pct').default(0),
  status: text('status').default('quoting'),
  addr: text('addr'),
  team_count: integer('team_count').default(0),
  due: text('due'),
  margin: real('margin').default(0),
  risk_score: real('risk_score').default(0),
  risk_factors: text('risk_factors').default('[]'),
  health_color: text('health_color').default('green'),
  created_at: text('created_at').default('datetime(\'now\')'),
})

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  workspace_id: text('workspace_id').notNull().references(() => workspaces.id),
  project_id: text('project_id').references(() => projects.id),
  title: text('title').notNull(),
  assignee: text('assignee'),
  due: text('due'),
  prio: text('prio').default('med'),
  done: integer('done').default(0),
  predicted_duration: integer('predicted_duration'),
  dependency_ids: text('dependency_ids').default('[]'),
  created_at: text('created_at').default('datetime(\'now\')'),
})

export const team_members = sqliteTable('team_members', {
  id: text('id').primaryKey(),
  workspace_id: text('workspace_id').notNull().references(() => workspaces.id),
  name: text('name').notNull(),
  role: text('role'),
  color: text('color'),
  site: text('site'),
  hours: real('hours').default(0),
  status: text('status').default('off'),
  cscs: text('cscs'),
  phone: text('phone'),
  email: text('email'),
  day_rate: real('day_rate'),
  certificates: text('certificates').default('[]'),
  qualifications: text('qualifications').default('[]'),
  skills: text('skills').default('[]'),
  meta: text('meta').default('{}'),
  created_at: text('created_at').default('datetime(\'now\')'),
})

export const invoices = sqliteTable('invoices', {
  id: text('id').primaryKey(),
  workspace_id: text('workspace_id').notNull().references(() => workspaces.id),
  project_id: text('project_id').references(() => projects.id),
  client: text('client'),
  amount: real('amount'),
  status: text('status').default('due'),
  issued: text('issued'),
  due: text('due'),
  paid: text('paid'),
})

export const quotes = sqliteTable('quotes', {
  id: text('id').primaryKey(),
  workspace_id: text('workspace_id').notNull().references(() => workspaces.id),
  project_id: text('project_id').references(() => projects.id),
  client: text('client'),
  title: text('title'),
  total: real('total'),
  status: text('status').default('draft'),
  issued: text('issued'),
  valid_until: text('valid_until'),
  items: text('items'),
})

export const risks = sqliteTable('risks', {
  id: text('id').primaryKey(),
  workspace_id: text('workspace_id').notNull().references(() => workspaces.id),
  project_id: text('project_id').references(() => projects.id),
  type: text('type').notNull(),
  title: text('title').notNull(),
  probability: real('probability').default(50),
  impact: real('impact').default(50),
  status: text('status').default('open'),
  detected_at: text('detected_at').default('datetime(\'now\')'),
  predicted_date: text('predicted_date'),
  predicted_overrun: real('predicted_overrun'),
  predicted_delay_days: integer('predicted_delay_days'),
  ai_source: text('ai_source'),
  mitigation: text('mitigation'),
  rsi: real('rsi'),
  cp_70_30: real('cp_70_30'),
  cp_60_40: real('cp_60_40'),
  moisture_regulation: text('moisture_regulation'),
  euronorm_minimum: text('euronorm_minimum'),
  safety: text('safety'),
  cost: text('cost'),
  weather: text('weather'),
  risk_score: real('risk_score').default(2500),
  updated_at: text('updated_at').default('datetime(\'now\')'),
})

export const snags = sqliteTable('snags', {
  id: text('id').primaryKey(),
  workspace_id: text('workspace_id').notNull().references(() => workspaces.id),
  project_id: text('project_id').references(() => projects.id),
  photo_url: text('photo_url'),
  photo_thumb: text('photo_thumb'),
  ai_description: text('ai_description'),
  ai_confidence: real('ai_confidence'),
  location: text('location'),
  snag_type: text('snag_type'),
  priority: text('priority').default('med'),
  status: text('status').default('open'),
  assigned_to: text('assigned_to'),
  assignee: text('assignee'),
  due: text('due'),
  resolved_at: text('resolved_at'),
  created_at: text('created_at').default('datetime(\'now\')'),
})

export const daily_logs = sqliteTable('daily_logs', {
  id: text('id').primaryKey(),
  workspace_id: text('workspace_id').notNull().references(() => workspaces.id),
  project_id: text('project_id').references(() => projects.id),
  log_date: text('log_date').notNull(),
  crew_count: integer('crew_count').default(0),
  narrative: text('narrative'),
  ai_summary: text('ai_summary'),
  ai_extracted: text('ai_extracted').default('{}'),
  photos: text('photos').default('[]'),
  created_by: text('created_by'),
  created_at: text('created_at').default('datetime(\'now\')'),
})

export const rfis = sqliteTable('rfis', {
  id: text('id').primaryKey(),
  workspace_id: text('workspace_id').notNull().references(() => workspaces.id),
  project_id: text('project_id').references(() => projects.id),
  ai_generated: integer('ai_generated').default(0),
  ai_trigger: text('ai_trigger'),
  ai_context: text('ai_context'),
  question: text('question').notNull(),
  ref_drawing: text('ref_drawing'),
  ref_location: text('ref_location'),
  priority: text('priority').default('med'),
  status: text('status').default('open'),
  submitted_to: text('submitted_to'),
  answered_by: text('answered_by'),
  answer: text('answer'),
  answered_at: text('answered_at'),
  submitted_at: text('submitted_at'),
  created_at: text('created_at').default('datetime(\'now\')'),
})

export const subcontractors = sqliteTable('subcontractors', {
  id: text('id').primaryKey(),
  workspace_id: text('workspace_id').notNull().references(() => workspaces.id),
  name: text('name').notNull(),
  trade: text('trade').notNull(),
  contact: text('contact'),
  email: text('email'),
  phone: text('phone'),
  rating: real('rating').default(0),
  completed_jobs: integer('completed_jobs').default(0),
  avg_days: real('avg_days'),
  reliability: real('reliability').default(50),
  specializations: text('specializations').default('[]'),
  metadata: text('metadata').default('{}'),
  created_at: text('created_at').default('datetime(\'now\')'),
})

export const bid_opportunities = sqliteTable('bid_opportunities', {
  id: text('id').primaryKey(),
  workspace_id: text('workspace_id').notNull().references(() => workspaces.id),
  project_id: text('project_id').references(() => projects.id),
  scope_desc: text('scope_desc').notNull(),
  estimated_value: real('estimated_value'),
  trade: text('trade'),
  status: text('status').default('draft'),
  awarded_to: text('awarded_to'),
  created_at: text('created_at').default('datetime(\'now\')'),
  published_at: text('published_at'),
  awarded_at: text('awarded_at'),
})

export const documents_store = sqliteTable('documents_store', {
  id: text('id').primaryKey(),
  workspace_id: text('workspace_id').notNull().references(() => workspaces.id),
  collection: text('collection').notNull(),
  doc_id: text('doc_id').notNull(),
  data: text('data').notNull(),
  updated_at: text('updated_at').default('datetime(\'now\')'),
})

export const site_photos = sqliteTable('site_photos', {
  id: text('id').primaryKey(),
  workspace_id: text('workspace_id').notNull().references(() => workspaces.id),
  project_id: text('project_id').references(() => projects.id),
  photo_url: text('photo_url').notNull(),
  thumb_url: text('thumb_url'),
  taken_at: text('taken_at').default('datetime(\'now\')'),
  location: text('location'),
  captioned_by_ai: integer('captioned_by_ai').default(0),
  ai_description: text('ai_description'),
  created_at: text('created_at').default('datetime(\'now\')'),
})

export const ai_conversations = sqliteTable('ai_conversations', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => users.id),
  workspace_id: text('workspace_id').notNull().references(() => workspaces.id),
  project_id: text('project_id').references(() => projects.id),
  role: text('role').notNull(),
  content: text('content').notNull(),
  title: text('title'),
  tool_calls: text('tool_calls').default('[]'),
  tokens: integer('tokens'),
  created_at: text('created_at').default('datetime(\'now\')'),
})

export const ai_jobs = sqliteTable('ai_jobs', {
  id: text('id').primaryKey(),
  workspace_id: text('workspace_id').notNull().references(() => workspaces.id),
  name: text('name').notNull(),
  kind: text('kind').notNull(),
  status: text('status').default('pending'),
  scheduled_at: text('scheduled_at'),
  run_at: text('run_at'),
  result: text('result'),
  error: text('error'),
  created_at: text('created_at').default('datetime(\'now\')'),
})

export const reports = sqliteTable('reports', {
  id: text('id').primaryKey(),
  workspace_id: text('workspace_id').notNull().references(() => workspaces.id),
  project_id: text('project_id').references(() => projects.id),
  report_type: text('report_type').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  generated_by: text('generated_by'),
  generated_at: text('generated_at').default('datetime(\'now\')'),
  created_at: text('created_at').default('datetime(\'now\')'),
})

export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey(),
  workspace_id: text('workspace_id').notNull().references(() => workspaces.id),
  customer_id: text('customer_id'),
  plan: text('plan').default('free'),
  status: text('status').default('active'),
  current_period_end: text('current_period_end'),
  stripe_sub_id: text('stripe_sub_id'),
  created_at: text('created_at').default('datetime(\'now\')'),
})

export const proposals = sqliteTable('proposals', {
  id: text('id').primaryKey(),
  workspace_id: text('workspace_id').notNull().references(() => workspaces.id),
  project_id: text('project_id').references(() => projects.id),
  client: text('client').notNull(),
  title: text('title').notNull(),
  value: real('value').default(0),
  status: text('status').default('draft'),
  valid_until: text('valid_until'),
  items: text('items').default('[]'),
  created_at: text('created_at').default('datetime(\'now\')'),
})

export const progress_logs = sqliteTable('progress_logs', {
  id: text('id').primaryKey(),
  workspace_id: text('workspace_id').notNull().references(() => workspaces.id),
  project_id: text('project_id').references(() => projects.id),
  log_date: text('log_date').notNull(),
  narrative: text('narrative'),
  created_at: text('created_at').default('datetime(\'now\')'),
})

export const subcontractor_bids = sqliteTable('subcontractor_bids', {
  id: text('id').primaryKey(),
  workspace_id: text('workspace_id').notNull().references(() => workspaces.id),
  bid_id: text('bid_id').references(() => bid_opportunities.id),
  subcontractor_id: text('subcontractor_id').references(() => subcontractors.id),
  amount: real('amount'),
  bidder_name: text('bidder_name'),
  submitted_at: text('submitted_at'),
  status: text('status').default('pending'),
  notes: text('notes'),
})

// Table reference map for skills
export const TABLES = {
  workspaces, users, projects, tasks, team_members,
  invoices, quotes, risks, snags, daily_logs,
  rfis, subcontractors, bid_opportunities, documents_store,
  site_photos, ai_conversations, ai_jobs, reports,
  subscriptions, proposals, progress_logs, subcontractor_bids
}
