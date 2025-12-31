# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-31

### Added

#### @anthropic/ash-core
- `canonicalizeJson()` - Deterministic JSON canonicalization with lexicographic key ordering
- `canonicalizeUrlEncoded()` - URL-encoded form data canonicalization
- `normalizeBinding()` - HTTP method + path normalization
- `buildProof()` - SHA-256 proof generation with Base64URL encoding
- `timingSafeCompare()` - Constant-time string comparison
- Error classes: `InvalidContextError`, `ContextExpiredError`, `ReplayDetectedError`, `IntegrityFailedError`, `EndpointMismatchError`, `UnsupportedContentTypeError`, `CanonicalizationError`
- TypeScript type definitions

#### @anthropic/ash-server
- `ContextStore` interface with atomic consume support
- `MemoryContextStore` - In-memory store for development/testing
- `RedisContextStore` - Production Redis store with Lua script for atomic consume
- `SqlContextStore` - Production SQL store (PostgreSQL, MySQL, SQLite)
- `createContext()` - Server-side context issuance
- `verifyRequest()` - 8-step fail-closed verification pipeline
- `ashMiddleware()` - Express.js middleware
- `ashPlugin` - Fastify plugin with `ashVerify` decorator
- `ashErrorHandler()` - Express error handling middleware

#### @anthropic/ash-client-web
- `buildProof()` - Browser (Web Crypto API) and Node.js compatible proof generation
- `createAshHeaders()` - Generate ASH request headers
- `ashFetch()` - Fetch wrapper with automatic ASH header injection
- Re-exports of core canonicalization functions

#### Examples
- `examples/express-demo` - Complete Express.js demo with tamper/replay detection

#### Documentation
- README.md - Project overview and quick start
- docs/QUICKSTART.md - 5-minute getting started guide
- docs/API-REFERENCE.md - Full API documentation
- docs/SECURITY.md - Security best practices
- docs/ERROR-CODES.md - Error handling guide
- docs/PRODUCTION.md - Production deployment guide

### Security
- Context IDs generated with CSPRNG (128-bit)
- Proofs compared with constant-time algorithm
- Atomic consume prevents replay attacks
- Error messages don't leak internal details
- No payload/proof data in logs

### Testing
- 180 total tests across all packages
  - ash-core: 134 tests
  - ash-server: 31 tests
  - ash-client-web: 15 tests
- Test vectors for canonicalization, proof generation, and binding normalization

### Infrastructure
- Monorepo structure with npm workspaces
- TypeScript with strict mode
- ESM and CommonJS dual builds
- TypeScript declaration files
- Vitest for testing
