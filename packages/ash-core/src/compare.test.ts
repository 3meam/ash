/**
 * ASH Secure Comparison Tests
 */

import { describe, it, expect } from 'vitest';
import { timingSafeCompare, timingSafeCompareBuffers } from './compare.js';

describe('timingSafeCompare', () => {
  it('should return true for equal strings', () => {
    expect(timingSafeCompare('hello', 'hello')).toBe(true);
    expect(timingSafeCompare('', '')).toBe(true);
    expect(timingSafeCompare('abc123!@#', 'abc123!@#')).toBe(true);
  });

  it('should return false for different strings', () => {
    expect(timingSafeCompare('hello', 'world')).toBe(false);
    expect(timingSafeCompare('abc', 'abd')).toBe(false);
    expect(timingSafeCompare('test', 'Test')).toBe(false);
  });

  it('should return false for strings of different lengths', () => {
    expect(timingSafeCompare('short', 'longer')).toBe(false);
    expect(timingSafeCompare('', 'a')).toBe(false);
    expect(timingSafeCompare('abc', 'ab')).toBe(false);
  });

  it('should handle Unicode strings', () => {
    expect(timingSafeCompare('café', 'café')).toBe(true);
    expect(timingSafeCompare('👍', '👍')).toBe(true);
    expect(timingSafeCompare('你好', '你好')).toBe(true);
    expect(timingSafeCompare('café', 'cafe')).toBe(false);
  });
});

describe('timingSafeCompareBuffers', () => {
  it('should return true for equal buffers', () => {
    const buf1 = Buffer.from('hello');
    const buf2 = Buffer.from('hello');
    expect(timingSafeCompareBuffers(buf1, buf2)).toBe(true);
  });

  it('should return false for different buffers', () => {
    const buf1 = Buffer.from('hello');
    const buf2 = Buffer.from('world');
    expect(timingSafeCompareBuffers(buf1, buf2)).toBe(false);
  });

  it('should return false for buffers of different lengths', () => {
    const buf1 = Buffer.from('short');
    const buf2 = Buffer.from('longer');
    expect(timingSafeCompareBuffers(buf1, buf2)).toBe(false);
  });

  it('should handle empty buffers', () => {
    const buf1 = Buffer.from('');
    const buf2 = Buffer.from('');
    expect(timingSafeCompareBuffers(buf1, buf2)).toBe(true);
  });
});
