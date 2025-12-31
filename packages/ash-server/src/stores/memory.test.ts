/**
 * MemoryContextStore Tests
 * Tests for atomic consume and basic operations.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryContextStore } from './memory.js';
import type { StoredContext } from '@anthropic/ash-core';

describe('MemoryContextStore', () => {
  let store: MemoryContextStore;

  beforeEach(() => {
    store = new MemoryContextStore({ suppressWarning: true });
  });

  const createTestContext = (overrides?: Partial<StoredContext>): StoredContext => ({
    contextId: 'test-ctx-123',
    binding: 'POST /api/test',
    mode: 'balanced',
    issuedAt: Date.now(),
    expiresAt: Date.now() + 60000,
    nonce: undefined,
    consumedAt: null,
    ...overrides,
  });

  describe('put and get', () => {
    it('should store and retrieve a context', async () => {
      const ctx = createTestContext();
      await store.put(ctx);

      const retrieved = await store.get(ctx.contextId);
      expect(retrieved).toEqual(ctx);
    });

    it('should return null for non-existent context', async () => {
      const retrieved = await store.get('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should return a copy, not the original', async () => {
      const ctx = createTestContext();
      await store.put(ctx);

      const retrieved = await store.get(ctx.contextId);
      expect(retrieved).not.toBe(ctx);
    });
  });

  describe('consume', () => {
    it('should consume a valid context', async () => {
      const ctx = createTestContext();
      await store.put(ctx);

      const result = await store.consume(ctx.contextId, Date.now());
      expect(result).toBe('consumed');
    });

    it('should return already_consumed for consumed context', async () => {
      const ctx = createTestContext();
      await store.put(ctx);

      await store.consume(ctx.contextId, Date.now());
      const result = await store.consume(ctx.contextId, Date.now());
      expect(result).toBe('already_consumed');
    });

    it('should return missing for non-existent context', async () => {
      const result = await store.consume('non-existent', Date.now());
      expect(result).toBe('missing');
    });

    it('should update consumedAt timestamp', async () => {
      const ctx = createTestContext();
      await store.put(ctx);

      const consumeTime = Date.now();
      await store.consume(ctx.contextId, consumeTime);

      const retrieved = await store.get(ctx.contextId);
      expect(retrieved?.consumedAt).toBe(consumeTime);
    });
  });

  describe('atomic consume (replay prevention)', () => {
    it('should only allow one successful consume in concurrent calls', async () => {
      const ctx = createTestContext();
      await store.put(ctx);

      // Simulate concurrent consume attempts
      const results = await Promise.all([
        store.consume(ctx.contextId, Date.now()),
        store.consume(ctx.contextId, Date.now()),
        store.consume(ctx.contextId, Date.now()),
        store.consume(ctx.contextId, Date.now()),
        store.consume(ctx.contextId, Date.now()),
      ]);

      const consumed = results.filter(r => r === 'consumed');
      const alreadyConsumed = results.filter(r => r === 'already_consumed');

      expect(consumed.length).toBe(1);
      expect(alreadyConsumed.length).toBe(4);
    });
  });

  describe('cleanup', () => {
    it('should remove expired contexts', async () => {
      const expiredCtx = createTestContext({
        contextId: 'expired-ctx',
        expiresAt: Date.now() - 1000,
      });
      const validCtx = createTestContext({
        contextId: 'valid-ctx',
        expiresAt: Date.now() + 60000,
      });

      await store.put(expiredCtx);
      await store.put(validCtx);

      const removed = await store.cleanup();
      expect(removed).toBe(1);
      expect(await store.get('expired-ctx')).toBeNull();
      expect(await store.get('valid-ctx')).not.toBeNull();
    });

    it('should remove consumed contexts', async () => {
      const consumedCtx = createTestContext({
        contextId: 'consumed-ctx',
        consumedAt: Date.now() - 1000,
      });
      const unconsumedCtx = createTestContext({
        contextId: 'unconsumed-ctx',
      });

      await store.put(consumedCtx);
      await store.put(unconsumedCtx);

      const removed = await store.cleanup();
      expect(removed).toBe(1);
      expect(await store.get('consumed-ctx')).toBeNull();
      expect(await store.get('unconsumed-ctx')).not.toBeNull();
    });
  });

  describe('utility methods', () => {
    it('size() should return correct count', async () => {
      expect(store.size()).toBe(0);

      await store.put(createTestContext({ contextId: 'ctx-1' }));
      expect(store.size()).toBe(1);

      await store.put(createTestContext({ contextId: 'ctx-2' }));
      expect(store.size()).toBe(2);
    });

    it('clear() should remove all contexts', async () => {
      await store.put(createTestContext({ contextId: 'ctx-1' }));
      await store.put(createTestContext({ contextId: 'ctx-2' }));

      store.clear();
      expect(store.size()).toBe(0);
    });
  });
});
