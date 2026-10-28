import type { IKnowledgeBasesRepository } from "../../../infrastructure/repositories/knowledge-bases/knowledge-bases.repository.interface.js";
import { InternalError, NotFoundError } from "../../../shared/core/api-error.js";
import type { ILoggerService } from "../../../shared/services/logger/logger.service.interface.js";
import { DeleteKnowledgeBaseResponseDto, type DeleteKnowledgeBaseRequestDto } from "./dtos/delete-knowledge-base.dto.js";

export class DeleteKnowledgeBaseUseCase {
  constructor(
    private readonly knowledgeBases: IKnowledgeBasesRepository,
    private readonly logger: ILoggerService,
  ) {}

  async execute(dto: DeleteKnowledgeBaseRequestDto): Promise<DeleteKnowledgeBaseResponseDto> {
    let deleted: boolean;
    try {
      deleted = await this.knowledgeBases.deleteByIdInWorkspaceOfOwner(dto.knowledgeBaseId, dto.workspaceId, dto.userId);
    } catch (error) {
      this.logger.error("Knowledge base deletion failed", error, {
        knowledgeBaseId: dto.knowledgeBaseId,
        workspaceId: dto.workspaceId,
        userId: dto.userId,
      });
      throw new InternalError("Could not delete the knowledge base - please try again");
    }
    if (!deleted) throw new NotFoundError("Knowledge base not found");

    this.logger.info("Knowledge base deleted", {
      knowledgeBaseId: dto.knowledgeBaseId,
      workspaceId: dto.workspaceId,
      userId: dto.userId,
    });
    return DeleteKnowledgeBaseResponseDto.toResponse({ id: dto.knowledgeBaseId });
  }
}
