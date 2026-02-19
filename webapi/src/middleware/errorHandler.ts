import { Elysia } from "elysia";
import { getLogger } from "@logtape/logtape";
import { error, ErrorCode, errorCodeToStatus } from "../utils/response.ts";

const logger = getLogger(["middleware", "errorHandler"]);

/**
 * Custom error class for API errors with error codes.
 */
export class ApiError extends Error {
  constructor(
    public readonly code: (typeof ErrorCode)[keyof typeof ErrorCode],
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Error handler middleware that catches all errors and transforms them
 * into the standard API response format.
 */
export const errorHandler = new Elysia({ name: "errorHandler" }).onError(
  { as: "global" },
  ({ code, error: err, set }) => {
    // Handle Elysia validation errors
    if (code === "VALIDATION") {
      logger.debug("Validation error: {message}", { message: err.message });
      set.status = 400;
      return error(ErrorCode.VALIDATION_ERROR, "Validation failed", {
        message: err.message,
      });
    }

    // Handle not found errors
    if (code === "NOT_FOUND") {
      set.status = 404;
      return error(ErrorCode.RESOURCE_NOT_FOUND, "Resource not found");
    }

    // Handle custom API errors
    if (err instanceof ApiError) {
      set.status = errorCodeToStatus[err.code];
      return error(err.code, err.message, err.details);
    }

    // Handle unexpected errors
    logger.error(
      "Unexpected error [elysia_code={code}] [type={type}] [message={message}] [stack={stack}]",
      {
        code,
        type: err?.constructor?.name ?? typeof err,
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : "no stack",
      }
    );
    set.status = 500;
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred";
    return error(
      ErrorCode.INTERNAL_ERROR,
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred"
        : message
    );
  }
);
