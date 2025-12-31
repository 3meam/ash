/**
 * ASH Context Management
 *
 * Server-side context issuance for request verification.
 *
 * @module @anthropic/ash-server
 */

import { randomBytes } from 'crypto';
import type { StoredContext, ContextPublicInfo, AshMode } from '@anthropic/ash-core';
import type { CreateContextOptions, ContextStore } from './types.js';

/** Default context configuration */
const DEFAULT_MODE: AshMode = 'balanced';
const CONTEXT_ID_BYTES = 16; // 128 bits
const NONCE_BYTES = 16; // 128 bits

/**
 * Generate a cryptographically secure random ID.
 * Uses CSPRNG for unpredictability.
 */
function generateSecureId(bytes: number): string {
  return randomBytes(bytes).toString('base64url');
}

/**
 * Create a context manager bound to a store.
 */
export function createContextManager(store: ContextStore): {
  createContext: (options: CreateContextOptions) => Promise<ContextPublicInfo>;
  getContext: (contextId: string) => Promise<StoredContext | null>;
} {
  return {
    createContext: (options) => createContext(store, options),
    getContext: (contextId) => store.get(contextId),
  };
}

/**
 * Create a new verification context.
 *
 * @param store - The context store to use
 * @param options - Context creation options
 * @returns Public context info to return to client
 */
export async function createContext(
  store: ContextStore,
  options: CreateContextOptions
): Promise<ContextPublicInfo> {
  const { binding, ttlMs, mode = DEFAULT_MODE, issueNonce = false } = options;

  const now = Date.now();

  // Generate unpredictable context ID (128-bit CSPRNG)
  const contextId = generateSecureId(CONTEXT_ID_BYTES);

  // Generate nonce if requested (server-assisted mode)
  const nonce = issueNonce ? generateSecureId(NONCE_BYTES) : undefined;

  // Build stored context
  const storedContext: StoredContext = {
    contextId,
    binding,
    mode,
    issuedAt: now,
    expiresAt: now + ttlMs,
    nonce,
    consumedAt: null,
  };

  // Store context
  await store.put(storedContext);

  // Return only public info
  const publicInfo: ContextPublicInfo = {
    contextId,
    expiresAt: storedContext.expiresAt,
    mode,
  };

  if (nonce !== undefined) {
    publicInfo.nonce = nonce;
  }

  return publicInfo;
}
