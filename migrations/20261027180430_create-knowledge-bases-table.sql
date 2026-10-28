-- Migration: create-knowledge-bases-table
-- Transactions are managed by the migration runner.

-- A knowledge base belongs to one workspace. Deleting the workspace (or the owner's account,
-- which deletes their workspaces) removes its knowledge bases, so no orphaned data is left behind.
-- Hard delete: knowledge base deletion is permanent, so there is no deleted_at column.
CREATE TABLE IF NOT EXISTS knowledge_bases (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL CONSTRAINT knowledge_bases_name_check CHECK (char_length(btrim(name)) > 0),
  description VARCHAR(500) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Serves the foreign key and "list this workspace's knowledge bases, oldest first" in one index.
CREATE INDEX IF NOT EXISTS idx_knowledge_bases_workspace_id_created_at ON knowledge_bases (workspace_id, created_at);
