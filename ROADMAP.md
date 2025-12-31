# ASH Free v1.0 - Team Roadmap

## Team Roles
| Code | Role | Primary Focus |
|------|------|---------------|
| **R&D** | R&D / Protocol Architect | Protocol design, core implementation, security |
| **PM** | Technical Project Manager | Coordination, infrastructure, releases |
| **DX** | DX / Developer Advocate | Documentation, examples, developer experience |

---

## MANDATORY: Phase Completion Protocol

Every phase MUST follow this protocol:

### Before Starting a Phase
- [ ] Team kickoff meeting to review phase objectives
- [ ] All dependencies from previous phases verified complete
- [ ] Each team member confirms understanding of their tasks

### After Completing a Phase
- [ ] Run full test suite: `npm test`
- [ ] Verify all gate criteria are met
- [ ] Team review meeting to validate completion
- [ ] Update PROGRESS.md with completion status
- [ ] All team members sign off before proceeding

### Testing Requirements (After Every Phase)
```bash
# Required tests after each phase
npm run typecheck     # TypeScript compilation
npm run lint          # Code quality
npm run test          # Unit + integration tests
npm run build         # Verify build succeeds
```

---

## Phase 0: Project Setup
**Goal**: Infrastructure ready for development

| # | Task | Owner | Depends On | Deliverable |
|---|------|-------|------------|-------------|
| 0.1 | Create GitHub repository | PM | - | Public repo created |
| 0.2 | Initialize monorepo structure | PM | 0.1 | Package folders + root config |
| 0.3 | Setup TypeScript configuration | PM | 0.2 | tsconfig.json files |
| 0.4 | Configure CI/CD (GitHub Actions) | PM | 0.2 | Tests run on PR |
| 0.5 | Setup linting + formatting | PM | 0.3 | ESLint + Prettier config |
| 0.6 | Create issue templates | PM | 0.1 | Bug/Feature templates |

**Gate**: Repository ready with CI pipeline running

---

## Phase 1: Specification Lock
**Goal**: Freeze all protocol decisions

| # | Task | Owner | Depends On | Deliverable |
|---|------|-------|------------|-------------|
| 1.1 | Review ASH-Spec-v1.0.md | R&D | - | Annotated spec |
| 1.2 | Document locked decisions | R&D | 1.1 | DECISIONS.md |
| 1.3 | Define error codes (final) | R&D | 1.1 | Error enum + HTTP mapping |
| 1.4 | Define TypeScript interfaces | R&D | 1.2 | types.ts |
| 1.5 | Team spec review meeting | ALL | 1.2, 1.3, 1.4 | Sign-off |

**Locked Decisions for v1.0:**
```
Mode:           balanced (only)
Hash:           SHA-256
Encoding:       Base64URL (no padding)
Content-Types:  application/json (required)
                application/x-www-form-urlencoded (optional)
Context ID:     128-bit CSPRNG
TTL:            Configurable, recommend < 60s
```

**Gate**: Spec signed off by all team members

---

## Phase 2: Test Vectors
**Goal**: Define expected outputs before implementation

| # | Task | Owner | Depends On | Deliverable |
|---|------|-------|------------|-------------|
| 2.1 | Create JSON canonicalization vectors | R&D | 1.5 | `vectors/canonicalization.json.vectors.json` |
| 2.2 | Create URL-encoded vectors | R&D | 1.5 | `vectors/canonicalization.urlencoded.vectors.json` |
| 2.3 | Create proof generation vectors | R&D | 1.5 | `vectors/proof.vectors.json` |
| 2.4 | Document vector format | DX | 2.1 | Vector README |
| 2.5 | Review vectors for edge cases | R&D | 2.1, 2.2, 2.3 | Edge case coverage |

**Vector Categories:**
```
JSON Canonicalization:
  - Simple objects
  - Nested objects
  - Arrays
  - Unicode strings (NFC)
  - Number edge cases (-0, large numbers, decimals)
  - Key ordering
  - Null values
  - Empty objects/arrays

Proof Generation:
  - With nonce
  - Without nonce
  - Different modes
  - Different bindings
```

**Gate**: All vectors reviewed and committed

---

## Phase 3: Core Implementation (ash-core)
**Goal**: Shared logic used by server and client

| # | Task | Owner | Depends On | Deliverable |
|---|------|-------|------------|-------------|
| 3.1 | Implement `canonicalizeJson()` | R&D | 2.1 | Function + tests |
| 3.2 | Implement `canonicalizeUrlEncoded()` | R&D | 2.2 | Function + tests |
| 3.3 | Implement `buildProof()` | R&D | 2.3 | Function + tests |
| 3.4 | Implement constant-time compare | R&D | 1.5 | `timingSafeEqual()` |
| 3.5 | Implement error classes | R&D | 1.3 | `AshError` + codes |
| 3.6 | Implement binding normalizer | R&D | 1.5 | `normalizeBinding()` |
| 3.7 | Run vectors against implementation | R&D | 3.1-3.6 | 100% vector pass |
| 3.8 | Cross-version Node test | PM | 3.7 | Node 18/20/22 passing |

