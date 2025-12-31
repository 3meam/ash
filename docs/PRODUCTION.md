# ASH Protocol - Production Deployment Guide

## Prerequisites

- Node.js 18+ (LTS recommended)
- Redis or PostgreSQL for context storage
- HTTPS enabled
- Proper logging and monitoring

## Context Store Selection

### Redis (Recommended)

Best for: High throughput, horizontal scaling, automatic expiration.

```typescript
import Redis from 'ioredis';
import { RedisContextStore } from '@anthropic/ash-server';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
});

const store = new RedisContextStore({
  client: redis,
  keyPrefix: 'ash:ctx:',
});
```

**Benefits:**
- Lua script ensures atomic consume
- Automatic TTL-based expiration
- Cluster-safe

### PostgreSQL

Best for: Existing PostgreSQL infrastructure, audit requirements.

```typescript
import { Pool } from 'pg';
import { SqlContextStore } from '@anthropic/ash-server';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

const store = new SqlContextStore({
  query: (sql, params) => pool.query(sql, params),
  tableName: 'ash_contexts',
});

// Run cleanup periodically
setInterval(async () => {
  const removed = await store.cleanup();
  console.log(`Cleaned up ${removed} expired contexts`);
}, 60000); // Every minute
```

**Required migration:**
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
CREATE INDEX idx_ash_contexts_consumed ON ash_contexts(consumed_at) WHERE consumed_at IS NOT NULL;
```

## Configuration

### Environment Variables

```bash
# Store configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=secret

# OR for PostgreSQL
DATABASE_URL=postgres://user:pass@host:5432/dbname

# ASH configuration
ASH_DEFAULT_TTL_MS=30000
ASH_ENABLE_NONCE=true
```

### Express Setup

```typescript
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createContext, ashMiddleware, RedisContextStore } from '@anthropic/ash-server';

const app = express();

// Security middleware
app.use(helmet());
app.use(express.json({ limit: '1mb' }));

// Rate limit context issuance
const contextLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 100, // 100 contexts per minute per IP
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
});

// Context store
const store = new RedisContextStore({ client: redis });

// Context issuance endpoint
app.post('/ash/context', contextLimiter, async (req, res) => {
  try {
    const { binding } = req.body;

    if (!binding || typeof binding !== 'string') {
      return res.status(400).json({
        error: { code: 'INVALID_REQUEST', message: 'Binding required' },
      });
    }

    const context = await createContext(store, {
      binding,
      ttlMs: parseInt(process.env.ASH_DEFAULT_TTL_MS || '30000'),
      issueNonce: process.env.ASH_ENABLE_NONCE === 'true',
    });

    res.json(context);
  } catch (error) {
    console.error('Context creation failed:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create context' },
    });
  }
});

// Protected endpoints
app.post('/api/transfer',
  ashMiddleware(store, { expectedBinding: 'POST /api/transfer' }),
  transferHandler
);
```

## Monitoring

### Metrics to Track

```typescript
import { AshError, ReplayDetectedError, IntegrityFailedError } from '@anthropic/ash-server';

// Wrap verification with metrics
async function verifyWithMetrics(store, req, options) {
  const start = Date.now();

  try {
    await verifyRequest(store, req, options);
    metrics.increment('ash.verify.success');
    metrics.timing('ash.verify.duration', Date.now() - start);
  } catch (error) {
    if (error instanceof ReplayDetectedError) {
      metrics.increment('ash.verify.replay_detected');
      alerting.warn('Replay attack detected', { contextId: req.contextId });
    } else if (error instanceof IntegrityFailedError) {
      metrics.increment('ash.verify.integrity_failed');
      alerting.warn('Integrity check failed', { ip: req.ip });
    } else if (error instanceof AshError) {
      metrics.increment(`ash.verify.error.${error.code.toLowerCase()}`);
    }
    throw error;
  }
}
```

### Recommended Alerts

| Metric | Threshold | Severity |
|--------|-----------|----------|
| `ash.verify.replay_detected` | > 10/min | High |
| `ash.verify.integrity_failed` | > 5/min | High |
| `ash.verify.error.context_expired` | > 50% of requests | Medium |
| Context store latency | > 100ms p99 | Medium |

## Scaling

### Horizontal Scaling

ASH is designed for horizontal scaling:

```
                    ┌──────────────┐
                    │ Load Balancer│
                    └──────┬───────┘
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼─────┐  ┌──────▼─────┐  ┌──────▼─────┐
    │  Server 1  │  │  Server 2  │  │  Server 3  │
    └──────┬─────┘  └──────┬─────┘  └──────┬─────┘
           │               │               │
           └───────────────┼───────────────┘
                           │
                    ┌──────▼───────┐
                    │    Redis     │
                    │   Cluster    │
                    └──────────────┘
```

- Any server can issue contexts
- Any server can verify requests
- Redis/PostgreSQL provides shared state
- Atomic consume prevents race conditions

### Performance Tips

1. **Use connection pooling** for database stores
2. **Set appropriate TTL** (shorter = less storage)
3. **Run cleanup periodically** for SQL stores
4. **Monitor store latency** - it's in the critical path

## Health Checks

```typescript
app.get('/health', async (req, res) => {
  try {
    // Test store connectivity
    const testCtx = await createContext(store, {
      binding: 'GET /health',
      ttlMs: 1000,
    });
    await store.get(testCtx.contextId);

    res.json({ status: 'healthy', store: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});
```

## Checklist

- [ ] Using Redis or PostgreSQL (not MemoryContextStore)
- [ ] HTTPS enabled
- [ ] Rate limiting on context issuance
- [ ] Appropriate TTL configured (30-60 seconds)
- [ ] Monitoring and alerting set up
- [ ] Health checks implemented
- [ ] Database migrations applied (for SQL)
- [ ] Connection pooling configured
- [ ] Error logging without sensitive data
- [ ] `npm audit` shows no critical vulnerabilities
