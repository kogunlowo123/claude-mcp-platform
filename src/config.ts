import { PlatformConfig } from "./types";

const defaults: PlatformConfig = {
  port: 3000,
  host: "0.0.0.0",
  healthCheckIntervalMs: 30000,
  requestTimeoutMs: 10000,
  maxRetries: 3,
  logLevel: "info",
  registry: {
    maxServers: 100,
    deregistrationTimeoutMs: 60000,
    persistState: false,
  },
};

export function loadConfig(overrides?: Partial<PlatformConfig>): PlatformConfig {
  const envConfig: Partial<PlatformConfig> = {
    port: envInt("MCP_PORT", defaults.port),
    host: envStr("MCP_HOST", defaults.host),
    healthCheckIntervalMs: envInt("MCP_HEALTH_INTERVAL", defaults.healthCheckIntervalMs),
    requestTimeoutMs: envInt("MCP_REQUEST_TIMEOUT", defaults.requestTimeoutMs),
    maxRetries: envInt("MCP_MAX_RETRIES", defaults.maxRetries),
    logLevel: envStr("MCP_LOG_LEVEL", defaults.logLevel) as PlatformConfig["logLevel"],
  };

  return {
    ...defaults,
    ...envConfig,
    ...overrides,
    registry: {
      ...defaults.registry,
      ...overrides?.registry,
    },
  };
}

function envStr(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function envInt(key: string, fallback: number): number {
  const val = process.env[key];
  if (val === undefined) return fallback;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? fallback : parsed;
}

export function validateConfig(config: PlatformConfig): string[] {
  const errors: string[] = [];

  if (config.port < 1 || config.port > 65535) {
    errors.push("Port must be between 1 and 65535");
  }
  if (config.healthCheckIntervalMs < 1000) {
    errors.push("Health check interval must be at least 1000ms");
  }
  if (config.requestTimeoutMs < 100) {
    errors.push("Request timeout must be at least 100ms");
  }
  if (config.maxRetries < 0) {
    errors.push("Max retries must be non-negative");
  }
  if (config.registry.maxServers < 1) {
    errors.push("Max servers must be at least 1");
  }

  return errors;
}
