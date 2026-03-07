export interface MCPServer {
  id: string;
  name: string;
  version: string;
  endpoint: string;
  protocol: "stdio" | "sse" | "http";
  capabilities: string[];
  status: ServerStatus;
  metadata: Record<string, unknown>;
  registeredAt: Date;
  lastHeartbeat: Date;
}

export type ServerStatus = "healthy" | "degraded" | "unhealthy" | "unknown";

export interface MCPRequest {
  id: string;
  method: string;
  params: Record<string, unknown>;
  serverId?: string;
  timestamp: Date;
}

export interface MCPResponse {
  id: string;
  result?: unknown;
  error?: MCPError;
  serverId: string;
  latencyMs: number;
}

export interface MCPError {
  code: number;
  message: string;
  data?: unknown;
}

export interface HealthCheckResult {
  serverId: string;
  status: ServerStatus;
  latencyMs: number;
  checkedAt: Date;
  details?: Record<string, unknown>;
}

export interface PlatformConfig {
  port: number;
  host: string;
  healthCheckIntervalMs: number;
  requestTimeoutMs: number;
  maxRetries: number;
  logLevel: "debug" | "info" | "warn" | "error";
  registry: RegistryConfig;
}

export interface RegistryConfig {
  maxServers: number;
  deregistrationTimeoutMs: number;
  persistState: boolean;
  statePath?: string;
}

export interface RouteRule {
  pattern: string;
  serverId: string;
  priority: number;
  methods?: string[];
  fallbackServerId?: string;
}

export interface PlatformMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatencyMs: number;
  activeServers: number;
  uptime: number;
}
