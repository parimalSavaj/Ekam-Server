import type { ErrorRequestHandler } from "express";
import { HTTP_STATUS } from "../constants/status-code.constants.js";
import type { ILoggerService } from "../services/logger/logger.service.interface.js";
import { ApiError, ValidationError } from "./api-error.js";

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

    const apiError = this.toApiError(error);
    if (apiError) {
      res.status(apiError.statusCode).json(apiError.toJSON());
      return;
    }

    this.logger.error("Unhandled request error", error, { method: req.method, path: req.path });
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
      ...(this.isDevelopment && error instanceof Error ? { stack: error.stack } : {}),
    });
  };

  /** Maps known client mistakes (including JSON body parser failures) to safe API errors. */
  private toApiError(error: unknown): ApiError | null {
    if (error instanceof ApiError) return error;

    const type = typeof error === "object" && error !== null && "type" in error ? error.type : undefined;
    if (type === "entity.parse.failed") return new ValidationError("Request body must be valid JSON");
    if (type === "entity.too.large") return new ApiError(HTTP_STATUS.PAYLOAD_TOO_LARGE, "Request body is too large");
    return null;
  }
}
