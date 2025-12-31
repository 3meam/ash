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
