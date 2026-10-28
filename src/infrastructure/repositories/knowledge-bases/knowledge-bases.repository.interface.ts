import type { KnowledgeBaseEntity } from "../../../domain/entities/knowledge-base.entity.js";

/**
 * Reads and writes are scoped through the workspace owner, so a knowledge base in someone
 * else's workspace behaves exactly like a missing one.
 */
export interface IKnowledgeBasesRepository {
  create(entity: KnowledgeBaseEntity): Promise<void>;
  /** The workspace's knowledge bases, oldest first. The caller has already checked the workspace belongs to the owner. */
  findAllByWorkspaceId(workspaceId: string): Promise<KnowledgeBaseEntity[]>;
  /** Null when the knowledge base does not exist in this workspace or the workspace belongs to someone else. */
  findByIdInWorkspaceOfOwner(id: string, workspaceId: string, ownerId: string): Promise<KnowledgeBaseEntity | null>;
  /** Saves the name, description and updated_at. Returns false when no matching knowledge base of this owner was found. */
  update(entity: KnowledgeBaseEntity, ownerId: string): Promise<boolean>;
  /** Returns false when no matching knowledge base of this owner was found. */
  deleteByIdInWorkspaceOfOwner(id: string, workspaceId: string, ownerId: string): Promise<boolean>;
}
