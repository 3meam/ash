# ASH Protocol - Quick Start Guide

Get up and running with ASH in 5 minutes.

## Installation

```bash
# Server package (Express/Fastify)
npm install @anthropic/ash-server

# Client package (Browser/Node)
npm install @anthropic/ash-client-web
```

## Basic Setup

### 1. Server Setup (Express.js)

```typescript
import express from 'express';
import {
  createContext,
  ashMiddleware,
  MemoryContextStore,  // Use RedisContextStore in production!
} from '@anthropic/ash-server';

const app = express();
app.use(express.json());

// Create a context store
const store = new MemoryContextStore();

// Endpoint to issue contexts
app.post('/ash/context', async (req, res) => {
  const { binding } = req.body;

  const context = await createContext(store, {
    binding,           // e.g., "POST /api/transfer"
    ttlMs: 30000,      // 30 seconds
    issueNonce: true,  // Optional: server-assisted mode
  });

  res.json(context);
});

// Protected endpoint with ASH verification
app.post('/api/transfer',
  ashMiddleware(store, {
    expectedBinding: 'POST /api/transfer',
    contentType: 'application/json',
  }),
  (req, res) => {
    // Request verified! Safe to process
    const { amount, recipient } = req.body;
    res.json({ success: true, transferred: amount });
  }
);

app.listen(3000);
```

### 2. Client Setup (Browser)

```typescript
import { ashFetch, createAshHeaders } from '@anthropic/ash-client-web';

async function makeProtectedRequest(payload) {
  // Step 1: Get context from server
  const contextResponse = await fetch('/ash/context', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ binding: 'POST /api/transfer' }),
  });
  const context = await contextResponse.json();

  // Step 2: Make protected request with ashFetch
  const response = await ashFetch('/api/transfer', {
    context,
    payload,
    method: 'POST',
    path: '/api/transfer',
  });

  return response.json();
}

// Usage
const result = await makeProtectedRequest({
  amount: 100,
  recipient: 'user@example.com',
});
```

## Alternative: Manual Header Creation

If you need more control:

```typescript
import { createAshHeaders } from '@anthropic/ash-client-web';

const headers = await createAshHeaders({
  context,
  payload: { amount: 100 },
  method: 'POST',
  path: '/api/transfer',
});

// Headers now contains:
// - X-ASH-Context-Id
// - X-ASH-Proof
// - Content-Type

const response = await fetch('/api/transfer', {
  method: 'POST',
  headers,
  body: JSON.stringify({ amount: 100 }),
});
```

## Fastify Setup

```typescript
import Fastify from 'fastify';
import { ashPlugin, createContext, MemoryContextStore } from '@anthropic/ash-server';

const fastify = Fastify();
const store = new MemoryContextStore();

// Register ASH plugin
await fastify.register(ashPlugin, { store });

// Issue context
fastify.post('/ash/context', async (request, reply) => {
  const context = await createContext(store, {
    binding: 'POST /api/transfer',
    ttlMs: 30000,
  });
  return context;
});

// Protected endpoint
fastify.post('/api/transfer', {
  preHandler: fastify.ashVerify({
    expectedBinding: 'POST /api/transfer',
  }),
}, async (request, reply) => {
  return { success: true };
});

await fastify.listen({ port: 3000 });
```

## Production Checklist

- [ ] Use `RedisContextStore` or `SqlContextStore` instead of `MemoryContextStore`
- [ ] Set appropriate TTL (recommended: 30-60 seconds)
- [ ] Enable HTTPS
- [ ] Consider rate limiting context issuance
- [ ] Monitor for replay attack attempts (REPLAY_DETECTED errors)

## Next Steps

- [API Reference](./API-REFERENCE.md) - Full API documentation
- [Security Guide](./SECURITY.md) - Security best practices
- [Error Codes](./ERROR-CODES.md) - Handle errors gracefully
- [Production Deployment](./PRODUCTION.md) - Production setup guide
