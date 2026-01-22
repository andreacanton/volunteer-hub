import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { getLogger } from "@logtape/logtape";
import { getDb } from "./connection.ts";

const logger = getLogger(["app", "db"]);

/**
 * Ensures the schema_migrations table exists.
 * This table tracks which migrations have been applied.
 */
function ensureMigrationsTable(): void {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

/**
 * Gets the list of already applied migrations.
 */
function getAppliedMigrations(): Set<string> {
  const db = getDb();
  const rows = db.query("SELECT filename FROM schema_migrations").all() as { filename: string }[];
  return new Set(rows.map((row) => row.filename));
}

/**
 * Gets all migration files from the migrations directory, sorted by name.
 */
async function getMigrationFiles(migrationsDir: string): Promise<string[]> {
  const files = await readdir(migrationsDir);
  return files
    .filter((f) => f.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Runs all pending migrations from the specified directory.
 *
 * Migrations are executed in order by filename (e.g., 001_init.sql, 002_users.sql).
 * Each migration is tracked in the schema_migrations table to prevent re-execution.
 *
 * @param migrationsDir - Path to the migrations directory (default: ./migrations)
 * @returns Number of migrations applied
 */
export async function runMigrations(migrationsDir = "./migrations"): Promise<number> {
  const db = getDb();

  // Ensure migrations tracking table exists
  ensureMigrationsTable();

  const applied = getAppliedMigrations();
  const files = await getMigrationFiles(migrationsDir);

  let count = 0;

  for (const filename of files) {
    if (applied.has(filename)) {
      logger.debug("Skipping already applied migration: {file}", { file: filename });
      continue;
    }

    const filePath = join(migrationsDir, filename);
    const sql = await readFile(filePath, "utf-8");

    logger.info("Applying migration: {file}", { file: filename });

    // Run migration in a transaction
    db.transaction(() => {
      db.exec(sql);
      db.run(
        "INSERT INTO schema_migrations (filename) VALUES (?)",
        [filename]
      );
    })();

    count++;
    logger.info("Migration applied successfully: {file}", { file: filename });
  }

  if (count === 0) {
    logger.info("No new migrations to apply");
  } else {
    logger.info("Applied {count} migration(s)", { count });
  }

  return count;
}

/**
 * CLI entry point for running migrations.
 * Can be executed directly with: bun run src/database/migrate.ts
 */
async function main(): Promise<void> {
  const { configureLogging } = await import("../config/logger.ts");
  const { initializeDatabase } = await import("./init.ts");

  await configureLogging();
  await initializeDatabase();
  await runMigrations();
}

// Run if executed directly
if (import.meta.main) {
  main().catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
}
