# Contributing to ASH

## Development Principles

### 1. Spec Compliance
- All implementations must strictly follow the ASH specification
- No personal interpretations or "improvements" without approval
- Document any deviation requests with rationale

### 2. Determinism First
- Same input MUST produce same output across all environments
- Test on multiple Node versions
- Verify byte-level equality

### 3. Fail-Closed Design
- When in doubt, reject
- Never fail-open
- Clear error messages without security leaks

### 4. Misuse Prevention
- APIs should be hard to use incorrectly
- Sensible defaults
- Clear documentation of edge cases

## Code Standards

### Rust (ash-core)
- Follow Rust idioms
- Use `cargo fmt` and `cargo clippy`
- All public APIs must be documented
- Constant-time operations for security-sensitive code

### TypeScript (ash-node)
- Strict TypeScript
- ESLint with security rules
- No `any` types without justification

## Testing Requirements

- All changes require test vectors
- CI must pass before merge
- Determinism tests are mandatory
- Security-sensitive changes require Security Engineer review

## Pull Request Process

1. Create feature branch from `main`
2. Implement with tests
3. Ensure CI passes
4. Request review from appropriate team member
5. Address feedback
6. Squash and merge

## Security Issues

Report security issues privately - see [SECURITY.md](SECURITY.md)
