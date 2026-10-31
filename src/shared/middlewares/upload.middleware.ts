import multer from "multer";
import type { RequestHandler } from "express";
import { HTTP_STATUS } from "../constants/status-code.constants.js";
import { ApiError, ValidationError } from "../core/api-error.js";

/**
 * Reads one uploaded file from a multipart request into memory (req.file). The size limit is
 * enforced while the upload streams in, so an oversized file is rejected without being buffered.
 * Put the session check before this middleware so anonymous callers cannot send large bodies.
 */
export class UploadMiddleware {
  static singleFile(fieldName: string, maxFileBytes: number): RequestHandler {
    const upload = multer({
      storage: multer.memoryStorage(),
      // Exactly one file part and no text fields.
      limits: { fileSize: maxFileBytes, files: 1, fields: 0, parts: 1 },
    }).single(fieldName);

    return (req, res, next) => {
      upload(req, res, (error: unknown) => {
        if (error instanceof multer.MulterError) {
          if (error.code === "LIMIT_FILE_SIZE") {
            const megabytes = Math.floor(maxFileBytes / (1024 * 1024));
            next(new ApiError(HTTP_STATUS.PAYLOAD_TOO_LARGE, `The file is too large. The limit is ${megabytes} MB.`));
            return;
          }
          next(new ValidationError(`Upload one file in the "${fieldName}" field.`));
          return;
        }
        if (error) {
          // Malformed multipart bodies (missing boundary, cut-off upload) are client mistakes.
          next(new ValidationError("The upload could not be read. Choose the file again."));
          return;
        }
        if (!req.file) {
          next(new ValidationError("Choose a file to upload."));
          return;
        }
        next();
      });
    };
  }
}
