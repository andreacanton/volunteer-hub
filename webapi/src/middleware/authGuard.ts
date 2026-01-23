import { Elysia } from "elysia";
import { getLogger } from "@logtape/logtape";
import { jwtPlugin, type JwtPayload } from "./jwt.ts";
import { error, ErrorCode, errorCodeToStatus } from "../utils/response.ts";

const logger = getLogger(["app", "auth"]);

/**
 * Auth guard middleware that protects routes by requiring valid Bearer tokens.
 * Rejects requests without valid tokens with 401 status.
 *
 * Usage:
 * ```ts
 * app.use(authGuard).get("/protected", ({ user }) => {
 *   // user is available here
 * })
 * ```
 */
export const authGuard = new Elysia({ name: "authGuard" })
  .use(jwtPlugin)
  .derive(async ({ jwt, request, set }) => {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      logger.debug("Missing Authorization header");
      set.status = errorCodeToStatus[ErrorCode.AUTH_TOKEN_MISSING];
      return {
        user: null as JwtPayload | null,
        authError: error(
          ErrorCode.AUTH_TOKEN_MISSING,
          "Authorization header is required"
        ),
      };
    }

    if (!authHeader.startsWith("Bearer ")) {
      logger.debug("Invalid Authorization header format");
      set.status = errorCodeToStatus[ErrorCode.AUTH_TOKEN_INVALID];
      return {
        user: null as JwtPayload | null,
        authError: error(
          ErrorCode.AUTH_TOKEN_INVALID,
          "Authorization header must use Bearer scheme"
        ),
      };
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix

    try {
      const payload = await jwt.verify(token);

      if (!payload) {
        logger.debug("Token verification failed");
        set.status = errorCodeToStatus[ErrorCode.AUTH_TOKEN_INVALID];
        return {
          user: null as JwtPayload | null,
          authError: error(ErrorCode.AUTH_TOKEN_INVALID, "Invalid token"),
        };
      }

      // Check if token is expired
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        logger.debug("Token expired");
        set.status = errorCodeToStatus[ErrorCode.AUTH_TOKEN_EXPIRED];
        return {
          user: null as JwtPayload | null,
          authError: error(ErrorCode.AUTH_TOKEN_EXPIRED, "Token has expired"),
        };
      }

      return {
        user: payload as JwtPayload,
        authError: null,
      };
    } catch (err) {
      logger.debug("Token verification error: {error}", { error: err });
      set.status = errorCodeToStatus[ErrorCode.AUTH_TOKEN_INVALID];
      return {
        user: null as JwtPayload | null,
        authError: error(ErrorCode.AUTH_TOKEN_INVALID, "Invalid token"),
      };
    }
  })
  .onBeforeHandle(({ authError }) => {
    // Return error response early if authentication failed
    if (authError) {
      return authError;
    }
  });
