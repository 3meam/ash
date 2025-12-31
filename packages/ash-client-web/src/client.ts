/**
 * ASH Client SDK
 *
 * Browser and Node.js compatible client for ASH protocol.
 *
 * @module @anthropic/ash-client-web
 */

import {
  canonicalizeJson,
  canonicalizeUrlEncoded,
  normalizeBinding,
} from '@anthropic/ash-core';
import type { AshMode, ContextPublicInfo, BuildProofInput } from '@anthropic/ash-core';

/** ASH protocol version prefix */
const ASH_VERSION_PREFIX = 'ASHv1';

/**
 * Build proof in browser environment using Web Crypto API.
 */
async function buildProofBrowser(input: BuildProofInput): Promise<string> {
  const { mode, binding, contextId, nonce, canonicalPayload } = input;

  // Build the proof input string
  let proofInput = `${ASH_VERSION_PREFIX}\n${mode}\n${binding}\n${contextId}\n`;
  if (nonce !== undefined && nonce !== '') {
    proofInput += `${nonce}\n`;
  }
  proofInput += canonicalPayload;

  // Encode to bytes
  const encoder = new TextEncoder();
  const data = encoder.encode(proofInput);

  // Compute SHA-256 using Web Crypto API
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // Convert to Base64URL
  return base64UrlEncode(new Uint8Array(hashBuffer));
}

/**
 * Build proof in Node.js environment using crypto module.
 */
async function buildProofNode(input: BuildProofInput): Promise<string> {
  // Dynamic import to avoid bundling issues
  const { createHash } = await import('crypto');

  const { mode, binding, contextId, nonce, canonicalPayload } = input;

  let proofInput = `${ASH_VERSION_PREFIX}\n${mode}\n${binding}\n${contextId}\n`;
  if (nonce !== undefined && nonce !== '') {
    proofInput += `${nonce}\n`;
  }
  proofInput += canonicalPayload;

  const hash = createHash('sha256').update(proofInput, 'utf8').digest();

  return hash
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Encode Uint8Array to Base64URL (no padding).
 */
function base64UrlEncode(bytes: Uint8Array): string {
  // Convert to binary string
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }

  // Encode to Base64
  const base64 = btoa(binary);

  // Convert to Base64URL
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Detect environment and use appropriate crypto.
 */
function isBrowser(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.crypto !== 'undefined' &&
    typeof window.crypto.subtle !== 'undefined'
  );
}

/**
 * Build a proof for the given inputs.
 * Automatically uses Web Crypto API in browsers, Node crypto in Node.js.
 *
 * @param input - Proof input parameters
 * @returns Promise resolving to Base64URL encoded proof
 */
export async function buildProof(input: BuildProofInput): Promise<string> {
  if (isBrowser()) {
    return buildProofBrowser(input);
  }
  return buildProofNode(input);
}

/**
 * Options for ASH-protected fetch request.
 */
export interface AshFetchOptions {
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
export async function createAshHeaders(
  options: AshFetchOptions
): Promise<Record<string, string>> {
  const {
    context,
    payload,
    method,
    path,
    contextIdHeader = 'X-ASH-Context-Id',
    proofHeader = 'X-ASH-Proof',
  } = options;

  // Canonicalize payload
  const canonicalPayload = canonicalizeJson(payload);

  // Normalize binding
  const binding = normalizeBinding(method, path);

  // Build proof
  const proof = await buildProof({
    mode: context.mode,
    binding,
    contextId: context.contextId,
    nonce: context.nonce,
    canonicalPayload,
  });

  return {
    [contextIdHeader]: context.contextId,
    [proofHeader]: proof,
    'Content-Type': 'application/json',
  };
}

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
export async function ashFetch(
  url: string,
  options: AshFetchOptions
): Promise<Response> {
  const { payload, method, fetchOptions = {} } = options;

  // Create ASH headers
  const ashHeaders = await createAshHeaders(options);

  // Merge with existing headers
  const headers = new Headers(fetchOptions.headers);
  for (const [key, value] of Object.entries(ashHeaders)) {
    headers.set(key, value);
  }

  return fetch(url, {
    ...fetchOptions,
    method,
    headers,
    body: JSON.stringify(payload),
  });
}

// Re-export utilities
export { canonicalizeJson, canonicalizeUrlEncoded, normalizeBinding };
export type { AshMode, ContextPublicInfo, BuildProofInput };
