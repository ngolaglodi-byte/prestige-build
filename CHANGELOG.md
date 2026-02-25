# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-02-25

### Added

- **AI Code Generation** — Multi-provider support (OpenAI GPT-4, Anthropic Claude, Google Gemini) with automatic fallback.
- **Code Editor** — Integrated Monaco Editor with live preview (Sandpack).
- **Project Management** — Create, build, deploy, and manage files.
- **Teams** — Multi-user collaboration with role management.
- **Templates** — Reusable template library.
- **Billing** — Credit and subscription system.
- **API Keys** — Key management and usage tracking.
- **Webhooks** — Event system with automatic retry.
- **Admin Panel** — Full administration dashboard.
- **Rate Limiting** — Redis-backed (Upstash) rate limiter with in-memory fallback.
- **CI Pipeline** — GitHub Actions: lint, security audit (`npm audit`), build, unit tests (Vitest), E2E tests (Playwright).
- **CD Pipeline** — Automated staging → production deployment via Vercel with smoke tests.
- **Documentation** — CONTRIBUTING.md, deployment guide, ADR records.
- **Unit Tests** — ≥ 80% code coverage with Vitest.
- **Structured Logging** — Pino logger with JSON output.
- **Error Monitoring** — Sentry integration.
- **Docker** — Dockerfile and Docker Compose for local development and production.
