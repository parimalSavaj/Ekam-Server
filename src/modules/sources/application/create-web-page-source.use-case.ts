import { SourceEntity } from "../../../domain/entities/source.entity.js";
import { SourceType } from "../../../domain/enums/source-type.enum.js";
import type { IKnowledgeBasesRepository } from "../../../infrastructure/repositories/knowledge-bases/knowledge-bases.repository.interface.js";
import type { ISourcesRepository } from "../../../infrastructure/repositories/sources/sources.repository.interface.js";
import { InternalError, NotFoundError } from "../../../shared/core/api-error.js";
import type { IIdService } from "../../../shared/services/id/id.service.interface.js";
import type { ILoggerService } from "../../../shared/services/logger/logger.service.interface.js";
import {
  CreateWebPageSourceResponseDto,
  type CreateWebPageSourceRequestDto,
} from "./dtos/create-web-page-source.dto.js";

export class CreateWebPageSourceUseCase {
  constructor(
    private readonly knowledgeBases: IKnowledgeBasesRepository,
    private readonly sources: ISourcesRepository,
    private readonly ids: IIdService,
    private readonly logger: ILoggerService,
  ) {}

  async execute(dto: CreateWebPageSourceRequestDto): Promise<CreateWebPageSourceResponseDto> {
    // Knowledge bases of other users look exactly like missing ones, so ids cannot be probed.
    const knowledgeBase = await this.knowledgeBases.findByIdInWorkspaceOfOwner(
      dto.knowledgeBaseId,
      dto.workspaceId,
      dto.userId,
    );
    if (!knowledgeBase) throw new NotFoundError("Knowledge base not found");

    // Intake only stores the address. The page is fetched later by the processing pipeline.
    const source = SourceEntity.create({
      id: this.ids.generate(),
      knowledgeBaseId: knowledgeBase.id,
      type: SourceType.WEB_PAGE,
      name: dto.url,
      url: dto.url,
    });

    // A single insert is atomic, so no transaction is needed.
    try {
      await this.sources.create(source);
    } catch (error) {
      this.logger.error("Web page source creation failed", error, {
        knowledgeBaseId: dto.knowledgeBaseId,
        workspaceId: dto.workspaceId,
        userId: dto.userId,
      });
      throw new InternalError("Could not add the web page - please try again");
    }

    this.logger.info("Web page source created", {
      sourceId: source.id,
      knowledgeBaseId: dto.knowledgeBaseId,
      workspaceId: dto.workspaceId,
      userId: dto.userId,
    });
    return CreateWebPageSourceResponseDto.toResponse(source);
  }
}
