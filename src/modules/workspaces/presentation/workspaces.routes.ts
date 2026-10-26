import { Router } from "express";
import { ROUTE_PATHS } from "../../../shared/constants/route-path.constants.js";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { ValidationMiddleware } from "../../../shared/middlewares/validate.middleware.js";
import type { IAuthService } from "../../../shared/services/auth/auth.service.interface.js";
import type { IDatabaseService } from "../../../shared/services/database/database.service.interface.js";
import type { IIdService } from "../../../shared/services/id/id.service.interface.js";
import type { ILoggerService } from "../../../shared/services/logger/logger.service.interface.js";
import { WorkspacesFactory } from "../workspaces.factory.js";
import type { WorkspacesController } from "./workspaces.controller.js";
import {
  createWorkspaceBodySchema,
  deleteWorkspaceParamsSchema,
  getWorkspaceParamsSchema,
  updateWorkspaceBodySchema,
  updateWorkspaceParamsSchema,
} from "./workspaces.validation.js";

export class WorkspacesRoutes {
  private readonly router = Router();
  private readonly controller: WorkspacesController;

  constructor(
    db: IDatabaseService,
    logger: ILoggerService,
    ids: IIdService,
    private readonly auth: IAuthService,
  ) {
    this.controller = WorkspacesFactory.create(db, logger, ids);
    this.setupRoutes();
  }

  private setupRoutes(): void {
    const requireSession = AuthMiddleware.requireSession(this.auth);

    // Workspace data is private to the signed-in user and must never be cached.
    this.router.use(ROUTE_PATHS.WORKSPACES.BASE, (_req, res, next) => {
      res.setHeader("Cache-Control", "no-store");
      next();
    });

    this.router.post(
      ROUTE_PATHS.WORKSPACES.BASE,
      requireSession,
      ValidationMiddleware.validateBody(createWorkspaceBodySchema),
      this.controller.createWorkspace,
    );
    this.router.get(ROUTE_PATHS.WORKSPACES.BASE, requireSession, this.controller.listWorkspaces);
    this.router.get(
      ROUTE_PATHS.WORKSPACES.BY_ID,
      requireSession,
      ValidationMiddleware.validateParams(getWorkspaceParamsSchema),
      this.controller.getWorkspace,
    );
    this.router.patch(
      ROUTE_PATHS.WORKSPACES.BY_ID,
      requireSession,
      ValidationMiddleware.validateParams(updateWorkspaceParamsSchema),
      ValidationMiddleware.validateBody(updateWorkspaceBodySchema),
      this.controller.updateWorkspace,
    );
    this.router.delete(
      ROUTE_PATHS.WORKSPACES.BY_ID,
      requireSession,
      ValidationMiddleware.validateParams(deleteWorkspaceParamsSchema),
      this.controller.deleteWorkspace,
    );
  }

  getRouter(): Router { return this.router; }
}
