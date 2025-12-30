## Description
<!-- Brief description of the changes -->

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Protocol change
- [ ] Documentation
- [ ] Security-related

---

## Security Checklist (MANDATORY)

**All PRs must complete this checklist. Security Engineer must approve security-related changes.**

### Security Boundaries
- [ ] This PR does NOT implement user authentication
- [ ] This PR does NOT implement data encryption
- [ ] This PR does NOT implement session management
- [ ] This PR does NOT implement authorization

### Security Review Checklist
- [ ] **No downgrade paths** - No way to use weaker verification
- [ ] **No bypass logic** - No code path avoids verification
- [ ] **No ambiguity** - All behaviors are explicitly defined
- [ ] **Constant-time comparisons** - Used for all secret/proof comparisons
- [ ] **Replay protection maintained** - Context IDs are single-use
- [ ] **Binding rules enforced** - Proof is bound to specific request
- [ ] **Error messages are safe** - No sensitive data in errors

### Threat Model Verification
- [ ] Tested against logic flaws
- [ ] Tested against protocol misuse
- [ ] Tested against edge cases
- [ ] Tested against race conditions
- [ ] Tested against canonicalization attacks

---

## Test Coverage
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Security tests added/updated (if applicable)
- [ ] Test vectors added (if canonicalization change)

## Documentation
- [ ] Code comments added for complex logic
- [ ] API documentation updated
- [ ] Security boundaries documented (if changed)

---

## Reviewer Assignment

**Required Reviewers by Change Type:**

| Change Type | Required Reviewer |
|-------------|-------------------|
| Core verification logic | Lead Backend Engineer + Security Engineer |
| Canonicalization | Deterministic Systems Engineer |
| API/SDK changes | DX Engineer |
| Security-related | Security Engineer (MANDATORY) |
| Protocol changes | R&D Lead (MANDATORY) |

---

## Final Confirmation

- [ ] I have read and followed the [Security Implementation Guide](docs/SECURITY_IMPLEMENTATION_GUIDE.md)
- [ ] I understand that fail-closed is mandatory
- [ ] I confirm no secrets are logged or exposed in errors
