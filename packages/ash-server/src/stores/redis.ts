/**
 * Redis Context Store
 *
 * Production-ready store with atomic consume using Lua scripts.
 *
 * @module @anthropic/ash-server
 */

import type { StoredContext } from '@anthropic/ash-core';
import type { ContextStore, ConsumeResult } from '../types.js';

/** Redis client interface (compatible with ioredis) */
export interface RedisClient {
  set(key: string, value: string, mode: 'EX', seconds: number): Promise<'OK' | null>;
  get(key: string): Promise<string | null>;
  del(key: string): Promise<number>;
  eval(script: string, numKeys: number, ...args: string[]): Promise<unknown>;
}

/** Options for RedisContextStore */
export interface RedisContextStoreOptions {
  /** Redis client instance */
  client: RedisClient;
  /** Key prefix (default: 'ash:ctx:') */
  keyPrefix?: string;
}

/**
 * Lua script for atomic consume.
 * Returns: 1 = consumed, 0 = already_consumed, -1 = missing
 */
const CONSUME_SCRIPT = `
local key = KEYS[1]
local nowMs = ARGV[1]

local data = redis.call('GET', key)
if not data then
  return -1
end

local ctx = cjson.decode(data)
if ctx.consumedAt then
  return 0
end

ctx.consumedAt = tonumber(nowMs)
redis.call('SET', key, cjson.encode(ctx), 'KEEPTTL')
return 1
`;

/**
 * Redis-backed context store for production use.
 *
 * Features:
 * - Atomic consume using Lua scripts
 * - Automatic expiration via Redis TTL
 * - Cluster-safe
 */
export class RedisContextStore implements ContextStore {
  private readonly client: RedisClient;
  private readonly keyPrefix: string;

  constructor(options: RedisContextStoreOptions) {
    this.client = options.client;
    this.keyPrefix = options.keyPrefix ?? 'ash:ctx:';
  }

  private key(contextId: string): string {
    return `${this.keyPrefix}${contextId}`;
  }

  async put(ctx: StoredContext): Promise<void> {
    const ttlSeconds = Math.ceil((ctx.expiresAt - Date.now()) / 1000);
    if (ttlSeconds <= 0) {
      return; // Already expired, don't store
    }

    await this.client.set(this.key(ctx.contextId), JSON.stringify(ctx), 'EX', ttlSeconds);
  }

  async get(contextId: string): Promise<StoredContext | null> {
    const data = await this.client.get(this.key(contextId));
    if (data === null) {
      return null;
    }

    return JSON.parse(data) as StoredContext;
  }

  async consume(contextId: string, nowMs: number): Promise<ConsumeResult> {
    const result = (await this.client.eval(
      CONSUME_SCRIPT,
      1,
      this.key(contextId),
      nowMs.toString()
    )) as number;

    switch (result) {
      case 1:
        return 'consumed';
      case 0:
        return 'already_consumed';
      default:
        return 'missing';
    }
  }

  async cleanup(): Promise<number> {
    // Redis handles expiration automatically via TTL
    return 0;
  }
}
