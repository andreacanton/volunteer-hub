import { t } from "elysia";

/**
 * Standard error codes used across the API.
 */
export const ErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AUTH_TOKEN_MISSING: "AUTH_TOKEN_MISSING",
  AUTH_TOKEN_INVALID: "AUTH_TOKEN_INVALID",
  AUTH_TOKEN_EXPIRED: "AUTH_TOKEN_EXPIRED",
  AUTH_TOKEN_REVOKED: "AUTH_TOKEN_REVOKED",
  AUTH_USER_EXISTS: "AUTH_USER_EXISTS",
  AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
  AUTH_USER_NOT_FOUND: "AUTH_USER_NOT_FOUND",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  DATABASE_ERROR: "DATABASE_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * API error structure.
 */
export interface ApiError {
  code: ErrorCodeType;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Standard API response structure.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  timestamp: string;
}

/**
 * TypeBox schema for API error (for Elysia validation).
 */
export const ApiErrorSchema = t.Object({
  code: t.String(),
  message: t.String(),
  details: t.Optional(t.Record(t.String(), t.Unknown())),
});

/**
 * Creates a TypeBox schema for API response with typed data.
 */
export function apiResponseSchema<T extends ReturnType<typeof t.Object>>(
  dataSchema: T
) {
  return t.Object({
    success: t.Boolean(),
    data: t.Nullable(dataSchema),
    error: t.Nullable(ApiErrorSchema),
    timestamp: t.String(),
  });
}

/**
 * Creates a successful API response.
 */
export function success<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    error: null,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates an error API response.
 */
export function error(
  code: ErrorCodeType,
  message: string,
  details?: Record<string, unknown>
): ApiResponse<null> {
  return {
    success: false,
    data: null,
    error: {
      code,
      message,
      ...(details && { details }),
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * HTTP status codes mapped to error codes.
 */
export const errorCodeToStatus: Record<ErrorCodeType, number> = {
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.AUTH_TOKEN_MISSING]: 401,
  [ErrorCode.AUTH_TOKEN_INVALID]: 401,
  [ErrorCode.AUTH_TOKEN_EXPIRED]: 401,
  [ErrorCode.AUTH_TOKEN_REVOKED]: 401,
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: 401,
  [ErrorCode.AUTH_USER_NOT_FOUND]: 404,
  [ErrorCode.AUTH_USER_EXISTS]: 409,
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.INTERNAL_ERROR]: 500,
};
