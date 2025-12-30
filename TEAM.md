# ASH Team Structure

## Phase 1 Team (ASH Free v1.0 - Web/API)

### Lean Team: 3-5 People

---

## Core Roles

### 1. Lead Backend / Protocol Engineer (Essential)
**Title**: Senior Backend & Protocol Engineer (Security Libraries)

**Objective**: Design and implement ASH Free v1.0 core according to spec

**Responsibilities**:
- Implement ASH Core (canonicalization, proof, verification)
- Develop professional Middleware (Express/Fastify)
- Design and implement Context lifecycle with atomic consume
- Ensure fail-closed behavior in all cases
- Review HTTP and body parsing edge cases
- Strict compliance with Spec

**Required Skills**:
- 5+ years Backend Development
- Strong Node.js + TypeScript experience
- Deep understanding of HTTP, REST, middleware lifecycle
- Experience with Redis or SQL with atomic operations
- Previous work with JWT/OAuth/Security middleware
- Understanding of stateless vs stateful security
- Replay protection knowledge
- Deterministic systems design

**Bonus Skills**:
- Protocol or Library design experience
- Cryptographic hashing experience
- Developer Tools/Frameworks experience

---

### 2. Security Engineer - AppSec/Protocol (Part-time/Consulting)
**Title**: Application & Protocol Security Engineer

**Objective**: Review ASH from logical security perspective (Logic & Misuse)

**Responsibilities**:
- Threat Modeling (misuse cases)
- Review: Replay protection, Binding rules, Error semantics
- Ensure no downgrade paths or bypass
- Review constant-time comparisons
- Write Security Boundaries documentation

**Required Skills**:
- Application Security experience
- OWASP Top 10 understanding (Logic flaws focus)
- Understanding difference between hashing/signing/encryption
- Secure-by-default design experience
- Threat modeling (STRIDE/misuse cases)
- Cryptographic primitives knowledge

**Role Type**: Part-time / Consulting - Periodic reviews

---

### 3. Deterministic Systems Engineer (Critical)
**Title**: Deterministic Systems / Serialization Engineer

**Objective**: Ensure ASH produces identical outputs across all environments

**Responsibilities**:
- Design and implement canonicalization engine
- Write canonicalization test vectors
- Handle: Unicode normalization, JSON edge cases, URL-encoded parsing
- Prevent any environment-dependent behavior
- Contribute to determinism tests

**Required Skills**:
- Serialization/parsing experience
- Unicode and locale issues understanding
- Experience building systems requiring byte-level equality
- Cross-environment consistency
- JSON edge cases handling

---

### 4. SDK / Developer Experience Engineer (Essential)
**Title**: SDK & Developer Experience Engineer

**Objective**: Make ASH easy to use, hard to misuse

**Responsibilities**:
- Design clean, intuitive APIs
- Build Web Client SDK (JS/TS)
- Design clear, safe error messages for developers
- Write Quick Start and practical examples
- Ensure integration takes no more than 30 minutes

**Required Skills**:
- SDK or Library building experience
- Understanding developer behavior and common mistakes
- Writing clear, copy-paste friendly examples
- API design
- Middleware ergonomics

---

### 5. Test / Quality Engineer (Part-time)
**Title**: Test & Compliance Engineer

**Objective**: Prevent any deviation from standard over time

**Responsibilities**:
- Write Test Vectors
- Build CI pipelines for: canonicalization, proof determinism
- Test replay scenarios
- Ensure changes don't break compatibility

**Required Skills**:
- Testing Libraries experience
- CI/CD understanding
- Regression testing experience
- Determinism tests

**Role Type**: Part-time - Intensive during release periods

---

### 6. Technical Project Manager (Light)
**Title**: Technical Project Manager (Security Tooling)

**Objective**: Deliver ASH Free v1.0 without expansion or delay

**Responsibilities**:
- Scope management and prevent Scope Creep
- Coordinate work between Engineering, Security, Documentation
- Track progress against Spec
- Ensure timeline commitment
- Remove obstacles for team

**Required Skills**:
- Technical/library project experience
- Basic security and development understanding
- Quick decision-making ability

**NOT needed**: Bureaucratic PM, excessive meetings, valueless reports

---

### 7. R&D Lead / Architect (Thought Leadership)
**Title**: R&D Lead / Protocol Architect

**Objective**: Protect core idea and ensure continuity

**Responsibilities**:
- Lead technical vision
- Review architectural decisions
- Ensure ASH:
  - Is not a JWT clone
  - Solves a real problem
- Document why decisions were made
- Initial planning for future versions (no implementation)

**Note**: Usually the project founder

---

### 8. Developer Marketing / DevRel (Technical Marketing Only)
**Title**: Developer Relations / Technical Evangelist

**Objective**: Spread ASH among developers without commercial marketing

**Responsibilities**:
- Write strong README
- Prepare clear Docs
- Write technical article explaining: When to use ASH, When NOT to use it
- Support GitHub issues for early developers

**Required Skills**:
- Technical background
- Explanation and writing ability
- Developer community understanding

---

## Team Summary Table

| Role | Status |
|------|--------|
| Lead Backend / Protocol Engineer | Essential |
| Security Engineer | Part-time/Review |
| Deterministic Systems Engineer | Critical |
| DX / SDK Engineer | Essential |
| Test / Quality Engineer | Part-time |
| Project Manager | Light |
| R&D Lead | Thought Leadership |
| Developer Marketing | One person |

## Critical 3 Roles (Cannot Skip)

1. **Lead Backend / Protocol Engineer**
2. **DX Engineer**
3. **R&D / Architect**

---

## Technology Stack

- **Core**: Rust (Reference implementation)
- **Bindings**: Node.js (Express/Fastify middleware)
- **Future**: WASM for web support
