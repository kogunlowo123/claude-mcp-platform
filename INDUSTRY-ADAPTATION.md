# Industry Adaptation Guide

## Overview
The `claude-mcp-platform` is an MCP (Model Context Protocol) platform orchestrator for managing and routing requests across MCP servers. It provides server registration, health checking, request routing with pattern-based rules, retry logic, and platform metrics. Its protocol-agnostic design (stdio, SSE, HTTP) makes it adaptable as the AI integration backbone for any industry.

## Healthcare
### Compliance Requirements
- HIPAA, HITRUST, HL7 FHIR
### Configuration Changes
- Set `MCP_REQUEST_TIMEOUT` to an appropriate value for clinical decision support latency requirements.
- Set `MCP_LOG_LEVEL = "info"` or `"debug"` for HIPAA audit trail requirements on all MCP server interactions.
- Configure `RegistryConfig.persistState = true` with `statePath` pointing to an encrypted volume for server registry persistence.
- Register only HIPAA-eligible MCP servers via the registry, validating PHI handling capabilities in `MCPServer.metadata`.
- Configure `RouteRule` patterns to route PHI-related requests only to HIPAA-compliant servers.
- Set `MCP_HEALTH_INTERVAL` to `15000` (15s) for critical clinical AI services requiring rapid failover.
- Use `MCPServer.protocol = "http"` with TLS for all connections carrying PHI.
- Configure `RouteRule.fallbackServerId` for clinical services requiring high availability.
### Example Use Case
A health IT platform routes clinical NLP requests to a HIPAA-compliant MCP server for medical document analysis, with 15-second health checks for rapid failover, TLS-encrypted HTTP transport, and audit logging of all requests for HIPAA compliance.

## Finance
### Compliance Requirements
- SOX, PCI-DSS, SOC 2
### Configuration Changes
- Set `MCP_MAX_RETRIES = 3` for reliable delivery of financial analysis requests.
- Set `MCP_REQUEST_TIMEOUT` based on trading system latency requirements.
- Configure `RouteRule` patterns to route PCI-scoped requests (payment analysis, fraud detection) to dedicated MCP servers.
- Set `MCP_LOG_LEVEL = "info"` for SOX audit trail of all AI-assisted financial decisions.
- Register MCP servers with `MCPServer.metadata` including compliance certifications for routing decisions.
- Set `MCP_HEALTH_INTERVAL = 10000` (10s) for rapid detection of degraded trading AI services.
- Configure `RegistryConfig.maxServers` based on the number of financial AI models in production.
- Set `RegistryConfig.deregistrationTimeoutMs` to prevent premature removal of temporarily degraded servers.
### Example Use Case
A trading firm routes market analysis requests to low-latency MCP servers, fraud detection to specialized servers, with 10-second health checks, 3 retries for reliability, and audit logging of all AI-assisted trading decisions for SOX compliance.

## Government
### Compliance Requirements
- FedRAMP, CMMC, NIST 800-53
### Configuration Changes
- Deploy the platform in a FedRAMP-authorized or GovCloud environment.
- Set `MCP_LOG_LEVEL = "info"` for continuous monitoring (NIST AU-2, AU-12).
- Register only FedRAMP-authorized MCP servers in the registry.
- Configure `RouteRule` patterns to enforce routing of CUI-related requests only to IL-4/IL-5 authorized servers.
- Set `MCPServer.protocol = "http"` with TLS for all connections (NIST SC-8).
- Set `MCP_REQUEST_TIMEOUT` and `MCP_MAX_RETRIES` per mission-criticality level.
- Configure `RegistryConfig.persistState = true` for recovery after restart (NIST CP-10).
- Set `MCP_HEALTH_INTERVAL = 30000` for mission-critical services.
### Example Use Case
A federal agency deploys the MCP platform in GovCloud to route document analysis requests to FedRAMP-authorized AI servers, with TLS enforcement, persistent server registry for recovery, and comprehensive audit logging for NIST compliance.

## Retail / E-Commerce
### Compliance Requirements
- PCI-DSS, CCPA/GDPR
### Configuration Changes
- Set `RegistryConfig.maxServers = 100` to support a large fleet of AI servers for product recommendations, search, and customer support.
- Configure `RouteRule` patterns for capability-based routing: product search to embedding servers, customer support to chat servers, recommendations to ML inference servers.
- Set `MCP_REQUEST_TIMEOUT = 5000` (5s) for responsive customer-facing AI features.
- Set `MCP_MAX_RETRIES = 2` for fast failover during peak traffic.
- Configure `RouteRule.fallbackServerId` for critical customer-facing services.
- Set `MCP_HEALTH_INTERVAL = 15000` for rapid detection of degraded recommendation services.
- Use `MCPServer.capabilities` to route requests based on server specialization.
### Example Use Case
An e-commerce platform routes product search queries to embedding servers, customer chat to conversational AI servers, and personalization requests to recommendation engines, with 5-second timeouts, fast failover, and health checks every 15 seconds.

## Education
### Compliance Requirements
- FERPA, COPPA
### Configuration Changes
- Configure `RouteRule` patterns to route student-facing AI requests only to servers that do not log or store student PII.
- Set `MCP_LOG_LEVEL = "warn"` for student-facing services to minimize PII in logs, `"info"` for administrative services.
- Register tutoring and assessment AI servers with `MCPServer.metadata` indicating FERPA compliance.
- Set `MCP_REQUEST_TIMEOUT = 10000` for interactive tutoring sessions.
- Configure `RouteRule.fallbackServerId` for tutoring services requiring high availability during exam periods.
### Example Use Case
A university routes tutoring requests to FERPA-compliant AI servers, assessment grading to specialized evaluation servers, and research queries to general-purpose servers, with routing rules ensuring student data only reaches FERPA-compliant endpoints.

## SaaS / Multi-Tenant
### Compliance Requirements
- SOC 2, ISO 27001
### Configuration Changes
- Deploy separate platform instances per tenant tier, or use `RouteRule` patterns with tenant identifiers for request routing.
- Configure `RouteRule.methods` and `RouteRule.pattern` to route tenant requests to tenant-dedicated MCP servers.
- Set `RegistryConfig.maxServers` based on the total number of tenant-specific AI servers.
- Set `MCP_REQUEST_TIMEOUT` based on tenant SLA tiers (lower timeout for premium tenants).
- Configure `RouteRule.priority` to prioritize premium tenant routing.
- Set `MCP_LOG_LEVEL = "info"` for SOC 2 audit evidence.
- Configure `RegistryConfig.persistState = true` for recovery without re-registration.
### Example Use Case
A SaaS AI platform deploys the MCP orchestrator to route tenant requests to tenant-specific AI servers, with priority-based routing for enterprise tenants, health monitoring across all tenant servers, and audit logging for SOC 2 compliance.

## Cross-Industry Best Practices
- Use environment-based configuration via `MCP_PORT`, `MCP_HOST`, `MCP_LOG_LEVEL`, and other environment variables per deployment.
- Always enable encryption in transit by using `MCPServer.protocol = "http"` with TLS or `"sse"` over HTTPS.
- Enable audit logging and monitoring by setting `MCP_LOG_LEVEL = "info"` and tracking `PlatformMetrics` (totalRequests, failedRequests, averageLatencyMs).
- Enforce least-privilege access controls by restricting MCP server registration to authorized services and using capability-based routing.
- Implement network segmentation by deploying the platform in a private subnet with access only to registered MCP server endpoints.
- Configure backup and disaster recovery by enabling `RegistryConfig.persistState = true` and deploying redundant platform instances with load balancing.
