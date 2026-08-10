# Teleprompter Script

Target: 4 minutes 35 seconds at a calm speaking pace (about 140 words per minute).
One section per slide. Advance the slide when you reach the marker.

Big Idea: Keep Power Apps for governed, control-heavy workflows. Use Devin to
prove a custom-build path on the next bounded tool, then earn any migration
decision with evidence.

---

## Slide 1 (0:00 to 0:40)

You spend about two hundred fifty thousand dollars a year on Power Apps. Three
apps run on it today, and at least ten more tools are planned. The question on
the table is not "Power Apps or Devin." They are not substitutes. Power Apps is
a governed application platform. Devin accelerates engineering work your team
still owns: design, security, review, and operations.

So the recommendation has two lanes. Keep KYC and refunds, and anything touching
payments or risk, on Power Apps. In parallel, prove the custom-build path with
Devin on one bounded tool, and let evidence, not a vendor pitch, drive any
migration decision.

**[ADVANCE]**

## Slide 2 (0:40 to 1:20)

Before we talk about building anything, we have to be honest about what the
spend buys. It is not screen-building. It is governance and operating leverage:
identity and access through Entra ID, managed Dataverse auditing, org-wide DLP
policies, managed environments and ALM, hundreds of governed connectors, and
Microsoft running the hosting and patching.

Every one of those rows becomes your engineering team's problem the moment you
go custom. And one caution: the two-fifty is your stated spend. Validate the
actual license economics against your tenant before anyone claims savings.

**[ADVANCE]**

## Slide 3 (1:20 to 2:00)

Here is the conflict. The apps with the most obvious licensing cost, KYC and
refunds, are exactly the wrong place to test a custom build. High blast radius,
sensitive data, heavy integration. If a first attempt goes badly there, it goes
badly with money and compliance.

The feature-flag change-control workflow is the safer proving ground. It has the
same workflow shape, propose, approve, apply, audit, but against virtual flags
and synthetic data. Failure is recoverable, and everything it proves transfers
to the ten tools you still plan to build.

**[ADVANCE]**

## Slide 4 (2:00 to 2:40)

So we built it. What you see is the real prototype: a developer proposes a flag
change, a different release approver approves it, applies it, or rolls it back
through a simulated provider, and an auditor can read the full decision trail.

Five reusable primitives sit under that console: server-side role policy, a
state-transition guard, two-person approval, an append-only audit writer, and a
provider adapter behind an interface. Those are the bones of every internal tool
on your roadmap. To be clear, the provider is fake and every flag is a virtual
label in a demo database.

**[ADVANCE]**

## Slide 5 (2:40 to 3:20)

Here is the delivery evidence, and everything on this slide renders from a
generated evidence file, written only after the commands actually ran. In one
Devin-assisted hour we got the working POC, the role-based approval and audit
workflow, a Docker-runnable environment, ten automated tests plus one end-to-end
browser test, and this deck. The conventional equivalent is typically multi-day
delivery.

One qualifier, verbatim from the slide: this is accelerated prototype delivery,
not a one-hour production system. Security, real-provider integration,
reliability, and operating ownership remain separate work.

**[ADVANCE]**

## Slide 6 (3:20 to 3:55)

What transfers, and what does not. The workflow patterns transfer: custom UI,
role checks, state machines, approvals, audit capture, tests. The enterprise
guarantees do not. Before anything real, you would deliberately replace real
provider integration with idempotency and reconciliation, SSO, DLP equivalents,
durable audit controls, monitoring, backups, and on-call ownership. The full
list is in the production-gaps document, and none of it is hidden.

**[ADVANCE]**

## Slide 7 (3:55 to 4:35)

So the resolution is a ninety-day pilot that earns, or stops, the migration
decision. First validate the economics against your tenant. Then run one bounded
virtual flag workflow with real teams, behind a security and operations gate.
Measure cycle time, failure and recovery, audit completeness, effort, and total
cost of ownership.

At day ninety you have three honest paths: expand the custom build, retain Power
Apps, or run the hybrid. Either way, you decide with evidence from your own
workflows. That is the ask: approve the pilot.

**[END]**
