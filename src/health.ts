import { HealthCheckResult, ServerStatus } from "./types";
import { ServerRegistry } from "./registry";

export class HealthChecker {
  private registry: ServerRegistry;
  private intervalMs: number;
  private timer: ReturnType<typeof setInterval> | null = null;
  private results: Map<string, HealthCheckResult> = new Map();

  constructor(registry: ServerRegistry, intervalMs: number) {
    this.registry = registry;
    this.intervalMs = intervalMs;
  }

  start(): void {
    if (this.timer) return;

    console.log(`[Health] Starting health checks every ${this.intervalMs}ms`);
    this.timer = setInterval(() => this.checkAll(), this.intervalMs);
    this.checkAll();
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log("[Health] Stopped health checks");
    }
  }

  async checkAll(): Promise<HealthCheckResult[]> {
    const servers = this.registry.getAll();
    const checks = servers.map((s) => this.checkServer(s.id, s.endpoint));
    const results = await Promise.allSettled(checks);

    return results.map((r, i) => {
      if (r.status === "fulfilled") {
        return r.value;
      }
      const fallback: HealthCheckResult = {
        serverId: servers[i].id,
        status: "unhealthy",
        latencyMs: -1,
        checkedAt: new Date(),
        details: { error: (r.reason as Error).message },
      };
      this.registry.updateStatus(servers[i].id, "unhealthy");
      return fallback;
    });
  }

  async checkServer(serverId: string, endpoint: string): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${endpoint}/health`, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const latencyMs = Date.now() - startTime;
      let status: ServerStatus;

      if (response.ok) {
        status = latencyMs > 3000 ? "degraded" : "healthy";
      } else {
        status = "unhealthy";
      }

      this.registry.updateStatus(serverId, status);

      const result: HealthCheckResult = {
        serverId,
        status,
        latencyMs,
        checkedAt: new Date(),
      };

      this.results.set(serverId, result);
      return result;
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      this.registry.updateStatus(serverId, "unhealthy");

      const result: HealthCheckResult = {
        serverId,
        status: "unhealthy",
        latencyMs,
        checkedAt: new Date(),
        details: { error: (err as Error).message },
      };

      this.results.set(serverId, result);
      return result;
    }
  }

  getLastResult(serverId: string): HealthCheckResult | undefined {
    return this.results.get(serverId);
  }

  getAllResults(): HealthCheckResult[] {
    return Array.from(this.results.values());
  }

  getSummary(): { total: number; healthy: number; degraded: number; unhealthy: number } {
    const all = this.getAllResults();
    return {
      total: all.length,
      healthy: all.filter((r) => r.status === "healthy").length,
      degraded: all.filter((r) => r.status === "degraded").length,
      unhealthy: all.filter((r) => r.status === "unhealthy").length,
    };
  }
}
