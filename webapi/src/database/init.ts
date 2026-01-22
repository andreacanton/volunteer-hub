import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { getLogger } from "@logtape/logtape";
import { getConfig } from "../config/index.ts";
import { getDb } from "./connection.ts";

const logger = getLogger(["app", "db"]);

/**
 * Initializes the database.
 * - Creates the database directory if it doesn't exist
 * - Opens the database connection (which enables WAL mode)
 * - Logs initialization status
 *
 * Should be called once at application startup after logging is configured.
 */
export async function initializeDatabase(): Promise<void> {
  const dbPath = getConfig().DATABASE_PATH;
  const dbDir = dirname(dbPath);

  // Ensure database directory exists
  try {
    await mkdir(dbDir, { recursive: true });
    logger.debug("Database directory ensured: {dir}", { dir: dbDir });
  } catch (error) {
    // Directory might already exist, which is fine
    if ((error as Error & { code?: string }).code !== "EEXIST") {
      throw error;
    }
  }

  // Initialize the database connection (this also enables WAL mode)
  const db = getDb();

  // Verify WAL mode is enabled
  const result = db.query("PRAGMA journal_mode").get() as { journal_mode: string };
  logger.info("Database initialized at {path} (journal_mode: {mode})", {
    path: dbPath,
    mode: result.journal_mode,
  });
}
