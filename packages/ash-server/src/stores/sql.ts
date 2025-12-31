/**
 * SQL Context Store
 *
 * Production-ready store with atomic consume using row-level locking.
 *
 * @module @anthropic/ash-server
 */

import type { StoredContext, AshMode } from '@anthropic/ash-core';
import type { ContextStore, ConsumeResult } from '../types.js';

/** Generic SQL query interface */
export interface SqlQuery {
  (sql: string, params?: unknown[]): Promise<{ rows: unknown[]; rowCount: number }>;
}

/** Options for SqlContextStore */
export interface SqlContextStoreOptions {
  /** SQL query function */
  query: SqlQuery;
  /** Table name (default: 'ash_contexts') */
  tableName?: string;
}

/** Row structure in the database */
interface ContextRow {
  context_id: string;
  binding: string;
  mode: string;
  issued_at: string | number;
  expires_at: string | number;
  nonce: string | null;
  consumed_at: string | number | null;
}

/**
 * SQL-backed context store for production use.
 *
 * Requires a table with the following schema:
 * ```sql
 * CREATE TABLE ash_contexts (
 *   context_id VARCHAR(64) PRIMARY KEY,
 *   binding VARCHAR(255) NOT NULL,
 *   mode VARCHAR(20) NOT NULL,
 *   issued_at BIGINT NOT NULL,
 *   expires_at BIGINT NOT NULL,
 *   nonce VARCHAR(64),
 *   consumed_at BIGINT
 * );
 *
 * CREATE INDEX idx_ash_contexts_expires ON ash_contexts(expires_at);
 * ```
 *
 * Features:
 * - Atomic consume using UPDATE ... WHERE consumed_at IS NULL
 * - Works with PostgreSQL, MySQL, SQLite
 */
export class SqlContextStore implements ContextStore {
  private readonly query: SqlQuery;
  private readonly tableName: string;

  constructor(options: SqlContextStoreOptions) {
    this.query = options.query;
    this.tableName = options.tableName ?? 'ash_contexts';
  }

  async put(ctx: StoredContext): Promise<void> {
    const sql = `
      INSERT INTO ${this.tableName}
        (context_id, binding, mode, issued_at, expires_at, nonce, consumed_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    await this.query(sql, [
      ctx.contextId,
      ctx.binding,
      ctx.mode,
      ctx.issuedAt,
      ctx.expiresAt,
      ctx.nonce ?? null,
      ctx.consumedAt ?? null,
    ]);
  }

  async get(contextId: string): Promise<StoredContext | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE context_id = $1`;
    const result = await this.query(sql, [contextId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.rowToContext(result.rows[0] as ContextRow);
  }

  async consume(contextId: string, nowMs: number): Promise<ConsumeResult> {
    // Atomic update - only succeeds if consumed_at IS NULL
    const sql = `
      UPDATE ${this.tableName}
      SET consumed_at = $1
      WHERE context_id = $2 AND consumed_at IS NULL
    `;

    const result = await this.query(sql, [nowMs, contextId]);

    if (result.rowCount === 1) {
      return 'consumed';
    }

    // Check if context exists
    const existsResult = await this.query(
      `SELECT consumed_at FROM ${this.tableName} WHERE context_id = $1`,
      [contextId]
    );

    if (existsResult.rows.length === 0) {
      return 'missing';
    }

    return 'already_consumed';
  }

  async cleanup(): Promise<number> {
    const sql = `DELETE FROM ${this.tableName} WHERE expires_at < $1`;
    const result = await this.query(sql, [Date.now()]);
    return result.rowCount;
  }

  private rowToContext(row: ContextRow): StoredContext {
    return {
      contextId: row.context_id,
      binding: row.binding,
      mode: row.mode as AshMode,
      issuedAt: Number(row.issued_at),
      expiresAt: Number(row.expires_at),
      nonce: row.nonce ?? undefined,
      consumedAt: row.consumed_at !== null ? Number(row.consumed_at) : null,
    };
  }
}
