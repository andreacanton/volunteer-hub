import { Elysia } from "elysia";
import { getLogger } from "@logtape/logtape";
import { UserRole } from "../constants/userRole.ts";
import { error, ErrorCode, errorCodeToStatus } from "../utils/response.ts";

const logger = getLogger(["app", "auth"]);

/**
 * Role guard middleware factory that restricts access to specific user roles.
 * Must be used after authGuard (depends on `user` in context).
 *
 * Usage:
 * ```ts
 * app.use(authGuard).use(roleGuard(UserRole.ADMIN)).get("/admin", ...)
 * ```
 */
export function roleGuard(...allowedRoles: UserRole[]) {
  const validRoles = Object.values(UserRole);
  return new Elysia({ name: `roleGuard:${allowedRoles.join(",")}` })
    .onBeforeHandle(({ user, authError, set }) => {
      // Re-check auth since authGuard's onBeforeHandle may not propagate
      // across .use() plugin boundaries in Elysia
      if (authError) {
        return authError;
      }

      const userRole = user?.role as string | undefined;
      if (!user || !userRole || !validRoles.includes(userRole as UserRole) || !allowedRoles.includes(userRole as UserRole)) {
        logger.debug("Access denied: user role {role} not in {allowed}", {
          role: user?.role ?? "none",
          allowed: allowedRoles.join(", "),
        });
        set.status = errorCodeToStatus[ErrorCode.FORBIDDEN];
        return error(
          ErrorCode.FORBIDDEN,
          "You do not have permission to access this resource"
        );
      }
    });
}
