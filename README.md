# ASH - Integrity Protocol Library

A deterministic integrity verification protocol library built in Rust.

## Architecture

```
ash-core (Rust)      <- Single source of truth
|
├── ash-cli (Rust)         <- Testing / Debug / Demo
├── ash-wasm (future)      <- Web support
├── ash-node (bindings)    <- Express / Fastify middleware
└── docs/vectors           <- Spec + Tests
```

## Core Principles

- **Determinism**: Same input = Same output, always
- **Fail-Closed**: Reject on any doubt
- **Misuse Prevention**: Hard to use incorrectly
- **Protocol Integrity**: Not auth, but verification

## Project Phase

**Current**: ASH Free v1.0 - Web/API

## Getting Started

```bash
# Clone the repository
git clone https://github.com/3meam/ash.git
cd ash

# Build core (Rust)
cd ash-core
cargo build
```

## Documentation

- [Team Structure](TEAM.md)
- [Contributing](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)
- [Specifications](docs/specs/)

## License

Proprietary - All rights reserved
