import {
  configure,
  getConsoleSink,
  type LogLevel,
} from "@logtape/logtape";
import { getConfig } from "./index.ts";

/**
 * Maps string log level from env to LogTape log level.
 */
function getLogLevel(): LogLevel {
  const level = getConfig().LOG_LEVEL;
  const levelMap: Record<string, LogLevel> = {
    trace: "debug", // LogTape doesn't have trace, use debug
    debug: "debug",
    info: "info",
    warning: "warning",
    error: "error",
    fatal: "fatal",
  };
  return levelMap[level] ?? "info";
}

/**
 * Configures LogTape with console sink and hierarchical categories.
 * Should be called once at application startup.
 *
 * Categories:
 * - "app" - Root category for all application logs
 * - "app.http" - HTTP request/response logging
 * - "app.db" - Database operations
 * - "app.auth" - Authentication/authorization
 */
export async function configureLogging(): Promise<void> {
  const level = getLogLevel();
  const isDev = getConfig().NODE_ENV === "development";

  await configure({
    sinks: {
      console: getConsoleSink({
        formatter: isDev
          ? ({ level, category, message, timestamp }) => {
              const time = new Date(timestamp).toISOString().slice(11, 23);
              const cat = category.join(".");
              return `[${time}] ${level.toUpperCase().padEnd(7)} [${cat}] ${message}`;
            }
          : undefined, // Use default JSON format in production
      }),
    },
    loggers: [
      {
        category: "app",
        lowestLevel: level,
        sinks: ["console"],
      },
    ],
  });
}
