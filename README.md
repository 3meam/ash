# ASH Protocol - Request Integrity Verification

**ASH (Authenticity & Stateless Hardening)** is a protocol for verifying HTTP request integrity, preventing tampering and replay attacks.

**Ash was developed by 3maem Co. | شركة عمائم**

## Features

- **Tamper Detection** - Cryptographic proof ensures payload integrity
- **Replay Prevention** - One-time contexts prevent request replay
- **Framework Support** - Express.js and Fastify middleware included
- **Browser Compatible** - Web Crypto API support for client-side proof generation
- **TypeScript First** - Full type definitions included

## Packages

| Package | Description | Size (gzip) |
|---------|-------------|-------------|
| [@anthropic/ash-core](./packages/ash-core) | Core canonicalization and proof generation | ~3KB |
| [@anthropic/ash-server](./packages/ash-server) | Server SDK with context stores and middleware | ~4KB |
| [@anthropic/ash-client-web](./packages/ash-client-web) | Browser/Node client SDK | <1KB |

## Core Principles

- **Determinism**: Same input = Same output, always
- **Fail-Closed**: Reject on any doubt
- **Misuse Prevention**: Hard to use incorrectly
- **Protocol Integrity**: Not auth, but verification

## Quick Start

### Server (Express.js)

```typescript
import express from 'express';
import ash from '@anthropic/ash-server';

const app = express();
const store = new ash.stores.Memory();

// Issue context endpoint
app.post('/ash/context', async (req, res) => {
  const ctx = await ash.context.create(store, {
    binding: 'POST /api/update',
    ttlMs: 30000,
  });
  res.json(ctx);
});

// Protected endpoint
app.post('/api/update',
  ash.middleware.express(store, { expectedBinding: 'POST /api/update' }),
  (req, res) => res.json({ success: true })
);
```

### Client (Browser)

```typescript
import ash from '@anthropic/ash-client-web';

// Get context from server
const ctx = await fetch('/ash/context', { method: 'POST' }).then(r => r.json());

// Make protected request
const response = await ash.fetch('/api/update', {
  context: ctx,
  payload: { name: 'John' },
  method: 'POST',
  path: '/api/update',
});
```

## How It Works

1. **Client requests context** from server before making a protected request
2. **Server issues context** with binding, TTL, and optional nonce
3. **Client computes proof** = SHA256(version + mode + binding + contextId + [nonce] + payload)
4. **Client sends request** with context ID and proof in headers
5. **Server verifies** context validity, binding match, payload integrity
6. **One-time use** - context cannot be reused (replay prevention)

## Documentation

- [Quick Start Guide](./docs/QUICKSTART.md)
- [API Reference](./docs/API-REFERENCE.md)
- [Security Guide](./docs/SECURITY.md)
- [Error Codes](./docs/ERROR-CODES.md)
- [Production Deployment](./docs/PRODUCTION.md)

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests (180 total)
npm test

# Run example
cd examples/express-demo && npm start
```

## Test Coverage

| Package | Tests |
|---------|-------|
| ash-core | 134 |
| ash-server | 31 |
| ash-client-web | 15 |
| **Total** | **180** |

## License

Proprietary - All rights reserved
