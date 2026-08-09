-- Migration 018: Create Agent Logs and Schedule Tables
CREATE TABLE IF NOT EXISTS agent_logs (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  tool_action TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS agent_schedules (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  execute_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_logs_created ON agent_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_schedules_status ON agent_schedules(status, execute_at);
