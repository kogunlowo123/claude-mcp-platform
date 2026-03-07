import { MCPRequest, MCPResponse, RouteRule } from "./types";
import { ServerRegistry } from "./registry";

export class RequestRouter {
  private rules: RouteRule[] = [];
  private registry: ServerRegistry;
  private requestTimeoutMs: number;
  private maxRetries: number;

  constructor(registry: ServerRegistry, requestTimeoutMs: number, maxRetries: number) {
    this.registry = registry;
    this.requestTimeoutMs = requestTimeoutMs;
    this.maxRetries = maxRetries;
  }

  addRule(rule: RouteRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
    console.log(`[Router] Added rule: ${rule.pattern} -> ${rule.serverId} (priority: ${rule.priority})`);
  }

  removeRule(pattern: string): boolean {
    const index = this.rules.findIndex((r) => r.pattern === pattern);
    if (index >= 0) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  getRules(): RouteRule[] {
    return [...this.rules];
  }

  resolve(request: MCPRequest): string | null {
    if (request.serverId) {
      const server = this.registry.get(request.serverId);
      if (server && server.status === "healthy") {
        return server.id;
      }
    }

    for (const rule of this.rules) {
      if (this.matchesPattern(request.method, rule.pattern)) {
        if (rule.methods && !rule.methods.includes(request.method)) {
          continue;
        }

        const server = this.registry.get(rule.serverId);
        if (server && server.status === "healthy") {
          return server.id;
        }

        if (rule.fallbackServerId) {
          const fallback = this.registry.get(rule.fallbackServerId);
          if (fallback && fallback.status === "healthy") {
            return fallback.id;
          }
        }
      }
    }

    const healthy = this.registry.getHealthy();
    if (healthy.length > 0) {
      const index = Math.floor(Math.random() * healthy.length);
      return healthy[index].id;
    }

    return null;
  }

  async route(request: MCPRequest): Promise<MCPResponse> {
    const startTime = Date.now();
    const serverId = this.resolve(request);

    if (!serverId) {
      return {
        id: request.id,
        error: { code: -32000, message: "No available server to handle request" },
        serverId: "none",
        latencyMs: Date.now() - startTime,
      };
    }

    const server = this.registry.get(serverId);
    if (!server) {
      return {
        id: request.id,
        error: { code: -32001, message: `Server ${serverId} not found` },
        serverId,
        latencyMs: Date.now() - startTime,
      };
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.sendRequest(server.endpoint, request);
        return {
          id: request.id,
          result,
          serverId,
          latencyMs: Date.now() - startTime,
        };
      } catch (err) {
        lastError = err as Error;
        console.warn(`[Router] Attempt ${attempt + 1} failed for ${serverId}: ${lastError.message}`);
      }
    }

    return {
      id: request.id,
      error: { code: -32002, message: lastError?.message ?? "Request failed after retries" },
      serverId,
      latencyMs: Date.now() - startTime,
    };
  }

  private matchesPattern(method: string, pattern: string): boolean {
    if (pattern === "*") return true;
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    return regex.test(method);
  }

  private async sendRequest(endpoint: string, request: MCPRequest): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }
}
