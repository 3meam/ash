/**
 * ASH Canonicalization Tests
 * Tests against official test vectors
 */

import { describe, it, expect } from 'vitest';
import { canonicalizeJson, canonicalizeUrlEncoded, normalizeBinding } from './canonicalize.js';
import { CanonicalizationError } from './errors.js';

// Load test vectors
import jsonVectors from '../../vectors/canonicalization.json.vectors.json';
import urlEncodedVectors from '../../vectors/canonicalization.urlencoded.vectors.json';
import bindingVectors from '../../vectors/binding.vectors.json';

describe('canonicalizeJson', () => {
  describe('standard vectors', () => {
    for (const vector of jsonVectors.vectors) {
      it(vector.description, () => {
        const result = canonicalizeJson(vector.input);
        expect(result).toBe(vector.expected);
      });
    }
  });

  describe('rejection vectors', () => {
    it('should reject NaN', () => {
      expect(() => canonicalizeJson({ value: NaN })).toThrow(CanonicalizationError);
    });

    it('should reject Infinity', () => {
      expect(() => canonicalizeJson({ value: Infinity })).toThrow(CanonicalizationError);
    });

    it('should reject -Infinity', () => {
      expect(() => canonicalizeJson({ value: -Infinity })).toThrow(CanonicalizationError);
    });

    it('should reject undefined', () => {
      expect(() => canonicalizeJson(undefined)).toThrow(CanonicalizationError);
    });

    it('should reject functions', () => {
      expect(() => canonicalizeJson({ fn: () => {} })).toThrow(CanonicalizationError);
    });

    it('should reject symbols', () => {
      expect(() => canonicalizeJson({ sym: Symbol('test') })).toThrow(CanonicalizationError);
    });

    it('should reject BigInt', () => {
      expect(() => canonicalizeJson({ big: BigInt(123) })).toThrow(CanonicalizationError);
    });
  });
});

describe('canonicalizeUrlEncoded', () => {
  describe('standard vectors', () => {
    for (const vector of urlEncodedVectors.vectors) {
      it(vector.description, () => {
        const result = canonicalizeUrlEncoded(vector.input);
        expect(result).toBe(vector.expected);
      });
    }
  });

  describe('edge case vectors', () => {
    if (urlEncodedVectors.edge_cases) {
      for (const vector of urlEncodedVectors.edge_cases) {
        it(vector.description, () => {
          const result = canonicalizeUrlEncoded(vector.input);
          expect(result).toBe(vector.expected);
        });
      }
    }
  });
});

describe('normalizeBinding', () => {
  describe('standard vectors', () => {
    for (const vector of bindingVectors.vectors) {
      it(vector.description, () => {
        const result = normalizeBinding(vector.input.method, vector.input.path);
        expect(result).toBe(vector.expected);
      });
    }
  });
});
