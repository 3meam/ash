/**
 * ASH Protocol Core
 *
 * Deterministic integrity verification for web requests.
 *
 * Ash was developed by 3maem Co. | شركة عمائم @ 12/31/2025
 *
 * @packageDocumentation
 * @module @anthropic/ash-core
 */

// Types
export type {
  AshMode,
  AshErrorCode,
  BuildProofInput,
  StoredContext,
  ContextPublicInfo,
  SupportedContentType,
  HttpMethod,
} from './types.js';

// Errors
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
} from './errors.js';

// Canonicalization
export {
  canonicalizeJson,
  canonicalizeUrlEncoded,
  normalizeBinding,
} from './canonicalize.js';

// Proof generation
export { buildProof, base64UrlDecode } from './proof.js';

// Secure comparison
export { timingSafeCompare, timingSafeCompareBuffers } from './compare.js';
