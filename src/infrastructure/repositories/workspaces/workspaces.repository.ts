import { WorkspaceEntity } from "../../../domain/entities/workspace.entity.js";
import type { IDatabaseService } from "../../../shared/services/database/database.service.interface.js";
import type { IWorkspacesRepository } from "./workspaces.repository.interface.js";
import type { WorkspaceRow } from "./workspaces.types.js";

const COLUMNS = "id, owner_id, name, created_at, updated_at";

export class WorkspacesRepository implements IWorkspacesRepository {
  private readonly TABLE = "workspaces";

  constructor(private readonly db: IDatabaseService) {}

  async create(entity: WorkspaceEntity): Promise<void> {
    const sql = `INSERT INTO ${this.TABLE} (${COLUMNS}) VALUES ($1, $2, $3, $4, $5)`;
    await this.db.insert(sql, [entity.id, entity.ownerId, entity.name, entity.createdAt, entity.updatedAt]);
  }

  async findAllByOwnerId(ownerId: string): Promise<WorkspaceEntity[]> {
    const sql = `SELECT ${COLUMNS} FROM ${this.TABLE} WHERE owner_id = $1 ORDER BY created_at, id`;
    const rows = await this.db.select<WorkspaceRow>(sql, [ownerId]);
    return rows.map(row => this.toEntity(row));
  }

  async findByIdAndOwnerId(id: string, ownerId: string): Promise<WorkspaceEntity | null> {
    const sql = `SELECT ${COLUMNS} FROM ${this.TABLE} WHERE id = $1 AND owner_id = $2`;
    const row = await this.db.selectOne<WorkspaceRow>(sql, [id, ownerId]);
    return row ? this.toEntity(row) : null;
  }

  async update(entity: WorkspaceEntity): Promise<boolean> {
    const sql = `UPDATE ${this.TABLE} SET name = $1, updated_at = $2 WHERE id = $3 AND owner_id = $4`;
    const affected = await this.db.execute(sql, [entity.name, entity.updatedAt, entity.id, entity.ownerId]);
    return affected > 0;
  }

  async deleteByIdAndOwnerId(id: string, ownerId: string): Promise<boolean> {
    const sql = `DELETE FROM ${this.TABLE} WHERE id = $1 AND owner_id = $2`;
    const affected = await this.db.execute(sql, [id, ownerId]);
    return affected > 0;
  }

  // --- Private mapper: DB row -> Entity ---
  private toEntity(row: WorkspaceRow): WorkspaceEntity {
    return WorkspaceEntity.fromRecord(row);
  }
}
