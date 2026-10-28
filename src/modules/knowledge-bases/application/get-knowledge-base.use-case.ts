import type { IKnowledgeBasesRepository } from "../../../infrastructure/repositories/knowledge-bases/knowledge-bases.repository.interface.js";
import { NotFoundError } from "../../../shared/core/api-error.js";
import { GetKnowledgeBaseResponseDto, type GetKnowledgeBaseRequestDto } from "./dtos/get-knowledge-base.dto.js";

export class GetKnowledgeBaseUseCase {
  constructor(private readonly knowledgeBases: IKnowledgeBasesRepository) {}

  async execute(dto: GetKnowledgeBaseRequestDto): Promise<GetKnowledgeBaseResponseDto> {
    // Knowledge bases in other users' workspaces look exactly like missing ones.
    const knowledgeBase = await this.knowledgeBases.findByIdInWorkspaceOfOwner(
      dto.knowledgeBaseId,
      dto.workspaceId,
      dto.userId,
    );
    if (!knowledgeBase) throw new NotFoundError("Knowledge base not found");

    return GetKnowledgeBaseResponseDto.toResponse(knowledgeBase);
  }
}
