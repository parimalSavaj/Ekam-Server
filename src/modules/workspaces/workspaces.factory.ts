import { WorkspacesRepository } from "../../infrastructure/repositories/workspaces/workspaces.repository.js";
import type { IDatabaseService } from "../../shared/services/database/database.service.interface.js";
import type { IIdService } from "../../shared/services/id/id.service.interface.js";
import type { ILoggerService } from "../../shared/services/logger/logger.service.interface.js";
import { CreateWorkspaceUseCase } from "./application/create-workspace.use-case.js";
import { DeleteWorkspaceUseCase } from "./application/delete-workspace.use-case.js";
import { GetWorkspaceUseCase } from "./application/get-workspace.use-case.js";
import { ListWorkspacesUseCase } from "./application/list-workspaces.use-case.js";
import { UpdateWorkspaceUseCase } from "./application/update-workspace.use-case.js";
import { WorkspacesController } from "./presentation/workspaces.controller.js";

export class WorkspacesFactory {
  static create(db: IDatabaseService, logger: ILoggerService, ids: IIdService): WorkspacesController {
    // 1. Repository
    const workspacesRepository = new WorkspacesRepository(db);

    // 2. Use cases
    const createWorkspace = new CreateWorkspaceUseCase(workspacesRepository, ids, logger);
    const listWorkspaces = new ListWorkspacesUseCase(workspacesRepository);
    const getWorkspace = new GetWorkspaceUseCase(workspacesRepository);
    const updateWorkspace = new UpdateWorkspaceUseCase(workspacesRepository, logger);
    const deleteWorkspace = new DeleteWorkspaceUseCase(workspacesRepository, logger);

    // 3. Controller
    return new WorkspacesController(createWorkspace, listWorkspaces, getWorkspace, updateWorkspace, deleteWorkspace);
  }
}
