/**
 * ASH Client SDK Tests
 */

import { describe, it, expect } from 'vitest';
import {
  buildProof,
  createAshHeaders,
  canonicalizeJson,
  canonicalizeUrlEncoded,
  normalizeBinding,
} from './client.js';
import type { ContextPublicInfo } from './client.js';

describe('buildProof', () => {
  it('should build a proof for valid input', async () => {
    const proof = await buildProof({
      mode: 'balanced',
      binding: 'POST /api/test',
      contextId: 'ctx-123',
      canonicalPayload: '{"test":"data"}',
    });

    expect(proof).toBeDefined();
    expect(typeof proof).toBe('string');
    expect(proof.length).toBeGreaterThan(0);
    // Base64URL should not contain +, /, or =
    expect(proof).not.toMatch(/[+/=]/);
  });

  it('should include nonce in proof when provided', async () => {
    const proofWithoutNonce = await buildProof({
      mode: 'balanced',
      binding: 'POST /api/test',
      contextId: 'ctx-123',
      canonicalPayload: '{}',
    });

    const proofWithNonce = await buildProof({
      mode: 'balanced',
      binding: 'POST /api/test',
      contextId: 'ctx-123',
      nonce: 'nonce-456',
      canonicalPayload: '{}',
    });

    expect(proofWithNonce).not.toBe(proofWithoutNonce);
  });

  it('should produce consistent proofs for same input', async () => {
    const input = {
      mode: 'balanced' as const,
      binding: 'POST /api/test',
      contextId: 'ctx-123',
      canonicalPayload: '{"a":1}',
    };

    const proof1 = await buildProof(input);
    const proof2 = await buildProof(input);

    expect(proof1).toBe(proof2);
  });

  it('should produce different proofs for different payloads', async () => {
    const proof1 = await buildProof({
      mode: 'balanced',
      binding: 'POST /api/test',
      contextId: 'ctx-123',
      canonicalPayload: '{"a":1}',
    });

    const proof2 = await buildProof({
      mode: 'balanced',
      binding: 'POST /api/test',
      contextId: 'ctx-123',
      canonicalPayload: '{"a":2}',
    });

    expect(proof1).not.toBe(proof2);
  });

  it('should produce different proofs for different bindings', async () => {
    const proof1 = await buildProof({
      mode: 'balanced',
      binding: 'POST /api/test',
      contextId: 'ctx-123',
      canonicalPayload: '{}',
    });

    const proof2 = await buildProof({
      mode: 'balanced',
      binding: 'POST /api/other',
      contextId: 'ctx-123',
      canonicalPayload: '{}',
    });

    expect(proof1).not.toBe(proof2);
  });
});

describe('createAshHeaders', () => {
  it('should create headers with context ID and proof', async () => {
    const context: ContextPublicInfo = {
      contextId: 'ctx-abc-123',
      expiresAt: Date.now() + 60000,
      mode: 'balanced',
    };

    const headers = await createAshHeaders({
      context,
      payload: { name: 'John' },
      method: 'POST',
      path: '/api/profile/update',
    });

    expect(headers['X-ASH-Context-Id']).toBe('ctx-abc-123');
    expect(headers['X-ASH-Proof']).toBeDefined();
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('should use custom header names when provided', async () => {
    const context: ContextPublicInfo = {
      contextId: 'ctx-123',
      expiresAt: Date.now() + 60000,
      mode: 'balanced',
    };

    const headers = await createAshHeaders({
      context,
      payload: {},
      method: 'POST',
      path: '/api/test',
      contextIdHeader: 'X-Custom-Context',
      proofHeader: 'X-Custom-Proof',
    });

    expect(headers['X-Custom-Context']).toBe('ctx-123');
    expect(headers['X-Custom-Proof']).toBeDefined();
  });

  it('should include nonce in proof calculation when present', async () => {
    const contextWithoutNonce: ContextPublicInfo = {
      contextId: 'ctx-123',
      expiresAt: Date.now() + 60000,
      mode: 'balanced',
    };

    const contextWithNonce: ContextPublicInfo = {
      contextId: 'ctx-123',
      expiresAt: Date.now() + 60000,
      mode: 'balanced',
      nonce: 'server-nonce-456',
    };

    const headers1 = await createAshHeaders({
      context: contextWithoutNonce,
      payload: {},
      method: 'POST',
      path: '/api/test',
    });

    const headers2 = await createAshHeaders({
      context: contextWithNonce,
      payload: {},
      method: 'POST',
      path: '/api/test',
    });

    expect(headers1['X-ASH-Proof']).not.toBe(headers2['X-ASH-Proof']);
  });
});

describe('canonicalizeJson (re-export)', () => {
  it('should canonicalize JSON objects', () => {
    const result = canonicalizeJson({ b: 2, a: 1 });
    expect(result).toBe('{"a":1,"b":2}');
  });

  it('should handle nested objects', () => {
    const result = canonicalizeJson({ outer: { b: 2, a: 1 } });
    expect(result).toBe('{"outer":{"a":1,"b":2}}');
  });
});

describe('canonicalizeUrlEncoded (re-export)', () => {
  it('should canonicalize URL-encoded data', () => {
    const result = canonicalizeUrlEncoded('b=2&a=1');
    expect(result).toBe('a=1&b=2');
  });

  it('should handle object input', () => {
    const result = canonicalizeUrlEncoded({ b: '2', a: '1' });
    expect(result).toBe('a=1&b=2');
  });
});

describe('normalizeBinding (re-export)', () => {
  it('should normalize method and path', () => {
    const result = normalizeBinding('post', '/api/test');
    expect(result).toBe('POST /api/test');
  });

  it('should strip query strings', () => {
    const result = normalizeBinding('GET', '/api/test?foo=bar');
    expect(result).toBe('GET /api/test');
  });

  it('should collapse duplicate slashes', () => {
    const result = normalizeBinding('GET', '/api//test///path');
    expect(result).toBe('GET /api/test/path');
  });
});
