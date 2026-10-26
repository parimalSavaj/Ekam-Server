import type { RequestHandler } from "express";
import type { z } from "zod";
import { ValidationError } from "../core/api-error.js";

/**
 * Validates one part of the request with a Zod schema. Schemas carry readable messages,
 * which are returned to the client; raw Zod error objects are never exposed.
 */
export class ValidationMiddleware {
  /** Replaces req.body with the parsed value, so unknown fields are dropped and strings are trimmed. */
  static validateBody(schema: z.ZodType): RequestHandler {
    return (req, _res, next) => {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        next(new ValidationError(ValidationMiddleware.describe(result.error)));
        return;
      }
      req.body = result.data;
      next();
    };
  }

  /** Checks req.params only; Express keeps owning the values. */
  static validateParams(schema: z.ZodType): RequestHandler {
    return (req, _res, next) => {
      const result = schema.safeParse(req.params);
      if (!result.success) {
        next(new ValidationError(ValidationMiddleware.describe(result.error)));
        return;
      }
      next();
    };
  }

  private static describe(error: z.ZodError): string {
    const messages = [...new Set(error.issues.map(issue => issue.message))];
    return messages.join(" ") || "Invalid request";
  }
}
