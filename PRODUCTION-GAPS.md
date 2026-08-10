# Production Gaps

This is a POC. These assumptions and simplifications block production use until
addressed.

## Provider integration

- The fake provider writes to the same PostgreSQL database, so request state,
  provider state, and audit rows commit in one transaction. A real remote provider
  (LaunchDarkly, Unleash, in-house) cannot share that transaction. Production needs
  idempotency keys on every provider call, a reconciliation loop that detects drift
  between intended and actual provider state, and an outbox (or saga) so a crash
  between DB commit and provider call cannot lose or duplicate a change.
- No retry, timeout, circuit-breaker, or partial-failure handling.

## Identity and access

- Seeded credential accounts with bcrypt hashes and JWT sessions. Production needs
  SSO/OIDC against the company IdP, session revocation, MFA enforcement, and
  automated on/offboarding. Role assignment here is a seed-time constant.
- No per-flag or per-environment permission granularity, no break-glass path.

## Audit

- Append-only is an application-layer discipline (one writer module, no mutating
  route). Production needs database-level enforcement (REVOKE UPDATE/DELETE, or WORM
  storage), retention policy, tamper evidence (hash chaining), and export for
  compliance review.

## Flag classification and blast radius

- All flags here are virtual and non-transactional. A pilot must classify flags and
  keep payment, KYC, access, and risk-decision flags out of scope until the control
  plane passes a security review.

## Operations

- No rate limiting, monitoring, alerting, backup/restore drill, or scaling posture.
- Compose stack is for local demo. There is deliberately no deployment workflow.
- Secrets in compose.yaml are demo constants; production needs a secret manager.

## Governance parity with Power Apps

- Power Apps provides DLP policies, Dataverse auditing, managed environments, and
  connector governance out of the box. This codebase owns none of those yet. Any
  migration decision must price building or buying equivalents.
