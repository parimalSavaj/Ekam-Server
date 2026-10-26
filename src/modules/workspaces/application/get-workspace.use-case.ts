import type { IWorkspacesRepository } from "../../../infrastructure/repositories/workspaces/workspaces.repository.interface.js";
import { NotFoundError } from "../../../shared/core/api-error.js";
import { GetWorkspaceResponseDto, type GetWorkspaceRequestDto } from "./dtos/get-workspace.dto.js";

export class GetWorkspaceUseCase {
  constructor(private readonly workspaces: IWorkspacesRepository) {}

  async execute(dto: GetWorkspaceRequestDto): Promise<GetWorkspaceResponseDto> {
    // Workspaces of other users look exactly like missing ones, so ids cannot be probed.
    const workspace = await this.workspaces.findByIdAndOwnerId(dto.workspaceId, dto.userId);
    if (!workspace) throw new NotFoundError("Workspace not found");

    return GetWorkspaceResponseDto.toResponse(workspace);
  }
}
