/**
 * ASH Protocol Core Types
 * @module @anthropic/ash-core
 */
/** Security modes for ASH protocol */
type AshMode = 'minimal' | 'balanced' | 'strict';
/** Error codes returned by ASH verification */
type AshErrorCode = 'ASH_INVALID_CONTEXT' | 'ASH_CONTEXT_EXPIRED' | 'ASH_REPLAY_DETECTED' | 'ASH_INTEGRITY_FAILED' | 'ASH_ENDPOINT_MISMATCH' | 'ASH_MODE_VIOLATION' | 'ASH_UNSUPPORTED_CONTENT_TYPE' | 'ASH_MALFORMED_REQUEST' | 'ASH_CANONICALIZATION_FAILED';
/** Input for building a proof */
interface BuildProofInput {
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
interface StoredContext {
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
interface ContextPublicInfo {
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
type SupportedContentType = 'application/json' | 'application/x-www-form-urlencoded';
/** HTTP methods */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * ASH Protocol Error Classes
 * @module @anthropic/ash-core
 */

/** HTTP status codes for ASH errors */
declare const ASH_ERROR_HTTP_STATUS: Record<AshErrorCode, number>;
/** User-friendly error messages */
declare const ASH_ERROR_MESSAGES: Record<AshErrorCode, string>;
/**
 * Base error class for ASH protocol errors.
 * Errors MUST NOT leak secrets, canonical string, or payload.
 */
declare class AshError extends Error {
    readonly code: AshErrorCode;
    readonly httpStatus: number;
    constructor(code: AshErrorCode, message?: string);
    /** Convert to safe JSON (no sensitive data) */
    toJSON(): {
        code: AshErrorCode;
        message: string;
        httpStatus: number;
    };
}
/** Context not found */
declare class InvalidContextError extends AshError {
    constructor(message?: string);
}
/** Context has expired */
declare class ContextExpiredError extends AshError {
    constructor(message?: string);
}
/** Context already consumed (replay attempt) */
declare class ReplayDetectedError extends AshError {
    constructor(message?: string);
}
/** Proof does not match expected value */
declare class IntegrityFailedError extends AshError {
    constructor(message?: string);
}
/** Request binding does not match context binding */
declare class EndpointMismatchError extends AshError {
    constructor(message?: string);
}
/** Content type not supported */
declare class UnsupportedContentTypeError extends AshError {
    constructor(message?: string);
}
/** Canonicalization failed */
declare class CanonicalizationError extends AshError {
    constructor(message?: string);
}

/**
 * ASH Protocol Canonicalization Engine
 *
 * Deterministic canonicalization for JSON and URL-encoded payloads.
 * Same input MUST produce identical output across all implementations.
 *
 * @module @anthropic/ash-core
 */
/**
 * Canonicalize a JSON value to a deterministic string.
 *
 * Rules (from ASH-Spec-v1.0):
 * - JSON minified (no whitespace)
 * - Object keys sorted lexicographically (ascending)
 * - Arrays preserve order
 * - Unicode normalization: NFC
 * - Numbers: no scientific notation, remove trailing zeros, -0 becomes 0
 * - Unsupported values REJECT: NaN, Infinity, undefined
 *
 * @param value - The value to canonicalize
 * @returns Canonical JSON string
 * @throws {CanonicalizationError} If value contains unsupported types
 */
declare function canonicalizeJson(value: unknown): string;
/**
 * Canonicalize URL-encoded form data.
 *
 * Rules (from ASH-Spec-v1.0):
 * - Parse into key-value pairs
 * - Percent-decode consistently
 * - Sort keys lexicographically
 * - For duplicate keys: preserve value order per key
 * - Output format: k1=v1&k1=v2&k2=v3
 * - Unicode NFC applies after decoding
 *
 * @param input - URL-encoded string or Record of key-value pairs
 * @returns Canonical URL-encoded string
 * @throws {CanonicalizationError} If input cannot be parsed
 */
declare function canonicalizeUrlEncoded(input: string | Record<string, string | string[]>): string;
/**
 * Normalize a binding string.
 *
 * Rules (from ASH-Spec-v1.0):
 * - Format: "METHOD /path"
 * - Method uppercased
 * - Path must start with /
 * - Path excludes query string
 * - Collapse duplicate slashes
 *
 * @param method - HTTP method
 * @param path - Request path
 * @returns Normalized binding string
 */
declare function normalizeBinding(method: string, path: string): string;

/**
 * ASH Protocol Proof Generation
 *
 * Deterministic hash-based integrity proof.
 * Same inputs MUST produce identical proof across all implementations.
 *
 * @module @anthropic/ash-core
 */

/**
 * Build a deterministic proof from the given inputs.
 *
 * Proof structure (from ASH-Spec-v1.0):
 * ```
 * proof = SHA256(
 *   "ASHv1" + "\n" +
 *   mode + "\n" +
 *   binding + "\n" +
 *   contextId + "\n" +
 *   (nonce? + "\n" : "") +
 *   canonicalPayload
 * )
 * ```
 *
 * Output: Base64URL encoded (no padding)
 *
 * @param input - Proof input parameters
 * @returns Base64URL encoded proof string
 */
declare function buildProof(input: BuildProofInput): string;
/**
 * Decode a Base64URL string to a buffer.
 * Handles both padded and unpadded input.
 */
declare function base64UrlDecode(input: string): Buffer;

/**
 * ASH Protocol Secure Comparison
 *
 * Constant-time comparison to prevent timing attacks.
 *
 * @module @anthropic/ash-core
 */
/**
 * Compare two strings in constant time.
 *
 * This prevents timing attacks where an attacker could determine
 * partial matches based on comparison duration.
 *
 * @param a - First string
 * @param b - Second string
 * @returns true if strings are equal, false otherwise
 */
declare function timingSafeCompare(a: string, b: string): boolean;
/**
 * Compare two buffers in constant time.
 *
 * @param a - First buffer
 * @param b - Second buffer
 * @returns true if buffers are equal, false otherwise
 */
declare function timingSafeCompareBuffers(a: Buffer, b: Buffer): boolean;

export { ASH_ERROR_HTTP_STATUS, ASH_ERROR_MESSAGES, AshError, type AshErrorCode, type AshMode, type BuildProofInput, CanonicalizationError, ContextExpiredError, type ContextPublicInfo, EndpointMismatchError, type HttpMethod, IntegrityFailedError, InvalidContextError, ReplayDetectedError, type StoredContext, type SupportedContentType, UnsupportedContentTypeError, base64UrlDecode, buildProof, canonicalizeJson, canonicalizeUrlEncoded, normalizeBinding, timingSafeCompare, timingSafeCompareBuffers };
