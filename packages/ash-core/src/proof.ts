/**
 * ASH Protocol Proof Generation
 *
 * Deterministic hash-based integrity proof.
 * Same inputs MUST produce identical proof across all implementations.
 *
 * @module @anthropic/ash-core
 */

import { createHash } from 'crypto';
import type { BuildProofInput } from './types.js';

/** ASH protocol version prefix */
const ASH_VERSION_PREFIX = 'ASHv1';

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
export function buildProof(input: BuildProofInput): string {
  const { mode, binding, contextId, nonce, canonicalPayload } = input;

  // Build the proof input string
  let proofInput = `${ASH_VERSION_PREFIX}\n${mode}\n${binding}\n${contextId}\n`;

  // Add nonce if present (server-assisted mode)
  if (nonce !== undefined && nonce !== '') {
    proofInput += `${nonce}\n`;
  }

  // Add canonical payload
  proofInput += canonicalPayload;

  // Compute SHA-256 hash
  const hash = createHash('sha256').update(proofInput, 'utf8').digest();

  // Encode as Base64URL (no padding)
  return base64UrlEncode(hash);
}

/**
 * Encode a buffer as Base64URL (no padding).
 * RFC 4648 Section 5: Base 64 Encoding with URL and Filename Safe Alphabet
 */
function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Decode a Base64URL string to a buffer.
 * Handles both padded and unpadded input.
 */
export function base64UrlDecode(input: string): Buffer {
  // Convert Base64URL to standard Base64
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/');

  // Add padding if needed
  const padLength = (4 - (base64.length % 4)) % 4;
  base64 += '='.repeat(padLength);

  return Buffer.from(base64, 'base64');
}
