import { KnowledgeBaseEntity } from "../../../domain/entities/knowledge-base.entity.js";
import type { IKnowledgeBasesRepository } from "../../../infrastructure/repositories/knowledge-bases/knowledge-bases.repository.interface.js";
import type { IWorkspacesRepository } from "../../../infrastructure/repositories/workspaces/workspaces.repository.interface.js";
import { InternalError, NotFoundError } from "../../../shared/core/api-error.js";
import type { IIdService } from "../../../shared/services/id/id.service.interface.js";
import type { ILoggerService } from "../../../shared/services/logger/logger.service.interface.js";
import { CreateKnowledgeBaseResponseDto, type CreateKnowledgeBaseRequestDto } from "./dtos/create-knowledge-base.dto.js";

export class CreateKnowledgeBaseUseCase {
  constructor(
    private readonly workspaces: IWorkspacesRepository,
    private readonly knowledgeBases: IKnowledgeBasesRepository,
    private readonly ids: IIdService,
    private readonly logger: ILoggerService,
  ) {}

  async execute(dto: CreateKnowledgeBaseRequestDto): Promise<CreateKnowledgeBaseResponseDto> {
    // Workspaces of other users look exactly like missing ones, so ids cannot be probed.
    const workspace = await this.workspaces.findByIdAndOwnerId(dto.workspaceId, dto.userId);
    if (!workspace) throw new NotFoundError("Workspace not found");

    const knowledgeBase = KnowledgeBaseEntity.create({
      id: this.ids.generate(),
      workspaceId: workspace.id,
      name: dto.name,
      description: dto.description,
    });

    // A single insert is atomic, so no transaction is needed.
    try {
      await this.knowledgeBases.create(knowledgeBase);
    } catch (error) {
      this.logger.error("Knowledge base creation failed", error, { workspaceId: dto.workspaceId, userId: dto.userId });
      throw new InternalError("Could not create the knowledge base - please try again");
    }

    this.logger.info("Knowledge base created", {
      knowledgeBaseId: knowledgeBase.id,
      workspaceId: dto.workspaceId,
      userId: dto.userId,
    });
    return CreateKnowledgeBaseResponseDto.toResponse(knowledgeBase);
  }
}
