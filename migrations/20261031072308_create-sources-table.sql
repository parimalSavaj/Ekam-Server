-- Migration: create-sources-table
-- Transactions are managed by the migration runner.

-- A source is one piece of content (a PDF, a web page address or a text file) stored in a
-- knowledge base. Intake only stores it: status stays 'stored' until the processing pipeline exists.
-- Deleting the knowledge base (or anything above it) removes its source rows. The stored files are
-- removed by the application, because the database cannot reach object storage.
-- Hard delete: source deletion is permanent, so there is no deleted_at column.
CREATE TABLE IF NOT EXISTS sources (
  id UUID PRIMARY KEY,
  knowledge_base_id UUID NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL
    CONSTRAINT sources_type_check CHECK (type IN ('pdf', 'web_page', 'text_file')),
  -- File name for files, the address for web pages. Shown in lists.
  name TEXT NOT NULL CONSTRAINT sources_name_check CHECK (char_length(btrim(name)) > 0),
  -- Web pages only. Stored as text and never fetched at intake.
  url TEXT NULL,
  -- Files only: object storage key, size in bytes and content type.
  storage_key TEXT NULL,
  size_bytes INTEGER NULL CONSTRAINT sources_size_bytes_check CHECK (size_bytes IS NULL OR size_bytes >= 0),
  content_type VARCHAR(100) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'stored'
    CONSTRAINT sources_status_check CHECK (status IN ('stored', 'processing', 'ready', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- A web page has an address and no file; every other type has a file and no address.
  CONSTRAINT sources_location_check CHECK (
    (type = 'web_page' AND url IS NOT NULL AND storage_key IS NULL AND size_bytes IS NULL AND content_type IS NULL)
    OR
    (type <> 'web_page' AND url IS NULL AND storage_key IS NOT NULL AND size_bytes IS NOT NULL AND content_type IS NOT NULL)
  )
);

-- Serves the foreign key and "list this knowledge base's sources, oldest first" in one index.
CREATE INDEX IF NOT EXISTS idx_sources_knowledge_base_id_created_at ON sources (knowledge_base_id, created_at);
