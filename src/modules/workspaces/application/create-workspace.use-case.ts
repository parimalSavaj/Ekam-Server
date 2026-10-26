import { WorkspaceEntity } from "../../../domain/entities/workspace.entity.js";
import type { IWorkspacesRepository } from "../../../infrastructure/repositories/workspaces/workspaces.repository.interface.js";
import { InternalError } from "../../../shared/core/api-error.js";
import type { IIdService } from "../../../shared/services/id/id.service.interface.js";
import type { ILoggerService } from "../../../shared/services/logger/logger.service.interface.js";
import { CreateWorkspaceResponseDto, type CreateWorkspaceRequestDto } from "./dtos/create-workspace.dto.js";

export class CreateWorkspaceUseCase {
  constructor(
    private readonly workspaces: IWorkspacesRepository,
    private readonly ids: IIdService,
    private readonly logger: ILoggerService,
  ) {}

  async execute(dto: CreateWorkspaceRequestDto): Promise<CreateWorkspaceResponseDto> {
    const workspace = WorkspaceEntity.create({ id: this.ids.generate(), ownerId: dto.userId, name: dto.name });

    // A single insert is atomic, so no transaction is needed.
    try {
      await this.workspaces.create(workspace);
    } catch (error) {
      this.logger.error("Workspace creation failed", error, { userId: dto.userId });
      throw new InternalError("Could not create the workspace - please try again");
    }

    this.logger.info("Workspace created", { workspaceId: workspace.id, userId: dto.userId });
    return CreateWorkspaceResponseDto.toResponse(workspace);
  }
}
