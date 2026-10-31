export type SourceRow = {
  id: string;
  knowledge_base_id: string;
  type: string;
  name: string;
  url: string | null;
  storage_key: string | null;
  size_bytes: number | null;
  content_type: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
};

/** Only the object storage key, for cleaning up files. */
export type SourceStorageKeyRow = {
  storage_key: string;
};
