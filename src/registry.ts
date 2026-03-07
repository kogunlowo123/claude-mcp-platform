import { MCPServer, RegistryConfig, ServerStatus } from "./types";

export class ServerRegistry {
  private servers: Map<string, MCPServer> = new Map();
  private config: RegistryConfig;

  constructor(config: RegistryConfig) {
    this.config = config;
  }

  register(server: Omit<MCPServer, "registeredAt" | "lastHeartbeat" | "status">): MCPServer {
    if (this.servers.size >= this.config.maxServers) {
      throw new Error(`Registry full: maximum ${this.config.maxServers} servers allowed`);
    }

    if (this.servers.has(server.id)) {
      throw new Error(`Server with id '${server.id}' already registered`);
    }

    const registered: MCPServer = {
      ...server,
      status: "unknown",
      registeredAt: new Date(),
      lastHeartbeat: new Date(),
    };

    this.servers.set(server.id, registered);
    console.log(`[Registry] Registered server: ${server.name} (${server.id})`);
    return registered;
  }

  deregister(serverId: string): boolean {
    const removed = this.servers.delete(serverId);
    if (removed) {
      console.log(`[Registry] Deregistered server: ${serverId}`);
    }
    return removed;
  }

  get(serverId: string): MCPServer | undefined {
    return this.servers.get(serverId);
  }

  getAll(): MCPServer[] {
    return Array.from(this.servers.values());
  }

  getByCapability(capability: string): MCPServer[] {
    return this.getAll().filter((s) => s.capabilities.includes(capability));
  }

  getByStatus(status: ServerStatus): MCPServer[] {
    return this.getAll().filter((s) => s.status === status);
  }

  getHealthy(): MCPServer[] {
    return this.getByStatus("healthy");
  }

  updateStatus(serverId: string, status: ServerStatus): void {
    const server = this.servers.get(serverId);
    if (server) {
      server.status = status;
      server.lastHeartbeat = new Date();
    }
  }

  pruneStale(): string[] {
    const now = Date.now();
    const pruned: string[] = [];

    for (const [id, server] of this.servers) {
      const elapsed = now - server.lastHeartbeat.getTime();
      if (elapsed > this.config.deregistrationTimeoutMs) {
        this.servers.delete(id);
        pruned.push(id);
      }
    }

    if (pruned.length > 0) {
      console.log(`[Registry] Pruned ${pruned.length} stale server(s)`);
    }

    return pruned;
  }

  count(): number {
    return this.servers.size;
  }

  clear(): void {
    this.servers.clear();
  }
}
