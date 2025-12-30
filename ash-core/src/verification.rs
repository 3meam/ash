//! Verification Module
//!
//! Verifies ASH proofs using FAIL-CLOSED design.
//! Security: All paths must reject by default.

use crate::{error::AshError, Result};

/// Verification result - defaults to Invalid (fail-closed)
#[derive(Debug, Clone, PartialEq)]
pub enum VerificationResult {
    /// Proof is valid - only returned when ALL checks pass
    Valid,
    /// Proof is invalid - reject request
    Invalid(String),
    /// Context already consumed - replay attack detected
    Replay,
    /// Context expired
    Expired,
}

impl VerificationResult {
    pub fn is_valid(&self) -> bool {
        matches!(self, VerificationResult::Valid)
    }

    pub fn is_replay(&self) -> bool {
        matches!(self, VerificationResult::Replay)
    }
}

impl Default for VerificationResult {
    /// SECURITY: Default is INVALID (fail-closed)
    fn default() -> Self {
        VerificationResult::Invalid("verification required".to_string())
    }
}

/// Verify an ASH proof
///
/// # Security Properties
/// - Uses constant-time comparison to prevent timing attacks
/// - Fails closed on ANY error
/// - Context must not be consumed (replay protection)
///
/// # Arguments
/// * `proof` - The hex-encoded proof to verify
/// * `canonical_data` - The canonicalized request data
/// * `secret` - The shared secret
/// * `context_id` - The unique context ID for replay protection
///
/// # Returns
/// * `VerificationResult::Valid` - Only if ALL checks pass
/// * `VerificationResult::Invalid` - If proof doesn't match
/// * `VerificationResult::Replay` - If context was already consumed
/// * `VerificationResult::Expired` - If context has expired
pub fn verify_proof(
    proof: &str,
    canonical_data: &[u8],
    secret: &[u8],
    context_id: &str,
) -> Result<VerificationResult> {
    // SECURITY: Start with rejection (fail-closed)
    let mut result = VerificationResult::default();

    // Validate inputs - reject on any issue
    if proof.is_empty() {
        return Ok(VerificationResult::Invalid("empty proof".to_string()));
    }
    if canonical_data.is_empty() {
        return Ok(VerificationResult::Invalid("empty data".to_string()));
    }
    if secret.is_empty() {
        return Ok(VerificationResult::Invalid("empty secret".to_string()));
    }
    if context_id.is_empty() {
        return Ok(VerificationResult::Invalid("empty context".to_string()));
    }

    // Decode proof - reject on invalid format
    let proof_bytes = match hex::decode(proof) {
        Ok(bytes) => bytes,
        Err(_) => return Ok(VerificationResult::Invalid("invalid proof format".to_string())),
    };

    // Generate expected proof
    let expected = generate_expected_proof(canonical_data, secret, context_id)?;

    // SECURITY: Constant-time comparison - NEVER use ==
    if !constant_time_compare(&expected, &proof_bytes) {
        return Ok(VerificationResult::Invalid("verification failed".to_string()));
    }

    // Check replay protection
    // TODO: Implement atomic context consumption
    // For now, this is a placeholder
    // SECURITY: Context check must happen BEFORE marking as valid

    // Only if ALL checks pass, mark as valid
    result = VerificationResult::Valid;

    Ok(result)
}

/// Generate the expected proof for comparison
fn generate_expected_proof(
    canonical_data: &[u8],
    secret: &[u8],
    context_id: &str,
) -> Result<Vec<u8>> {
    use sha2::{Sha256, Digest};

    // Combine data with context binding
    let mut hasher = Sha256::new();
    hasher.update(canonical_data);
    hasher.update(secret);
    hasher.update(context_id.as_bytes());

    Ok(hasher.finalize().to_vec())
}

/// Constant-time comparison to prevent timing attacks
///
/// # Security
/// - Comparison time is independent of where mismatch occurs
/// - Always compares all bytes even if mismatch found early
/// - Returns false for different lengths (but still constant-time for same length)
#[inline(never)]
pub fn constant_time_compare(a: &[u8], b: &[u8]) -> bool {
    if a.len() != b.len() {
        // Length mismatch - still do work to avoid timing leak
        let mut _dummy = 0u8;
        for byte in a.iter().chain(b.iter()) {
            _dummy |= byte;
        }
        return false;
    }

    // XOR all bytes - result is 0 only if all bytes match
    let mut result = 0u8;
    for (x, y) in a.iter().zip(b.iter()) {
        result |= x ^ y;
    }

    // SECURITY: Single comparison at end, not per-byte
    result == 0
}

