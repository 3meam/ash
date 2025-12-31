/**
 * ASH Protocol Client SDK
 *
 * Browser and Node.js compatible client for ASH protocol.
 *
 * Ash was developed by 3maem Co. | شركة عمائم @ 12/31/2025
 *
 * @packageDocumentation
 * @module @anthropic/ash-client-web
 */

export {
  buildProof,
  createAshHeaders,
  ashFetch,
  canonicalizeJson,
  canonicalizeUrlEncoded,
  normalizeBinding,
  type AshFetchOptions,
  type AshMode,
  type ContextPublicInfo,
  type BuildProofInput,
} from './client.js';

// ============================================================
// ASH Namespace Export (Mandatory for brand visibility)
// Usage: import ash from '@anthropic/ash-client-web';
//        const proof = await ash.proof.build(input);
//        const response = await ash.fetch(url, options);
// ============================================================

import {
  buildProof,
  createAshHeaders,
  ashFetch,
  canonicalizeJson,
  canonicalizeUrlEncoded,
  normalizeBinding,
} from './client.js';

/**
 * ASH Client Namespace
 *
 * All ASH client functionality accessible via `ash.` prefix.
 *
 * @example
 * ```typescript
 * import ash from '@anthropic/ash-client-web';
 *
 * const ctx = await fetch('/ash/context').then(r => r.json());
 * const proof = await ash.proof.build({ context: ctx, payload, method: 'POST', path: '/api' });
 * const response = await ash.fetch('/api', { context: ctx, payload, method: 'POST', path: '/api' });
 * ```
 */
const ash = {
  /** Version of the ASH protocol */
  version: '1.0.0',

  /** Proof generation */
  proof: {
    /** Build a cryptographic proof */
    build: buildProof,
  },

  /** Create ASH headers for a request */
  createHeaders: createAshHeaders,

  /** Fetch wrapper with automatic ASH headers */
  fetch: ashFetch,

  /** Canonicalization functions */
  canonicalize: {
    /** Canonicalize JSON data */
    json: canonicalizeJson,
    /** Canonicalize URL-encoded data */
    urlEncoded: canonicalizeUrlEncoded,
    /** Normalize HTTP binding (method + path) */
    binding: normalizeBinding,
  },
} as const;

export default ash;
