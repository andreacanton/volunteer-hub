import { Elysia, t } from "elysia";
import { success, ErrorCode, apiResponseSchema } from "../../utils/response.ts";
import { ApiError } from "../../middleware/errorHandler.ts";
import {
  createUser,
  getUserByEmail,
  getUserById,
  validateCredentials,
  toUserResponse,
  createRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  revokeRefreshTokenByValue,
  createPasswordReset,
  validateResetToken,
  markResetTokenUsed,
  updateUserPassword,
} from "./service.ts";
import { UserRole } from "../../constants/userRole.ts";
import { PASSWORD_REGEX, PASSWORD_REQUIREMENTS_MESSAGE } from "../../constants/password.ts";
import type { JwtPayload } from "../../middleware/jwt.ts";
import { sendPasswordResetEmail } from "../../utils/email.ts";

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

const LoginRequestSchema = t.Object({
  email: t.String({
    format: "email",
  }),
  password: t.String(),
});

const RefreshRequestSchema = t.Object({
  refreshToken: t.String({
    minLength: 1,
  }),
});

const LogoutRequestSchema = t.Object({
  refreshToken: t.String({
    minLength: 1,
  }),
});

const ForgotPasswordRequestSchema = t.Object({
  email: t.String({
    format: "email",
  }),
});

const ResetPasswordRequestSchema = t.Object({
  token: t.String({
    minLength: 1,
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
  firstName: t.String(),
  lastName: t.String(),
  createdAt: t.String(),
  updatedAt: t.String(),
});

const RegisterResponseSchema = t.Object({
  message: t.String(),
});

const LoginResponseSchema = t.Object({
  accessToken: t.String(),
  refreshToken: t.String(),
  user: UserResponseSchema,
});

const LogoutResponseSchema = t.Object({
  message: t.String(),
});

const ForgotPasswordResponseSchema = t.Object({
  message: t.String(),
});

const ResetPasswordResponseSchema = t.Object({
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

      // Validate password strength (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
      if (!PASSWORD_REGEX.test(password)) {
        throw new ApiError(
          ErrorCode.VALIDATION_ERROR,
          PASSWORD_REQUIREMENTS_MESSAGE
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
  )
  .post(
    "/login",
    async ({ body, jwt }) => {
      const { email, password } = body;

      // Validate credentials
      const user = await validateCredentials(email, password);
      if (!user) {
        throw new ApiError(
          ErrorCode.AUTH_INVALID_CREDENTIALS,
          "Invalid email or password"
        );
      }

      // Create JWT access token
      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };
      const accessToken = await jwt.sign(payload);

      // Create refresh token
      const { token: refreshToken } = createRefreshToken(user.id);

      return success({
        accessToken,
        refreshToken,
        user,
      });
    },
    {
      body: LoginRequestSchema,
      detail: {
        summary: "Login",
        description: "Authenticates a user and returns access and refresh tokens",
        tags: ["Auth"],
      },
      response: {
        200: apiResponseSchema(LoginResponseSchema),
        401: t.Any(),
      },
    }
  )
  .post(
    "/refresh",
    async ({ body, jwt }) => {
      const { refreshToken } = body;

      // Validate the refresh token
      const tokenRecord = validateRefreshToken(refreshToken);
      if (!tokenRecord) {
        throw new ApiError(
          ErrorCode.AUTH_TOKEN_INVALID,
          "Invalid or expired refresh token"
        );
      }

      // Get the user
      const user = getUserById(tokenRecord.user_id);
      if (!user) {
        // User was deleted, revoke the token
        revokeRefreshToken(tokenRecord.id);
        throw new ApiError(
          ErrorCode.AUTH_USER_NOT_FOUND,
          "User not found"
        );
      }

      // Revoke the old refresh token (token rotation)
      revokeRefreshToken(tokenRecord.id);

      // Create new access token
      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };
      const accessToken = await jwt.sign(payload);

      // Create new refresh token
      const { token: newRefreshToken } = createRefreshToken(user.id);

      return success({
        accessToken,
        refreshToken: newRefreshToken,
        user: toUserResponse(user),
      });
    },
    {
      body: RefreshRequestSchema,
      detail: {
        summary: "Refresh tokens",
        description: "Exchanges a valid refresh token for new access and refresh tokens",
        tags: ["Auth"],
      },
      response: {
        200: apiResponseSchema(LoginResponseSchema),
        401: t.Any(),
        404: t.Any(),
      },
    }
  )
  .post(
    "/logout",
    async ({ body }) => {
      const { refreshToken } = body;

      // Revoke the token - idempotent, returns success regardless
      revokeRefreshTokenByValue(refreshToken);

      return success({
        message: "Logged out successfully",
      });
    },
    {
      body: LogoutRequestSchema,
      detail: {
        summary: "Logout",
        description: "Revokes the refresh token, ending the session",
        tags: ["Auth"],
      },
      response: {
        200: apiResponseSchema(LogoutResponseSchema),
      },
    }
  )
  .post(
    "/forgot-password",
    async ({ body }) => {
      const { email } = body;

      // Always return success to prevent email enumeration
      const responseMessage =
        "If an account with that email exists, a password reset link has been sent.";

      // Check if user exists
      const user = getUserByEmail(email);
      if (!user) {
        // Normalize response time to prevent timing-based email enumeration
        await Bun.sleep(150);
        return success({
          message: responseMessage,
        });
      }

      // Create password reset token
      const { token } = createPasswordReset(user.id);

      // Send email (fire and forget - don't fail the request if email fails)
      sendPasswordResetEmail(email, token);

      return success({
        message: responseMessage,
      });
    },
    {
      body: ForgotPasswordRequestSchema,
      detail: {
        summary: "Request password reset",
        description:
          "Sends a password reset email if the account exists. Always returns success to prevent email enumeration.",
        tags: ["Auth"],
      },
      response: {
        200: apiResponseSchema(ForgotPasswordResponseSchema),
      },
    }
  )
  .post(
    "/reset-password",
    async ({ body }) => {
      const { token, password } = body;

      // Validate the reset token
      const resetRecord = validateResetToken(token);
      if (!resetRecord) {
        throw new ApiError(
          ErrorCode.AUTH_TOKEN_INVALID,
          "Invalid or expired password reset token"
        );
      }

      // Validate password strength (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
      if (!PASSWORD_REGEX.test(password)) {
        throw new ApiError(
          ErrorCode.VALIDATION_ERROR,
          PASSWORD_REQUIREMENTS_MESSAGE
        );
      }

      // Update password (also revokes all refresh tokens)
      await updateUserPassword(resetRecord.user_id, password);

      // Mark reset token as used
      markResetTokenUsed(resetRecord.id);

      return success({
        message: "Password has been reset successfully. Please log in with your new password.",
      });
    },
    {
      body: ResetPasswordRequestSchema,
      detail: {
        summary: "Reset password",
        description:
          "Resets the user's password using a valid reset token. Revokes all existing sessions.",
        tags: ["Auth"],
      },
      response: {
        200: apiResponseSchema(ResetPasswordResponseSchema),
        400: t.Any(),
        401: t.Any(),
      },
    }
  );
