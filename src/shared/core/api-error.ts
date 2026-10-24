import { HTTP_STATUS } from "../constants/status-code.constants.js";

export class ApiError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
    this.name = new.target.name;
  }

  toJSON(): { statusCode: number; message: string } {
    return { statusCode: this.statusCode, message: this.message };
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Route not found") {
    super(HTTP_STATUS.NOT_FOUND, message);
  }
}
