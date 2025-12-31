/**
 * ASH Proof Generation Tests
 * Tests against official test vectors
 */

import { describe, it, expect } from 'vitest';
import { buildProof } from './proof.js';
import type { BuildProofInput } from './types.js';

// Load test vectors
import proofVectors from '../../vectors/proof.vectors.json';

describe('buildProof', () => {
  describe('standard vectors', () => {
    for (const vector of proofVectors.vectors) {
      it(vector.description, () => {
        const input: BuildProofInput = {
          mode: vector.input.mode as 'minimal' | 'balanced' | 'strict',
          binding: vector.input.binding,
          contextId: vector.input.contextId,
          nonce: vector.input.nonce ?? undefined,
          canonicalPayload: vector.input.canonicalPayload,
        };
        const result = buildProof(input);
        expect(result).toBe(vector.expected);
      });
    }
  });

  describe('proof construction', () => {
    it('should produce different proofs for different modes', () => {
      const baseInput: BuildProofInput = {
        mode: 'balanced',
        binding: 'POST /api/test',
        contextId: 'ctx-001',
        canonicalPayload: '{}',
      };

      const proof1 = buildProof(baseInput);
      const proof2 = buildProof({ ...baseInput, mode: 'minimal' });

      expect(proof1).not.toBe(proof2);
    });

    it('should produce different proofs for different bindings', () => {
      const baseInput: BuildProofInput = {
        mode: 'balanced',
        binding: 'POST /api/test',
        contextId: 'ctx-001',
        canonicalPayload: '{}',
      };

      const proof1 = buildProof(baseInput);
      const proof2 = buildProof({ ...baseInput, binding: 'POST /api/other' });

      expect(proof1).not.toBe(proof2);
    });

    it('should produce different proofs for different payloads', () => {
      const baseInput: BuildProofInput = {
        mode: 'balanced',
        binding: 'POST /api/test',
        contextId: 'ctx-001',
        canonicalPayload: '{"a":1}',
      };

      const proof1 = buildProof(baseInput);
      const proof2 = buildProof({ ...baseInput, canonicalPayload: '{"a":2}' });

      expect(proof1).not.toBe(proof2);
    });

    it('should produce different proofs when nonce is added', () => {
      const baseInput: BuildProofInput = {
        mode: 'balanced',
        binding: 'POST /api/test',
        contextId: 'ctx-001',
        canonicalPayload: '{}',
      };

      const proof1 = buildProof(baseInput);
      const proof2 = buildProof({ ...baseInput, nonce: 'nonce-123' });

      expect(proof1).not.toBe(proof2);
    });

    it('should treat empty string nonce as no nonce', () => {
      const baseInput: BuildProofInput = {
        mode: 'balanced',
        binding: 'POST /api/test',
        contextId: 'ctx-001',
        canonicalPayload: '{}',
      };

      const proof1 = buildProof(baseInput);
      const proof2 = buildProof({ ...baseInput, nonce: '' });

      expect(proof1).toBe(proof2);
    });
  });
});
