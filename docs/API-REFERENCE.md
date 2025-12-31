# ASH Protocol - API Reference

## @anthropic/ash-core

Core canonicalization and proof generation.

### `canonicalizeJson(value: unknown): string`

Canonicalize a JSON value to a deterministic string.

**Rules:**
- Object keys sorted lexicographically
- Arrays preserve order
- Unicode NFC normalization
- Minified (no whitespace)
- Rejects: `NaN`, `Infinity`, `undefined`, functions, symbols, BigInt

```typescript
canonicalizeJson({ b: 2, a: 1 });
// Returns: '{"a":1,"b":2}'

canonicalizeJson({ name: "café" });
// Returns: '{"name":"café"}' (NFC normalized)
```

### `canonicalizeUrlEncoded(input: string | Record<string, string | string[]>): string`

Canonicalize URL-encoded form data.

**Rules:**
- Keys sorted lexicographically
- Duplicate keys preserve value order
- `+` decoded as space
- Unicode NFC after decoding

```typescript
canonicalizeUrlEncoded('b=2&a=1');
// Returns: 'a=1&b=2'

canonicalizeUrlEncoded({ colors: ['red', 'blue'], name: 'test' });
// Returns: 'colors=red&colors=blue&name=test'
```

### `normalizeBinding(method: string, path: string): string`

Normalize HTTP binding string.

**Rules:**
- Method uppercased
- Query string stripped
- Fragment stripped
- Duplicate slashes collapsed
- Trailing slash removed (except root)

```typescript
normalizeBinding('post', '/api/test?foo=bar');
// Returns: 'POST /api/test'

normalizeBinding('GET', '/api//users///123/');
// Returns: 'GET /api/users/123'
```

### `buildProof(input: BuildProofInput): string`

Generate SHA-256 proof (Base64URL encoded).

```typescript
interface BuildProofInput {
  mode: 'minimal' | 'balanced' | 'strict';
  binding: string;
  contextId: string;
  nonce?: string;
  canonicalPayload: string;
}

const proof = buildProof({
  mode: 'balanced',
  binding: 'POST /api/transfer',
  contextId: 'ctx-abc-123',
  nonce: 'server-nonce',
  canonicalPayload: '{"amount":100}',
});
```

### `timingSafeCompare(a: string, b: string): boolean`

Constant-time string comparison (prevents timing attacks).

---

## @anthropic/ash-server

Server SDK with context management and middleware.

### Context Stores

#### `MemoryContextStore`

In-memory store for development/testing only.

```typescript
const store = new MemoryContextStore({
  suppressWarning: true, // Suppress production warning
});

// Methods
await store.put(context);
await store.get(contextId);
await store.consume(contextId, Date.now());
await store.cleanup(); // Remove expired contexts
```

#### `RedisContextStore`

Production-ready Redis store with atomic operations.

```typescript
import Redis from 'ioredis';

const redis = new Redis();
const store = new RedisContextStore({
  client: redis,
  keyPrefix: 'ash:ctx:', // Optional, default shown
});
```

#### `SqlContextStore`

Production-ready SQL store (PostgreSQL, MySQL, SQLite).

```typescript
import { Pool } from 'pg';

const pool = new Pool();
const store = new SqlContextStore({
  query: (sql, params) => pool.query(sql, params),
  tableName: 'ash_contexts', // Optional, default shown
});
```

**Required table schema:**
```sql
CREATE TABLE ash_contexts (
  context_id VARCHAR(64) PRIMARY KEY,
  binding VARCHAR(255) NOT NULL,
  mode VARCHAR(20) NOT NULL,
  issued_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL,
  nonce VARCHAR(64),
  consumed_at BIGINT
);

CREATE INDEX idx_ash_contexts_expires ON ash_contexts(expires_at);
```

### `createContext(store, options): Promise<ContextPublicInfo>`

Create a new verification context.

