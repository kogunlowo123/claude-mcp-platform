# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-15

### Added

- Initial release of MCP Platform Orchestrator
- Server registry with capability-based discovery
- Request router with pattern matching and priority rules
- Health checker with configurable intervals
- Platform metrics endpoint
- REST API for server management and request routing
- Docker and docker-compose support
- Environment-based configuration
- Automatic stale server pruning
- Retry logic with configurable max attempts
- Round-robin fallback routing for unmatched requests
