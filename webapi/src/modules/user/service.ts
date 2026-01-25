import { getDb } from "../../database/connection.ts";
import { UserRole } from "../../constants/userRole.ts";

/**
 * User entity as stored in database.
 */
export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

/**
 * User without sensitive fields (password_hash).
 */
export type SafeUser = Omit<User, "password_hash">;

/**
 * Parameters for updating a user profile.
 */
export interface UpdateUserParams {
  email?: string;
}

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
  const user = getUserById(id);
  if (!user) {
    return null;
  }

  const { password_hash, ...safeUser } = user;
  return safeUser;
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
 * Updates a user's profile.
 * @param id - User ID
 * @param params - Fields to update
 * @returns Updated safe user or null if not found
 */
export function updateUser(id: string, params: UpdateUserParams): SafeUser | null {
  const db = getDb();

  // Build dynamic update query
  const updates: string[] = [];
  const values: (string | null)[] = [];

  if (params.email !== undefined) {
    updates.push("email = ?");
    values.push(params.email);
  }

  if (updates.length === 0) {
    // No fields to update, just return current user
    return getSafeUserById(id);
  }

  // Always update updated_at
  updates.push("updated_at = datetime('now')");

  // Add user ID for WHERE clause
  values.push(id);

  const stmt = db.prepare(`
    UPDATE users
    SET ${updates.join(", ")}
    WHERE id = ?
  `);

  stmt.run(...values);

  return getSafeUserById(id);
}
