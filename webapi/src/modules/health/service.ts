// Health service - provides system health status information

const startTime = Date.now();

export interface HealthStatus {
  status: "ok" | "degraded" | "down";
  version: string;
  uptime: number;
  timestamp: string;
}

/**
 * Get the current health status of the application
 * @returns HealthStatus object with status, version, uptime
 */
export function getHealthStatus(): HealthStatus {
  const uptime = Math.floor((Date.now() - startTime) / 1000); // uptime in seconds

  return {
    status: "ok",
    version: "0.1.0", // From package.json
    uptime,
    timestamp: new Date().toISOString(),
  };
}
