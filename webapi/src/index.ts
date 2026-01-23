import { getLogger } from "@logtape/logtape";
import { configureLogging } from "./config/logger.ts";
import { config } from "./config/index.ts";
import { initializeDatabase, closeDb } from "./database/index.ts";
import { createApp } from "./app.ts";

const logger = getLogger(["app"]);

/**
 * Main entry point for the Volunteer Hub API.
 * Initializes logging, database, and starts the Elysia server.
 */
async function main() {
  try {
    // Step 1: Configure logging
    await configureLogging();
    logger.info("LogTape configured");

    // Step 2: Initialize database
    initializeDatabase();
    logger.info(`Database initialized at ${config.DATABASE_PATH}`);

    // Step 3: Create and start the Elysia app
    const app = createApp();

    app.listen(config.PORT, () => {
      logger.info(
        `Volunteer Hub API listening on http://localhost:${config.PORT}`
      );
      logger.info(`Environment: ${config.NODE_ENV}`);
      logger.info(`Health check: http://localhost:${config.PORT}/api/v1/health`);
    });

    // Step 4: Graceful shutdown handling
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);

      try {
        // Close database connection
        closeDb();
        logger.info("Database connection closed");

        logger.info("Shutdown complete");
        process.exit(0);
      } catch (error) {
        logger.error("Error during shutdown", { error });
        process.exit(1);
      }
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("Failed to start application:", error);
    process.exit(1);
  }
}

main();