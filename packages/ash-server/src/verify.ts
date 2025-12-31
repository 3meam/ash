/**
 * ASH Request Verification Pipeline
 *
 * Fail-closed verification following the ASH-Spec-v1.0 order:
 * 1. Extract contextId
 * 2. Load context
 * 3. Check expiry
 * 4. Verify binding
 * 5. Canonicalize payload
 * 6. Recompute proof
 * 7. Compare proofs (constant-time)
 * 8. Atomic consume
 *
 * @module @anthropic/ash-server
 */

import {
  canonicalizeJson,
  canonicalizeUrlEncoded,
  buildProof,
  timingSafeCompare,
  InvalidContextError,
  ContextExpiredError,
  EndpointMismatchError,
  IntegrityFailedError,
  ReplayDetectedError,
  UnsupportedContentTypeError,
} from '@anthropic/ash-core';
import type { SupportedContentType } from '@anthropic/ash-core';
import type { ContextStore, VerifyOptions } from './types.js';

/**
 * Verify a request against ASH protocol.
 *
 * This function implements the verification pipeline exactly as specified.
 * Any failure throws an AshError and stops execution immediately.
 *
 * @param store - Context store
 * @param req - The incoming request
 * @param options - Verification options
 * @throws {AshError} On any verification failure
 */
export async function verifyRequest(
  store: ContextStore,
  req: unknown,
  options: VerifyOptions
): Promise<void> {
  const { expectedBinding, contentType, extractContextId, extractProof, extractPayload } = options;

  // Step 1: Extract contextId from request
  const contextId = extractContextId(req);
  if (typeof contextId !== 'string' || contextId === '') {
    throw new InvalidContextError('Missing or invalid context ID');
  }

  // Step 2: Load context by contextId
  const context = await store.get(contextId);
  if (context === null) {
    throw new InvalidContextError();
  }

  // Step 3: Check expiry
  const now = Date.now();
  if (context.expiresAt <= now) {
    throw new ContextExpiredError();
  }

  // Step 4: Verify binding matches
  if (context.binding !== expectedBinding) {
    throw new EndpointMismatchError();
  }

  // Step 5: Canonicalize request payload
  const payload = extractPayload(req);
  const canonicalPayload = canonicalizePayload(payload, contentType);

  // Step 6: Recompute expected proof
  const expectedProof = buildProof({
    mode: context.mode,
    binding: context.binding,
    contextId: context.contextId,
    nonce: context.nonce,
    canonicalPayload,
  });

  // Step 7: Constant-time compare proofs
  const providedProof = extractProof(req);
  if (typeof providedProof !== 'string' || !timingSafeCompare(expectedProof, providedProof)) {
    throw new IntegrityFailedError();
  }

  // Step 8: Atomically consume context
  const consumeResult = await store.consume(contextId, now);
  if (consumeResult === 'already_consumed') {
    throw new ReplayDetectedError();
  }
  if (consumeResult === 'missing') {
    // Race condition: context was deleted between get and consume
    throw new InvalidContextError();
  }

  // Verification successful - proceed to business logic
}

/**
 * Canonicalize payload based on content type.
 */
function canonicalizePayload(payload: unknown, contentType: SupportedContentType): string {
  switch (contentType) {
    case 'application/json':
      return canonicalizeJson(payload);

    case 'application/x-www-form-urlencoded':
      if (typeof payload === 'string') {
        return canonicalizeUrlEncoded(payload);
      }
      if (typeof payload === 'object' && payload !== null) {
        return canonicalizeUrlEncoded(payload as Record<string, string | string[]>);
      }
      throw new UnsupportedContentTypeError('Invalid payload for URL-encoded content type');

    default:
      throw new UnsupportedContentTypeError(`Content type not supported: ${contentType as string}`);
  }
}

/**
 * Create a verifier bound to a store.
 */
export function createVerifier(store: ContextStore): {
  verify: (req: unknown, options: VerifyOptions) => Promise<void>;
} {
  return {
    verify: (req, options) => verifyRequest(store, req, options),
  };
}
