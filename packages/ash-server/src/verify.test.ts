/**
 * Request Verification Pipeline Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { verifyRequest, createVerifier } from './verify.js';
import { createContext } from './context.js';
import { MemoryContextStore } from './stores/memory.js';
import {
  buildProof,
  canonicalizeJson,
  InvalidContextError,
  ContextExpiredError,
  EndpointMismatchError,
  IntegrityFailedError,
  ReplayDetectedError,
} from '@anthropic/ash-core';

describe('verifyRequest', () => {
  let store: MemoryContextStore;

  beforeEach(() => {
    store = new MemoryContextStore({ suppressWarning: true });
  });

  const createValidRequest = async (options?: {
    binding?: string;
    payload?: unknown;
    nonce?: boolean;
  }) => {
    const binding = options?.binding ?? 'POST /api/test';
    const payload = options?.payload ?? { test: 'data' };

    const ctx = await createContext(store, {
      binding,
      ttlMs: 30000,
      issueNonce: options?.nonce ?? false,
    });

    const storedCtx = await store.get(ctx.contextId);
    const canonicalPayload = canonicalizeJson(payload);

    const proof = buildProof({
      mode: storedCtx!.mode,
      binding: storedCtx!.binding,
      contextId: storedCtx!.contextId,
      nonce: storedCtx!.nonce,
      canonicalPayload,
    });

    return {
      contextId: ctx.contextId,
      proof,
      payload,
      binding,
    };
  };

  it('should verify a valid request', async () => {
    const req = await createValidRequest();

    await expect(
      verifyRequest(store, req, {
        expectedBinding: req.binding,
        contentType: 'application/json',
        extractContextId: (r: unknown) => (r as typeof req).contextId,
        extractProof: (r: unknown) => (r as typeof req).proof,
        extractPayload: (r: unknown) => (r as typeof req).payload,
      })
    ).resolves.toBeUndefined();
  });

  it('should verify a request with nonce', async () => {
    const req = await createValidRequest({ nonce: true });

    await expect(
      verifyRequest(store, req, {
        expectedBinding: req.binding,
        contentType: 'application/json',
        extractContextId: (r: unknown) => (r as typeof req).contextId,
        extractProof: (r: unknown) => (r as typeof req).proof,
        extractPayload: (r: unknown) => (r as typeof req).payload,
      })
    ).resolves.toBeUndefined();
  });

  it('should throw InvalidContextError for missing context ID', async () => {
    await expect(
      verifyRequest(store, {}, {
        expectedBinding: 'POST /api/test',
        contentType: 'application/json',
        extractContextId: () => '',
        extractProof: () => 'proof',
        extractPayload: () => ({}),
      })
    ).rejects.toThrow(InvalidContextError);
  });

  it('should throw InvalidContextError for non-existent context', async () => {
    await expect(
      verifyRequest(store, {}, {
        expectedBinding: 'POST /api/test',
        contentType: 'application/json',
        extractContextId: () => 'non-existent-ctx',
        extractProof: () => 'proof',
        extractPayload: () => ({}),
      })
    ).rejects.toThrow(InvalidContextError);
  });

  it('should throw ContextExpiredError for expired context', async () => {
    const ctx = await createContext(store, {
      binding: 'POST /api/test',
      ttlMs: 1, // 1ms TTL
    });

    // Wait for expiry
    await new Promise(resolve => setTimeout(resolve, 10));

    await expect(
      verifyRequest(store, {}, {
        expectedBinding: 'POST /api/test',
        contentType: 'application/json',
        extractContextId: () => ctx.contextId,
        extractProof: () => 'proof',
        extractPayload: () => ({}),
      })
    ).rejects.toThrow(ContextExpiredError);
  });

  it('should throw EndpointMismatchError for wrong binding', async () => {
    const req = await createValidRequest({ binding: 'POST /api/test' });

    await expect(
      verifyRequest(store, req, {
        expectedBinding: 'POST /api/other', // Different binding
        contentType: 'application/json',
        extractContextId: (r: unknown) => (r as typeof req).contextId,
        extractProof: (r: unknown) => (r as typeof req).proof,
        extractPayload: (r: unknown) => (r as typeof req).payload,
      })
    ).rejects.toThrow(EndpointMismatchError);
  });

  it('should throw IntegrityFailedError for wrong proof', async () => {
    const req = await createValidRequest();

    await expect(
      verifyRequest(store, req, {
        expectedBinding: req.binding,
        contentType: 'application/json',
        extractContextId: (r: unknown) => (r as typeof req).contextId,
        extractProof: () => 'invalid-proof',
        extractPayload: (r: unknown) => (r as typeof req).payload,
      })
    ).rejects.toThrow(IntegrityFailedError);
  });

  it('should throw IntegrityFailedError for tampered payload', async () => {
    const req = await createValidRequest({ payload: { amount: 100 } });

    await expect(
      verifyRequest(store, req, {
        expectedBinding: req.binding,
        contentType: 'application/json',
        extractContextId: (r: unknown) => (r as typeof req).contextId,
        extractProof: (r: unknown) => (r as typeof req).proof,
        extractPayload: () => ({ amount: 999 }), // Tampered amount
      })
    ).rejects.toThrow(IntegrityFailedError);
  });

  it('should throw ReplayDetectedError on second use', async () => {
    const req = await createValidRequest();
    const options = {
      expectedBinding: req.binding,
      contentType: 'application/json' as const,
      extractContextId: (r: unknown) => (r as typeof req).contextId,
      extractProof: (r: unknown) => (r as typeof req).proof,
      extractPayload: (r: unknown) => (r as typeof req).payload,
    };

    // First request should succeed
    await verifyRequest(store, req, options);

    // Second request should fail (replay)
    await expect(verifyRequest(store, req, options)).rejects.toThrow(
      ReplayDetectedError
    );
  });
});

describe('createVerifier', () => {
  let store: MemoryContextStore;

  beforeEach(() => {
    store = new MemoryContextStore({ suppressWarning: true });
  });

  it('should return verifier with verify function', () => {
    const verifier = createVerifier(store);
    expect(verifier.verify).toBeDefined();
  });

  it('should verify requests through bound verifier', async () => {
    const verifier = createVerifier(store);

    const ctx = await createContext(store, {
      binding: 'POST /api/test',
      ttlMs: 30000,
    });

    const storedCtx = await store.get(ctx.contextId);
    const payload = { test: 'data' };
    const canonicalPayload = canonicalizeJson(payload);

    const proof = buildProof({
      mode: storedCtx!.mode,
      binding: storedCtx!.binding,
      contextId: storedCtx!.contextId,
      nonce: storedCtx!.nonce,
      canonicalPayload,
    });

    const req = { contextId: ctx.contextId, proof, payload };

    await expect(
      verifier.verify(req, {
        expectedBinding: 'POST /api/test',
        contentType: 'application/json',
        extractContextId: (r: unknown) => (r as typeof req).contextId,
        extractProof: (r: unknown) => (r as typeof req).proof,
        extractPayload: (r: unknown) => (r as typeof req).payload,
      })
    ).resolves.toBeUndefined();
  });
});