**Package Structure:**
```
packages/ash-core/
  ├── src/
  │   ├── index.ts
  │   ├── canonicalize.ts
  │   ├── proof.ts
  │   ├── compare.ts
  │   ├── errors.ts
  │   └── types.ts
  ├── tests/
  │   ├── canonicalize.test.ts
  │   ├── proof.test.ts
  │   └── vectors.test.ts
  └── package.json
```

**Gate**: All vectors pass, cross-version tests pass

---

## Phase 4: Server SDK (ash-server)
**Goal**: Production-ready server middleware

| # | Task | Owner | Depends On | Deliverable |
|---|------|-------|------------|-------------|
| 4.1 | Define ContextStore interface | R&D | 3.7 | Interface + types |
| 4.2 | Implement MemoryContextStore | R&D | 4.1 | Dev/test store |
| 4.3 | Implement RedisContextStore | R&D | 4.1 | Production store |
| 4.4 | Implement SqlContextStore | R&D | 4.1 | Production store |
| 4.5 | Implement `createContext()` | R&D | 4.1 | Function + tests |
| 4.6 | Implement `verifyRequest()` | R&D | 4.1, 3.7 | Function + tests |
| 4.7 | Implement Express middleware | R&D | 4.6 | `ashMiddleware()` |
| 4.8 | Implement Fastify middleware | R&D | 4.6 | Fastify plugin |
| 4.9 | Atomic consume tests | R&D | 4.3, 4.4 | Race condition tests |
| 4.10 | Integration tests | R&D | 4.7, 4.8 | E2E test suite |

**Package Structure:**
```
packages/ash-server/
  ├── src/
  │   ├── index.ts
  │   ├── context.ts
  │   ├── verify.ts
  │   ├── middleware/
  │   │   ├── express.ts
  │   │   └── fastify.ts
  │   └── stores/
  │       ├── memory.ts
  │       ├── redis.ts
  │       └── sql.ts
  ├── tests/
  └── package.json
```

**Gate**: All stores pass atomic consume tests, middleware working

---

## Phase 5: Client SDK (ash-client-web)
**Goal**: Browser + Node client library

| # | Task | Owner | Depends On | Deliverable |
|---|------|-------|------------|-------------|
| 5.1 | Setup browser-compatible build | PM | 3.7 | Rollup/esbuild config |
| 5.2 | Export client functions | R&D | 3.7 | Public API |
| 5.3 | Browser compatibility tests | R&D | 5.1 | Chrome/Firefox/Safari |
| 5.4 | Node.js compatibility tests | R&D | 5.2 | Node 18+ |
| 5.5 | Bundle size optimization | PM | 5.1 | < 10KB gzipped |
| 5.6 | Create fetch wrapper helper | DX | 5.2 | `ashFetch()` utility |

**Package Structure:**
```
packages/ash-client-web/
  ├── src/
  │   ├── index.ts
  │   ├── client.ts
  │   └── fetch.ts (optional helper)
  ├── tests/
  ├── dist/
  │   ├── ash-client.esm.js
  │   ├── ash-client.cjs.js
  │   └── ash-client.min.js
  └── package.json
```

**Gate**: Works in browsers + Node, bundle size acceptable

---

## Phase 6: Examples
**Goal**: Working reference implementations

| # | Task | Owner | Depends On | Deliverable |
|---|------|-------|------------|-------------|
| 6.1 | Create Express minimal example | DX | 4.7, 5.2 | Working demo |
| 6.2 | Add tamper detection demo | DX | 6.1 | Visible rejection |
| 6.3 | Add replay detection demo | DX | 6.1 | Visible rejection |
| 6.4 | Create client HTML page | DX | 6.1 | Browser demo |
| 6.5 | Add inline comments | DX | 6.1-6.4 | Educational code |
| 6.6 | Test example end-to-end | PM | 6.1-6.5 | Works out of box |

**Example Structure:**
```
packages/examples/express-minimal/
  ├── server.ts
  ├── public/
  │   └── index.html
  ├── package.json
  └── README.md
```

**Gate**: Example runs with `npm start`, demonstrates all features

---

## Phase 7: Documentation
**Goal**: Developers can integrate in < 30 minutes

| # | Task | Owner | Depends On | Deliverable |
|---|------|-------|------------|-------------|
| 7.1 | Write README.md | DX | 6.6 | Project overview |
| 7.2 | Write QUICKSTART.md | DX | 6.6 | 5-minute guide |
| 7.3 | Write API-REFERENCE.md | DX | 4.10, 5.4 | Full API docs |
| 7.4 | Write SECURITY.md | R&D | - | Boundaries + threats |
| 7.5 | Write ERROR-CODES.md | DX | 1.3 | Error table + fixes |
| 7.6 | Write PRODUCTION.md | R&D | 4.9 | Deployment guide |
| 7.7 | Review all docs | ALL | 7.1-7.6 | Consistency check |
| 7.8 | Add JSDoc comments | DX | 4.10, 5.4 | Inline documentation |

