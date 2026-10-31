import type { SourceEntity } from "../../../domain/entities/source.entity.js";

/**
 * Reads and deletes are scoped through the workspace owner, so a source in someone else's
 * workspace behaves exactly like a missing one. Callers of create and findAll have already
 * checked that the knowledge base belongs to the owner.
 */
export interface ISourcesRepository {
  create(entity: SourceEntity): Promise<void>;
  /** The knowledge base's sources, oldest first. */
  findAllByKnowledgeBaseId(knowledgeBaseId: string): Promise<SourceEntity[]>;
  /**
   * Deletes the source and returns it, so the caller can remove its stored file.
   * Null when the source does not exist in this knowledge base or the workspace belongs to someone else.
   */
  deleteByIdInKnowledgeBaseOfOwner(
    id: string,
    knowledgeBaseId: string,
    workspaceId: string,
    ownerId: string,
  ): Promise<SourceEntity | null>;
  /** Storage keys of the files in a knowledge base, read before the knowledge base is deleted. */
  findStorageKeysByKnowledgeBaseId(knowledgeBaseId: string): Promise<string[]>;
}
