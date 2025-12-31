/**
 * ASH Protocol Canonicalization Engine
 *
 * Deterministic canonicalization for JSON and URL-encoded payloads.
 * Same input MUST produce identical output across all implementations.
 *
 * @module @anthropic/ash-core
 */

import { CanonicalizationError } from './errors.js';

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
export function canonicalizeJson(value: unknown): string {
  return buildCanonicalJson(canonicalizeValue(value));
}

/**
 * Build canonical JSON string manually to ensure key ordering.
 * This is necessary because JavaScript objects don't preserve insertion order
 * for integer-like keys (they're stored in numeric order).
 */
function buildCanonicalJson(value: unknown): string {
  if (value === null) {
    return 'null';
  }

  const type = typeof value;

  if (type === 'string') {
    return JSON.stringify(value);
  }

  if (type === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (type === 'number') {
    return String(value);
  }

  if (Array.isArray(value)) {
    const items = value.map((item) => buildCanonicalJson(item));
    return '[' + items.join(',') + ']';
  }

  if (type === 'object') {
    const obj = value as Record<string, unknown>;
    // Get keys and sort lexicographically with explicit string comparison
    const sortedKeys = Object.keys(obj).sort((a, b) => {
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    });
    const pairs = sortedKeys.map((key) => {
      return JSON.stringify(key) + ':' + buildCanonicalJson(obj[key]);
    });
    return '{' + pairs.join(',') + '}';
  }

  throw new CanonicalizationError(`Cannot serialize type: ${type}`);
}

/**
 * Recursively canonicalize a value.
 */
function canonicalizeValue(value: unknown): unknown {
  // Handle null
  if (value === null) {
    return null;
  }

  // Handle undefined - MUST reject
  if (value === undefined) {
    throw new CanonicalizationError('undefined values are not allowed');
  }

  // Handle primitives
  const type = typeof value;

  if (type === 'string') {
    // Apply NFC normalization to strings
    return (value as string).normalize('NFC');
  }

  if (type === 'boolean') {
    return value;
  }

  if (type === 'number') {
    return canonicalizeNumber(value as number);
  }

  if (type === 'bigint') {
    throw new CanonicalizationError('BigInt values are not supported');
  }

  if (type === 'symbol') {
    throw new CanonicalizationError('Symbol values are not supported');
  }

  if (type === 'function') {
    throw new CanonicalizationError('Function values are not supported');
  }

  // Handle arrays - preserve order
  if (Array.isArray(value)) {
    return value.map((item) => canonicalizeValue(item));
  }

  // Handle objects - sort keys lexicographically
  if (type === 'object') {
    const obj = value as Record<string, unknown>;
    const sortedKeys = Object.keys(obj).sort();
    const result: Record<string, unknown> = {};

    for (const key of sortedKeys) {
      const val = obj[key];
      // Skip undefined values (they would be omitted by JSON.stringify anyway)
      if (val !== undefined) {
        // Normalize key using NFC
        const normalizedKey = key.normalize('NFC');
        result[normalizedKey] = canonicalizeValue(val);
      }
    }

    return result;
  }

  throw new CanonicalizationError(`Unsupported type: ${type}`);
}

/**
 * Canonicalize a number according to ASH spec.
 *
 * Rules:
 * - No scientific notation
 * - Remove trailing zeros
 * - -0 becomes 0
 * - Reject NaN and Infinity
 */
function canonicalizeNumber(num: number): number {
  // Reject NaN
  if (Number.isNaN(num)) {
    throw new CanonicalizationError('NaN values are not allowed');
  }

  // Reject Infinity
  if (!Number.isFinite(num)) {
    throw new CanonicalizationError('Infinity values are not allowed');
  }

  // Convert -0 to 0
  if (Object.is(num, -0)) {
    return 0;
  }

  // Return the number (JSON.stringify handles trailing zeros)
  return num;
}

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
export function canonicalizeUrlEncoded(
  input: string | Record<string, string | string[]>
): string {
  let pairs: Array<[string, string]>;

  if (typeof input === 'string') {
    pairs = parseUrlEncoded(input);
  } else {
    pairs = objectToPairs(input);
  }

  // Normalize all keys and values with NFC
  const normalizedPairs = pairs.map(([key, value]): [string, string] => [
    key.normalize('NFC'),
    value.normalize('NFC'),
  ]);

  // Sort by key (stable sort preserves value order for same keys)
  normalizedPairs.sort((a, b) => {
    if (a[0] < b[0]) return -1;
    if (a[0] > b[0]) return 1;
    return 0;
  });

  // Encode and join
  return normalizedPairs
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

/**
 * Parse URL-encoded string into key-value pairs.
 * Handles + as space (per application/x-www-form-urlencoded spec)
 * Skips empty parts from && or leading/trailing &
 */
function parseUrlEncoded(input: string): Array<[string, string]> {
  if (input === '') {
    return [];
  }

  const pairs: Array<[string, string]> = [];

  for (const part of input.split('&')) {
    // Skip empty parts (from && or leading/trailing &)
    if (part === '') {
      continue;
    }

    // Replace + with space before decoding (per form encoding spec)
    const normalizedPart = part.replace(/\+/g, ' ');

    const eqIndex = normalizedPart.indexOf('=');
    if (eqIndex === -1) {
      // Key with no value - skip if key is empty
      const key = decodeURIComponent(normalizedPart);
      if (key !== '') {
        pairs.push([key, '']);
      }
    } else {
      const key = decodeURIComponent(normalizedPart.slice(0, eqIndex));
      const value = decodeURIComponent(normalizedPart.slice(eqIndex + 1));
      // Skip if key is empty
      if (key !== '') {
        pairs.push([key, value]);
      }
    }
  }

  return pairs;
}

/**
 * Convert object to key-value pairs, preserving array order.
 */
function objectToPairs(obj: Record<string, string | string[]>): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];

  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      for (const v of value) {
        pairs.push([key, v]);
      }
    } else {
      pairs.push([key, value]);
    }
  }

  return pairs;
}

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
export function normalizeBinding(method: string, path: string): string {
  // Uppercase method
  const normalizedMethod = method.toUpperCase();

  // Remove fragment (#...) first
  const fragmentIndex = path.indexOf('#');
  let normalizedPath = fragmentIndex === -1 ? path : path.slice(0, fragmentIndex);

  // Remove query string
  const queryIndex = normalizedPath.indexOf('?');
  normalizedPath = queryIndex === -1 ? normalizedPath : normalizedPath.slice(0, queryIndex);

  // Ensure path starts with /
  if (!normalizedPath.startsWith('/')) {
    normalizedPath = '/' + normalizedPath;
  }

  // Collapse duplicate slashes
  normalizedPath = normalizedPath.replace(/\/+/g, '/');

  // Remove trailing slash (except for root)
  if (normalizedPath.length > 1 && normalizedPath.endsWith('/')) {
    normalizedPath = normalizedPath.slice(0, -1);
  }

  return `${normalizedMethod} ${normalizedPath}`;
}
