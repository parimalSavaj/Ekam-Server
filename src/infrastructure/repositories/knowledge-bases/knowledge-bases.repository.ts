import { KnowledgeBaseEntity } from "../../../domain/entities/knowledge-base.entity.js";
import type { IDatabaseService } from "../../../shared/services/database/database.service.interface.js";
import type { IKnowledgeBasesRepository } from "./knowledge-bases.repository.interface.js";
import type { KnowledgeBaseRow } from "./knowledge-bases.types.js";

const COLUMNS = "id, workspace_id, name, description, created_at, updated_at";

// Ownership lives on the workspace (workspaces.owner_id). Until membership and roles exist,
// "may act on this knowledge base" means "owns its workspace".
const OWNS_WORKSPACE = "EXISTS (SELECT 1 FROM workspaces w WHERE w.id = knowledge_bases.workspace_id AND w.owner_id = ";

export class KnowledgeBasesRepository implements IKnowledgeBasesRepository {
  private readonly TABLE = "knowledge_bases";

  constructor(private readonly db: IDatabaseService) {}

  async create(entity: KnowledgeBaseEntity): Promise<void> {
    const sql = `INSERT INTO ${this.TABLE} (${COLUMNS}) VALUES ($1, $2, $3, $4, $5, $6)`;
    await this.db.insert(sql, [
      entity.id,
      entity.workspaceId,
      entity.name,
      entity.description,
      entity.createdAt,
      entity.updatedAt,
    ]);
  }

  async findAllByWorkspaceId(workspaceId: string): Promise<KnowledgeBaseEntity[]> {
    const sql = `SELECT ${COLUMNS} FROM ${this.TABLE} WHERE workspace_id = $1 ORDER BY created_at, id`;
    const rows = await this.db.select<KnowledgeBaseRow>(sql, [workspaceId]);
    return rows.map(row => this.toEntity(row));
  }

  async findByIdInWorkspaceOfOwner(id: string, workspaceId: string, ownerId: string): Promise<KnowledgeBaseEntity | null> {
    const sql = `SELECT ${COLUMNS} FROM ${this.TABLE} WHERE id = $1 AND workspace_id = $2 AND ${OWNS_WORKSPACE}$3)`;
    const row = await this.db.selectOne<KnowledgeBaseRow>(sql, [id, workspaceId, ownerId]);
    return row ? this.toEntity(row) : null;
  }

  async update(entity: KnowledgeBaseEntity, ownerId: string): Promise<boolean> {
    const sql =
      `UPDATE ${this.TABLE} SET name = $1, description = $2, updated_at = $3 ` +
      `WHERE id = $4 AND workspace_id = $5 AND ${OWNS_WORKSPACE}$6)`;
    const affected = await this.db.execute(sql, [
      entity.name,
      entity.description,
      entity.updatedAt,
      entity.id,
      entity.workspaceId,
      ownerId,
    ]);
    return affected > 0;
  }

  async deleteByIdInWorkspaceOfOwner(id: string, workspaceId: string, ownerId: string): Promise<boolean> {
    const sql = `DELETE FROM ${this.TABLE} WHERE id = $1 AND workspace_id = $2 AND ${OWNS_WORKSPACE}$3)`;
    const affected = await this.db.execute(sql, [id, workspaceId, ownerId]);
    return affected > 0;
  }

  // --- Private mapper: DB row -> Entity ---
  private toEntity(row: KnowledgeBaseRow): KnowledgeBaseEntity {
    return KnowledgeBaseEntity.fromRecord(row);
  }
}
