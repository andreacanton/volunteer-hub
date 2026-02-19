import {
  configure,
  getConsoleSink,
  type LogLevel,
  type LogRecord,
} from "@logtape/logtape";
import { appendFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
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

/** Absolute path to the error log file. */
export const ERROR_LOG_PATH = join(dirname(new URL(import.meta.url).pathname), "../../logs/error.log");

/**
 * Creates a simple file-appending sink for LogTape.
 */
function createFileSink(path: string): (record: LogRecord) => void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, ""); // truncate on startup
  return (record: LogRecord) => {
    const time = new Date(record.timestamp).toISOString();
    const cat = record.category.join(".");
    const line = `[${time}] ${record.level.toUpperCase().padEnd(7)} [${cat}] ${record.message}\n`;
    appendFileSync(path, line);
  };
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

  const sinks: Record<string, any> = {
    console: getConsoleSink({
      formatter: isDev
        ? ({ level, category, message, timestamp }) => {
            const time = new Date(timestamp).toISOString().slice(11, 23);
            const cat = category.join(".");
            return `[${time}] ${level.toUpperCase().padEnd(7)} [${cat}] ${message}`;
          }
        : undefined, // Use default JSON format in production
    }),
  };

  const sinkNames = ["console"];

  if (isDev) {
    sinks.file = createFileSink(ERROR_LOG_PATH);
    sinkNames.push("file");
  }

  await configure({
    sinks,
    loggers: [
      {
        category: "app",
        lowestLevel: level,
        sinks: sinkNames,
      },
      {
        // Catch middleware and other non-app categories
        category: "middleware",
        lowestLevel: "debug",
        sinks: sinkNames,
      },
      {
        category: ["logtape", "meta"],
        lowestLevel: "warning",
        sinks: ["console"],
      },
    ],
  });
}
