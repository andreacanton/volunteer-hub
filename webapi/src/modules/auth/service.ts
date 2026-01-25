import { getDb } from "../../database/connection.ts";
import { UserRole } from "../../constants/userRole.ts";
import { generateToken, hashToken } from "../../utils/crypto.ts";
import { getConfig } from "../../config/index.ts";

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
 * User creation parameters.
 */
export interface CreateUserParams {
  email: string;
  password: string;
  role?: UserRole;
}

/**
 * Creates a new user with hashed password.
 * @param params - User creation parameters
 * @returns The created user (without password_hash)
 * @throws Error if email already exists or database operation fails
 */
export async function createUser(params: CreateUserParams): Promise<Omit<User, "password_hash">> {
  const db = getDb();
  const id = generateToken(16); // 32 character hex string
  const passwordHash = await Bun.password.hash(params.password, {
    algorithm: "argon2id",
    memoryCost: 19456, // 19 MiB
    timeCost: 2,
  });
  const role = params.role ?? UserRole.VOLUNTEER;

  const stmt = db.prepare(`
    INSERT INTO users (id, email, password_hash, role)
    VALUES (?, ?, ?, ?)
  `);

  stmt.run(id, params.email, passwordHash, role);

  const user = getUserById(id);
  if (!user) {
    throw new Error("Failed to create user");
  }

  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
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
 * Retrieves a user by email address.
 * @param email - User email
 * @returns User or null if not found
 */
export function getUserByEmail(email: string): User | null {
  const db = getDb();
  const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
  return stmt.get(email) as User | null;
}

/**
 * Validates user credentials.
 * @param email - User email
 * @param password - Plain text password
 * @returns User (without password_hash) if valid, null otherwise
 */
export async function validateCredentials(
  email: string,
  password: string
): Promise<Omit<User, "password_hash"> | null> {
  const user = getUserByEmail(email);
  if (!user) {
    return null;
  }

  const isValid = await Bun.password.verify(password, user.password_hash);
  if (!isValid) {
    return null;
  }

  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Refresh token entity as stored in database.
 */
export interface RefreshToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
  revoked_at: string | null;
}

/**
 * Result of creating a refresh token.
 */
export interface CreateRefreshTokenResult {
  token: string; // Plain token to return to client
  tokenId: string; // Database ID for reference
}

/**
 * Parses a duration string (e.g., "7d", "24h") to milliseconds.
 * @param duration - Duration string
 * @returns Milliseconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([dhms])$/);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const value = parseInt(match[1] ?? "0", 10);
  const unit = match[2];

  switch (unit) {
    case "d":
      return value * 24 * 60 * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "m":
      return value * 60 * 1000;
    case "s":
      return value * 1000;
    default:
      throw new Error(`Unknown duration unit: ${unit}`);
  }
}

/**
 * Creates a refresh token for a user.
 * @param userId - User ID
 * @returns Plain token and token ID
 */
export function createRefreshToken(userId: string): CreateRefreshTokenResult {
  const db = getDb();
  const config = getConfig();

  const token = generateToken(32); // 64 character hex string
  const tokenHash = hashToken(token);
  const tokenId = generateToken(16);

  const expiresInMs = parseDuration(config.JWT_REFRESH_EXPIRES_IN);
  const expiresAt = new Date(Date.now() + expiresInMs).toISOString();

  const stmt = db.prepare(`
    INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
    VALUES (?, ?, ?, ?)
  `);

  stmt.run(tokenId, userId, tokenHash, expiresAt);

  return { token, tokenId };
}

/**
 * Validates a refresh token.
 * @param token - Plain refresh token
 * @returns Token record if valid, null if invalid/expired/revoked
 */
export function validateRefreshToken(token: string): RefreshToken | null {
  const db = getDb();
  const tokenHash = hashToken(token);

  const stmt = db.prepare(`
    SELECT * FROM refresh_tokens
    WHERE token_hash = ?
    AND revoked_at IS NULL
  `);

  const tokenRecord = stmt.get(tokenHash) as RefreshToken | null;

  if (!tokenRecord) {
    return null;
  }

  // Check if expired
  const expiresAt = new Date(tokenRecord.expires_at);
  if (expiresAt < new Date()) {
    return null;
  }

  return tokenRecord;
}

/**
 * Revokes a refresh token.
 * @param tokenId - Token ID to revoke
 */
export function revokeRefreshToken(tokenId: string): void {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE refresh_tokens
    SET revoked_at = datetime('now')
    WHERE id = ? AND revoked_at IS NULL
  `);

  stmt.run(tokenId);
}

/**
 * Revokes all refresh tokens for a user.
 * @param userId - User ID
 */
export function revokeAllUserTokens(userId: string): void {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE refresh_tokens
    SET revoked_at = datetime('now')
    WHERE user_id = ? AND revoked_at IS NULL
  `);

  stmt.run(userId);
}

/**
 * Revokes a refresh token by its plain token value.
 * @param token - Plain refresh token
 * @returns true if token was revoked, false if not found
 */
export function revokeRefreshTokenByValue(token: string): boolean {
  const db = getDb();
  const tokenHash = hashToken(token);

  const stmt = db.prepare(`
    UPDATE refresh_tokens
    SET revoked_at = datetime('now')
    WHERE token_hash = ? AND revoked_at IS NULL
  `);

  const result = stmt.run(tokenHash);
  return result.changes > 0;
}
