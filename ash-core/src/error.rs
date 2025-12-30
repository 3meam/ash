//! Error types for ASH operations
//!
//! Errors are designed to be informative for developers
//! but not leak sensitive information.

use thiserror::Error;

#[derive(Error, Debug)]
pub enum AshError {
    #[error("Canonicalization failed: {0}")]
    CanonicalizationError(String),

    #[error("Invalid proof format")]
    InvalidProofFormat,

    #[error("Verification failed")]
    VerificationFailed,

    #[error("Context already consumed")]
    ContextConsumed,

    #[error("Context expired")]
    ContextExpired,

    #[error("Invalid configuration: {0}")]
    ConfigurationError(String),
}
