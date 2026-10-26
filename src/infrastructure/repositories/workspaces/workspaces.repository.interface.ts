import type { WorkspaceEntity } from "../../../domain/entities/workspace.entity.js";

export interface IWorkspacesRepository {
  create(entity: WorkspaceEntity): Promise<void>;
  /** The caller's workspaces, oldest first. */
  findAllByOwnerId(ownerId: string): Promise<WorkspaceEntity[]>;
  /** Null when the workspace does not exist or belongs to someone else. */
  findByIdAndOwnerId(id: string, ownerId: string): Promise<WorkspaceEntity | null>;
  /** Saves the name and updated_at. Returns false when no workspace of this owner matched. */
  update(entity: WorkspaceEntity): Promise<boolean>;
  /** Returns false when no workspace of this owner matched. */
  deleteByIdAndOwnerId(id: string, ownerId: string): Promise<boolean>;
}
