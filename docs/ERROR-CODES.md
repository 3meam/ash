# ASH Protocol - Error Codes

**Ash was developed by 3maem Co. | شركة عمائم**

All ASH errors extend `AshError` and include an error code, message, and HTTP status.

## Error Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_CONTEXT` | 400 | Context ID not found or invalid |
| `CONTEXT_EXPIRED` | 400 | Context TTL has passed |
| `REPLAY_DETECTED` | 400 | Context already consumed |
| `INTEGRITY_FAILED` | 400 | Proof doesn't match payload |
| `ENDPOINT_MISMATCH` | 400 | Request binding doesn't match context |
| `UNSUPPORTED_CONTENT_TYPE` | 400 | Content type not supported |
| `CANONICALIZATION_ERROR` | 400 | Payload cannot be canonicalized |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## Error Classes

### InvalidContextError
```typescript
throw new ash.errors.InvalidContextError();
// code: 'INVALID_CONTEXT'
// message: 'Invalid or missing context'
// httpStatus: 400
```

**Causes:**
- Context ID not provided in request headers
- Context ID not found in store
- Context was deleted (race condition)

### ContextExpiredError
```typescript
throw new ash.errors.ContextExpiredError();
// code: 'CONTEXT_EXPIRED'
// message: 'Context has expired'
// httpStatus: 400
```

**Causes:**
- Current time > context.expiresAt
- TTL was too short for request latency

### ReplayDetectedError
```typescript
throw new ash.errors.ReplayDetectedError();
// code: 'REPLAY_DETECTED'
// message: 'Context has already been used'
// httpStatus: 400
```

**Causes:**
- Same context ID used twice (potential attack)
- Client retry sent same context
- Network duplicate

### IntegrityFailedError
```typescript
throw new ash.errors.IntegrityFailedError();
// code: 'INTEGRITY_FAILED'
// message: 'Request integrity verification failed'
// httpStatus: 400
```

**Causes:**
- Payload was modified after proof was computed
- Wrong proof provided
- Man-in-the-middle tampering

### EndpointMismatchError
```typescript
throw new ash.errors.EndpointMismatchError();
// code: 'ENDPOINT_MISMATCH'
// message: 'Request endpoint does not match context binding'
// httpStatus: 400
```

**Causes:**
- Context created for different endpoint
- Binding string doesn't match exactly
- Method or path differs

### UnsupportedContentTypeError
```typescript
throw new ash.errors.UnsupportedContentTypeError('Details');
// code: 'UNSUPPORTED_CONTENT_TYPE'
// message: 'Unsupported content type: Details'
// httpStatus: 400
```

**Causes:**
- Content type not `application/json` or `application/x-www-form-urlencoded`
- Custom content type handler needed

### CanonicalizationError
```typescript
throw new ash.errors.CanonicalizationError('NaN not allowed');
// code: 'CANONICALIZATION_ERROR'
// message: 'Canonicalization failed: NaN not allowed'
// httpStatus: 400
```

**Causes:**
- Payload contains `NaN`, `Infinity`, or `undefined`
- Payload contains functions or symbols
- Invalid data structure

## Handling Errors

### Server-Side (Express)

```typescript
import ash from '@anthropic/ash-server';

app.post('/api/endpoint',
  ash.middleware.express(store, options),
  (req, res) => {
    // Success path
  }
);

// Errors are automatically handled by middleware
// Returns: { error: { code, message } }
```

### Server-Side (Custom)

```typescript
import ash from '@anthropic/ash-server';

try {
  await ash.verify(store, req, options);
} catch (error) {
  if (error instanceof ash.errors.ReplayDetectedError) {
    // Log potential attack
    logger.warn('Replay attack detected', { contextId });
  }

  if (error instanceof ash.errors.AshError) {
    return res.status(error.httpStatus).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  // Unknown error
  throw error;
}
```

### Client-Side

```typescript
import ash from '@anthropic/ash-client-web';

const response = await ash.fetch('/api/endpoint', options);

if (!response.ok) {
  const error = await response.json();

  switch (error.error.code) {
    case 'CONTEXT_EXPIRED':
      // Get new context and retry
      break;
    case 'REPLAY_DETECTED':
      // Context was already used, get new one
      break;
    case 'INTEGRITY_FAILED':
      // Possible tampering, investigate
      break;
    default:
      // Handle other errors
  }
}
```

## Monitoring Recommendations

Track these error codes for security monitoring:

| Code | Alert Level | Action |
|------|-------------|--------|
| `REPLAY_DETECTED` | High | Investigate potential attack |
| `INTEGRITY_FAILED` | High | Check for MITM or tampering |
| `ENDPOINT_MISMATCH` | Medium | Possible misuse or attack |
| `CONTEXT_EXPIRED` | Low | Consider increasing TTL |
| `INVALID_CONTEXT` | Low | Normal for expired cleanup |
