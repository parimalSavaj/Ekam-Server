import { Router } from "express";
import type { StorageOptions } from "../../../infrastructure/external-services/storage/storage.types.js";
import { ROUTE_PATHS } from "../../../shared/constants/route-path.constants.js";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { UploadMiddleware } from "../../../shared/middlewares/upload.middleware.js";
import { ValidationMiddleware } from "../../../shared/middlewares/validate.middleware.js";
import type { IAuthService } from "../../../shared/services/auth/auth.service.interface.js";
import type { IDatabaseService } from "../../../shared/services/database/database.service.interface.js";
import type { IIdService } from "../../../shared/services/id/id.service.interface.js";
import type { ILoggerService } from "../../../shared/services/logger/logger.service.interface.js";
import { SourcesFactory } from "../sources.factory.js";
import type { SourcesController } from "./sources.controller.js";
import {
  createWebPageSourceBodySchema,
  createWebPageSourceParamsSchema,
  deleteSourceParamsSchema,
  listSourcesParamsSchema,
  uploadFileSourceParamsSchema,
} from "./sources.validation.js";

/** Name of the multipart field that carries the uploaded file. */
const FILE_FIELD = "file";

export class SourcesRoutes {
  private readonly router = Router();
  private readonly controller: SourcesController;

  constructor(
    db: IDatabaseService,
    logger: ILoggerService,
    ids: IIdService,
    private readonly auth: IAuthService,
    storageOptions: StorageOptions,
    private readonly maxFileBytes: number,
  ) {
    this.controller = SourcesFactory.create(db, logger, ids, storageOptions);
    this.setupRoutes();
  }

  private setupRoutes(): void {
    const requireSession = AuthMiddleware.requireSession(this.auth);

    // Source data is private to the signed-in user and must never be cached.
    this.router.use(ROUTE_PATHS.SOURCES.BASE, (_req, res, next) => {
      res.setHeader("Cache-Control", "no-store");
      next();
    });

    this.router.get(
      ROUTE_PATHS.SOURCES.BASE,
      requireSession,
      ValidationMiddleware.validateParams(listSourcesParamsSchema),
      this.controller.listSources,
    );
    this.router.post(
      ROUTE_PATHS.SOURCES.WEB_PAGES,
      requireSession,
      ValidationMiddleware.validateParams(createWebPageSourceParamsSchema),
      ValidationMiddleware.validateBody(createWebPageSourceBodySchema),
      this.controller.createWebPageSource,
    );
    // The session is checked first, so anonymous callers cannot make the server read a large upload.
    this.router.post(
      ROUTE_PATHS.SOURCES.FILES,
      requireSession,
      ValidationMiddleware.validateParams(uploadFileSourceParamsSchema),
      UploadMiddleware.singleFile(FILE_FIELD, this.maxFileBytes),
      this.controller.uploadFileSource,
    );
    this.router.delete(
      ROUTE_PATHS.SOURCES.BY_ID,
      requireSession,
      ValidationMiddleware.validateParams(deleteSourceParamsSchema),
      this.controller.deleteSource,
    );
  }

  getRouter(): Router { return this.router; }
}
