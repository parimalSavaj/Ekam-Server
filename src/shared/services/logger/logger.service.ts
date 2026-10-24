import type { ILoggerService } from "./logger.service.interface.js";

export class LoggerService implements ILoggerService {
  private static instance: LoggerService | undefined;

  private constructor() {}

  static getInstance(): LoggerService {
    return (this.instance ??= new LoggerService());
  }

  info(message: string, context?: Record<string, unknown>): void {
    process.stdout.write(`${JSON.stringify({ level: "info", timestamp: new Date().toISOString(), message, context })}\n`);
  }

  error(message: string, error: unknown, context?: Record<string, unknown>): void {
    const details = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { message: String(error) };
    process.stderr.write(`${JSON.stringify({ level: "error", timestamp: new Date().toISOString(), message, error: details, context })}\n`);
  }
}
