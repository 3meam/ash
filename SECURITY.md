# Security Policy

## Reporting a Vulnerability

**Do NOT report security vulnerabilities through public GitHub issues.**

Please report security vulnerabilities privately to the security team.

## Security Boundaries

ASH is designed for **integrity verification**, not authentication or encryption.

### What ASH Does
- Verifies request integrity
- Prevents replay attacks
- Ensures deterministic proof generation
- Provides fail-closed verification

### What ASH Does NOT Do
- User authentication
- Data encryption
- Session management
- Authorization

## Security Review Checklist

For any protocol changes:

- [ ] No downgrade paths
- [ ] No bypass logic
- [ ] No ambiguity in specification
- [ ] Constant-time comparisons used
- [ ] Replay protection maintained
- [ ] Binding rules enforced
- [ ] Error messages are safe (no sensitive data leaks)

## Threat Model

### In Scope
- Logic flaws
- Protocol misuse
- Edge cases
- Race conditions
- Canonicalization attacks

### Out of Scope (for Phase 1)
- Traditional web attacks (XSS, SQLi, SSRF)
- Infrastructure attacks
- Client-side attacks
