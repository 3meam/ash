/**
 * ASH Server SDK Types
 * @module @anthropic/ash-server
 */

import type { AshMode, StoredContext, SupportedContentType } from '@anthropic/ash-core';

/** Options for creating a context */
export interface CreateContextOptions {
  /** Security mode (default: 'balanced') */
  mode?: AshMode;
  /** Time-to-live in milliseconds (recommended < 60000) */
  ttlMs: number;
  /** Canonical binding: "METHOD /path" */
  binding: string;
  /** Whether to issue a nonce (server-assisted mode) */
  issueNonce?: boolean;
}

/** Options for verifying a request */
export interface VerifyOptions {
  /** Expected binding for this endpoint */
  expectedBinding: string;
  /** Content type of the request */
  contentType: SupportedContentType;
  /** Extract context ID from request */
  extractContextId: (req: unknown) => string;
  /** Extract proof from request */
  extractProof: (req: unknown) => string;
  /** Extract payload from request (parsed body or raw string) */
  extractPayload: (req: unknown) => unknown;
}

/** Result of atomic consume operation */
export type ConsumeResult = 'consumed' | 'already_consumed' | 'missing';

/** Context store interface - implementations MUST support atomic consume */
export interface ContextStore {
  /** Store a new context */
  put(ctx: StoredContext): Promise<void>;

  /** Retrieve a context by ID */
  get(contextId: string): Promise<StoredContext | null>;

  /**
   * Atomically consume a context.
   * This MUST be atomic to prevent replay attacks.
   *
   * @param contextId - The context ID to consume
   * @param nowMs - Current timestamp in milliseconds
   * @returns Result of the consume operation
   */
  consume(contextId: string, nowMs: number): Promise<ConsumeResult>;

  /** Clean up expired contexts (optional) */
  cleanup?(): Promise<number>;
}

/** Express-like request interface */
export interface ExpressRequest {
  method: string;
  path: string;
  originalUrl?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

/** Express-like response interface */
export interface ExpressResponse {
  status(code: number): this;
  json(body: unknown): void;
}

/** Express-like next function */
export type ExpressNextFunction = (err?: unknown) => void;

/** Middleware options for Express */
export interface ExpressMiddlewareOptions {
  /** Expected binding for this endpoint */
  expectedBinding: string;
  /** Content type (default: 'application/json') */
  contentType?: SupportedContentType;
  /** Header name for context ID (default: 'x-ash-context-id') */
  contextIdHeader?: string;
  /** Header name for proof (default: 'x-ash-proof') */
  proofHeader?: string;
}
