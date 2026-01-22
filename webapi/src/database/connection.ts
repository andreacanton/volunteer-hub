import { Database } from "bun:sqlite";
import { getConfig } from "../config/index.ts";

/**
 * Database connection singleton.
 * Lazily initialized on first call to getDb().
 */
let _db: Database | null = null;

/**
 * Returns the SQLite database connection.
 * Creates a new connection if one doesn't exist.
 *
 * The database is configured with:
 * - WAL mode for better concurrent read performance
 * - Foreign keys enabled
 *
 * @returns The SQLite database instance
 */
export function getDb(): Database {
  if (_db === null) {
    const dbPath = getConfig().DATABASE_PATH;
    _db = new Database(dbPath, { create: true });

    // Enable WAL mode for better concurrent read performance
    _db.exec("PRAGMA journal_mode = WAL");

    // Enable foreign key constraints
    _db.exec("PRAGMA foreign_keys = ON");
  }
  return _db;
}

/**
 * Closes the database connection.
 * Used for graceful shutdown.
 */
export function closeDb(): void {
  if (_db !== null) {
    _db.close();
    _db = null;
  }
}
