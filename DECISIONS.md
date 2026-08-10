# Decisions

## Scope

Built the bounded control-plane candidate: a feature-flag change-control console with
roles, a state machine, two-person approval, an append-only audit trail, and a fake
provider adapter. Not built on purpose: a migration of the existing feature-flag admin
panel, a generic internal-tool builder, and anything touching real payments, KYC,
access, or risk-decision flags.

## What this prototype proves

- Devin can produce a reviewable, Git-native internal tool with server-side
  authorization, workflow invariants, tests, Docker execution, and CI in one session.
- The reusable primitives (role policy, transition guard, two-person rule, audit
  writer, provider adapter) are small, isolated modules that later tools can copy.

## What it does not prove

- Nothing here replaces Power Apps platform controls (DLP, Dataverse auditing,
  managed environments, connector governance). Custom code must own equivalents.
- Demo controls are not production-grade security or compliance.
- The atomic provider-plus-audit commit only works because the fake provider lives in
  the same database. It says nothing about real provider integration safety.

## Tradeoffs taken for the timebox

- Auth.js Credentials with JWT session tokens instead of database-backed sessions.
  Sessions are still validated server-side on every request and every mutation
  re-checks role policy against the session. Credentials + database sessions is a
  known awkward pairing in Auth.js; JWT was the lower-risk path in two hours.
- Rollback restores the request's captured before-state rather than a full provider
  version history. Enough prior state is stored to make rollback visible and testable.
- Draft editing is limited to creating a new draft. EDIT exists in the policy layer
  but has no UI form. Submit, approve, reject, apply, and rollback are complete.
- Audit append-only is enforced by code path (single writer, no update/delete route)
  and asserted in review, not by database REVOKE rules.
- One E2E path, not a matrix. The Vitest suite covers the authorization and
  invariant matrix at the domain/workflow layer where the control actually lives.

## Incomplete at time expiry

See RELEASE-READINESS.md for the final checklist state. Anything unchecked there was
cut for time, not silently skipped.
