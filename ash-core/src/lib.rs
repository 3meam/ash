//! ASH Core - Integrity Protocol Library
//!
//! This is the reference implementation of the ASH protocol.
//! All other language bindings should use this as the source of truth.
//!
//! # Security Boundaries
//!
//! ASH is designed for **integrity verification**, not authentication or encryption.
//!
//! ## What ASH Does
//! - Verifies request integrity
//! - Prevents replay attacks
//! - Ensures deterministic proof generation
//! - Provides fail-closed verification
//!
//! ## What ASH Does NOT Do
//! - User authentication
//! - Data encryption
//! - Session management
//! - Authorization

pub mod canonicalization;
pub mod proof;
pub mod verification;
pub mod error;

#[cfg(test)]
mod threat_tests;

pub use error::AshError;

/// ASH Protocol Version
pub const VERSION: &str = "1.0.0";

/// Result type for ASH operations
pub type Result<T> = std::result::Result<T, AshError>;
