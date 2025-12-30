//! ASH Core - Integrity Protocol Library
//!
//! This is the reference implementation of the ASH protocol.
//! All other language bindings should use this as the source of truth.

pub mod canonicalization;
pub mod proof;
pub mod verification;
pub mod error;

pub use error::AshError;

/// ASH Protocol Version
pub const VERSION: &str = "1.0.0";

/// Result type for ASH operations
pub type Result<T> = std::result::Result<T, AshError>;
