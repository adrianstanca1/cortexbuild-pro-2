# CortexBuild Pro 2.0 — PostgreSQL schema
# Run with: psql -f this_file.db_name < cortexbuild_pro

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS proposals CASCADE;
DROP TABLE IF NOT EXISTS subscriptions CASCADE;
DROP TABLE IF NOT EXISTS reports CASCADE;
DROP TABLE IF NOT EXISTS ai_jobs CASCADE;
DROP TABLE IF NOT EXISTS ai_conversations CASCADE;
DROP TABLE IF NOT EXISTS site_photos CASCADE;
DROP TABLE IF NOT EXISTS documents_store CASCADE;
DROP TABLE IF NOT EXISTS subcontractor_bids CASCADE;
DROP TABLE IF NOT EXISTS bid_opportunities CASCADE;
DROP TABLE IF NOT EXISTS subcontractors CASCADE;
DROP TABLE IF NOT EXISTS rfis CASCADE;
DROP TABLE IF NOT EXISTS daily_logs CASCADE;
DROP TABLE IF NOT EXISTS progress_logs CASCADE;
DROP TABLE IF NOT EXISTS snags CASCADE;
DROP TABLE IF NOT EXISTS risks CASCADE;
DROP TABLE IF NOT EXISTS invoices CASCADE;
DROP TABLE IF NOT EXISTS quotes CASCADE;
DROP TABLE IF NOT EXISTS tasks CASCADE;
DROP TABLE IF NOT EXISTS team_members CASCADE;
DROP TABLE IF NOT EXISTS projects CASCADE;
DROP TABLE IF NOT EXISTS users CASCADE;
DROP TABLE IF NOT EXISTS workspaces CASCADE;

-- ── Tenancy ────────────────────────────────────────────────────────────
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  company TEXT,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'director',
  cscs TEXT,
  safety_score INTEGER DEFAULT 90,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Core Construction Entities ─────────────────────────────────────────
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  client TEXT,
  value DECIMAL(12,2) DEFAULT 0,
  pct INTEGER DEFAULT 0,
  status TEXT DEFAULT 'quoting',
  addr TEXT,
  team_count INTEGER DEFAULT 0,
  due DATE,
  margin DECIMAL(8,2) DEFAULT 0,
  risk_score REAL DEFAULT 0,
  risk_factors JSONB,
  health_color TEXT DEFAULT 'green',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  assignee TEXT,
  due DATE,
  prio TEXT DEFAULT 'med',
  done BOOLEAN DEFAULT FALSE,
  predicted_duration INTEGER,
  dependency_ids JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  color TEXT,
  site TEXT,
  hours DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'off',
  cscs TEXT,
  phone TEXT,
  email TEXT,
  day_rate DECIMAL(10,2),
  certificates JSONB,
  qualifications JSONB,
  skills JSONB,
  meta JSONB
);

CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  client TEXT,
  amount DECIMAL(12,2),
  status TEXT DEFAULT 'due',
  issued DATE,
  due DATE,
  paid DATE
);

CREATE TABLE quotes (
  id TEXT PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  client TEXT,
  title TEXT,
  total DECIMAL(12,2),
  status TEXT DEFAULT 'draft',
  issued DATE,
  valid_until DATE,
  items JSONB
);

-- ── Predictive Risk Register ───────────────────────────────────────────
CREATE TABLE risks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  probability REAL DEFAULT 50,
  impact REAL DEFAULT 50,
  risk_score REAL GENERATED ALWAYS AS (probability * impact / 100) STORED,
  status TEXT DEFAULT 'open',
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  predicted_date DATE,
  predicted_overrun DECIMAL(12,2),
  predicted_delay_days INTEGER,
  ai_source JSONB,
  mitigation TEXT,
  rsi REAL,
  cp_70_30 REAL,
  cp_60_40 REAL,
  moisture_regulation TEXT,
  euronorm_minimum TEXT,
  safety TEXT,
  cost TEXT,
  weather TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT risk_score_check CHECK (risk_score >= 0 AND risk_score <= 100)
);

-- ── AI Site Agent: Snags ───────────────────────────────────────────────
CREATE TABLE snags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
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
  due DATE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── AI Site Agent: Daily Logs ─────────────────────────────────────────
CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  crew_count INTEGER DEFAULT 0,
  narrative TEXT,
  ai_summary TEXT,
  ai_extracted JSONB,
  photos JSONB,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE progress_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  log_date DATE NOT NULL,
  phase TEXT,
  description TEXT NOT NULL,
  hours_spent DECIMAL(10,2) DEFAULT 0,
  crew_count INTEGER DEFAULT 0,
  weather TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── AI Site Agent: Auto RFIs ───────────────────────────────────────────
CREATE TABLE rfis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_trigger TEXT,
  ai_context JSONB,
  question TEXT NOT NULL,
  ref_drawing TEXT,
  ref_location TEXT,
  priority TEXT DEFAULT 'med',
  status TEXT DEFAULT 'open',
  submitted_to TEXT,
  answered_by TEXT,
  answer TEXT,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Subcontractor Network ──────────────────────────────────────────────
CREATE TABLE subcontractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trade TEXT NOT NULL,
  contact TEXT,
  email TEXT,
  phone TEXT,
  rating REAL DEFAULT 0,
  completed_jobs INTEGER DEFAULT 0,
  avg_days DECIMAL(6,1),
  reliability REAL DEFAULT 50,
  specializations JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bid_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  scope_desc TEXT NOT NULL,
  estimated_value DECIMAL(12,2),
  trade TEXT,
  status TEXT DEFAULT 'draft',
  awarded_to UUID REFERENCES subcontractors(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  awarded_at TIMESTAMPTZ
);

CREATE TABLE subcontractor_bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID REFERENCES bid_opportunities(id) ON DELETE CASCADE,
  subcontractor_id UUID REFERENCES subcontractors(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'GBP',
  duration_days INTEGER,
  notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'submitted'
);

-- ── Generic Document Store ─────────────────────────────────────────────
CREATE TABLE documents_store (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  collection TEXT NOT NULL,
  doc_id TEXT NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, collection, doc_id)
);

-- ── AI Agent Memory ────────────────────────────────────────────────────
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  tool_calls JSONB,
  tokens INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ,
  run_at TIMESTAMPTZ,
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Reports, Subscriptions, Proposals ─────────────────────────────────
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  generated_by TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  customer_id TEXT,
  plan TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  stripe_sub_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  client TEXT NOT NULL,
  title TEXT NOT NULL,
  value DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'draft',
  valid_until DATE,
  items JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Site Photos ─────────────────────────────────────────────────────────
CREATE TABLE site_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  thumb_url TEXT,
  taken_at TIMESTAMPTZ DEFAULT NOW(),
  location TEXT,
  captioned_by_ai BOOLEAN DEFAULT FALSE,
  ai_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_projects_workspace ON projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace ON tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_snags_workspace ON snags(workspace_id);
CREATE INDEX IF NOT EXISTS idx_risks_workspace ON risks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_risks_project ON risks(project_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_workspace ON daily_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_rfis_workspace ON rfis(workspace_id);
CREATE INDEX IF NOT EXISTS idx_subs_workspace ON subcontractors(workspace_id);
CREATE INDEX IF NOT EXISTS idx_bids_workspace ON bid_opportunities(workspace_id);
CREATE INDEX IF NOT EXISTS idx_docs_workspace ON documents_store(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_conv_workspace ON ai_conversations(workspace_id);

COMMENT ON TABLE risks IS 'Predictive risk register — AI-scanned, manually adjusted';
COMMENT ON COLUMN risks.rsi IS 'Risk Severity Index — AI-calculated';
COMMENT ON COLUMN risks.cp_70_30 IS 'Cost Performance index — 70/30 weighting';
COMMENT ON COLUMN risks.cp_60_40 IS 'Cost Performance index — 60/40 weighting';
COMMENT ON COLUMN risks.moisture_regulation IS 'Moisture regulation factor — AI building physics analysis';
COMMENT ON COLUMN risks.euronorm_minimum IS 'EuroNorm minimum standard — AI compliance check';
COMMENT ON COLUMN risks.safety IS 'Safety risk assessment — AI safety scoring';
COMMENT ON COLUMN risks.cost IS 'Cost overrun risk — AI cost prediction';
COMMENT ON COLUMN risks.weather IS 'Weather risk factor — AI weather impact analysis';

COMMENT ON TABLE snags IS 'AI-detected site defects from photos — computer vision';
COMMENT ON TABLE daily_logs IS 'AI-summarized daily progress logs — voice/photo to structured data';
COMMENT ON TABLE rfis IS 'Auto-generated RFIs from snags and site events — AI-driven';
