import express, { type Express } from "express";
import cors from "cors";
import { AuthRoutes } from "./modules/auth/presentation/auth.routes.js";
import type { IAuthService } from "./shared/services/auth/auth.service.interface.js";
import { HealthRoutes } from "./modules/system/health.routes.js";
import { WorkspacesRoutes } from "./modules/workspaces/presentation/workspaces.routes.js";
import { NotFoundError } from "./shared/core/api-error.js";
import { ErrorHandler } from "./shared/core/error-handler.js";
import type { IDatabaseService } from "./shared/services/database/database.service.interface.js";
import type { IIdService } from "./shared/services/id/id.service.interface.js";
import type { ILoggerService } from "./shared/services/logger/logger.service.interface.js";

export class App {
  static create(
    logger: ILoggerService,
    isDevelopment: boolean,
    auth: IAuthService,
    clientURL: string,
    db: IDatabaseService,
    ids: IIdService,
  ): Express {
    const app = express();
    const errorHandler = new ErrorHandler(logger, isDevelopment);

    app.disable("x-powered-by");
    app.use(cors({ origin: clientURL, credentials: true, methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"] }));
    app.use(new AuthRoutes(auth).getRouter());
    // Better Auth reads its own request bodies, so JSON parsing must stay after the auth routes.
    app.use(express.json({ limit: "10kb" }));
    app.use(new HealthRoutes().getRouter());
    app.use(new WorkspacesRoutes(db, logger, ids, auth).getRouter());
    app.use((_req, _res, next): void => next(new NotFoundError()));
    app.use(errorHandler.handleError);

    return app;
  }
}
