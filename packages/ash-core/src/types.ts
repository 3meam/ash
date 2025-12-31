/**
 * ASH Protocol Core Types
 * @module @anthropic/ash-core
 */

/** Security modes for ASH protocol */
export type AshMode = 'minimal' | 'balanced' | 'strict';

/** Error codes returned by ASH verification */
export type AshErrorCode =
  | 'ASH_INVALID_CONTEXT'
  | 'ASH_CONTEXT_EXPIRED'
  | 'ASH_REPLAY_DETECTED'
  | 'ASH_INTEGRITY_FAILED'
  | 'ASH_ENDPOINT_MISMATCH'
  | 'ASH_MODE_VIOLATION'
  | 'ASH_UNSUPPORTED_CONTENT_TYPE'
  | 'ASH_MALFORMED_REQUEST'
  | 'ASH_CANONICALIZATION_FAILED';

/** Input for building a proof */
export interface BuildProofInput {
  /** ASH mode (currently only 'balanced' in v1) */
  mode: AshMode;
  /** Canonical binding: "METHOD /path" */
  binding: string;
  /** Server-issued context ID */
  contextId: string;
  /** Optional server-issued nonce */
  nonce?: string;
  /** Canonicalized payload string */
  canonicalPayload: string;
}

/** Context as stored on server */
export interface StoredContext {
  /** Unique context identifier (CSPRNG) */
  contextId: string;
  /** Canonical binding: "METHOD /path" */
  binding: string;
  /** Security mode */
  mode: AshMode;
  /** Timestamp when context was issued (ms epoch) */
  issuedAt: number;
  /** Timestamp when context expires (ms epoch) */
  expiresAt: number;
  /** Optional nonce for server-assisted mode */
  nonce?: string;
  /** Timestamp when context was consumed (null if not consumed) */
  consumedAt?: number | null;
}

/** Public context info returned to client */
export interface ContextPublicInfo {
  /** Opaque context ID */
  contextId: string;
  /** Expiration timestamp (ms epoch) */
  expiresAt: number;
  /** Security mode */
  mode: AshMode;
  /** Optional nonce (if server-assisted mode) */
  nonce?: string;
}

/** Supported content types */
export type SupportedContentType = 'application/json' | 'application/x-www-form-urlencoded';

/** HTTP methods */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
