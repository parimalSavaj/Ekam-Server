import type { IKnowledgeBasesRepository } from "../../../infrastructure/repositories/knowledge-bases/knowledge-bases.repository.interface.js";
import { InternalError, NotFoundError } from "../../../shared/core/api-error.js";
import type { ILoggerService } from "../../../shared/services/logger/logger.service.interface.js";
import { UpdateKnowledgeBaseResponseDto, type UpdateKnowledgeBaseRequestDto } from "./dtos/update-knowledge-base.dto.js";

export class UpdateKnowledgeBaseUseCase {
  constructor(
    private readonly knowledgeBases: IKnowledgeBasesRepository,
    private readonly logger: ILoggerService,
  ) {}

  async execute(dto: UpdateKnowledgeBaseRequestDto): Promise<UpdateKnowledgeBaseResponseDto> {
    const existing = await this.knowledgeBases.findByIdInWorkspaceOfOwner(
      dto.knowledgeBaseId,
      dto.workspaceId,
      dto.userId,
    );
    if (!existing) throw new NotFoundError("Knowledge base not found");

    const updatedEntity = existing.update({ name: dto.name, description: dto.description });

    let saved: boolean;
    try {
      saved = await this.knowledgeBases.update(updatedEntity, dto.userId);
    } catch (error) {
      this.logger.error("Knowledge base update failed", error, {
        knowledgeBaseId: dto.knowledgeBaseId,
        workspaceId: dto.workspaceId,
        userId: dto.userId,
      });
      throw new InternalError("Could not update the knowledge base - please try again");
    }
    // The knowledge base was deleted between the read and the write.
    if (!saved) throw new NotFoundError("Knowledge base not found");

    this.logger.info("Knowledge base updated", {
      knowledgeBaseId: updatedEntity.id,
      workspaceId: dto.workspaceId,
      userId: dto.userId,
    });
    return UpdateKnowledgeBaseResponseDto.toResponse(updatedEntity);
  }
}
