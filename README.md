# Feature-Flag Change-Control Plane

A demo operations console where a developer proposes a feature-flag change for a
virtual DEV, STAGING, or PRODUCTION environment, a different release approver approves
or rejects it, the approver applies or rolls it back through a deterministic fake
provider, and an auditor inspects the full decision trail.

Everything is synthetic. No real flag provider, identity provider, customer record,
secret, payment system, or production environment is involved. Virtual PRODUCTION is
only a label in the demo database. This is a prototype, not a Power Apps replacement
and not a production flag service.

## Quick start (Docker only)

No host Node, database, or browser needed.

```sh
make up        # build and start app + PostgreSQL, migrate, seed
# open http://localhost:3000
make down      # stop containers, keep the database volume
make logs      # tail the stack
```

## Demo accounts

Password for every account: `demo-password-123`

| Email | Role |
| --- | --- |
| dana.dev@example.test | DEVELOPER |
| devon.dev@example.test | DEVELOPER |
| rae.approver@example.test | RELEASE_APPROVER |
| riley.approver@example.test | RELEASE_APPROVER |
| ada.auditor@example.test | AUDITOR |

## Make targets

| Target | What it does |
| --- | --- |
| `make up` | build and start app and PostgreSQL containers |
| `make down` | stop and remove containers, database volume preserved |
| `make logs` | tail the local stack |
| `make test` | lint, typecheck, and Vitest in containers |
| `make test-e2e` | Playwright workflow in a container against the Compose stack |
| `make verify` | all required checks, including E2E, through Docker |
| `make evidence` | run `make verify`, then write factual `docs/evidence.js` |
| `make clean-stack` | remove containers AND the database volume (explicit) |

## Architecture

```
 Browser (role-aware console, Next.js App Router + Tailwind)
    |
    v
 Server action ── Zod parse ── Auth.js session ── role policy ── transition guard
    |                                                                  |
    v                                                                  v
 Prisma $transaction [ ChangeRequest update (optimistic version) + AuditEvent append ]
    |
    v
 FakeFlagProvider.applyChange / rollbackChange (in-DB state, deterministic)
```

Reusable primitives and where they live:

- Server-side role policy: `src/domain/policy.ts`
- State-transition guard: `src/domain/transitions.ts`
- Two-person approval rule: `authorize()` in `src/domain/policy.ts`
- Append-only audit writer: `src/server/audit.ts` (no route or UI edits/deletes audit rows)
- Provider adapter: `src/domain/provider.ts` (`FeatureFlagProvider` + `FakeFlagProvider`)
- Workflow executor tying them together atomically: `src/server/workflow.ts`

State machine:

```
DRAFT -> PENDING_APPROVAL -> APPROVED -> APPLIED -> ROLLED_BACK
                       \--> REJECTED
```

Every successful transition appends an audit event in the same database transaction.
The fake provider stores its state in the same database, which is the only reason
provider state and audit records can commit atomically. A real remote provider could
not share that transaction. See `PRODUCTION-GAPS.md`.

## Known limits

- Fake provider only. No idempotency keys, reconciliation, or outbox pattern.
- Auth.js credentials with JWT sessions, not SSO/OIDC. Demo accounts are seeded.
- Audit is append-only at the application layer, not at the database privilege layer.
- No DLP, notifications, analytics, multi-tenancy, or deployment workflow.
- Flags here are virtual and non-transactional. Payment, KYC, access, and
  risk-decision flags stay out of scope until a security review.

More detail: `DECISIONS.md`, `PRODUCTION-GAPS.md`, `docs/DEVIN-EXECUTION-PLAN.md`.
Presentation deck: open `docs/index.html` in a browser.
