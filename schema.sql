-- The Foundation — foundation-db schema
-- Database ID: c0b05a24-b8a8-4fd8-8cc7-fe70638cdeae
-- This schema is already applied to the live D1 database.
-- Use this file as reference for future migrations.

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  is_banned INTEGER DEFAULT 0,
  is_admin INTEGER DEFAULT 0
);

-- Articles: metadata only — content lives in /public/posts/*.md
-- is_ai_collaborative: marks pieces co-authored or responded to by AI
CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  author TEXT NOT NULL,
  category TEXT NOT NULL,        -- 'analysis' | 'politics' | 'society' | 'convergence'
  tags TEXT,                     -- JSON array as text: '["democracy","institutions"]'
  excerpt TEXT,
  content_file TEXT NOT NULL,    -- relative path e.g. 'posts/my-article.html'
  published_at TEXT,
  is_published INTEGER DEFAULT 0,
  is_ai_collaborative INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Comments with threading (parent_id for replies) and moderation
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_slug TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  approved INTEGER DEFAULT 0,
  flagged INTEGER DEFAULT 0,
  flag_count INTEGER DEFAULT 0,
  parent_id INTEGER DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Mailing list signups from homepage
CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  joined_at TEXT DEFAULT (datetime('now')),
  source TEXT DEFAULT 'homepage'
);

-- Contact form submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  read INTEGER DEFAULT 0
);

-- Session tokens (HttpOnly cookie auth)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
