import { Elysia, t } from "elysia";
import { success, ErrorCode, apiResponseSchema } from "../../utils/response.ts";
import { ApiError } from "../../middleware/errorHandler.ts";
import { authGuard } from "../../middleware/authGuard.ts";
import { getSafeUserById, updateUser, isEmailTaken } from "./service.ts";

// Response schemas
const UserResponseSchema = t.Object({
  id: t.String(),
  email: t.String(),
  role: t.String(),
  created_at: t.String(),
  updated_at: t.String(),
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
  );
