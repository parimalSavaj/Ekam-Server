import { Router } from "express";
import { ROUTE_PATHS } from "../../shared/constants/route-path.constants.js";
import { HTTP_STATUS } from "../../shared/constants/status-code.constants.js";
import { ApiResponse } from "../../shared/core/api-response.js";

// System endpoints are flat and have no business logic or database dependency.
export class HealthRoutes {
  private readonly router = Router();

  constructor() {
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.get(ROUTE_PATHS.SYSTEM.HEALTH, (_req, res): void => {
      res.setHeader("Cache-Control", "no-store");
      res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { status: "ok" }));
    });
  }

  getRouter(): Router {
    return this.router;
  }
}
