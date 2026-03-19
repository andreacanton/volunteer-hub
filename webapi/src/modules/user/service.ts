import { getDb } from "../../database/connection.ts";
import type { UserRole } from "../../constants/userRole.ts";
import { toUserResponse, type UserResponse } from "../auth/service.ts";

/**
 * User entity as stored in database.
 */
export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
}

/**
 * User without sensitive fields, camelCase for API.
 */
export type SafeUser = UserResponse;

/**
 * Parameters for updating a user profile.
 */
export interface UpdateUserParams {
  email?: string;
}

/**
 * Parameters for admin user update.
 */
export interface UpdateUserAdminParams {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

/** Columns safe to select (excludes password_hash). */
const SAFE_COLUMNS = "id, email, role, first_name, last_name, created_at, updated_at";

/**
 * Retrieves a user by ID.
 * @param id - User ID
 * @returns User or null if not found
 */
export function getUserById(id: string): User | null {
  const db = getDb();
  const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
  return stmt.get(id) as User | null;
}

/**
 * Retrieves a user by ID without sensitive fields.
 * @param id - User ID
 * @returns Safe user or null if not found
 */
export function getSafeUserById(id: string): SafeUser | null {
  const db = getDb();
  const stmt = db.prepare(`SELECT ${SAFE_COLUMNS} FROM users WHERE id = ?`);
  const user = stmt.get(id) as Omit<User, "password_hash"> | null;
  if (!user) {
    return null;
  }
  return toUserResponse(user);
}

/**
 * Checks if an email is already in use by another user.
 * @param email - Email to check
 * @param excludeUserId - User ID to exclude from check (for updates)
 * @returns true if email is taken
 */
export function isEmailTaken(email: string, excludeUserId?: string): boolean {
  const db = getDb();
  const stmt = db.prepare(
    "SELECT id FROM users WHERE email = ? AND id != ?"
  );
  const result = stmt.get(email, excludeUserId ?? "");
  return result !== null;
}

/**
 * Builds and executes a dynamic UPDATE query for users.
 * @param id - User ID
 * @param fields - Map of column names to values
 * @returns Updated safe user or null if not found
 */
function applyUserUpdate(id: string, fields: Record<string, string | undefined>): SafeUser | null {
  const db = getDb();

  const updates: string[] = [];
  const values: string[] = [];

  for (const [column, value] of Object.entries(fields)) {
    if (value !== undefined) {
      updates.push(`${column} = ?`);
      values.push(value);
    }
  }

  if (updates.length === 0) {
    return getSafeUserById(id);
  }

  updates.push("updated_at = datetime('now')");
  values.push(id);

  const stmt = db.prepare(`
    UPDATE users
    SET ${updates.join(", ")}
    WHERE id = ?
  `);

  stmt.run(...values);

  return getSafeUserById(id);
}

/**
 * Updates a user's profile.
 * @param id - User ID
 * @param params - Fields to update
 * @returns Updated safe user or null if not found
 */
export function updateUser(id: string, params: UpdateUserParams): SafeUser | null {
  return applyUserUpdate(id, {
    email: params.email,
  });
}

/**
 * Retrieves all users without sensitive fields.
 * @returns Array of safe users
 */
export function getAllUsers(): SafeUser[] {
  const db = getDb();
  const stmt = db.prepare(`SELECT ${SAFE_COLUMNS} FROM users ORDER BY created_at DESC`);
  const users = stmt.all() as Omit<User, "password_hash">[];
  return users.map(toUserResponse);
}

/**
 * Updates a user as admin (can change role, name, email).
 * @param id - User ID
 * @param params - Fields to update
 * @returns Updated safe user or null if not found
 */
export function updateUserAdmin(id: string, params: UpdateUserAdminParams): SafeUser | null {
  return applyUserUpdate(id, {
    email: params.email,
    first_name: params.firstName,
    last_name: params.lastName,
    role: params.role,
  });
}

/**
 * Deletes a user and cleans up related records atomically.
 * @param id - User ID
 * @returns true if user was deleted
 */
export function deleteUser(id: string): boolean {
  const db = getDb();

  const deleteInTransaction = db.transaction(() => {
    db.prepare("DELETE FROM refresh_tokens WHERE user_id = ?").run(id);
    db.prepare("DELETE FROM password_resets WHERE user_id = ?").run(id);
    const result = db.prepare("DELETE FROM users WHERE id = ?").run(id);
    return result.changes > 0;
  });

  return deleteInTransaction();
}
