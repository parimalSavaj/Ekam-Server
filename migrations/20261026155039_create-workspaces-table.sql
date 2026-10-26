-- Migration: create-workspaces-table
-- Transactions are managed by the migration runner.

-- A workspace belongs to the user who created it. Deleting the user removes their
-- workspaces (and, later, everything inside them), so no orphaned data is left behind.
-- Hard delete: workspace deletion is permanent, so there is no deleted_at column.
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL CONSTRAINT workspaces_name_check CHECK (char_length(btrim(name)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Serves the foreign key and "list my workspaces, oldest first" in one index.
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id_created_at ON workspaces (owner_id, created_at);
