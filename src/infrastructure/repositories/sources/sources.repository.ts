import { SourceEntity } from "../../../domain/entities/source.entity.js";
import type { IDatabaseService } from "../../../shared/services/database/database.service.interface.js";
import type { ISourcesRepository } from "./sources.repository.interface.js";
import type { SourceRow, SourceStorageKeyRow } from "./sources.types.js";

const COLUMNS =
  "id, knowledge_base_id, type, name, url, storage_key, size_bytes, content_type, status, created_at, updated_at";

// Ownership lives on the workspace (workspaces.owner_id). Until membership and roles exist,
// "may act on this source" means "owns the workspace of its knowledge base".
const OWNS_KNOWLEDGE_BASE =
  "EXISTS (SELECT 1 FROM knowledge_bases kb JOIN workspaces w ON w.id = kb.workspace_id " +
  "WHERE kb.id = sources.knowledge_base_id AND kb.workspace_id = ";

export class SourcesRepository implements ISourcesRepository {
  private readonly TABLE = "sources";

  constructor(private readonly db: IDatabaseService) {}

  async create(entity: SourceEntity): Promise<void> {
    const sql = `INSERT INTO ${this.TABLE} (${COLUMNS}) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`;
    await this.db.insert(sql, [
      entity.id,
      entity.knowledgeBaseId,
      entity.type,
      entity.name,
      entity.url,
      entity.storageKey,
      entity.sizeBytes,
      entity.contentType,
      entity.status,
      entity.createdAt,
      entity.updatedAt,
    ]);
  }

  async findAllByKnowledgeBaseId(knowledgeBaseId: string): Promise<SourceEntity[]> {
    const sql = `SELECT ${COLUMNS} FROM ${this.TABLE} WHERE knowledge_base_id = $1 ORDER BY created_at, id`;
    const rows = await this.db.select<SourceRow>(sql, [knowledgeBaseId]);
    return rows.map(row => this.toEntity(row));
  }

  async deleteByIdInKnowledgeBaseOfOwner(
    id: string,
    knowledgeBaseId: string,
    workspaceId: string,
    ownerId: string,
  ): Promise<SourceEntity | null> {
    const sql =
      `DELETE FROM ${this.TABLE} WHERE id = $1 AND knowledge_base_id = $2 AND ${OWNS_KNOWLEDGE_BASE}$3 AND w.owner_id = $4) ` +
      `RETURNING ${COLUMNS}`;
    // DELETE ... RETURNING reads and removes the row in one statement, so a stored file is never orphaned by a race.
    const rows = await this.db.select<SourceRow>(sql, [id, knowledgeBaseId, workspaceId, ownerId]);
    const row = rows[0];
    return row ? this.toEntity(row) : null;
  }

  async findStorageKeysByKnowledgeBaseId(knowledgeBaseId: string): Promise<string[]> {
    const sql = `SELECT storage_key FROM ${this.TABLE} WHERE knowledge_base_id = $1 AND storage_key IS NOT NULL`;
    const rows = await this.db.select<SourceStorageKeyRow>(sql, [knowledgeBaseId]);
    return rows.map(row => row.storage_key);
  }

  // --- Private mapper: DB row -> Entity ---
  private toEntity(row: SourceRow): SourceEntity {
    return SourceEntity.fromRecord(row);
  }
}
