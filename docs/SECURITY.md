# ASH Protocol - Security Guide

## Threat Model

ASH protects against the following threats:

| Threat | Protection | How |
|--------|------------|-----|
| **Payload Tampering** | Yes | SHA-256 proof covers entire payload |
| **Replay Attacks** | Yes | One-time context consumption |
| **Endpoint Confusion** | Yes | Binding ties context to specific endpoint |
| **Timing Attacks** | Yes | Constant-time proof comparison |
| **Predictable Context IDs** | Yes | CSPRNG (128-bit) for IDs and nonces |

## What ASH Does NOT Protect

- **Authentication** - ASH verifies request integrity, not user identity
- **Authorization** - Combine with proper access control
- **Transport Security** - Always use HTTPS
- **Denial of Service** - Implement rate limiting separately

## Security Best Practices

### 1. Use Production-Ready Stores

```typescript
// BAD - Not safe for production
const store = new MemoryContextStore();

// GOOD - Atomic operations across instances
const store = new RedisContextStore({ client: redis });
// OR
const store = new SqlContextStore({ query: pool.query });
```

### 2. Set Appropriate TTL

```typescript
// BAD - Too long, increases replay window
const ctx = await createContext(store, {
  ttlMs: 3600000, // 1 hour
});

// GOOD - Short-lived contexts
const ctx = await createContext(store, {
  ttlMs: 30000, // 30 seconds
});
```

### 3. Use Server-Assisted Mode for Sensitive Operations

```typescript
// For high-value operations, use nonces
const ctx = await createContext(store, {
  binding: 'POST /api/transfer',
  ttlMs: 30000,
  issueNonce: true, // Server issues nonce
});
```

### 4. Validate Binding Carefully

```typescript
// Ensure binding matches exactly
app.post('/api/transfer',
  ashMiddleware(store, {
    expectedBinding: 'POST /api/transfer', // Must match context binding
  }),
  handler
);
```

### 5. Don't Log Sensitive Data

```typescript
// BAD - Leaks secrets
console.log('Context:', context);
console.log('Proof:', proof);

// GOOD - Log only safe identifiers
console.log('Context ID:', context.contextId);
console.log('Request verified successfully');
```

### 6. Handle Errors Safely

```typescript
// Errors don't leak internal details
catch (error) {
  if (error instanceof AshError) {
    // Safe to return to client
    res.status(error.httpStatus).json({
      code: error.code,
      message: error.message,
    });
  }
}
```

## Constant-Time Comparison

ASH uses constant-time comparison for proofs to prevent timing attacks:

```typescript
// Internal implementation uses Node's crypto.timingSafeEqual
import { timingSafeCompare } from '@anthropic/ash-core';

// Safe comparison - takes same time regardless of where mismatch occurs
const isValid = timingSafeCompare(expectedProof, providedProof);
```

## Context ID Security

Context IDs are generated using CSPRNG:

```typescript
// 128-bit random ID (base64url encoded)
const contextId = randomBytes(16).toString('base64url');
// Example: "Ks7JpL2mN4oP1qR3sT5uVw"
```

## Atomic Consume

The consume operation MUST be atomic to prevent replay attacks:

### Redis (Lua Script)
```lua
local ctx = redis.call('GET', key)
if ctx.consumedAt then return 0 end  -- Already consumed
ctx.consumedAt = nowMs
redis.call('SET', key, ctx)
return 1  -- Consumed
```

### SQL (Atomic UPDATE)
```sql
UPDATE ash_contexts
SET consumed_at = $1
WHERE context_id = $2 AND consumed_at IS NULL
```

## Security Checklist

- [ ] Using HTTPS in production
- [ ] Using RedisContextStore or SqlContextStore (not Memory)
- [ ] TTL is appropriate (30-60 seconds recommended)
- [ ] Not logging proofs, payloads, or context details
- [ ] Rate limiting context issuance
- [ ] Monitoring for REPLAY_DETECTED errors
- [ ] Error messages don't leak internal details
- [ ] Dependencies are up to date (`npm audit`)

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it privately to the security team. Do not open a public issue.
