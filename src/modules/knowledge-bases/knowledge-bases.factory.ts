import { KnowledgeBasesRepository } from "../../infrastructure/repositories/knowledge-bases/knowledge-bases.repository.js";
import { WorkspacesRepository } from "../../infrastructure/repositories/workspaces/workspaces.repository.js";
import type { IDatabaseService } from "../../shared/services/database/database.service.interface.js";
import type { IIdService } from "../../shared/services/id/id.service.interface.js";
import type { ILoggerService } from "../../shared/services/logger/logger.service.interface.js";
import { CreateKnowledgeBaseUseCase } from "./application/create-knowledge-base.use-case.js";
import { DeleteKnowledgeBaseUseCase } from "./application/delete-knowledge-base.use-case.js";
import { GetKnowledgeBaseUseCase } from "./application/get-knowledge-base.use-case.js";
import { ListKnowledgeBasesUseCase } from "./application/list-knowledge-bases.use-case.js";
import { UpdateKnowledgeBaseUseCase } from "./application/update-knowledge-base.use-case.js";
import { KnowledgeBasesController } from "./presentation/knowledge-bases.controller.js";

export class KnowledgeBasesFactory {
  static create(db: IDatabaseService, logger: ILoggerService, ids: IIdService): KnowledgeBasesController {
    // 1. Repositories (workspaces is used only to check the caller owns the workspace)
    const workspacesRepository = new WorkspacesRepository(db);
    const knowledgeBasesRepository = new KnowledgeBasesRepository(db);

    // 2. Use cases
    const createKnowledgeBase = new CreateKnowledgeBaseUseCase(workspacesRepository, knowledgeBasesRepository, ids, logger);
    const listKnowledgeBases = new ListKnowledgeBasesUseCase(workspacesRepository, knowledgeBasesRepository);
    const getKnowledgeBase = new GetKnowledgeBaseUseCase(knowledgeBasesRepository);
    const updateKnowledgeBase = new UpdateKnowledgeBaseUseCase(knowledgeBasesRepository, logger);
    const deleteKnowledgeBase = new DeleteKnowledgeBaseUseCase(knowledgeBasesRepository, logger);

    // 3. Controller
    return new KnowledgeBasesController(
      createKnowledgeBase,
      listKnowledgeBases,
      getKnowledgeBase,
      updateKnowledgeBase,
      deleteKnowledgeBase,
    );
  }
}
