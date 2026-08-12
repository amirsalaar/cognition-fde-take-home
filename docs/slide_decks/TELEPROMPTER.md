# Teleprompter Script

Target: 5 minutes total. Slides 1–4 take about 1 minute. Screen share takes 2 minutes 30 seconds. Slides 5–7 take about 1 minute 30 seconds.
Advance the slide when you reach the marker. Return to Slide 5 after the live walkthrough.

Big Idea: Keep Power Apps where governance carries real risk. Use Devin to prove a custom-build path on bounded internal tools, then decide with evidence.

---

## Slide 1 (0:00 to 0:10)

Good morning. I’m Amir Sojoudi. I’ll make the build-versus-buy case, then show the Devin build lifecycle and the working proof.

**[ADVANCE]**

## Slide 2 (0:10 to 0:35)

The client spends about two hundred fifty thousand dollars a year on Power Apps. Three apps run there today, and at least ten more tools are planned.

My recommendation has two lanes. Keep KYC, refunds, and anything touching payments, access, or risk on Power Apps. Use Devin to prove a custom-build path on the next bounded tool. Power Apps carries governance. Devin accelerates engineering delivery, while the team owns the production system.

**[ADVANCE]**

## Slide 3 (0:35 to 1:00)

The right answer changes by workflow. KYC carries PII and compliance risk. Refunds touch money and reconciliation. Feature flags give us the same propose, approve, apply, rollback, and audit shape with virtual data. A low-risk internal tool can reuse the same patterns next.

That is the screen-share proof point: one built workflow, four clear places where the pattern could fit, and a risk boundary around what we build first.

**[ADVANCE]**

## Slide 4 (1:00 to 1:05)

I want to make the Devin claim concrete. I’m switching to screen share for two and a half minutes. I’ll show the lifecycle from brief to plan, build, tests, running workflow, and evidence. Then I’ll come back to the decision.

**[SCREEN SHARE]**

## Live Devin walkthrough (1:05 to 3:35)

### 0:00 to 0:25, brief and plan

Start in Devin with the original constraint: build a bounded feature-flag change-control plane, keep synthetic data, and make the workflow auditable.

Show the plan and call out the scope boundary. The target is a working proof of role policy, approval, state transitions, audit, and a provider interface. It is not a production migration of KYC or refunds.

### 0:25 to 1:25, running workflow

Open the application. As Developer, create a flag-change request. Show the request moving from draft to pending approval.

Switch to the separate Release Approver. Approve the request, apply it, and show rollback as the recovery path. Then open the Auditor view and show the complete decision trail.

The value for this client is the control pattern: separation of duties, explicit transitions, reversible actions, and an audit record that an operator can inspect.

### 1:25 to 2:05, implementation lifecycle

Return to Devin or the repository. Show the server-side role policy, transition guard, two-person approval, audit writer, and provider adapter. Explain that the UI is the visible result; the reusable value sits in these controls.

### 2:05 to 2:30, verification and client value

Show the Docker verification, ten automated tests, one end-to-end workflow, and the evidence record.

This is where Devin helps: it moves a clear brief through planning, implementation, testing, and explanation quickly enough to change the decision conversation. The same lifecycle can inform the next low-risk internal tool.

**[RETURN TO SLIDE 5]**

## Slide 5 (3:35 to 4:05)

That walkthrough is the delivery evidence. In one Devin-assisted hour, we produced the working POC, the approval and audit workflow, a Docker-runnable environment, ten automated tests, one end-to-end browser test, the evidence package, and this presentation.

We would normally budget multiple engineer-days for an equivalent proof package. This measures prototype speed and feedback speed. Production still requires security, real-provider integration, reliability, and operating ownership.

**[ADVANCE]**

## Slide 6 (4:05 to 4:35)

The workflow patterns are portable: custom UI, role checks, state machines, approvals, audit capture, provider adapters, and tests.

The platform guarantees need deliberate replacements before production: real integration with idempotency and reconciliation, SSO and MFA, DLP and data policy, durable audit controls, monitoring, backups, and on-call ownership. That is why I recommend a hybrid path instead of a wholesale migration.

**[ADVANCE]**

## Slide 7 (4:35 to 5:00)

The next step is a ninety-day pilot. First validate the actual tenant economics. Then run one bounded workflow with a real internal team behind a security and operations gate. Measure cycle time, recovery, audit completeness, engineering effort, and total cost of ownership.

At day ninety, expand the custom path, retain Power Apps, or adopt the hybrid model. Devin fits into that path as the implementation partner for planning, building, testing, iterating, and documenting the bounded tools.

Approve the pilot.

**[END]**
