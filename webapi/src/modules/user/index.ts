import { Elysia, t } from "elysia";
import { success, ErrorCode, apiResponseSchema } from "../../utils/response.ts";
import { ApiError } from "../../middleware/errorHandler.ts";
import { authGuard } from "../../middleware/authGuard.ts";
import { roleGuard } from "../../middleware/roleGuard.ts";
import { UserRole } from "../../constants/userRole.ts";
import {
  getSafeUserById,
  updateUser,
  isEmailTaken,
  getAllUsers,
  updateUserAdmin,
  deleteUser,
} from "./service.ts";

// Response schemas
const UserResponseSchema = t.Object({
  id: t.String(),
  email: t.String(),
  role: t.String(),
  firstName: t.String(),
  lastName: t.String(),
  createdAt: t.String(),
  updatedAt: t.String(),
});

// Request schemas
const UpdateProfileRequestSchema = t.Object({
  email: t.Optional(
    t.String({
      format: "email",
      minLength: 3,
      maxLength: 255,
    })
  ),
});

export const userModule = new Elysia({ prefix: "/users" })
  .use(authGuard)
  .get(
    "/me",
    ({ user }) => {
      if (!user) {
        throw new ApiError(
          ErrorCode.AUTH_TOKEN_INVALID,
          "Authentication required"
        );
      }

      const profile = getSafeUserById(user.sub);
      if (!profile) {
        throw new ApiError(ErrorCode.AUTH_USER_NOT_FOUND, "User not found");
      }

      return success(profile);
    },
    {
      detail: {
        summary: "Get current user profile",
        description: "Returns the authenticated user's profile information",
        tags: ["User"],
      },
      response: {
        200: apiResponseSchema(UserResponseSchema),
        401: t.Any(),
        404: t.Any(),
      },
    }
  )
  .put(
    "/me",
    ({ user, body }) => {
      if (!user) {
        throw new ApiError(
          ErrorCode.AUTH_TOKEN_INVALID,
          "Authentication required"
        );
      }

      // Check if email is being changed and if it's already taken
      if (body.email) {
        if (isEmailTaken(body.email, user.sub)) {
          throw new ApiError(
            ErrorCode.AUTH_USER_EXISTS,
            "Email is already in use"
          );
        }
      }

      const updatedUser = updateUser(user.sub, body);
      if (!updatedUser) {
        throw new ApiError(ErrorCode.AUTH_USER_NOT_FOUND, "User not found");
      }

      return success(updatedUser);
    },
    {
      body: UpdateProfileRequestSchema,
      detail: {
        summary: "Update current user profile",
        description: "Updates the authenticated user's profile information",
        tags: ["User"],
      },
      response: {
        200: apiResponseSchema(UserResponseSchema),
        400: t.Any(),
        401: t.Any(),
        404: t.Any(),
        409: t.Any(),
      },
    }
  )
  // Admin routes
  .use(roleGuard(UserRole.ADMIN))
  .get(
    "/",
    () => {
      const users = getAllUsers();
      return success(users);
    },
    {
      detail: {
        summary: "List all users (admin)",
        tags: ["Admin"],
      },
      response: {
        200: apiResponseSchema(t.Array(UserResponseSchema)),
        401: t.Any(),
        403: t.Any(),
      },
    }
  )
  .get(
    "/:id",
    ({ params }) => {
      // Avoid shadowing /me — "me" is not a valid user ID
      if (params.id === "me") {
        throw new ApiError(ErrorCode.RESOURCE_NOT_FOUND, "User not found");
      }
      const userProfile = getSafeUserById(params.id);
      if (!userProfile) {
        throw new ApiError(ErrorCode.RESOURCE_NOT_FOUND, "User not found");
      }
      return success(userProfile);
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        summary: "Get user by ID (admin)",
        tags: ["Admin"],
      },
      response: {
        200: apiResponseSchema(UserResponseSchema),
        401: t.Any(),
        403: t.Any(),
        404: t.Any(),
      },
    }
  )
  .put(
    "/:id",
    ({ user, params, body }) => {
      if (!user) {
        throw new ApiError(ErrorCode.AUTH_TOKEN_INVALID, "Authentication required");
      }

      // Prevent self-role-change
      if (user.sub === params.id && body.role !== undefined) {
        throw new ApiError(ErrorCode.FORBIDDEN, "Cannot change your own role");
      }

      // Check email uniqueness
      if (body.email) {
        if (isEmailTaken(body.email, params.id)) {
          throw new ApiError(ErrorCode.AUTH_USER_EXISTS, "Email is already in use");
        }
      }

      const updated = updateUserAdmin(params.id, body);
      if (!updated) {
        throw new ApiError(ErrorCode.RESOURCE_NOT_FOUND, "User not found");
      }

      return success(updated);
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        email: t.Optional(t.String({ format: "email", minLength: 3, maxLength: 255 })),
        firstName: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
        lastName: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
        role: t.Optional(t.Enum(UserRole)),
      }),
      detail: {
        summary: "Update user (admin)",
        tags: ["Admin"],
      },
      response: {
        200: apiResponseSchema(UserResponseSchema),
        400: t.Any(),
        401: t.Any(),
        403: t.Any(),
        404: t.Any(),
        409: t.Any(),
      },
    }
  )
  .delete(
    "/:id",
    ({ user, params }) => {
      if (!user) {
        throw new ApiError(ErrorCode.AUTH_TOKEN_INVALID, "Authentication required");
      }

      // Prevent self-deletion
      if (user.sub === params.id) {
        throw new ApiError(ErrorCode.FORBIDDEN, "Cannot delete your own account");
      }

      const deleted = deleteUser(params.id);
      if (!deleted) {
        throw new ApiError(ErrorCode.RESOURCE_NOT_FOUND, "User not found");
      }

      return success({ deleted: true });
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        summary: "Delete user (admin)",
        tags: ["Admin"],
      },
      response: {
        200: t.Any(),
        401: t.Any(),
        403: t.Any(),
        404: t.Any(),
      },
    }
  );
