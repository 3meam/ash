# ASH Protocol Specification v1.0

## Overview

ASH (Application Security Hash) is an integrity verification protocol designed for Web/API environments.

## Core Concepts

### 1. Integrity, Not Authentication
ASH verifies that a request has not been tampered with. It does NOT:
- Authenticate users
- Encrypt data
- Manage sessions

### 2. Determinism
The same input MUST always produce the same output across:
- Different Node.js versions
- Different operating systems
- Different hardware architectures

### 3. Fail-Closed
On ANY error or ambiguity, verification MUST fail. Never fail-open.

## Protocol Flow

```
Client                                Server
  |                                     |
  |-- Generate Proof ------------------>|
  |   (canonical_data + secret + ctx)   |
  |                                     |
  |<-- Verify Proof --------------------|
  |   (regenerate + compare)            |
  |                                     |
  |<-- Accept/Reject -------------------|
```

## Components

### Canonicalization
- Input data MUST be transformed to canonical form before hashing
- JSON keys sorted alphabetically
- Whitespace normalized
- Unicode normalized (NFC)
- Numbers in consistent format

### Proof Generation
- HMAC-SHA256 of canonical data
- Context ID binding for replay protection
- Hex-encoded output

### Verification
- Constant-time comparison
- Context consumption (atomic)
- Fail-closed on any error

## Security Boundaries

### Protected Against
- Request tampering
- Replay attacks
- Parameter manipulation

### NOT Protected Against
- Compromised secrets
- Client-side attacks
- Man-in-the-middle (without TLS)

## Error Semantics

Errors MUST:
- Be clear enough for debugging
- Not leak sensitive information
- Guide correct usage
