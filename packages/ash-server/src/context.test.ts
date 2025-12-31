/**
 * Context Management Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createContext, createContextManager } from './context.js';
import { MemoryContextStore } from './stores/memory.js';

describe('createContext', () => {
  let store: MemoryContextStore;

  beforeEach(() => {
    store = new MemoryContextStore({ suppressWarning: true });
  });

  it('should create a context with required fields', async () => {
    const result = await createContext(store, {
      binding: 'POST /api/test',
      ttlMs: 30000,
    });

    expect(result.contextId).toBeDefined();
    expect(result.contextId.length).toBeGreaterThan(0);
    expect(result.expiresAt).toBeGreaterThan(Date.now());
    expect(result.mode).toBe('balanced');
    expect(result.nonce).toBeUndefined();
  });

  it('should use specified mode', async () => {
    const result = await createContext(store, {
      binding: 'POST /api/test',
      ttlMs: 30000,
      mode: 'strict',
    });

    expect(result.mode).toBe('strict');
  });

  it('should issue nonce when requested', async () => {
    const result = await createContext(store, {
      binding: 'POST /api/test',
      ttlMs: 30000,
      issueNonce: true,
    });

    expect(result.nonce).toBeDefined();
    expect(result.nonce!.length).toBeGreaterThan(0);
  });

  it('should store context in store', async () => {
    const result = await createContext(store, {
      binding: 'POST /api/test',
      ttlMs: 30000,
    });

    const stored = await store.get(result.contextId);
    expect(stored).not.toBeNull();
    expect(stored!.contextId).toBe(result.contextId);
    expect(stored!.binding).toBe('POST /api/test');
    expect(stored!.consumedAt).toBeNull();
  });

  it('should generate unique context IDs', async () => {
    const results = await Promise.all([
      createContext(store, { binding: 'POST /api/test', ttlMs: 30000 }),
      createContext(store, { binding: 'POST /api/test', ttlMs: 30000 }),
      createContext(store, { binding: 'POST /api/test', ttlMs: 30000 }),
    ]);

    const ids = results.map(r => r.contextId);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3);
  });

  it('should set correct expiry time', async () => {
    const before = Date.now();
    const result = await createContext(store, {
      binding: 'POST /api/test',
      ttlMs: 30000,
    });
    const after = Date.now();

    expect(result.expiresAt).toBeGreaterThanOrEqual(before + 30000);
    expect(result.expiresAt).toBeLessThanOrEqual(after + 30000);
  });
});

describe('createContextManager', () => {
  let store: MemoryContextStore;

  beforeEach(() => {
    store = new MemoryContextStore({ suppressWarning: true });
  });

  it('should return manager with createContext and getContext', () => {
    const manager = createContextManager(store);

    expect(manager.createContext).toBeDefined();
    expect(manager.getContext).toBeDefined();
  });

  it('should create and retrieve context through manager', async () => {
    const manager = createContextManager(store);

    const created = await manager.createContext({
      binding: 'POST /api/test',
      ttlMs: 30000,
    });

    const retrieved = await manager.getContext(created.contextId);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.contextId).toBe(created.contextId);
  });
});
