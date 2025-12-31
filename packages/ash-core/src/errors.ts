/**
 * ASH Protocol Error Classes
 * @module @anthropic/ash-core
 */

import type { AshErrorCode } from './types.js';

/** HTTP status codes for ASH errors */
export const ASH_ERROR_HTTP_STATUS: Record<AshErrorCode, number> = {
  ASH_INVALID_CONTEXT: 400,
  ASH_CONTEXT_EXPIRED: 410,
  ASH_REPLAY_DETECTED: 409,
  ASH_INTEGRITY_FAILED: 400,
  ASH_ENDPOINT_MISMATCH: 400,
  ASH_MODE_VIOLATION: 400,
  ASH_UNSUPPORTED_CONTENT_TYPE: 400,
  ASH_MALFORMED_REQUEST: 400,
  ASH_CANONICALIZATION_FAILED: 400,
};

/** User-friendly error messages */
export const ASH_ERROR_MESSAGES: Record<AshErrorCode, string> = {
  ASH_INVALID_CONTEXT: 'Context not found. Request a new context.',
  ASH_CONTEXT_EXPIRED: 'Context expired. Request a new context.',
  ASH_REPLAY_DETECTED: 'Request already processed. Use a new context.',
  ASH_INTEGRITY_FAILED: 'Payload integrity check failed.',
  ASH_ENDPOINT_MISMATCH: 'Request sent to wrong endpoint.',
  ASH_MODE_VIOLATION: 'Security mode requirements not met.',
  ASH_UNSUPPORTED_CONTENT_TYPE: 'Content type not supported.',
  ASH_MALFORMED_REQUEST: 'Request format is invalid.',
  ASH_CANONICALIZATION_FAILED: 'Failed to canonicalize payload.',
};

/**
 * Base error class for ASH protocol errors.
 * Errors MUST NOT leak secrets, canonical string, or payload.
 */
export class AshError extends Error {
  readonly code: AshErrorCode;
  readonly httpStatus: number;

  constructor(code: AshErrorCode, message?: string) {
    super(message ?? ASH_ERROR_MESSAGES[code]);
    this.name = 'AshError';
    this.code = code;
    this.httpStatus = ASH_ERROR_HTTP_STATUS[code];

    // Capture stack trace (V8 engines)
    if (Error.captureStackTrace !== undefined) {
      Error.captureStackTrace(this, AshError);
    }
  }

  /** Convert to safe JSON (no sensitive data) */
  toJSON(): { code: AshErrorCode; message: string; httpStatus: number } {
    return {
      code: this.code,
      message: this.message,
      httpStatus: this.httpStatus,
    };
  }
}

/** Context not found */
export class InvalidContextError extends AshError {
  constructor(message?: string) {
    super('ASH_INVALID_CONTEXT', message);
    this.name = 'InvalidContextError';
  }
}

/** Context has expired */
export class ContextExpiredError extends AshError {
  constructor(message?: string) {
    super('ASH_CONTEXT_EXPIRED', message);
    this.name = 'ContextExpiredError';
  }
}

/** Context already consumed (replay attempt) */
export class ReplayDetectedError extends AshError {
  constructor(message?: string) {
    super('ASH_REPLAY_DETECTED', message);
    this.name = 'ReplayDetectedError';
  }
}

/** Proof does not match expected value */
export class IntegrityFailedError extends AshError {
  constructor(message?: string) {
    super('ASH_INTEGRITY_FAILED', message);
    this.name = 'IntegrityFailedError';
  }
}

/** Request binding does not match context binding */
export class EndpointMismatchError extends AshError {
  constructor(message?: string) {
    super('ASH_ENDPOINT_MISMATCH', message);
    this.name = 'EndpointMismatchError';
  }
}

/** Content type not supported */
export class UnsupportedContentTypeError extends AshError {
  constructor(message?: string) {
    super('ASH_UNSUPPORTED_CONTENT_TYPE', message);
    this.name = 'UnsupportedContentTypeError';
  }
}

/** Canonicalization failed */
export class CanonicalizationError extends AshError {
  constructor(message?: string) {
    super('ASH_CANONICALIZATION_FAILED', message);
    this.name = 'CanonicalizationError';
  }
}
