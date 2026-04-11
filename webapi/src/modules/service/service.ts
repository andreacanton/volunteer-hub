import { getDb } from "../../database/connection.ts";
import { generateToken } from "../../utils/crypto.ts";

/**
 * Service entity as stored in database.
 */
export interface Service {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

/**
 * Service response with camelCase keys for API.
 */
export interface ServiceResponse {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Parameters for creating a service.
 */
export interface CreateServiceParams {
  name: string;
  description?: string;
}

/**
 * Parameters for updating a service.
 */
export interface UpdateServiceParams {
  name?: string;
  description?: string;
}

/**
 * Maps a DB row to a camelCase API response.
 */
export function toServiceResponse(service: Service): ServiceResponse {
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    createdAt: service.created_at,
    updatedAt: service.updated_at,
  };
}

/**
 * Retrieves all services.
 */
export function getAllServices(): ServiceResponse[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM services ORDER BY name ASC").all() as Service[];
  return rows.map(toServiceResponse);
}

/**
 * Retrieves a service by ID.
 */
export function getServiceById(id: string): ServiceResponse | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM services WHERE id = ?").get(id) as Service | null;
  return row ? toServiceResponse(row) : null;
}

/**
 * Retrieves a service by name.
 */
export function getServiceByName(name: string): ServiceResponse | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM services WHERE name = ?").get(name) as Service | null;
  return row ? toServiceResponse(row) : null;
}

/**
 * Checks if a service name is already in use.
 */
export function isServiceNameTaken(name: string, excludeId?: string): boolean {
  const db = getDb();
  const row = db.prepare("SELECT id FROM services WHERE name = ? AND id != ?").get(name, excludeId ?? "");
  return row !== null;
}

/**
 * Creates a new service.
 */
export function createService(params: CreateServiceParams): ServiceResponse {
  const db = getDb();
  const id = generateToken(16);

  db.prepare(
    "INSERT INTO services (id, name, description) VALUES (?, ?, ?)"
  ).run(id, params.name, params.description ?? "");

  return getServiceById(id)!;
}

/**
 * Updates an existing service.
 */
export function updateService(id: string, params: UpdateServiceParams): ServiceResponse | null {
  const db = getDb();

  const updates: string[] = [];
  const values: string[] = [];

  if (params.name !== undefined) {
    updates.push("name = ?");
    values.push(params.name);
  }
  if (params.description !== undefined) {
    updates.push("description = ?");
    values.push(params.description);
  }

  if (updates.length === 0) {
    return getServiceById(id);
  }

  updates.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE services SET ${updates.join(", ")} WHERE id = ?`).run(...values);

  return getServiceById(id);
}

/**
 * Deletes a service by ID.
 */
export function deleteService(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM services WHERE id = ?").run(id);
  return result.changes > 0;
}
