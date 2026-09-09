-- PostgreSQL 17. Flexible app documents preserve the original category-specific fields.
-- Auth identities/sessions are relational; documents use JSONB with a collection index.
CREATE TABLE IF NOT EXISTS google_accounts (
  id uuid PRIMARY KEY,
  firebase_uid text NOT NULL UNIQUE,
  email text NOT NULL,
  name text NOT NULL,
  photo_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS documents (
  path text PRIMARY KEY,
  collection text NOT NULL,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS documents_collection ON documents(collection);
CREATE INDEX IF NOT EXISTS documents_data ON documents USING gin(data);
