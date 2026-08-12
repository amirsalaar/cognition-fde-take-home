# Teleprompter Script

Target: 4 minutes 30 seconds total. Slides 1 to 4 take about 50 seconds. Screen share takes 2 minutes 30 seconds. Slides 5 to 7 take about 1 minute 10 seconds.
Advance the slide when you reach the marker. Return to Slide 5 after the live walkthrough.

Big Idea: Keep Power Apps where governance carries real risk. Use Devin to prove a repeatable custom-build path on bounded internal tools, then decide with evidence.

---

## Slide 1 (0:00 to 0:10)

Good morning. I'm Amir Sojoudi. Today I'll make the build-versus-buy case for Power Apps and Devin, show the working proof live, and close with a recommendation.

**[ADVANCE]**

## Slide 2 (0:10 to 0:25)

The client is a Series C fintech: about sixty engineers, roughly two hundred fifty thousand dollars a year on Power Apps, three internal apps live, at least ten more planned.

My recommendation has two lanes. Keep KYC, refunds, payments, access, and risk on Power Apps, where governance, audit, DLP, and managed operations carry real weight. Pilot Devin-assisted custom build on feature-flag change control and one more low-risk tool.

**[ADVANCE]**

## Slide 3 (0:25 to 0:40)

The same control pattern, propose, approve, apply, rollback, audit, fits four use cases. Risk decides where we build first. KYC and refunds carry compliance, money, and operational risk, so they stay. Feature flags run the full pattern on virtual data, so that is what we built. A fourth low-risk tool is the next candidate; the pattern extends, but only the feature-flag workflow exists today.

**[ADVANCE]**

## Slide 4 (0:40 to 0:50)

These screenshots are the working app: the change queue and the audit trail. The proof is the build lifecycle behind them, so I'm switching to screen share for two and a half minutes to show the work in Devin, from brief through review to merge.

**[SCREEN SHARE]**

## Live Devin walkthrough (0:50 to 3:20)

### 0:00 to 0:25, brief and scope

Start in Devin with the brief: a bounded feature-flag change-control plane, synthetic data, auditable workflow. Show the scoped plan.

### 0:25 to 1:10, build, test, QA

Show Devin building the workflow, running the ten automated tests and the end-to-end test, and iterating through QA until they pass.

### 1:10 to 2:00, pull request and AI review

Show the pull request, the automated AI-powered PR review, Devin addressing the findings, then looping back through test and QA and a second review pass.

### 2:00 to 2:30, CI, human review, merge

Show Devin watching CI until green, then the human review and merge. Deploy is skipped in this demo. That full loop, brief to merged PR, is the lifecycle the team would own.

**[RETURN TO SLIDE 5]**

## Slide 5 (3:20 to 3:50)

One Devin-assisted hour produced the proof package: the POC, ten automated tests, one end-to-end workflow, Docker-runnable verification, the evidence, and this deck. We would normally budget multiple engineer-days for the equivalent.

This measures accelerated prototype delivery and feedback speed. A production system still requires security, real-provider integration, reliability, and operating ownership.

**[ADVANCE]**

## Slide 6 (3:50 to 4:05)

Custom code can reproduce the workflow: the UI, role checks, approval rules, state machines, audit capture, adapters, and tests. Platform guarantees need deliberate replacement: real provider integration, SSO and MFA, DLP equivalents, durable audit, monitoring, and on-call ownership.

**[ADVANCE]**

## Slide 7 (4:05 to 4:30)

The ask is a bounded ninety-day pilot. Days zero to thirty, validate tenant economics and security requirements. Thirty-one to sixty, run one bounded workflow with a real internal team. Sixty-one to ninety, measure cycle time, recovery, audit completeness, and engineering effort.

Then the evidence decides: expand the custom-build path, retain Power Apps, or run the hybrid model. Approve the pilot.

**[END]**
