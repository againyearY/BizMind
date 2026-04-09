-- FEAT-DB-001: 信息条目表
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  content_raw TEXT NOT NULL,
  content_summary TEXT NOT NULL DEFAULT '',
  source_channel TEXT NOT NULL CHECK(source_channel IN ('wechat','qq','email','telegram','other')),
  category TEXT NOT NULL DEFAULT 'misc' CHECK(category IN ('lead','maintain','progress','finance','todo','misc')),
  customer_name TEXT,
  project_name TEXT,
  amount REAL,
  extracted_date TEXT,
  is_urgent INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'unprocessed' CHECK(status IN ('unprocessed','processed','archived')),
  attachment_path TEXT,
  ai_confidence REAL NOT NULL DEFAULT 0,
  user_corrected INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_category ON messages(category);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_customer ON messages(customer_name);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);

-- FEAT-DB-002: 配置表
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- FEAT-API-002: LLM 配置表
CREATE TABLE IF NOT EXISTS llm_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  api_key TEXT NOT NULL,
  base_url TEXT NOT NULL,
  model TEXT NOT NULL,
  vision_model TEXT DEFAULT '',
  updated_at TEXT NOT NULL
);

-- FEAT-DB-003: Token 使用追踪表
CREATE TABLE IF NOT EXISTS token_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  UNIQUE(date)
);
