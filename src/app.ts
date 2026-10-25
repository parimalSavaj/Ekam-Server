import express, { type Express } from "express";
import cors from "cors";
import { AuthRoutes } from "./modules/auth/presentation/auth.routes.js";
import type { IAuthService } from "./shared/services/auth/auth.service.interface.js";
import { HealthRoutes } from "./modules/system/health.routes.js";
import { NotFoundError } from "./shared/core/api-error.js";
import { ErrorHandler } from "./shared/core/error-handler.js";
import type { ILoggerService } from "./shared/services/logger/logger.service.interface.js";

export class App {
  static create(logger: ILoggerService, isDevelopment: boolean, auth: IAuthService, clientURL: string): Express {
    const app = express();
    const errorHandler = new ErrorHandler(logger, isDevelopment);

    app.disable("x-powered-by");
    app.use(cors({ origin: clientURL, credentials: true, methods: ["GET", "POST", "OPTIONS"] }));
    app.use(new AuthRoutes(auth).getRouter());
    app.use(new HealthRoutes().getRouter());
    app.use((_req, _res, next): void => next(new NotFoundError()));
    app.use(errorHandler.handleError);

    return app;
  }
}
