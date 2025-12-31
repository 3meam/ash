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

// ============================================================
// ASH Namespace Export (Mandatory for brand visibility)
// Usage: import ash from '@anthropic/ash-core';
//        ash.canonicalize.json(data);
//        ash.proof.build(input);
// ============================================================

import {
  canonicalizeJson,
  canonicalizeUrlEncoded,
  normalizeBinding,
} from './canonicalize.js';
import { buildProof, base64UrlDecode } from './proof.js';
import { timingSafeCompare, timingSafeCompareBuffers } from './compare.js';
import {
  AshError,
  InvalidContextError,
  ContextExpiredError,
  ReplayDetectedError,
  IntegrityFailedError,
  EndpointMismatchError,
  UnsupportedContentTypeError,
  CanonicalizationError,
} from './errors.js';

/**
 * ASH Core Namespace
 *
 * All ASH functionality accessible via `ash.` prefix.
 *
 * @example
 * ```typescript
 * import ash from '@anthropic/ash-core';
 *
 * const canonical = ash.canonicalize.json({ name: 'test' });
 * const proof = await ash.proof.build({ ... });
 * const isEqual = ash.compare.safe(a, b);
 * ```
 */
const ash = {
  /** Version of the ASH protocol */
  version: '1.0.0',

  /** Canonicalization functions */
  canonicalize: {
    /** Canonicalize JSON data */
    json: canonicalizeJson,
    /** Canonicalize URL-encoded data */
    urlEncoded: canonicalizeUrlEncoded,
    /** Normalize HTTP binding (method + path) */
    binding: normalizeBinding,
  },

  /** Proof generation functions */
  proof: {
    /** Build a cryptographic proof */
    build: buildProof,
    /** Decode Base64URL string */
    decode: base64UrlDecode,
  },

  /** Secure comparison functions */
  compare: {
    /** Timing-safe string comparison */
    safe: timingSafeCompare,
    /** Timing-safe buffer comparison */
    safeBuffers: timingSafeCompareBuffers,
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
