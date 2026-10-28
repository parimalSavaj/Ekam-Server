import type { IKnowledgeBasesRepository } from "../../../infrastructure/repositories/knowledge-bases/knowledge-bases.repository.interface.js";
import type { IWorkspacesRepository } from "../../../infrastructure/repositories/workspaces/workspaces.repository.interface.js";
import { NotFoundError } from "../../../shared/core/api-error.js";
import { ListKnowledgeBasesResponseDto, type ListKnowledgeBasesRequestDto } from "./dtos/list-knowledge-bases.dto.js";

export class ListKnowledgeBasesUseCase {
  constructor(
    private readonly workspaces: IWorkspacesRepository,
    private readonly knowledgeBases: IKnowledgeBasesRepository,
  ) {}

  async execute(dto: ListKnowledgeBasesRequestDto): Promise<ListKnowledgeBasesResponseDto> {
    // An empty list is only meaningful for a workspace the user owns; anything else is a 404.
    const workspace = await this.workspaces.findByIdAndOwnerId(dto.workspaceId, dto.userId);
    if (!workspace) throw new NotFoundError("Workspace not found");

    const knowledgeBases = await this.knowledgeBases.findAllByWorkspaceId(workspace.id);
    return ListKnowledgeBasesResponseDto.toResponse(knowledgeBases);
  }
}
