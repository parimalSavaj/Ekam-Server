import type { IWorkspacesRepository } from "../../../infrastructure/repositories/workspaces/workspaces.repository.interface.js";
import { InternalError, NotFoundError } from "../../../shared/core/api-error.js";
import type { ILoggerService } from "../../../shared/services/logger/logger.service.interface.js";
import { UpdateWorkspaceResponseDto, type UpdateWorkspaceRequestDto } from "./dtos/update-workspace.dto.js";

export class UpdateWorkspaceUseCase {
  constructor(
    private readonly workspaces: IWorkspacesRepository,
    private readonly logger: ILoggerService,
  ) {}

  async execute(dto: UpdateWorkspaceRequestDto): Promise<UpdateWorkspaceResponseDto> {
    const existing = await this.workspaces.findByIdAndOwnerId(dto.workspaceId, dto.userId);
    if (!existing) throw new NotFoundError("Workspace not found");

    const renamed = existing.rename(dto.name);

    let updated: boolean;
    try {
      updated = await this.workspaces.update(renamed);
    } catch (error) {
      this.logger.error("Workspace rename failed", error, { workspaceId: dto.workspaceId, userId: dto.userId });
      throw new InternalError("Could not rename the workspace - please try again");
    }
    // The workspace was deleted between the read and the write.
    if (!updated) throw new NotFoundError("Workspace not found");

    this.logger.info("Workspace renamed", { workspaceId: renamed.id, userId: dto.userId });
    return UpdateWorkspaceResponseDto.toResponse(renamed);
  }
}
