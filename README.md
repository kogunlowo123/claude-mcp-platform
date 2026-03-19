![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)
![GitHub release](https://img.shields.io/github/v/release/kogunlowo123/claude-mcp-platform)

# claude-mcp-platform

MCP (Model Context Protocol) Platform Orchestrator for managing, routing, and monitoring requests across multiple MCP servers.

## Architecture

```mermaid
flowchart TD
    A[Client Request] --> B[MCP Platform]
    B --> C[Request Router]
    C --> D{Route Resolution}
    D -->|Direct Match| E[Target Server]
    D -->|Pattern Match| F[Rule-Based Routing]
    D -->|Fallback| G[Round-Robin Selection]
    F --> E
    G --> E
    B --> H[Server Registry]
    H --> I[Register / Deregister]
    H --> J[Capability Discovery]
    B --> K[Health Checker]
    K --> L{Health Status}
    L -->|Healthy| M[Active Pool]
    L -->|Degraded| N[Warning State]
    L -->|Unhealthy| O[Removed from Routing]
    B --> P[Metrics Endpoint]
    P --> Q[Request Stats]
    P --> R[Latency Tracking]
    P --> S[Server Status]

    style A fill:#4A90D9,stroke:#2E6BA6,color:#FFFFFF
    style B fill:#2ECC71,stroke:#27AE60,color:#FFFFFF
    style C fill:#F39C12,stroke:#E67E22,color:#FFFFFF
    style D fill:#9B59B6,stroke:#8E44AD,color:#FFFFFF
    style E fill:#1ABC9C,stroke:#16A085,color:#FFFFFF
    style F fill:#F39C12,stroke:#E67E22,color:#FFFFFF
    style G fill:#F39C12,stroke:#E67E22,color:#FFFFFF
    style H fill:#3498DB,stroke:#2980B9,color:#FFFFFF
    style I fill:#3498DB,stroke:#2980B9,color:#FFFFFF
    style J fill:#3498DB,stroke:#2980B9,color:#FFFFFF
    style K fill:#E74C3C,stroke:#C0392B,color:#FFFFFF
    style L fill:#9B59B6,stroke:#8E44AD,color:#FFFFFF
    style M fill:#2ECC71,stroke:#27AE60,color:#FFFFFF
    style N fill:#F1C40F,stroke:#F39C12,color:#333333
    style O fill:#E74C3C,stroke:#C0392B,color:#FFFFFF
    style P fill:#1ABC9C,stroke:#16A085,color:#FFFFFF
    style Q fill:#1ABC9C,stroke:#16A085,color:#FFFFFF
    style R fill:#1ABC9C,stroke:#16A085,color:#FFFFFF
    style S fill:#1ABC9C,stroke:#16A085,color:#FFFFFF
```

## Features

- **Server Registry** - Register and discover MCP servers with capability-based lookup
- **Request Routing** - Pattern-based routing with priority rules and fallback support
- **Health Monitoring** - Periodic health checks with automatic status management
- **Metrics Collection** - Track request counts, latency, and server availability
- **Docker Support** - Production-ready Dockerfile and docker-compose configuration

## Quick Start

### Using Bun

```bash
bun install
bun run dev
```

### Using Docker (Production)

```bash
docker-compose up -d
```

### Using Docker (Development)

```bash
# Create your local env file from the template
cp .env.example .env.dev

# Start with hot-reload
docker-compose -f docker-compose.dev.yml up --build
```

Source code is volume-mounted so changes to `src/` are picked up automatically via `bun run --watch`. A named volume is used for `node_modules` to avoid host overwrites.

## API Endpoints

| Method | Path       | Description                    |
|--------|-----------|--------------------------------|
| GET    | /health   | Platform health status         |
| GET    | /metrics  | Platform metrics               |
| GET    | /servers  | List registered servers        |
| POST   | /servers  | Register a new server          |
| POST   | /route    | Route a request to a server    |

## Configuration

| Environment Variable    | Default   | Description                     |
|------------------------|-----------|---------------------------------|
| MCP_PORT               | 3000      | Server port                     |
| MCP_HOST               | 0.0.0.0   | Server host                     |
| MCP_LOG_LEVEL          | info      | Log level                       |
| MCP_HEALTH_INTERVAL    | 30000     | Health check interval (ms)      |
| MCP_REQUEST_TIMEOUT    | 10000     | Request timeout (ms)            |
| MCP_MAX_RETRIES        | 3         | Max retry attempts              |

## License

MIT License - see [LICENSE](LICENSE) for details.
