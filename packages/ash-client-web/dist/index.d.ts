import { BuildProofInput, ContextPublicInfo } from '@anthropic/ash-core';
export { AshMode, BuildProofInput, ContextPublicInfo, canonicalizeJson, canonicalizeUrlEncoded, normalizeBinding } from '@anthropic/ash-core';

/**
 * ASH Client SDK
 *
 * Browser and Node.js compatible client for ASH protocol.
 *
 * @module @anthropic/ash-client-web
 */

/**
 * Build a proof for the given inputs.
 * Automatically uses Web Crypto API in browsers, Node crypto in Node.js.
 *
 * @param input - Proof input parameters
 * @returns Promise resolving to Base64URL encoded proof
 */
declare function buildProof(input: BuildProofInput): Promise<string>;
/**
 * Options for ASH-protected fetch request.
 */
interface AshFetchOptions {
    /** Server-issued context */
    context: ContextPublicInfo;
    /** Request payload (will be canonicalized) */
    payload: unknown;
    /** HTTP method */
    method: string;
    /** Request path (for binding) */
    path: string;
    /** Header name for context ID (default: 'X-ASH-Context-Id') */
    contextIdHeader?: string;
    /** Header name for proof (default: 'X-ASH-Proof') */
    proofHeader?: string;
    /** Additional fetch options */
    fetchOptions?: RequestInit;
}
/**
 * Create headers for an ASH-protected request.
 *
 * @param options - Request options
 * @returns Headers to include in the request
 */
declare function createAshHeaders(options: AshFetchOptions): Promise<Record<string, string>>;
/**
 * Make an ASH-protected fetch request.
 *
 * @param url - Request URL
 * @param options - ASH fetch options
 * @returns Fetch response
 *
 * @example
 * ```typescript
 * // Get context from server
 * const ctx = await fetch('/ash/context', { method: 'POST' }).then(r => r.json());
 *
 * // Make protected request
 * const response = await ashFetch('/api/profile/update', {
 *   context: ctx,
 *   payload: { name: 'John' },
 *   method: 'POST',
 *   path: '/api/profile/update'
 * });
 * ```
 */
declare function ashFetch(url: string, options: AshFetchOptions): Promise<Response>;

export { type AshFetchOptions, ashFetch, buildProof, createAshHeaders };
