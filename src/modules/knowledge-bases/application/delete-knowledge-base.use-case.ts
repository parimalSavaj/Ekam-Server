import type { IStorageExternalService } from "../../../infrastructure/external-services/storage/storage.external-service.interface.js";
import type { IKnowledgeBasesRepository } from "../../../infrastructure/repositories/knowledge-bases/knowledge-bases.repository.interface.js";
import type { ISourcesRepository } from "../../../infrastructure/repositories/sources/sources.repository.interface.js";
import { InternalError, NotFoundError } from "../../../shared/core/api-error.js";
import type { ILoggerService } from "../../../shared/services/logger/logger.service.interface.js";
import { DeleteKnowledgeBaseResponseDto, type DeleteKnowledgeBaseRequestDto } from "./dtos/delete-knowledge-base.dto.js";

export class DeleteKnowledgeBaseUseCase {
  constructor(
    private readonly knowledgeBases: IKnowledgeBasesRepository,
    private readonly sources: ISourcesRepository,
    private readonly storage: IStorageExternalService,
    private readonly logger: ILoggerService,
  ) {}

  async execute(dto: DeleteKnowledgeBaseRequestDto): Promise<DeleteKnowledgeBaseResponseDto> {
    const context = { knowledgeBaseId: dto.knowledgeBaseId, workspaceId: dto.workspaceId, userId: dto.userId };

    // The source rows disappear with the knowledge base, so their stored files are looked up first.
    // The ownership check comes before it, so another user's knowledge base looks exactly like a missing one.
    const knowledgeBase = await this.knowledgeBases.findByIdInWorkspaceOfOwner(
      dto.knowledgeBaseId,
      dto.workspaceId,
      dto.userId,
    );
    if (!knowledgeBase) throw new NotFoundError("Knowledge base not found");
    const storageKeys = await this.sources.findStorageKeysByKnowledgeBaseId(knowledgeBase.id);

    let deleted: boolean;
    try {
      deleted = await this.knowledgeBases.deleteByIdInWorkspaceOfOwner(dto.knowledgeBaseId, dto.workspaceId, dto.userId);
    } catch (error) {
      this.logger.error("Knowledge base deletion failed", error, context);
      throw new InternalError("Could not delete the knowledge base - please try again");
    }
    if (!deleted) throw new NotFoundError("Knowledge base not found");

    // The knowledge base is gone, so the request succeeded. If the files cannot be removed they are
    // only logged: failing now would make a retry answer 404 and leave the files behind for good.
    if (storageKeys.length > 0) {
      try {
        await this.storage.deleteMany(storageKeys);
      } catch (error) {
        this.logger.error("Files of a deleted knowledge base could not be removed from storage", error, {
          ...context,
          fileCount: storageKeys.length,
        });
      }
    }

    this.logger.info("Knowledge base deleted", { ...context, fileCount: storageKeys.length });
    return DeleteKnowledgeBaseResponseDto.toResponse({ id: dto.knowledgeBaseId });
  }
}
