import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// Set up a temporary database before any app module imports
const testDir = mkdtempSync(join(tmpdir(), "service-test-"));
const testDbPath = join(testDir, "test.db");
process.env.DATABASE_PATH = testDbPath;
process.env.JWT_SECRET = "test-secret-that-is-at-least-32-characters-long";

// Now import modules that depend on the DB
import {
  getAllServices,
  getServiceById,
  getServiceByName,
  isServiceNameTaken,
  createService,
  updateService,
  deleteService,
} from "../../src/modules/service/service.ts";
import { getDb, closeDb } from "../../src/database/connection.ts";

beforeAll(() => {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
});

afterAll(() => {
  closeDb();
  rmSync(testDir, { recursive: true, force: true });
});

describe("Service - service layer", () => {
  test("createService creates a service with name and description", () => {
    const service = createService({ name: "Evening", description: "Evening shift" });

    expect(service).toHaveProperty("id");
    expect(service.name).toBe("Evening");
    expect(service.description).toBe("Evening shift");
    expect(service.createdAt).toBeDefined();
    expect(service.updatedAt).toBeDefined();
  });

  test("createService defaults description to empty string", () => {
    const service = createService({ name: "Breakfast" });
    expect(service.description).toBe("");
  });

  test("getAllServices returns all services sorted by name", () => {
    const services = getAllServices();

    expect(services.length).toBeGreaterThanOrEqual(2);
    const names = services.map((s) => s.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  test("getServiceById returns service when found", () => {
    const created = createService({ name: "Cooks", description: "Cooking shift" });
    const found = getServiceById(created.id);

    expect(found).not.toBeNull();
    expect(found!.name).toBe("Cooks");
  });

  test("getServiceById returns null when not found", () => {
    expect(getServiceById("nonexistent")).toBeNull();
  });

  test("getServiceByName returns service when found", () => {
    const found = getServiceByName("Evening");

    expect(found).not.toBeNull();
    expect(found!.name).toBe("Evening");
  });

  test("getServiceByName returns null when not found", () => {
    expect(getServiceByName("Nonexistent")).toBeNull();
  });

  test("isServiceNameTaken returns true for existing name", () => {
    expect(isServiceNameTaken("Evening")).toBe(true);
  });

  test("isServiceNameTaken returns false for unused name", () => {
    expect(isServiceNameTaken("Unique Name")).toBe(false);
  });

  test("isServiceNameTaken excludes a specific ID", () => {
    const service = getServiceByName("Evening")!;
    expect(isServiceNameTaken("Evening", service.id)).toBe(false);
  });

  test("updateService updates name", () => {
    const created = createService({ name: "Logistics", description: "Logistics shift" });
    const updated = updateService(created.id, { name: "Transport" });

    expect(updated).not.toBeNull();
    expect(updated!.name).toBe("Transport");
  });

  test("updateService updates description", () => {
    const service = getServiceByName("Transport")!;
    const updated = updateService(service.id, { description: "Transport and logistics" });

    expect(updated).not.toBeNull();
    expect(updated!.description).toBe("Transport and logistics");
  });

  test("updateService returns null for nonexistent ID", () => {
    expect(updateService("nonexistent", { name: "X" })).toBeNull();
  });

  test("updateService with no changes returns service unchanged", () => {
    const service = getServiceByName("Transport")!;
    const updated = updateService(service.id, {});

    expect(updated).not.toBeNull();
    expect(updated!.name).toBe("Transport");
  });

  test("deleteService removes the service", () => {
    const created = createService({ name: "ToDelete" });
    expect(deleteService(created.id)).toBe(true);
    expect(getServiceById(created.id)).toBeNull();
  });

  test("deleteService returns false for nonexistent ID", () => {
    expect(deleteService("nonexistent")).toBe(false);
  });
});
