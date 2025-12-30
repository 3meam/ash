# Security Implementation Guide

This document defines how each team member MUST implement the security policy.

---

## Security Boundaries Implementation

### What ASH Does (MUST Implement)

#### 1. Verifies Request Integrity
**Owner**: Lead Backend/Protocol Engineer

```rust
// REQUIRED: Every request must be verified
pub fn verify_request(request: &Request) -> VerificationResult {
    // NEVER skip verification
    // NEVER return Ok without full verification
}
```

**Implementation Requirements**:
- [ ] All incoming requests pass through verification middleware
- [ ] No endpoint bypasses verification
- [ ] Verification failure = request rejection (fail-closed)

---

#### 2. Prevents Replay Attacks
**Owner**: Lead Backend/Protocol Engineer + Deterministic Systems Engineer

**Implementation Requirements**:
- [ ] Every proof includes a unique context ID
- [ ] Context IDs are consumed atomically (single-use)
- [ ] Context consumption happens BEFORE processing request
- [ ] Expired contexts are rejected
- [ ] Context storage is thread-safe

```rust
// REQUIRED: Atomic context consumption
pub fn consume_context(context_id: &str) -> Result<(), AshError> {
    // MUST be atomic - no race conditions allowed
    // MUST fail if already consumed
    // MUST fail if expired
}
```

---

#### 3. Ensures Deterministic Proof Generation
**Owner**: Deterministic Systems Engineer

**Implementation Requirements**:
- [ ] Canonicalization produces identical output across all environments
- [ ] Test vectors pass on: Linux, macOS, Windows
- [ ] Test vectors pass on: Node 18, 20, 22
- [ ] Unicode normalization (NFC) applied consistently
- [ ] JSON key ordering is deterministic (alphabetical)
- [ ] Number representation is consistent
- [ ] No floating-point operations in proof generation

---

#### 4. Provides Fail-Closed Verification
**Owner**: ALL Engineers

**Implementation Requirements**:
- [ ] Default state is REJECT
- [ ] Any error = REJECT
- [ ] Any ambiguity = REJECT
- [ ] Unknown fields = REJECT
- [ ] Missing fields = REJECT
- [ ] Malformed input = REJECT

```rust
// CORRECT: Fail-closed
pub fn verify(proof: &str) -> VerificationResult {
    // Start with rejection assumption
    let result = VerificationResult::Invalid("verification required");

    // Only change to Valid if ALL checks pass
    // ...
}

// WRONG: Fail-open (NEVER DO THIS)
pub fn verify_wrong(proof: &str) -> VerificationResult {
    // NEVER start assuming valid
    let result = VerificationResult::Valid; // DANGEROUS
}
```

---

## What ASH Does NOT Do (MUST NOT Implement)

### Explicitly Forbidden

| Feature | Status | Enforcement |
|---------|--------|-------------|
| User authentication | FORBIDDEN | Code review rejection |
| Data encryption | FORBIDDEN | Code review rejection |
| Session management | FORBIDDEN | Code review rejection |
| Authorization | FORBIDDEN | Code review rejection |

**If you find yourself implementing any of these, STOP and consult R&D Lead.**

---

## Security Review Checklist - Detailed Implementation

### 1. No Downgrade Paths
**Owner**: Security Engineer

**What it means**: No way to use a weaker verification method.

**Implementation**:
- [ ] No `skip_verification` flags
- [ ] No `legacy_mode` options
- [ ] No `disable_replay_check` settings
- [ ] No environment variables that weaken security
- [ ] Version negotiation always selects strongest option

**Test Cases**:
```rust
#[test]
fn test_no_downgrade_path() {
    // Attempt to bypass verification - must fail
    let config = Config::new().skip_verification(true);
    assert!(config.is_err()); // Config with skip should be rejected
}
```

---

### 2. No Bypass Logic
**Owner**: Security Engineer + Lead Backend Engineer

**What it means**: No code path avoids verification.

**Implementation**:
- [ ] Middleware is not optional
- [ ] No admin endpoints skip verification
- [ ] No internal APIs skip verification
- [ ] No debug mode disables checks
- [ ] Error handlers don't expose bypass

**Required Code Pattern**:
```rust
// All handlers MUST go through verified middleware
pub async fn handler(
    verified: VerifiedRequest, // Type system enforces verification
) -> Response {
    // Can only reach here if verified
}
```

---

### 3. No Ambiguity in Specification
**Owner**: R&D Lead + Technical Writer

**What it means**: Every behavior is explicitly defined.

**Implementation**:
- [ ] All edge cases documented
- [ ] All error conditions documented
- [ ] All valid inputs documented
- [ ] All invalid inputs documented
- [ ] "Undefined behavior" does not exist in spec

---

### 4. Constant-Time Comparisons Used
**Owner**: Lead Backend Engineer + Security Engineer

