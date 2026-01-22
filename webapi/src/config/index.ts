import { loadEnv, type Env } from "./env.ts";

/**
 * Application configuration singleton.
 * Loaded once at startup and cached for the application lifetime.
 */
let _config: Env | null = null;

/**
 * Returns the application configuration.
 * On first call, validates and loads environment variables.
 * Subsequent calls return the cached configuration.
 *
 * @throws Error if required environment variables are missing or invalid
 */
export function getConfig(): Env {
  if (_config === null) {
    _config = loadEnv();
  }
  return _config;
}

/**
 * Shorthand for getConfig() - exported as `config` for convenience.
 * Note: This is a getter, not a static value, to support lazy loading.
 */
export const config = new Proxy({} as Env, {
  get(_, prop: keyof Env) {
    return getConfig()[prop];
  },
});

export type { Env };
