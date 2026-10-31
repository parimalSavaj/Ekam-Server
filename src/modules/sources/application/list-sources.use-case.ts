import type { IKnowledgeBasesRepository } from "../../../infrastructure/repositories/knowledge-bases/knowledge-bases.repository.interface.js";
import type { ISourcesRepository } from "../../../infrastructure/repositories/sources/sources.repository.interface.js";
import { NotFoundError } from "../../../shared/core/api-error.js";
import { ListSourcesResponseDto, type ListSourcesRequestDto } from "./dtos/list-sources.dto.js";

export class ListSourcesUseCase {
  constructor(
    private readonly knowledgeBases: IKnowledgeBasesRepository,
    private readonly sources: ISourcesRepository,
  ) {}

  async execute(dto: ListSourcesRequestDto): Promise<ListSourcesResponseDto> {
    // Knowledge bases of other users look exactly like missing ones, so ids cannot be probed.
    const knowledgeBase = await this.knowledgeBases.findByIdInWorkspaceOfOwner(
      dto.knowledgeBaseId,
      dto.workspaceId,
      dto.userId,
    );
    if (!knowledgeBase) throw new NotFoundError("Knowledge base not found");

    const sources = await this.sources.findAllByKnowledgeBaseId(knowledgeBase.id);
    return ListSourcesResponseDto.toResponse(sources);
  }
}