```typescript
interface CreateContextOptions {
  binding: string;      // e.g., "POST /api/transfer"
  ttlMs: number;        // Time-to-live in milliseconds
  mode?: AshMode;       // 'minimal' | 'balanced' | 'strict' (default: 'balanced')
  issueNonce?: boolean; // Enable server-assisted mode
}

const context = await createContext(store, {
  binding: 'POST /api/transfer',
  ttlMs: 30000,
  issueNonce: true,
});

// Returns:
// {
//   contextId: "abc123...",
//   expiresAt: 1704067230000,
//   mode: "balanced",
//   nonce: "xyz789..."  // Only if issueNonce: true
// }
```

### `verifyRequest(store, request, options): Promise<void>`

Verify a request against ASH protocol. Throws on failure.

```typescript
interface VerifyOptions {
  expectedBinding: string;
  contentType: 'application/json' | 'application/x-www-form-urlencoded';
  extractContextId: (req: unknown) => string;
  extractProof: (req: unknown) => string;
  extractPayload: (req: unknown) => unknown;
}

try {
  await verifyRequest(store, req, options);
  // Verification passed
} catch (error) {
  if (error instanceof AshError) {
    // Handle specific error
  }
}
```

### Express Middleware

#### `ashMiddleware(store, options)`

```typescript
app.post('/api/endpoint',
  ashMiddleware(store, {
    expectedBinding: 'POST /api/endpoint',
    contentType: 'application/json',        // Optional, default shown
    contextIdHeader: 'x-ash-context-id',    // Optional, default shown
    proofHeader: 'x-ash-proof',             // Optional, default shown
  }),
  handler
);
```

#### `ashErrorHandler()`

```typescript
app.use(ashErrorHandler());
```

### Fastify Plugin

```typescript
await fastify.register(ashPlugin, { store });

fastify.post('/api/endpoint', {
  preHandler: fastify.ashVerify({
    expectedBinding: 'POST /api/endpoint',
  }),
}, handler);
```

---

## @anthropic/ash-client-web

Browser and Node.js client SDK.

### `ashFetch(url, options): Promise<Response>`

Make an ASH-protected fetch request.

```typescript
interface AshFetchOptions {
  context: ContextPublicInfo;
  payload: unknown;
  method: string;
  path: string;
  contextIdHeader?: string;  // Default: 'X-ASH-Context-Id'
  proofHeader?: string;      // Default: 'X-ASH-Proof'
  fetchOptions?: RequestInit;
}

const response = await ashFetch('/api/transfer', {
  context,
  payload: { amount: 100 },
  method: 'POST',
  path: '/api/transfer',
});
```

### `createAshHeaders(options): Promise<Record<string, string>>`

Create ASH headers without making a request.

```typescript
const headers = await createAshHeaders({
  context,
  payload: { amount: 100 },
  method: 'POST',
  path: '/api/transfer',
});

// Returns:
// {
//   'X-ASH-Context-Id': 'abc123...',
//   'X-ASH-Proof': 'xyz789...',
//   'Content-Type': 'application/json'
// }
```

### `buildProof(input): Promise<string>`

Build proof using Web Crypto API (browser) or Node crypto.

```typescript
const proof = await buildProof({
  mode: 'balanced',
  binding: 'POST /api/transfer',
  contextId: 'ctx-123',
  nonce: 'server-nonce',
  canonicalPayload: '{"amount":100}',
});
```

---

## Types

```typescript
type AshMode = 'minimal' | 'balanced' | 'strict';

type AshErrorCode =
  | 'INVALID_CONTEXT'
  | 'CONTEXT_EXPIRED'
  | 'REPLAY_DETECTED'
  | 'INTEGRITY_FAILED'
  | 'ENDPOINT_MISMATCH'
  | 'UNSUPPORTED_CONTENT_TYPE'
  | 'CANONICALIZATION_ERROR'
  | 'INTERNAL_ERROR';

interface StoredContext {
  contextId: string;
  binding: string;
  mode: AshMode;
  issuedAt: number;
  expiresAt: number;
  nonce?: string;
  consumedAt: number | null;
}

interface ContextPublicInfo {
  contextId: string;
  expiresAt: number;
  mode: AshMode;
  nonce?: string;
}
```
