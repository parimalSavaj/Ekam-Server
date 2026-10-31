import type { SourceEntity } from "../../../domain/entities/source.entity.js";
import type { IStorageExternalService } from "../../../infrastructure/external-services/storage/storage.external-service.interface.js";
import type { ISourcesRepository } from "../../../infrastructure/repositories/sources/sources.repository.interface.js";
import { InternalError, NotFoundError } from "../../../shared/core/api-error.js";
import type { ILoggerService } from "../../../shared/services/logger/logger.service.interface.js";
import { DeleteSourceResponseDto, type DeleteSourceRequestDto } from "./dtos/delete-source.dto.js";

export class DeleteSourceUseCase {
  constructor(
    private readonly sources: ISourcesRepository,
    private readonly storage: IStorageExternalService,
    private readonly logger: ILoggerService,
  ) {}

  async execute(dto: DeleteSourceRequestDto): Promise<DeleteSourceResponseDto> {
    const context = {
      sourceId: dto.sourceId,
      knowledgeBaseId: dto.knowledgeBaseId,
      workspaceId: dto.workspaceId,
      userId: dto.userId,
    };

    let deleted: SourceEntity | null;
    try {
      deleted = await this.sources.deleteByIdInKnowledgeBaseOfOwner(
        dto.sourceId,
        dto.knowledgeBaseId,
        dto.workspaceId,
        dto.userId,
      );
    } catch (error) {
      this.logger.error("Source deletion failed", error, context);
      throw new InternalError("Could not delete the source - please try again");
    }
    if (!deleted) throw new NotFoundError("Source not found");

    // The row is gone, so the source is deleted from the user's point of view. If the file cannot
    // be removed it is only logged: failing the request now would make a retry answer 404.
    if (deleted.storageKey !== null) {
      try {
        await this.storage.deleteMany([deleted.storageKey]);
      } catch (error) {
        this.logger.error("Deleted source file could not be removed from storage", error, {
          ...context,
          storageKey: deleted.storageKey,
        });
      }
    }

    this.logger.info("Source deleted", context);
    return DeleteSourceResponseDto.toResponse({ id: deleted.id });
  }
}
