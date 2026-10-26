import type { IWorkspacesRepository } from "../../../infrastructure/repositories/workspaces/workspaces.repository.interface.js";
import { InternalError, NotFoundError } from "../../../shared/core/api-error.js";
import type { ILoggerService } from "../../../shared/services/logger/logger.service.interface.js";
import { DeleteWorkspaceResponseDto, type DeleteWorkspaceRequestDto } from "./dtos/delete-workspace.dto.js";

export class DeleteWorkspaceUseCase {
  constructor(
    private readonly workspaces: IWorkspacesRepository,
    private readonly logger: ILoggerService,
  ) {}

  async execute(dto: DeleteWorkspaceRequestDto): Promise<DeleteWorkspaceResponseDto> {
    let deleted: boolean;
    try {
      deleted = await this.workspaces.deleteByIdAndOwnerId(dto.workspaceId, dto.userId);
    } catch (error) {
      this.logger.error("Workspace deletion failed", error, { workspaceId: dto.workspaceId, userId: dto.userId });
      throw new InternalError("Could not delete the workspace - please try again");
    }
    if (!deleted) throw new NotFoundError("Workspace not found");

    this.logger.info("Workspace deleted", { workspaceId: dto.workspaceId, userId: dto.userId });
    return DeleteWorkspaceResponseDto.toResponse({ id: dto.workspaceId });
  }
}