**Gate**: All docs reviewed, no broken links

---

## Phase 8: Security Review
**Goal**: Production-ready security posture

| # | Task | Owner | Depends On | Deliverable |
|---|------|-------|------------|-------------|
| 8.1 | STRIDE threat model review | R&D | 4.10 | Threat assessment |
| 8.2 | Verify constant-time compare | R&D | 3.4 | Timing attack safe |
| 8.3 | Verify CSPRNG usage | R&D | 4.5 | Randomness audit |
| 8.4 | Check for secret leakage | R&D | 4.10 | No payload in logs |
| 8.5 | Dependency audit | PM | - | `npm audit` clean |
| 8.6 | Security checklist sign-off | ALL | 8.1-8.5 | Checklist complete |

**Security Checklist:**
```
[ ] Context IDs are CSPRNG generated (128-bit+)
[ ] Proofs use constant-time comparison
[ ] No payload/proof/canonical data in logs
[ ] Atomic consume prevents replay
[ ] Error messages don't leak internals
[ ] Dependencies have no critical CVEs
```

**Gate**: Security checklist signed by R&D

---

## Phase 9: Release
**Goal**: Public v1.0.0 release

| # | Task | Owner | Depends On | Deliverable |
|---|------|-------|------------|-------------|
| 9.1 | Version bump to 1.0.0 | PM | 8.6 | package.json updated |
| 9.2 | Write CHANGELOG.md | PM | 9.1 | Release notes |
| 9.3 | Create git tag | PM | 9.2 | v1.0.0 tag |
| 9.4 | Publish ash-core to NPM | PM | 9.3 | NPM package live |
| 9.5 | Publish ash-server to NPM | PM | 9.4 | NPM package live |
| 9.6 | Publish ash-client-web to NPM | PM | 9.4 | NPM package live |
| 9.7 | Create GitHub Release | PM | 9.4-9.6 | Release page |
| 9.8 | Announce release | DX | 9.7 | Social/blog post |

**Gate**: All packages on NPM, GitHub release published

---

## Visual Timeline

```
Phase 0 ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░ Project Setup
Phase 1 ░░░░████░░░░░░░░░░░░░░░░░░░░░░░░ Spec Lock
Phase 2 ░░░░░░░░████░░░░░░░░░░░░░░░░░░░░ Test Vectors
Phase 3 ░░░░░░░░░░░░████████░░░░░░░░░░░░ ash-core
Phase 4 ░░░░░░░░░░░░░░░░░░░░████████░░░░ ash-server
Phase 5 ░░░░░░░░░░░░░░░░░░░░░░░░████░░░░ ash-client-web
Phase 6 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░██░░ Examples
Phase 7 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░██░░ Documentation
Phase 8 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██ Security Review
Phase 9 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░█ Release
        ─────────────────────────────────
        Week 1  2  3  4  5  6  7  8  9  10
```

---

## Daily Standup Template

```
Team: ASH v1.0
Date: ___________

R&D:
  Yesterday:
  Today:
  Blockers:

PM:
  Yesterday:
  Today:
  Blockers:

DX:
  Yesterday:
  Today:
  Blockers:

Current Phase: ___
Phase Progress: ___%
```

---

## Communication Channels

| Purpose | Channel |
|---------|---------|
| Daily updates | Standup (async/sync) |
| Technical decisions | GitHub Discussions |
| Code review | GitHub PRs |
| Blockers | Direct message to PM |
| Spec questions | Tag R&D in issue |

---

## Definition of Done

A task is complete when:
- [ ] Code written and self-reviewed
- [ ] Tests written and passing
- [ ] PR created and approved
- [ ] Merged to main branch
- [ ] CI pipeline green

A phase is complete when:
- [ ] All tasks in phase done
- [ ] Gate criteria met
- [ ] Team sign-off received

---

## Quick Reference: Who Does What

| Area | R&D | PM | DX |
|------|:---:|:--:|:--:|
| Protocol design | ● | ○ | ○ |
| Core implementation | ● | ○ | ○ |
| Test vectors | ● | ○ | ○ |
| Security review | ● | ○ | ○ |
| Repo setup | ○ | ● | ○ |
| CI/CD | ○ | ● | ○ |
| Release management | ○ | ● | ○ |
| Dependency updates | ○ | ● | ○ |
| Documentation | ○ | ○ | ● |
| Examples | ○ | ○ | ● |
| API usability | ○ | ○ | ● |
| Developer feedback | ○ | ○ | ● |

● = Primary responsibility
○ = Support/Review
