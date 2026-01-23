import { describe, expect, test, beforeAll } from "bun:test";
import { Elysia } from "elysia";
import { getHealthStatus } from "../../src/modules/health/service.ts";
import { healthModule } from "../../src/modules/health/index.ts";

describe("Health Service", () => {
  test("getHealthStatus returns correct structure", () => {
    const status = getHealthStatus();

    expect(status).toHaveProperty("status");
    expect(status).toHaveProperty("version");
    expect(status).toHaveProperty("uptime");
    expect(status).toHaveProperty("timestamp");
  });

  test("status should be 'ok'", () => {
    const status = getHealthStatus();
    expect(status.status).toBe("ok");
  });

  test("version should be '0.1.0'", () => {
    const status = getHealthStatus();
    expect(status.version).toBe("0.1.0");
  });

  test("uptime should be a non-negative number", () => {
    const status = getHealthStatus();
    expect(typeof status.uptime).toBe("number");
    expect(status.uptime).toBeGreaterThanOrEqual(0);
  });

  test("timestamp should be valid ISO 8601 string", () => {
    const status = getHealthStatus();
    expect(status.timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );
  });

  test("uptime should increase over time", async () => {
    const status1 = getHealthStatus();
    await new Promise((resolve) => setTimeout(resolve, 100)); // Wait 100ms
    const status2 = getHealthStatus();

    expect(status2.uptime).toBeGreaterThanOrEqual(status1.uptime);
  });
});

describe("Health Module API", () => {
  let app: Elysia;

  beforeAll(() => {
    app = new Elysia().use(healthModule);
  });

  test("GET /health returns 200", async () => {
    const response = await app.handle(new Request("http://localhost/health"));

    expect(response.status).toBe(200);
  });

  test("GET /health returns correct structure", async () => {
    const response = await app.handle(new Request("http://localhost/health"));
    const body = await response.json();

    expect(body).toHaveProperty("success");
    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("error");
    expect(body).toHaveProperty("timestamp");
  });

  test("GET /health returns success: true", async () => {
    const response = await app.handle(new Request("http://localhost/health"));
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.error).toBeNull();
  });

  test("GET /health data contains health status", async () => {
    const response = await app.handle(new Request("http://localhost/health"));
    const body = await response.json();

    expect(body.data).toHaveProperty("status");
    expect(body.data).toHaveProperty("version");
    expect(body.data).toHaveProperty("uptime");
    expect(body.data).toHaveProperty("timestamp");
    expect(body.data.status).toBe("ok");
    expect(body.data.version).toBe("0.1.0");
  });
});
