/**
 * In-Memory Context Store
 *
 * WARNING: For development and testing ONLY.
 * NOT suitable for production - no persistence, no atomic guarantees across processes.
 *
 * @module @anthropic/ash-server
 */

import type { StoredContext } from '@anthropic/ash-core';
import type { ContextStore, ConsumeResult } from '../types.js';

/**
 * In-memory context store for development and testing.
 *
 * ⚠️ WARNING: Do NOT use in production!
 * - No persistence across restarts
 * - No atomic guarantees in clustered environments
 * - Memory will grow unbounded without cleanup
 */
export class MemoryContextStore implements ContextStore {
  private contexts = new Map<string, StoredContext>();
  private readonly warnOnUse: boolean;

  constructor(options?: { suppressWarning?: boolean }) {
    this.warnOnUse = !(options?.suppressWarning ?? false);

    if (this.warnOnUse && process.env['NODE_ENV'] === 'production') {
      console.warn(
        '[ASH WARNING] MemoryContextStore is not suitable for production. ' +
          'Use RedisContextStore or SqlContextStore instead.'
      );
    }
  }

  async put(ctx: StoredContext): Promise<void> {
    this.contexts.set(ctx.contextId, { ...ctx });
  }

  async get(contextId: string): Promise<StoredContext | null> {
    const ctx = this.contexts.get(contextId);
    return ctx ? { ...ctx } : null;
  }

  async consume(contextId: string, nowMs: number): Promise<ConsumeResult> {
    const ctx = this.contexts.get(contextId);

    if (ctx === undefined) {
      return 'missing';
    }

    if (ctx.consumedAt !== null && ctx.consumedAt !== undefined) {
      return 'already_consumed';
    }

    // Mark as consumed
    ctx.consumedAt = nowMs;
    return 'consumed';
  }

  async cleanup(): Promise<number> {
    const now = Date.now();
    let removed = 0;

    for (const [id, ctx] of this.contexts) {
      // Remove expired or consumed contexts
      if (ctx.expiresAt < now || ctx.consumedAt !== null) {
        this.contexts.delete(id);
        removed++;
      }
    }

    return removed;
  }

  /** Get current store size (for testing) */
  size(): number {
    return this.contexts.size;
  }

  /** Clear all contexts (for testing) */
  clear(): void {
    this.contexts.clear();
  }
}
