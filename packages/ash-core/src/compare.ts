/**
 * ASH Protocol Secure Comparison
 *
 * Constant-time comparison to prevent timing attacks.
 *
 * @module @anthropic/ash-core
 */

import { timingSafeEqual } from 'crypto';

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
export function timingSafeCompare(a: string, b: string): boolean {
  // Convert strings to buffers
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');

  // If lengths differ, we still need constant-time behavior
  // Compare against a buffer of the same length to avoid timing leak
  if (bufA.length !== bufB.length) {
    // Compare bufA with itself to maintain constant time
    // but return false since lengths differ
    timingSafeEqual(bufA, bufA);
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}

/**
 * Compare two buffers in constant time.
 *
 * @param a - First buffer
 * @param b - Second buffer
 * @returns true if buffers are equal, false otherwise
 */
export function timingSafeCompareBuffers(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) {
    // Compare a with itself to maintain constant time
    timingSafeEqual(a, a);
    return false;
  }

  return timingSafeEqual(a, b);
}
