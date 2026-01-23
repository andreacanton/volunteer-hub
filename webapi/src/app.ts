import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { getCorsConfig } from "./config/cors.ts";
import { errorHandler } from "./middleware/errorHandler.ts";
import { requestLogger } from "./middleware/logger.ts";
import { jwtPlugin } from "./middleware/jwt.ts";
import { healthModule } from "./modules/health/index.ts";

/**
 * Main Elysia application instance.
 * Assembles all middleware, plugins, and route modules.
 */
export function createApp() {
  const app = new Elysia()
    // Global error handler (must be first to catch all errors)
    .use(errorHandler)

    // Request logging
    .use(requestLogger)

    // CORS configuration
    .use(cors(getCorsConfig()))

    // JWT authentication plugin (adds jwt.sign and jwt.verify)
    .use(jwtPlugin)

    // API versioning prefix
    .group("/api/v1", (app) =>
      app
        // Health check endpoint (public, no auth required)
        .use(healthModule)

      // Future modules will be added here:
      // .use(authModule)
      // .use(userModule)
      // etc.
    );

  return app;
}
