import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { getConfig } from "../config/index.ts";

/**
 * JWT payload structure for user tokens.
 */
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * JWT authentication plugin configured with secret from environment.
 * Provides jwt.sign() and jwt.verify() methods to routes.
 */
export const jwtPlugin = new Elysia({ name: "jwtPlugin" }).use(
  jwt({
    name: "jwt",
    secret: getConfig().JWT_SECRET,
    exp: getConfig().JWT_EXPIRES_IN,
  })
);
