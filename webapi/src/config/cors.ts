import type { CORSConfig } from "@elysiajs/cors";
import { config } from "./index.ts";

/**
 * CORS configuration based on environment.
 * Development: Allow all origins for easy testing.
 * Production: Restrict to specific origins (configure as needed).
 */
export function getCorsConfig(): CORSConfig {
  const isDevelopment = config.NODE_ENV === "development";

  return {
    origin: isDevelopment
      ? true // Allow all origins in development
      : /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/, // Restrict in production
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length", "Content-Type"],
    maxAge: 86400, // 24 hours
  };
}
