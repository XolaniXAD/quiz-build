-- Run this once to set up the quiz schema in your PostgreSQL database.
-- Re-running is safe (all statements use IF NOT EXISTS / IF EXISTS).
--
-- Table overview:
--   quizzes        — one quiz per row
--   questions      — ordered list of questions belonging to a quiz
--   options        — answer choices for a question (all types)
--   question_images — uploaded images attached to a question
--
-- Future columns are already defined here with defaults so existing rows stay valid.
-- To add a new question type: no schema change needed; the `type` column accepts any string.

CREATE TABLE IF NOT EXISTS quizzes (
  id                   SERIAL PRIMARY KEY,
  title                TEXT             NOT NULL DEFAULT 'Untitled Quiz',
  description          TEXT,                              -- future: quiz description / instructions
  published            BOOLEAN          NOT NULL DEFAULT FALSE, -- future: draft vs live
  time_limit_seconds   INTEGER,                           -- future: timed quiz
  created_at           TIMESTAMPTZ      DEFAULT NOW(),
  updated_at           TIMESTAMPTZ      DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
  id           SERIAL PRIMARY KEY,
  quiz_id      INTEGER      REFERENCES quizzes(id) ON DELETE CASCADE,
  type         VARCHAR(50)  NOT NULL DEFAULT 'multiple_choice',
  -- Supported types: multiple_choice | checkbox | drag_drop_order | drag_drop_fill | dropdown
  position     INTEGER      NOT NULL DEFAULT 0,
  content      JSONB        NOT NULL DEFAULT '{}',  -- TipTap/ProseMirror JSON doc
  points       INTEGER      NOT NULL DEFAULT 1,    -- future: per-question scoring
  explanation  TEXT,                               -- future: shown after quiz is submitted
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS options (
  id           SERIAL PRIMARY KEY,
  question_id  INTEGER      REFERENCES questions(id) ON DELETE CASCADE,
  position     INTEGER      NOT NULL DEFAULT 0,
  text         TEXT         NOT NULL DEFAULT '',
  is_correct   BOOLEAN      NOT NULL DEFAULT FALSE,
  media_url    TEXT,        -- future: image-based answer choices
  match_key    TEXT,        -- future: drag_drop_fill — which blank this option belongs to
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS question_images (
  id            SERIAL PRIMARY KEY,
  question_id   INTEGER      REFERENCES questions(id) ON DELETE CASCADE,
  filename      TEXT         NOT NULL,
  original_name TEXT,
  mime_type     TEXT,
  size_bytes    INTEGER,
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);
