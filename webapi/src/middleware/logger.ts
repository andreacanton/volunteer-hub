import { Elysia } from "elysia";
import { getLogger } from "@logtape/logtape";

const logger = getLogger(["app", "http"]);

/**
 * Request logging middleware that logs method, path, status, and duration
 * for each request using LogTape.
 */
export const requestLogger = new Elysia({ name: "requestLogger" })
  .derive(({ request }) => {
    return {
      requestStart: performance.now(),
      requestPath: new URL(request.url).pathname,
    };
  })
  .onAfterResponse(({ request, set, requestStart, requestPath }) => {
    const duration = (performance.now() - requestStart).toFixed(2);
    const status = set.status ?? 200;
    const method = request.method;

    logger.info("{method} {path} {status} {duration}ms", {
      method,
      path: requestPath,
      status,
      duration,
    });
  });
