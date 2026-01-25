import { Elysia, t } from "elysia";
import { success, error, ErrorCode, apiResponseSchema } from "../../utils/response.ts";
import { ApiError } from "../../middleware/errorHandler.ts";
import { createUser, getUserByEmail } from "./service.ts";
import { UserRole } from "../../constants/userRole.ts";

// Request schemas
const RegisterRequestSchema = t.Object({
  email: t.String({
    format: "email",
    minLength: 3,
    maxLength: 255,
  }),
  password: t.String({
    minLength: 8,
    maxLength: 100,
  }),
});

// Response schemas
const UserResponseSchema = t.Object({
  id: t.String(),
  email: t.String(),
  role: t.String(),
  created_at: t.String(),
  updated_at: t.String(),
});

const RegisterResponseSchema = t.Object({
  message: t.String(),
});

export const authModule = new Elysia({ prefix: "/auth" })
  .post(
    "/register",
    async ({ body }) => {
      const { email, password } = body;

      // Check if user already exists
      const existingUser = getUserByEmail(email);
      if (existingUser) {
        throw new ApiError(
          ErrorCode.AUTH_USER_EXISTS,
          "A user with this email already exists"
        );
      }

      // Validate password strength
      if (password.length < 8) {
        throw new ApiError(
          ErrorCode.VALIDATION_ERROR,
          "Password must be at least 8 characters long"
        );
      }

      // Create user
      await createUser({
        email,
        password,
        role: UserRole.VOLUNTEER,
      });

      return success({
        message: "Registration successful. Please log in.",
      });
    },
    {
      body: RegisterRequestSchema,
      detail: {
        summary: "Register a new user",
        description: "Creates a new user account with the provided email and password",
        tags: ["Auth"],
      },
      response: {
        200: apiResponseSchema(RegisterResponseSchema),
        400: t.Any(),
        409: t.Any(),
      },
    }
  );
