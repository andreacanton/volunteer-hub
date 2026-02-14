import { createHash, randomBytes, timingSafeEqual } from "crypto";

/**
 * Generates a cryptographically secure random token.
 * @param bytes - Number of random bytes to generate (default: 32)
 * @returns Hex-encoded token string
 */
export function generateToken(bytes: number = 32): string {
  return randomBytes(bytes).toString("hex");
}

/**
 * Hashes a token using SHA-256.
 * @param token - Plain token string to hash
 * @returns SHA-256 hash as hex string
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Compares two tokens in constant time to prevent timing attacks.
 * Both tokens are hashed before comparison.
 * @param token1 - First token to compare
 * @param token2 - Second token to compare
 * @returns True if tokens match, false otherwise
 */
export function compareTokens(token1: string, token2: string): boolean {
  const hash1 = Buffer.from(hashToken(token1), "hex");
  const hash2 = Buffer.from(hashToken(token2), "hex");

  // timingSafeEqual requires buffers of equal length
  if (hash1.length !== hash2.length) {
    return false;
  }

  return timingSafeEqual(hash1, hash2);
}
