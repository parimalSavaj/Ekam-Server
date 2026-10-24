import { App } from "./app.js";
import { LoggerService } from "./shared/services/logger/logger.service.js";

const logger = LoggerService.getInstance();

async function main(): Promise<void> {
  // Validate configuration after the logger is ready to report startup failures.
  const { config } = await import("./shared/config/index.js");
  const app = App.create(logger, config.isDevelopment);
  const server = app.listen(config.port, config.host, () => {
    logger.info("Server started", { host: config.host, port: config.port });
  });

  server.on("error", error => {
    logger.error("Server failed to listen", error);
    process.exitCode = 1;
  });

  let stopping = false;
  const shutdown = (signal: string): void => {
    if (stopping) return;
    stopping = true;
    logger.info("Server stopping", { signal });

    const timeout = setTimeout(() => {
      logger.error("Server shutdown timed out", new Error("Open connections did not close"));
      server.closeAllConnections();
      process.exitCode = 1;
    }, 10_000);
    timeout.unref();

    server.close(error => {
      clearTimeout(timeout);
      if (error) {
        logger.error("Server shutdown failed", error);
        process.exitCode = 1;
        return;
      }
      logger.info("Server stopped");
    });
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

void main().catch((error: unknown) => {
  logger.error("Server startup failed", error);
  process.exitCode = 1;
});
