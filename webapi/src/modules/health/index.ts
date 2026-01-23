// Health module - provides system health check endpoint
import { Elysia, t } from "elysia";
import { getHealthStatus } from "./service.ts";
import { success, apiResponseSchema } from "../../utils/response.ts";

// TypeBox schema for health status response
const HealthStatusSchema = t.Object({
  status: t.Union([t.Literal("ok"), t.Literal("degraded"), t.Literal("down")]),
  version: t.String(),
  uptime: t.Number(),
  timestamp: t.String(),
});

export const healthModule = new Elysia({ prefix: "/health" }).get(
  "/",
  () => {
    const healthStatus = getHealthStatus();
    return success(healthStatus);
  },
  {
    detail: {
      summary: "Health Check",
      description: "Returns the health status of the API",
      tags: ["Health"],
    },
    response: {
      200: apiResponseSchema(HealthStatusSchema),
    },
  }
);
