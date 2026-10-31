import { Router } from "express";
import type { StorageOptions } from "../../../infrastructure/external-services/storage/storage.types.js";
import { ROUTE_PATHS } from "../../../shared/constants/route-path.constants.js";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { ValidationMiddleware } from "../../../shared/middlewares/validate.middleware.js";
import type { IAuthService } from "../../../shared/services/auth/auth.service.interface.js";
import type { IDatabaseService } from "../../../shared/services/database/database.service.interface.js";
import type { IIdService } from "../../../shared/services/id/id.service.interface.js";
import type { ILoggerService } from "../../../shared/services/logger/logger.service.interface.js";
import { KnowledgeBasesFactory } from "../knowledge-bases.factory.js";
import type { KnowledgeBasesController } from "./knowledge-bases.controller.js";
import {
  createKnowledgeBaseBodySchema,
  createKnowledgeBaseParamsSchema,
  deleteKnowledgeBaseParamsSchema,
  getKnowledgeBaseParamsSchema,
  listKnowledgeBasesParamsSchema,
  updateKnowledgeBaseBodySchema,
  updateKnowledgeBaseParamsSchema,
} from "./knowledge-bases.validation.js";

export class KnowledgeBasesRoutes {
  private readonly router = Router();
  private readonly controller: KnowledgeBasesController;

  constructor(
    db: IDatabaseService,
    logger: ILoggerService,
    ids: IIdService,
    private readonly auth: IAuthService,
    storageOptions: StorageOptions,
  ) {
    this.controller = KnowledgeBasesFactory.create(db, logger, ids, storageOptions);
    this.setupRoutes();
  }

  private setupRoutes(): void {
    const requireSession = AuthMiddleware.requireSession(this.auth);

    // Knowledge base data is private to the signed-in user and must never be cached.
    this.router.use(ROUTE_PATHS.KNOWLEDGE_BASES.BASE, (_req, res, next) => {
      res.setHeader("Cache-Control", "no-store");
      next();
    });

    this.router.post(
      ROUTE_PATHS.KNOWLEDGE_BASES.BASE,
      requireSession,
      ValidationMiddleware.validateParams(createKnowledgeBaseParamsSchema),
      ValidationMiddleware.validateBody(createKnowledgeBaseBodySchema),
      this.controller.createKnowledgeBase,
    );
    this.router.get(
      ROUTE_PATHS.KNOWLEDGE_BASES.BASE,
      requireSession,
      ValidationMiddleware.validateParams(listKnowledgeBasesParamsSchema),
      this.controller.listKnowledgeBases,
    );
    this.router.get(
      ROUTE_PATHS.KNOWLEDGE_BASES.BY_ID,
      requireSession,
      ValidationMiddleware.validateParams(getKnowledgeBaseParamsSchema),
      this.controller.getKnowledgeBase,
    );
    this.router.patch(
      ROUTE_PATHS.KNOWLEDGE_BASES.BY_ID,
      requireSession,
      ValidationMiddleware.validateParams(updateKnowledgeBaseParamsSchema),
      ValidationMiddleware.validateBody(updateKnowledgeBaseBodySchema),
      this.controller.updateKnowledgeBase,
    );
    this.router.delete(
      ROUTE_PATHS.KNOWLEDGE_BASES.BY_ID,
      requireSession,
      ValidationMiddleware.validateParams(deleteKnowledgeBaseParamsSchema),
      this.controller.deleteKnowledgeBase,
    );
  }

  getRouter(): Router { return this.router; }
}
