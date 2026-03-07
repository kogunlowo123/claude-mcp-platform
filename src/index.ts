import { loadConfig, validateConfig } from "./config";
import { ServerRegistry } from "./registry";
import { RequestRouter } from "./router";
import { HealthChecker } from "./health";
import { PlatformConfig, PlatformMetrics } from "./types";

export class MCPPlatform {
  private config: PlatformConfig;
  private registry: ServerRegistry;
  private router: RequestRouter;
  private healthChecker: HealthChecker;
  private startTime: number = 0;
  private metrics: PlatformMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageLatencyMs: 0,
    activeServers: 0,
    uptime: 0,
  };

  constructor(configOverrides?: Partial<PlatformConfig>) {
    this.config = loadConfig(configOverrides);

    const errors = validateConfig(this.config);
    if (errors.length > 0) {
      throw new Error(`Invalid configuration:\n${errors.join("\n")}`);
    }

    this.registry = new ServerRegistry(this.config.registry);
    this.router = new RequestRouter(
      this.registry,
      this.config.requestTimeoutMs,
      this.config.maxRetries
    );
    this.healthChecker = new HealthChecker(this.registry, this.config.healthCheckIntervalMs);
  }

  async start(): Promise<void> {
    this.startTime = Date.now();
    console.log(`[Platform] Starting MCP Platform on ${this.config.host}:${this.config.port}`);

    this.healthChecker.start();

    const server = Bun.serve({
      port: this.config.port,
      hostname: this.config.host,
      fetch: async (req) => this.handleRequest(req),
    });

    console.log(`[Platform] Listening on ${server.url}`);
  }

  async stop(): Promise<void> {
    console.log("[Platform] Shutting down...");
    this.healthChecker.stop();
    this.registry.clear();
  }

  private async handleRequest(req: Request): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === "/health") {
      return Response.json({
        status: "ok",
        uptime: Date.now() - this.startTime,
        servers: this.registry.count(),
        health: this.healthChecker.getSummary(),
      });
    }

    if (url.pathname === "/metrics") {
      this.metrics.uptime = Date.now() - this.startTime;
      this.metrics.activeServers = this.registry.getHealthy().length;
      return Response.json(this.metrics);
    }

    if (url.pathname === "/servers" && req.method === "GET") {
      return Response.json(this.registry.getAll());
    }

    if (url.pathname === "/servers" && req.method === "POST") {
      try {
        const body = await req.json();
        const server = this.registry.register(body);
        return Response.json(server, { status: 201 });
      } catch (err) {
        return Response.json({ error: (err as Error).message }, { status: 400 });
      }
    }

    if (url.pathname === "/route" && req.method === "POST") {
      try {
        const body = await req.json();
        this.metrics.totalRequests++;

        const response = await this.router.route({
          id: crypto.randomUUID(),
          method: body.method,
          params: body.params ?? {},
          serverId: body.serverId,
          timestamp: new Date(),
        });

        if (response.error) {
          this.metrics.failedRequests++;
        } else {
          this.metrics.successfulRequests++;
        }

        return Response.json(response);
      } catch (err) {
        this.metrics.failedRequests++;
        return Response.json({ error: (err as Error).message }, { status: 500 });
      }
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  }

  getRegistry(): ServerRegistry {
    return this.registry;
  }

  getRouter(): RequestRouter {
    return this.router;
  }

  getHealthChecker(): HealthChecker {
    return this.healthChecker;
  }
}

// CLI entry point
if (import.meta.main) {
  const platform = new MCPPlatform();
  platform.start().catch((err) => {
    console.error("[Platform] Fatal error:", err);
    process.exit(1);
  });

  process.on("SIGINT", async () => {
    await platform.stop();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await platform.stop();
    process.exit(0);
  });
}

export { ServerRegistry } from "./registry";
export { RequestRouter } from "./router";
export { HealthChecker } from "./health";
export { loadConfig, validateConfig } from "./config";
export * from "./types";
