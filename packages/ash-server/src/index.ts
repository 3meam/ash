/**
 * ASH Protocol Server SDK
 *
 * Server-side context management and request verification.
 *
 * Ash was developed by 3maem Co. | شركة عمائم @ 12/31/2025
 *
 * @packageDocumentation
 * @module @anthropic/ash-server
 */

// Re-export core types and errors
export type {
  AshMode,
  AshErrorCode,
  StoredContext,
  ContextPublicInfo,
  SupportedContentType,
} from '@anthropic/ash-core';

export {
  AshError,
  InvalidContextError,
  ContextExpiredError,
  ReplayDetectedError,
  IntegrityFailedError,
  EndpointMismatchError,
  UnsupportedContentTypeError,
  CanonicalizationError,
  ASH_ERROR_HTTP_STATUS,
  ASH_ERROR_MESSAGES,
} from '@anthropic/ash-core';

// Server types
export type {
  CreateContextOptions,
  VerifyOptions,
  ConsumeResult,
  ContextStore,
  ExpressRequest,
  ExpressResponse,
  ExpressNextFunction,
  ExpressMiddlewareOptions,
} from './types.js';

// Context management
export { createContext, createContextManager } from './context.js';

// Request verification
export { verifyRequest, createVerifier } from './verify.js';

// Middleware
export { ashMiddleware, ashErrorHandler, ashPlugin, type AshFastifyPluginOptions } from './middleware/index.js';

// Context stores
export {
  MemoryContextStore,
  RedisContextStore,
  SqlContextStore,
  type RedisClient,
  type RedisContextStoreOptions,
  type SqlQuery,
  type SqlContextStoreOptions,
} from './stores/index.js';

// ============================================================
// ASH Namespace Export (Mandatory for brand visibility)
// Usage: import ash from '@anthropic/ash-server';
//        await ash.context.create(store, options);
//        await ash.verify(store, req, options);
// ============================================================

import { createContext, createContextManager } from './context.js';
import { verifyRequest, createVerifier } from './verify.js';
import { ashMiddleware, ashErrorHandler, ashPlugin } from './middleware/index.js';
import {
  MemoryContextStore,
  RedisContextStore,
  SqlContextStore,
} from './stores/index.js';
import {
  AshError,
  InvalidContextError,
  ContextExpiredError,
  ReplayDetectedError,
  IntegrityFailedError,
  EndpointMismatchError,
  UnsupportedContentTypeError,
  CanonicalizationError,
} from '@anthropic/ash-core';

/**
 * ASH Server Namespace
 *
 * All ASH server functionality accessible via `ash.` prefix.
 *
 * @example
 * ```typescript
 * import ash from '@anthropic/ash-server';
 *
 * const store = new ash.stores.Memory();
 * const ctx = await ash.context.create(store, { binding: 'POST /api', ttlMs: 30000 });
 * await ash.verify(store, req, { expectedBinding: 'POST /api' });
 * ```
 */
const ash = {
  /** Version of the ASH protocol */
  version: '1.0.0',

  /** Context management */
  context: {
    /** Create a new context */
    create: createContext,
    /** Create a context manager */
    createManager: createContextManager,
  },

  /** Verify a request */
  verify: verifyRequest,

  /** Create a reusable verifier */
  createVerifier: createVerifier,

  /** Middleware for web frameworks */
  middleware: {
    /** Express.js middleware */
    express: ashMiddleware,
    /** Express.js error handler */
    expressErrorHandler: ashErrorHandler,
    /** Fastify plugin */
    fastify: ashPlugin,
  },

  /** Context stores */
  stores: {
    /** In-memory store (development only) */
    Memory: MemoryContextStore,
    /** Redis store (production) */
    Redis: RedisContextStore,
    /** SQL store (production) */
    Sql: SqlContextStore,
  },

  /** Error classes */
  errors: {
    AshError,
    InvalidContextError,
    ContextExpiredError,
    ReplayDetectedError,
    IntegrityFailedError,
    EndpointMismatchError,
    UnsupportedContentTypeError,
    CanonicalizationError,
  },
} as const;

export default ash;