**What it means**: Comparison time doesn't leak information.

**Implementation**:
- [ ] NEVER use `==` for secret comparison
- [ ] ALWAYS use constant-time compare for proofs
- [ ] ALWAYS use constant-time compare for secrets

**Required Code**:
```rust
// CORRECT: Constant-time comparison
fn verify_proof(expected: &[u8], actual: &[u8]) -> bool {
    constant_time_eq(expected, actual)
}

// WRONG: Variable-time comparison (NEVER USE)
fn verify_proof_wrong(expected: &[u8], actual: &[u8]) -> bool {
    expected == actual // TIMING ATTACK VULNERABLE
}
```

---

### 5. Replay Protection Maintained
**Owner**: Lead Backend Engineer

**What it means**: Same proof cannot be used twice.

**Implementation**:
- [ ] Context IDs are unique (UUID v4 or better)
- [ ] Context consumption is atomic
- [ ] Consumed contexts are tracked (Redis/DB)
- [ ] Context has TTL (expiration)
- [ ] Race condition tests pass

**Required Tests**:
```rust
#[test]
fn test_replay_rejected() {
    let proof = generate_proof(&data, &secret, "ctx-123");

    // First use - should succeed
    assert!(verify(&proof, &data, &secret, "ctx-123").is_valid());

    // Replay - MUST fail
    assert!(verify(&proof, &data, &secret, "ctx-123").is_replay());
}

#[test]
fn test_concurrent_replay_rejected() {
    // Parallel requests with same context - only ONE succeeds
}
```

---

### 6. Binding Rules Enforced
**Owner**: Lead Backend Engineer

**What it means**: Proof is bound to specific request.

**Implementation**:
- [ ] Proof includes method binding
- [ ] Proof includes path binding
- [ ] Proof includes body binding
- [ ] Proof includes context binding
- [ ] Changing ANY bound field invalidates proof

---

### 7. Error Messages Are Safe
**Owner**: DX Engineer + Security Engineer

**What it means**: Errors help debugging but don't leak secrets.

**Safe Error Examples**:
```
✓ "Verification failed"
✓ "Invalid proof format"
✓ "Context expired"
✓ "Context already consumed"
```

**Unsafe Error Examples (NEVER USE)**:
```
✗ "Expected proof: abc123, got: xyz789"
✗ "Secret mismatch for key: user_secret_key"
✗ "Hash comparison failed at byte 5"
```

---

## Threat Model - Test Requirements

### In Scope Threats (MUST Have Tests)

#### Logic Flaws
```rust
#[test]
fn test_logic_flaw_empty_body() { }

#[test]
fn test_logic_flaw_null_values() { }

#[test]
fn test_logic_flaw_type_confusion() { }
```

#### Protocol Misuse
```rust
#[test]
fn test_misuse_wrong_order() { }

#[test]
fn test_misuse_partial_proof() { }

#[test]
fn test_misuse_modified_after_sign() { }
```

#### Edge Cases
```rust
#[test]
fn test_edge_unicode_normalization() { }

#[test]
fn test_edge_empty_string_vs_null() { }

#[test]
fn test_edge_number_precision() { }

#[test]
fn test_edge_deeply_nested_json() { }
```

#### Race Conditions
```rust
#[test]
fn test_race_concurrent_verification() { }

#[test]
fn test_race_context_consumption() { }
```

#### Canonicalization Attacks
```rust
#[test]
fn test_canon_key_ordering_attack() { }

#[test]
fn test_canon_whitespace_attack() { }

#[test]
fn test_canon_unicode_attack() { }

#[test]
fn test_canon_number_representation_attack() { }
```

---

## Role-Specific Security Responsibilities

### Lead Backend/Protocol Engineer
- [ ] Implement constant-time comparisons
- [ ] Implement atomic context consumption
- [ ] Implement fail-closed verification
- [ ] Review all security-sensitive PRs

### Security Engineer
- [ ] Review all PRs for security checklist compliance
- [ ] Write threat model tests
- [ ] Audit for downgrade/bypass paths
- [ ] Maintain security documentation

### Deterministic Systems Engineer
- [ ] Ensure cross-platform determinism
- [ ] Write canonicalization test vectors
- [ ] Prevent environment-dependent behavior
- [ ] Test on multiple platforms/versions

### DX Engineer
- [ ] Design safe error messages
- [ ] Document security boundaries for users
- [ ] Create misuse-resistant APIs
- [ ] Write "What NOT to do" examples

### Test Engineer
- [ ] Implement all threat model tests
- [ ] CI enforces security tests pass
- [ ] Regression tests for security fixes
- [ ] Coverage for all security-critical paths

### R&D Lead
- [ ] Approve all security boundary changes
- [ ] Document security decisions
- [ ] Review spec for ambiguity
- [ ] Final sign-off on releases
