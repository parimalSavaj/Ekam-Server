import { StorageExternalService } from "../../infrastructure/external-services/storage/storage.external-service.js";
import type { StorageOptions } from "../../infrastructure/external-services/storage/storage.types.js";
import { KnowledgeBasesRepository } from "../../infrastructure/repositories/knowledge-bases/knowledge-bases.repository.js";
import { SourcesRepository } from "../../infrastructure/repositories/sources/sources.repository.js";
import type { IDatabaseService } from "../../shared/services/database/database.service.interface.js";
import type { IIdService } from "../../shared/services/id/id.service.interface.js";
import type { ILoggerService } from "../../shared/services/logger/logger.service.interface.js";
import { CreateWebPageSourceUseCase } from "./application/create-web-page-source.use-case.js";
import { DeleteSourceUseCase } from "./application/delete-source.use-case.js";
import { ListSourcesUseCase } from "./application/list-sources.use-case.js";
import { UploadFileSourceUseCase } from "./application/upload-file-source.use-case.js";
import { SourcesController } from "./presentation/sources.controller.js";

export class SourcesFactory {
  static create(
    db: IDatabaseService,
    logger: ILoggerService,
    ids: IIdService,
    storageOptions: StorageOptions,
  ): SourcesController {
    // 1. Repositories and external services (knowledge bases is used only to check the caller owns it)
    const knowledgeBasesRepository = new KnowledgeBasesRepository(db);
    const sourcesRepository = new SourcesRepository(db);
    const storage = new StorageExternalService(storageOptions);

    // 2. Use cases
    const listSources = new ListSourcesUseCase(knowledgeBasesRepository, sourcesRepository);
    const createWebPageSource = new CreateWebPageSourceUseCase(knowledgeBasesRepository, sourcesRepository, ids, logger);
    const uploadFileSource = new UploadFileSourceUseCase(knowledgeBasesRepository, sourcesRepository, storage, ids, logger);
    const deleteSource = new DeleteSourceUseCase(sourcesRepository, storage, logger);

    // 3. Controller
    return new SourcesController(listSources, createWebPageSource, uploadFileSource, deleteSource);
  }
}
