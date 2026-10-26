import type { IWorkspacesRepository } from "../../../infrastructure/repositories/workspaces/workspaces.repository.interface.js";
import { ListWorkspacesResponseDto, type ListWorkspacesRequestDto } from "./dtos/list-workspaces.dto.js";

export class ListWorkspacesUseCase {
  constructor(private readonly workspaces: IWorkspacesRepository) {}

  async execute(dto: ListWorkspacesRequestDto): Promise<ListWorkspacesResponseDto> {
    const workspaces = await this.workspaces.findAllByOwnerId(dto.userId);
    return ListWorkspacesResponseDto.toResponse(workspaces);
  }
}