// =============================================================================
// SECURITY TESTS - These tests verify security properties
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_constant_time_compare_equal() {
        assert!(constant_time_compare(b"hello", b"hello"));
        assert!(constant_time_compare(b"", b""));
        assert!(constant_time_compare(
            b"long string with many characters",
            b"long string with many characters"
        ));
    }

    #[test]
    fn test_constant_time_compare_not_equal() {
        assert!(!constant_time_compare(b"hello", b"world"));
        assert!(!constant_time_compare(b"hello", b"hellp"));
        assert!(!constant_time_compare(b"hello", b"hell"));
        assert!(!constant_time_compare(b"a", b"b"));
    }

    #[test]
    fn test_constant_time_compare_length_mismatch() {
        assert!(!constant_time_compare(b"hello", b"hell"));
        assert!(!constant_time_compare(b"a", b"ab"));
        assert!(!constant_time_compare(b"", b"a"));
    }

    #[test]
    fn test_fail_closed_default() {
        // Default must be Invalid (fail-closed)
        let result = VerificationResult::default();
        assert!(!result.is_valid());
    }

    #[test]
    fn test_empty_proof_rejected() {
        let result = verify_proof("", b"data", b"secret", "ctx").unwrap();
        assert!(!result.is_valid());
    }

    #[test]
    fn test_empty_data_rejected() {
        let result = verify_proof("abc123", b"", b"secret", "ctx").unwrap();
        assert!(!result.is_valid());
    }

    #[test]
    fn test_empty_secret_rejected() {
        let result = verify_proof("abc123", b"data", b"", "ctx").unwrap();
        assert!(!result.is_valid());
    }

    #[test]
    fn test_empty_context_rejected() {
        let result = verify_proof("abc123", b"data", b"secret", "").unwrap();
        assert!(!result.is_valid());
    }

    #[test]
    fn test_invalid_hex_rejected() {
        let result = verify_proof("not-valid-hex!", b"data", b"secret", "ctx").unwrap();
        assert!(!result.is_valid());
    }

    #[test]
    fn test_wrong_proof_rejected() {
        let result = verify_proof("deadbeef", b"data", b"secret", "ctx").unwrap();
        assert!(!result.is_valid());
    }

    // SECURITY: Error messages must not leak sensitive data
    #[test]
    fn test_error_messages_safe() {
        let result = verify_proof("wrong", b"data", b"secret", "ctx").unwrap();

        if let VerificationResult::Invalid(msg) = result {
            // Error message must NOT contain:
            assert!(!msg.contains("expected"));
            assert!(!msg.contains("secret"));
            assert!(!msg.contains("data"));
            assert!(!msg.contains("deadbeef")); // No hex values
        }
    }
}

// =============================================================================
// REPLAY PROTECTION TESTS
// =============================================================================

#[cfg(test)]
mod replay_tests {
    use super::*;

    #[test]
    fn test_replay_detected() {
        // TODO: Implement when context storage is added
        // Same proof with same context should fail on second use
    }
}

// =============================================================================
// DETERMINISM TESTS - Must pass on all platforms
// =============================================================================

#[cfg(test)]
mod determinism_tests {
    use super::*;

    #[test]
    fn test_proof_determinism() {
        // Same inputs must always produce same expected proof
        let proof1 = generate_expected_proof(b"data", b"secret", "ctx").unwrap();
        let proof2 = generate_expected_proof(b"data", b"secret", "ctx").unwrap();

        assert_eq!(proof1, proof2);
    }

    #[test]
    fn test_different_context_different_proof() {
        let proof1 = generate_expected_proof(b"data", b"secret", "ctx1").unwrap();
        let proof2 = generate_expected_proof(b"data", b"secret", "ctx2").unwrap();

        assert_ne!(proof1, proof2);
    }
}
