# Devin Execution Plan: Feature-Flag Change-Control Plane

Timebox: 2 hours. Vertical slice, P0 first, proof over breadth.

## What is being built

A single operations console where a DEVELOPER proposes a feature-flag change for a
virtual environment (DEV / STAGING / PRODUCTION), a different RELEASE_APPROVER approves
or rejects it, the approver applies or rolls it back through a deterministic fake
provider, and an AUDITOR inspects the full decision trail. Synthetic data only. No real
provider, IdP, or environment is touched.

## Sequence

1. Inspect repo, `.devin/agents`, and skills. Write this plan. (done before any code)
2. Scaffold Next.js App Router + TypeScript + Tailwind + Prisma + Auth.js credentials.
3. Prisma schema and seed: User, FeatureFlag, FlagEnvironmentState, ChangeRequest,
   Approval, AuditEvent. Seed covers every status for the recording.
4. Domain layer (framework-free, unit-testable):
   - `src/domain/transitions.ts` - state machine guard
   - `src/domain/policy.ts` - server-side role policy incl. two-person rule
   - `src/domain/provider.ts` - `FeatureFlagProvider` interface + `FakeFlagProvider`
   - `src/server/audit.ts` - append-only audit writer (same DB transaction)
5. Server actions with Zod validation and session-based authorization.
6. Console UI: queue table, search + status/environment filters, detail route with
   before/after diff and audit trail, role-aware actions, login page.
7. Vitest tests for acceptance criteria 1-7; Playwright E2E for criterion 8.
8. Dockerfile (multi-stage, non-root), compose.yaml (healthchecks, no sleeps),
   Makefile (`up`, `down`, `logs`, `test`, `test-e2e`, `verify`, `evidence`).
9. GitHub Actions workflow running the same Docker verification path. No publish.
10. Docs: README, DECISIONS, PRODUCTION-GAPS, REVIEW-LOG, sources. Static deck in
    `/docs` reading only `docs/evidence.js` (starts unverified).
11. `make verify` in Docker, fix failures, `make evidence`.
12. Branch `feature/feature-flag-change-control-plane`, commit incrementally, push,
    open PR, run reviewer agents (`code-simplifier` pre-PR; `code-reviewer`,
    `pr-test-analyzer`, `silent-failure-hunter`, `type-design-analyzer`,
    `comment-analyzer` post-PR), address findings, re-verify, update evidence.
13. Wait for CI, capture real status, squash merge to main per task instruction.

## Parallelization estimate

Two hours and one repository. The dependency chain (schema -> domain -> actions -> UI
-> tests -> Docker verify -> PR -> review) is mostly sequential; the independent lanes
are (a) app code, (b) docs + deck, (c) Docker/CI plumbing. Plan: build (a) directly,
interleave (b) and (c) while containers build, and run the reviewer agents as the
parallel post-PR lane. Spinning up isolated child sessions for lanes b/c would cost
more in handoff than it saves at this size, so parallelism is applied at the review
stage (multiple reviewer agents over the same diff) rather than the build stage.

## State machine

```
DRAFT --submit(requester)--> PENDING_APPROVAL --approve(approver != requester)--> APPROVED
DRAFT --edit--> DRAFT        PENDING_APPROVAL --reject(approver != requester)--> REJECTED
APPROVED --apply(approver, fake provider)--> APPLIED
APPLIED --rollback(approver, fake provider)--> ROLLED_BACK
```

Every successful transition appends an AuditEvent in the same DB transaction.
No route or UI path mutates or deletes audit events.

## Data flow

```
 Browser (role-aware console)
    |
    v
 Next.js server action ── Zod parse ── session -> role policy ── transition guard
    |                                                                  |
    v                                                                  v
 Prisma $transaction [ ChangeRequest update (optimistic version) + AuditEvent append ]
    |
    v
 FakeFlagProvider.applyChange / rollbackChange  (in-DB provider state, deterministic)
```

The fake provider has no external side effect, so provider state, request state, and
the audit record commit atomically. A real remote provider could NOT share that
transaction; idempotency keys, reconciliation, and an outbox are named production gaps.

## Acceptance criteria (tests must pass in Docker)

1. Auditor cannot create, approve, apply, or roll back.
2. Developer cannot approve their own request.
3. Invalid state transitions are rejected.
4. Approve, apply, and rollback each append an audit event with actor + before/after.
5. Rollback restores the previous fake-provider state.
6. Stale/duplicate approval or application rejected by optimistic-version check.
7. Fake-provider failure preserves prior request state, writes no false success audit
   event, and surfaces a recoverable error.
8. E2E: developer submits, a different approver approves and applies, then rolls back.

## Cut lines (in order, if time expires)

P2 polish, deck animation, extra seed variety. Never cut: authorization, workflow
invariants, Docker execution, tests, or honest evidence.
