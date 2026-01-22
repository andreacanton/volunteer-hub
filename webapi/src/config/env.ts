import { t, type Static } from "elysia";
import { Value } from "@sinclair/typebox/value";

/**
 * Environment variable schema with validation rules.
 * Required variables will cause startup failure if missing.
 */
const EnvSchema = t.Object({
  // Required
  JWT_SECRET: t.String({
    minLength: 32,
    description: "JWT signing secret (minimum 32 characters)",
  }),

  // Optional with defaults
  PORT: t.Transform(t.String({ default: "3000" }))
    .Decode((v) => parseInt(v, 10))
    .Encode((v) => String(v)),

  NODE_ENV: t.Union(
    [t.Literal("development"), t.Literal("production"), t.Literal("test")],
    { default: "development" }
  ),

  JWT_EXPIRES_IN: t.String({ default: "24h" }),

  DATABASE_PATH: t.String({ default: "./database/volunteer-hub.db" }),

  LOG_LEVEL: t.Union(
    [
      t.Literal("trace"),
      t.Literal("debug"),
      t.Literal("info"),
      t.Literal("warning"),
      t.Literal("error"),
      t.Literal("fatal"),
    ],
    { default: "info" }
  ),
});

export type Env = Static<typeof EnvSchema>;

/**
 * Validates and returns the environment configuration.
 * Throws an error if required variables are missing or invalid.
 */
export function loadEnv(): Env {
  const raw = {
    JWT_SECRET: process.env.JWT_SECRET,
    PORT: process.env.PORT ?? "3000",
    NODE_ENV: process.env.NODE_ENV ?? "development",
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "24h",
    DATABASE_PATH: process.env.DATABASE_PATH ?? "./database/volunteer-hub.db",
    LOG_LEVEL: process.env.LOG_LEVEL ?? "info",
  };

  // Validate JWT_SECRET is present
  if (!raw.JWT_SECRET) {
    throw new Error(
      "JWT_SECRET environment variable is required (minimum 32 characters)"
    );
  }

  if (raw.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long");
  }

  // Validate and decode with TypeBox
  if (!Value.Check(EnvSchema, raw)) {
    const errors = [...Value.Errors(EnvSchema, raw)];
    const messages = errors
      .map((e) => `${e.path}: ${e.message}`)
      .join("; ");
    throw new Error(`Environment validation failed: ${messages}`);
  }

  return Value.Decode(EnvSchema, raw);
}
