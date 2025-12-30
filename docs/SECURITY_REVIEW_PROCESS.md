# Security Review Process

This document defines the mandatory security review process for ASH.

---

## Review Levels

### Level 1: Standard Review
**Required for**: All PRs

- [ ] Code compiles without warnings
- [ ] All tests pass
- [ ] No obvious security issues

**Reviewer**: Any team member

---

### Level 2: Security Review
**Required for**: Changes to verification, proof, canonicalization

- [ ] All Level 1 checks
- [ ] Constant-time comparisons verified
- [ ] Fail-closed behavior verified
- [ ] No new downgrade paths
- [ ] No bypass logic introduced
- [ ] Error messages reviewed for leaks
- [ ] Threat model tests updated

**Reviewer**: Security Engineer (MANDATORY)

---

### Level 3: Protocol Review
**Required for**: Changes to specification, new features

- [ ] All Level 2 checks
- [ ] Specification updated
- [ ] Decision documented in ADR
- [ ] Impact on existing implementations assessed
- [ ] Backward compatibility verified or documented

**Reviewer**: R&D Lead (MANDATORY)

---

## Review Checklist by File

| File/Directory | Review Level | Required Reviewers |
|----------------|--------------|-------------------|
| `verification.rs` | Level 2 | Security Engineer |
| `proof.rs` | Level 2 | Security Engineer |
| `canonicalization.rs` | Level 2 | Deterministic Engineer |
| `threat_tests.rs` | Level 2 | Security Engineer |
| `docs/specs/*` | Level 3 | R&D Lead |
| `docs/vectors/*` | Level 2 | Test Engineer |
| `.github/workflows/*` | Level 2 | Lead Backend |
| All other files | Level 1 | Any team member |

---

## Security Sign-Off Requirements

### Before Merge
1. CI passes all security checks
2. Required reviewers approved
3. Security checklist in PR is complete

### Before Release
1. All threat model tests pass
2. Security Engineer final approval
3. R&D Lead final approval
4. No open security issues

---

## Incident Response

### If Security Issue Found

1. **DO NOT** create public GitHub issue
2. Contact Security Engineer directly
3. Document in private security tracker
4. Fix in private branch
5. Security Engineer reviews fix
6. Coordinate disclosure

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| Critical | Active exploit, data breach | Immediate |
| High | Bypass possible, replay vulnerability | 24 hours |
| Medium | Edge case issues | 1 week |
| Low | Documentation, minor issues | Next release |

---

## Architecture Decision Records (ADRs)

All security-relevant decisions must be documented:

```markdown
# ADR-XXX: Title

## Status
Proposed / Accepted / Deprecated

## Context
Why is this decision needed?

## Decision
What was decided?

## Consequences
What are the implications?

## Security Impact
How does this affect security boundaries?
```

Location: `docs/decisions/`

---

## Automated Security Checks

The following checks run on every PR:

1. **cargo audit** - Known vulnerability scan
2. **Constant-time check** - Grep for unsafe comparisons
3. **Fail-open check** - Grep for dangerous patterns
4. **Determinism tests** - Cross-platform verification
5. **Error message audit** - Check for leaks

All checks must pass before merge.
