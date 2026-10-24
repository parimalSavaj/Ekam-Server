import type { ErrorRequestHandler } from "express";
import { HTTP_STATUS } from "../constants/status-code.constants.js";
import type { ILoggerService } from "../services/logger/logger.service.interface.js";
import { ApiError } from "./api-error.js";

export class ErrorHandler {
  constructor(
    private readonly logger: ILoggerService,
    private readonly isDevelopment: boolean,
  ) {}

  handleError: ErrorRequestHandler = (error: unknown, req, res, next): void => {
    if (res.headersSent) {
      next(error);
      return;
    }

    if (error instanceof ApiError) {
      res.status(error.statusCode).json(error.toJSON());
      return;
    }

    this.logger.error("Unhandled request error", error, { method: req.method, path: req.path });
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
      ...(this.isDevelopment && error instanceof Error ? { stack: error.stack } : {}),
    });
  };
}
