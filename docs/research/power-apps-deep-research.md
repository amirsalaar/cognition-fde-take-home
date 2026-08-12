# Power Apps vs. Devin-Accelerated Custom Internal Tools: A Cited Research Brief

**Prepared for:** Cognition FDE take-home (scenario: Series C fintech, ~60 engineers, ~$250K/year on Microsoft Power Apps; runs a KYC review queue, refunds dashboard, and feature-flag admin panel; plans 10+ more internal apps; VP Eng asks whether Devin Cloud enables replacement with custom-built tools).

**Nature of this document:** Research only. This brief does **not** build a prototype and does **not** issue a final build-vs-buy recommendation. It assembles evidence, separates platform capabilities from per-app capabilities, and defines what must be measured before a decision.

**Access date for all sources:** 2026-08-09.

**Source-quality note (read this first):**
- Microsoft claims below are cited inline to official `learn.microsoft.com` documentation, with short verbatim quotes.
- **Two material source gaps could not be closed in this session** and are flagged throughout rather than guessed:
  1. **Power Apps published dollar list prices.** The Microsoft pricing page (`microsoft.com/.../power-apps/pricing`) was not fetchable in this session. No per-user or per-app dollar figure is asserted here. See [Assumptions & source gaps](#assumptions-source-gaps-and-time-sensitive-facts).
  2. **Devin / Devin Cloud primary-source facts.** `cognition.ai` and `docs.devin.ai` were not fetchable in this session. Per the brief's own standard ("do not make undocumented Devin claims"), Devin-specific capability, security, and pricing claims are **not asserted**; instead the exact primary sources to verify are listed, and the open questions are converted into POC/pilot measurements.
- The client's **$250K/year is a stated spend, not a Microsoft list price.** The two are different quantities and are kept distinct everywhere below.

---

## 1. What Power Apps actually delivers in practice

Power Apps is one product inside the broader **Microsoft Power Platform** (Power Apps, Power Automate, Copilot Studio, Power Pages, Power BI, plus the Dataverse data platform and connectors). The value the customer is paying for is mostly the *platform*, not the individual apps. The components that matter here:

### 1.1 Two app models: canvas and model-driven
- **Canvas apps** are pixel-controlled apps built on data sources via connectors; sharing is done directly with a user or Entra group but is "still subject to Dataverse security roles." ([Security in Microsoft Dataverse](https://learn.microsoft.com/en-us/power-platform/admin/wp-security))
- **Model-driven apps** are generated from the Dataverse data model; their access "is done via Dataverse security roles." ([Security in Microsoft Dataverse](https://learn.microsoft.com/en-us/power-platform/admin/wp-security))

### 1.2 Dataverse (the data platform)
Dataverse is "the underlying data platform for Power Platform components" and handles "security from user authentication to authorization." It supports "a simple security model with broad access all the way to highly complex security models where users have specific record and field level access." ([Security in Microsoft Dataverse](https://learn.microsoft.com/en-us/power-platform/admin/wp-security)) It provides tables/columns, business logic, auditing, and a rich security model (detailed in §4).

### 1.3 Connectors
Connectors are "strongly typed representations of RESTful application programming interfaces." Types include **certified** ("Microsoft tests and certifies to ensure they meet Microsoft's standards for security, reliability, and compliance"), **custom** ("makers to create their own connectors to integrate with external systems"), **virtual**, and **MCP** connectors. ([Data policies](https://learn.microsoft.com/en-us/power-platform/admin/wp-data-loss-prevention)) There is a large first- and third-party connector catalog referenced from the [Connectors documentation](https://learn.microsoft.com/en-us/connectors/), split by tier (standard vs premium), publisher, and release status.

### 1.4 Power Automate (workflow/automation)
Cloud flows execute API requests to connectors, HTTP actions, and built-in actions; "Both successful and failed actions count toward these limits. Retries and requests from pagination also count as action executions." ([Requests limits and allocations](https://learn.microsoft.com/en-us/power-platform/admin/api-request-limits-allocations)) This is the engine behind approvals, KYC routing, refund workflows, etc.

### 1.5 Role-based access, auditing, web/mobile delivery
- RBAC and auditing are Dataverse platform features (see §4).
- The Microsoft 365 seeded plan explicitly lists "Run apps in a browser or Power Apps mobile for iOS and Android" and "Run Canvas apps offline" as included capabilities. ([Licensing overview](https://learn.microsoft.com/en-us/power-platform/admin/pricing-billing-skus))

### 1.6 ALM, governance, DLP, environments, tenant controls
- **ALM via solutions:** "Solutions are the mechanism for implementing application lifecycle management (ALM)." Unmanaged solutions "are used in development"; managed solutions "are deployed to any environment that isn't a development environment," i.e., test/UAT/prod. ([Solution concepts](https://learn.microsoft.com/en-us/power-platform/alm/solution-concepts-alm))
- **Environments** "act as security boundaries allowing different security needs to be implemented in each environment." ([Security in Microsoft Dataverse](https://learn.microsoft.com/en-us/power-platform/admin/wp-security))
- **DLP / data policies** "act as guardrails to help reduce the risk of users unintentionally exposing organizational data" by controlling connector access. ([Data policies](https://learn.microsoft.com/en-us/power-platform/admin/wp-data-loss-prevention))
- **Managed Environments** are "a suite of premium capabilities that allow admins to manage Power Platform at scale." ([Managed environments overview](https://learn.microsoft.com/en-us/power-platform/admin/managed-environment-overview))
- **Tenant/security controls** include a security score, recommendations, tenant isolation, IP firewall, environment security groups, and guest-access controls surfaced in the Power Platform admin center. ([Security overview](https://learn.microsoft.com/en-us/power-platform/admin/security/security-overview))

**Takeaway for §1:** Most of what $250K buys is a *managed platform* (identity integration, RBAC, auditing, DLP, environments, ALM tooling, connector runtime, hosting, mobile/offline). The three named apps are thin slices of configuration on top of that platform.

---

## 2. Which capabilities materially matter for the named tools and the next 10

The critical distinction for a build-vs-buy analysis: **platform capabilities are provided by the SaaS and shared across all apps; custom-app capabilities are what each app author actually builds.** If the customer leaves Power Apps, the per-app logic is comparatively cheap to reproduce; the platform capabilities are what must be *rebuilt and operated*.

| Capability | Platform (SaaS-provided, shared) | Custom-app (built per app) | Why it matters for KYC / refunds / flags + next 10 |
|---|---|---|---|
| Identity / authentication | ✅ Entra ID ("Users are authenticated by Microsoft Entra ID") ([wp-security](https://learn.microsoft.com/en-us/power-platform/admin/wp-security)) | — | All three tools front sensitive fintech data; SSO/MFA is table stakes. |
| Authorization / RBAC | ✅ Dataverse security roles, row- and column-level | ⚙️ Which roles/columns each app uses | KYC reviewers, refund approvers, and flag admins need least-privilege separation. |
| Row/record-level & column-level security | ✅ Platform (see §4) | ⚙️ Config per table/column | Masking SSNs, DOBs, PANs in the KYC queue. |
| Auditing / change history | ✅ Dataverse auditing + Purview | ⚙️ Which tables/columns audited | Refunds and KYC decisions need who/when/old-value trails. |
| Workflow / approvals | ✅ Power Automate runtime | ⚙️ The specific flow logic | Refund approval chains, KYC escalations. |
| Data storage | ✅ Dataverse (or external via connector) | ⚙️ Table/column schema | Shared across all 13+ apps. |
| Connectors / integration | ✅ Connector runtime + catalog | ⚙️ Which connectors + custom connectors | Refunds → payment processor; flags → internal service APIs. |
| Web + mobile + offline delivery | ✅ Platform ([pricing-billing-skus](https://learn.microsoft.com/en-us/power-platform/admin/pricing-billing-skus)) | ⚙️ Screens/forms | Reviewers may need mobile/offline. |
| ALM / environments / deployment | ✅ Solutions, environments, pipelines | ⚙️ Solution packaging per app | 10 more apps means dev/test/prod discipline matters. |
| Governance / DLP / tenant controls | ✅ Data policies, Managed Environments, security score | ⚙️ Which policies apply | Prevents 60 engineers from wiring sensitive data to arbitrary connectors. |
| Hosting / scaling / patching | ✅ Fully Microsoft-operated | — | No servers, CDNs, or upgrades to run. |

**Interpretation:** For the three named apps the *custom-app* surface is small (a queue UI + a few tables + an approval flow + role config). The heavy value is the shared platform column. A custom-code replacement must recreate the ✅ column as owned, operated infrastructure. That is the crux of the comparison in §5.

---

## 3. Limitations and operational risks

### 3.1 Licensing and cost drivers
- **License models.** Power Apps is sold as **per-app**, **per-user (subscription)**, and **pay-as-you-go via Azure** ("a way to pay for Power Apps and Power Automate using an Azure subscription... without any license commitment or upfront purchasing"). ([Licensing overview](https://learn.microsoft.com/en-us/power-platform/admin/pricing-billing-skus))
- **Microsoft 365 "seeded" licenses are limited.** They allow standard connectors and Dataverse only in a limited way: they do **not** grant "Access on-premises data or use premium or custom connectors," and "if you need to create a Dataverse instance within production or sandbox environments (other than the default environment), you're still required to have a premium Power Apps or Power Automate license." ([Licensing overview](https://learn.microsoft.com/en-us/power-platform/admin/pricing-billing-skus)) **Premium/custom connectors are a primary cost escalator**, and fintech integrations (payment processors, internal REST APIs) are typically premium/custom.
- **Managed Environments require premium licensing.** "Managed environments are included as an entitlement with standalone Power Apps, Power Automate, Microsoft Copilot Studio, Power Pages, and Dynamics 365 licenses." ([Managed environments overview](https://learn.microsoft.com/en-us/power-platform/admin/managed-environment-overview)) Governance at scale is therefore gated behind premium seats.
- **API request entitlements are metered and can force add-on spend.** Paid per-user Power Apps/Automate licenses get **40,000 requests per 24 hours**; per-app, pay-as-you-go, and Microsoft 365 licenses get **6,000**. ([Requests limits and allocations](https://learn.microsoft.com/en-us/power-platform/admin/api-request-limits-allocations)) Each capacity add-on "raises the request limit by another 50,000 per 24 hours." ([same](https://learn.microsoft.com/en-us/power-platform/admin/api-request-limits-allocations))
- **Dollar figures: source gap.** No verified list price was obtainable in this session; the customer's **$250K/year is a negotiated/stated spend, not a published list price.** Do not conflate the two. (See gaps list.)

### 3.2 Maker governance risk
DLP enforcement is not instantaneous: for connector-policy changes, "the latency for full enforcement is 24 hours. In most cases, it's within an hour." ([Data policies](https://learn.microsoft.com/en-us/power-platform/admin/wp-data-loss-prevention)) With ~60 engineers as potential makers, ungoverned app/flow sprawl in the default environment is a real risk until Managed Environments + data policies are configured.

### 3.3 Performance and scale limits
- **Delegation (data-integrity risk, not just perf).** For non-delegable queries, "Power Apps gets the first 500 records from the data source and then runs the actions." The limit is raisable to 2,000, but "the query might return incorrect results if the data source has more than 500 or 2,000 records." ([Delegation overview](https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/delegation-overview)) For a KYC queue or refunds dashboard over large tables, naive canvas formulas can silently return **wrong** results.
- **Dataverse service-protection limits (per web server, 5-min sliding window):** "6,000" requests, "20 minutes (1,200 seconds)" combined execution time, and "52 or higher" concurrent requests; breaches return "429 Too Many Requests" with a `Retry-After` header. ([Service protection API limits](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/api-limits))
- **Daily entitlement limits** (§3.1) are a separate ceiling from service-protection limits: "These limits aren't related to entitlement limits." ([same](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/api-limits))

### 3.4 Source control and ALM trade-offs
- Solutions are the ALM unit; "Exported unmanaged versions of your solutions should be checked into your source control system." ([Solution concepts](https://learn.microsoft.com/en-us/power-platform/alm/solution-concepts-alm))
- **A solution "can be up to 95 MB in size."** ([same](https://learn.microsoft.com/en-us/power-platform/alm/solution-concepts-alm))
- **Canvas source control is in transition.** The CLI's `pac canvas pack` and `pac canvas unpack` are documented as **deprecated**: "The `pack` and `unpack` commands are deprecated. To source control your canvas app, use the Power Platform Git Integration." ([pac canvas reference](https://learn.microsoft.com/en-us/power-platform/developer/cli/reference/canvas)) Diff/merge of canvas apps is workable but has caveats (unique control names; some files unsafe to merge). ([same](https://learn.microsoft.com/en-us/power-platform/developer/cli/reference/canvas)) This is materially weaker than ordinary Git-native code review for custom software.

### 3.5 Vendor lock-in
The platform-capability column in §2 (identity integration, RBAC engine, auditing pipeline, DLP, environments, connector runtime, hosting) is Microsoft-proprietary. Data can be extracted (e.g., "Access audit data using Azure Synapse Link for Dataverse" ([Manage Dataverse auditing](https://learn.microsoft.com/en-us/power-platform/admin/manage-dataverse-auditing))), but the *operating model* does not port. Leaving means rebuilding that column.

---

## 4. Fintech security & compliance implications

### 4.1 Identity and least privilege
- **Authentication:** Entra ID; "Licensing is the first control-gate to allowing access." ([wp-security](https://learn.microsoft.com/en-us/power-platform/admin/wp-security))
- **Column-level security** restricts sensitive columns via **column security profiles** controlling Read / Read-unmasked / Update / Create, with optional **masking rules**; critically, "Column-level security doesn't apply for users who have the system administrator role. Data is never hidden from system administrators." ([Column-level security](https://learn.microsoft.com/en-us/power-platform/admin/field-level-security)) That admin-bypass is a compliance-relevant caveat for PII (SSN, PAN) in a KYC tool.

### 4.2 Auditability
Dataverse auditing "logs changes that you make to customer records" and "logs user access." It can audit "Create, update, and delete operations," "Changes to the sharing privileges," and "Changes to security roles." ([Manage Dataverse auditing](https://learn.microsoft.com/en-us/power-platform/admin/manage-dataverse-auditing)) Retention is configurable ("Maximum: 24,855 days"), and "Exporting audit logs isn't currently supported. Use the Web API or SDK for .NET to retrieve audit data" — or Synapse Link/Purview. ([same](https://learn.microsoft.com/en-us/power-platform/admin/manage-dataverse-auditing)) Auditing "doesn't support retrieve operations or export operations" unless activity logging is separately enabled. ([same](https://learn.microsoft.com/en-us/power-platform/admin/manage-dataverse-auditing))

### 4.3 Change control / SDLC
Managed vs unmanaged solutions plus environments give a real dev→test→prod path ([Solution concepts](https://learn.microsoft.com/en-us/power-platform/alm/solution-concepts-alm)), and **Pipelines in Power Platform** are a Managed Environments feature ([Managed environments overview](https://learn.microsoft.com/en-us/power-platform/admin/managed-environment-overview)). Caveat: canvas Git story is mid-transition (§3.4), so code-review rigor is weaker than for hand-written code.

### 4.4 Data residency
"Power Platform stores customer data in the tenant's assigned Azure macro region geography, or *home geo*." A "macro region geography represents the data residency boundary that aligns with data residency laws." Multi-geo deployments are supported. ([Data storage and governance](https://learn.microsoft.com/en-us/power-platform/admin/security/data-storage))

### 4.5 Encryption
"Power Platform encrypts all persisted data by default using Microsoft-managed keys," with Azure SQL TDE and Azure Storage Encryption; in transit it uses "TLS 1.2 or higher" and "rejects requests that try to use TLS 1.1 or lower." Note: "Data that's stored in memory isn't encrypted" during processing. ([Data storage and governance](https://learn.microsoft.com/en-us/power-platform/admin/security/data-storage)) **Customer-managed key (CMK)** is available under Managed Environments. ([Managed environments overview](https://learn.microsoft.com/en-us/power-platform/admin/managed-environment-overview))

### 4.6 Incident ownership / Microsoft access to data
**Customer Lockbox** lets the customer "review and approve (or reject) data access requests in the rare occasion when Microsoft needs access to customer data." It "is enforced only on environments that are activated for managed environments," Microsoft engineers get a fixed "eight hours" of access once approved, and unapproved requests expire after "four days." ([Customer Lockbox](https://learn.microsoft.com/en-us/power-platform/admin/about-lockbox)) It also requires specific compliance SKUs (e.g., "Microsoft 365 or Office 365 A5/E5/G5"). ([same](https://learn.microsoft.com/en-us/power-platform/admin/about-lockbox))

### 4.7 Secret management
Connections store "a saved credential" within the environment. ([Data policies](https://learn.microsoft.com/en-us/power-platform/admin/wp-data-loss-prevention)) (Environment variables/Azure Key Vault references are the documented pattern for secrets in solutions; this specific page was not fetched in-session — see gaps.)

### 4.8 DLP
Data policies classify connectors and block cross-group data flows at design time and runtime, cascading tenant-wide with up to 24h enforcement latency (§3.2). ([Data policies](https://learn.microsoft.com/en-us/power-platform/admin/wp-data-loss-prevention))

**Compliance certifications (SOC/ISO/PCI/HIPAA):** Microsoft directs customers to the **Microsoft Trust Center** and Online Services Terms for attestations and data-processing commitments ([Data storage and governance](https://learn.microsoft.com/en-us/power-platform/admin/security/data-storage)). The specific certification list was not fetched in-session (Trust Center is off `learn.microsoft.com`); treat exact PCI-DSS / SOC 2 scope as a **verification item**, not an assumed fact.

---

## 5. Comparison framework: low-code (Power Apps) vs. Devin-accelerated custom code

This is a **framework**, not a scored verdict. It is built around the §2 platform/custom split, because that is where the real cost and risk asymmetry lives.

### 5.1 The load-bearing question
Custom code (however it is authored, whether by humans or accelerated by an AI engineer) produces the **application logic and UI**. It does **not**, by itself, produce the **platform column** from §2 — identity integration, an RBAC/row/column-security engine, an auditing pipeline with retention, DLP, environment/tenant governance, connector runtime, hosting, patching, and mobile/offline delivery. With Power Apps the customer *rents* that column; with custom code the customer *owns and operates* it (assembled from cloud primitives such as an IdP, a database, an audit store, CI/CD, and hosting).

So the framework compares two totals:
- **Power Apps total** = per-app config effort + platform subscription + metered limits/add-ons + governance overhead + lock-in.
- **Custom total** = app build effort (this is what an AI engineer accelerates) + the effort to build/operate the platform column + ongoing maintenance/on-call + SDLC.

### 5.2 What generated custom code plausibly gives you
- Full control of data model, UI, and logic with **no delegation ceiling** (§3.3) and no per-app/per-user request entitlements (§3.1) — those are Power Apps constructs, not inherent to custom code.
- **Native Git**, standard code review, standard testing — stronger than the transitional canvas Git story (§3.4).
- No premium/custom-connector licensing tax for integrations (§3.1); you call APIs directly.
- Portability: no proprietary platform lock-in on the operating model.

### 5.3 What the customer must still build and operate (the SaaS was doing this)
Each of these maps to a cited Power Apps platform capability the customer would otherwise inherit for free:
- **Identity/SSO/MFA** (vs Entra ID, §4.1).
- **RBAC + row-level + column-level security + masking** engine (vs §4.1) — including the audit-safe handling that Power Apps gives via column security profiles.
- **Audit logging with retention and tamper-evidence** (vs §4.2), plus export tooling.
- **DLP / connector-governance equivalent** (vs §3.2/§4.8) — for a 60-engineer org this is real.
- **Environments + promotion/ALM + change control** (vs §4.3).
- **Hosting, scaling, patching, availability, mobile/offline** (vs §1.5/§3.5).
- **Compliance posture and evidence** (vs §4.4–§4.6, Trust Center attestations).

### 5.4 Devin / Devin Cloud: **explicit source gap — verify from primary sources**
Per the brief's standard, no undocumented Devin claims are made here. The following must be confirmed directly from Cognition primary sources before any decision, and the answers feed §6:
- **What Devin Cloud provides** as an autonomous engineering environment (session/VM model, tooling, concurrency). Verify: `https://docs.devin.ai` and `https://cognition.ai`.
- **Usage/pricing unit** (e.g., ACU / seat model) and how cost scales with 13+ apps + ongoing maintenance. Verify: Cognition pricing/docs.
- **Enterprise security & compliance posture**: SOC 2 / other attestations, data handling and retention, code/data isolation, SSO, self-hosted/VPC options, admin controls. Verify: Devin enterprise/security docs.
- **Integration & SDLC fit**: repo/CI integration, review model, guardrails.

> These four items are **unverified in this brief** and must not be presented as facts until fetched from `cognition.ai` / `docs.devin.ai`. (WebFetch to those domains was blocked in this session.)

### 5.5 Honest framing
Custom-code-with-an-AI-engineer changes the economics of the *app build* column (§5.2) — potentially large for 13+ apps. It does **not** eliminate the *platform + operate* column (§5.3). The decision hinges on: (a) how much the platform column actually costs the customer to build/operate for their compliance bar, and (b) Devin's verified capability, cost, and security posture (§5.4). Both are measurable — see §6.

---

## 6. Decision-relevant unknowns to measure

### 6.1 Two-hour proof of concept (feasibility signal only)
Pick the **simplest** of the three (feature-flag admin panel) and, using Devin, measure:
1. Can Devin scaffold a working CRUD app (data model + UI + auth stub) end-to-end in the box? Capture what it did unattended vs. needed human unblocking.
2. Does it wire **SSO (Entra/OIDC)** and a basic **RBAC** check? (Tests the §5.3 identity/authorization gap directly.)
3. Does it produce **Git-native, review-ready** code + a runnable test? (Tests §3.4 advantage.)
4. Record **cost consumed** in Devin's usage unit for this slice (feeds the §5.1 extrapolation).
**PoC does not prove:** compliance posture, scale, audit completeness, or maintenance cost. Say so explicitly.

### 6.2 30 / 60 / 90-day pilot
**Days 0–30 (rebuild one real app: refunds dashboard):**
- Reproduce refund workflow + approval chain; integrate the payment processor API directly (removes premium-connector tax, §3.1).
- Stand up the **platform column** minimum: SSO, RBAC + column-level protection for PII, **audit log with retention** matching current Dataverse config (§4.2), and a dev/test/prod path (§4.3).
- Metric: Devin usage/cost for build; human hours to close the platform gaps.

**Days 31–60 (harden + KYC queue):**
- Rebuild KYC queue over a realistically large dataset to test whether custom code avoids the **delegation correctness trap** (§3.3) and the **6,000-request/5-min service-protection ceiling** (§3.3) — and at what operational cost.
- Verify Devin **enterprise security posture** claims from §5.4 against primary docs; run a security review (secret handling, data isolation).
- Metric: incidents, review findings, throughput under load.

**Days 61–90 (operate + extrapolate):**
- Run all rebuilt apps in production-like mode; measure **maintenance/on-call** load (the §5.3 recurring cost).
- Build the honest cost model: (Devin build cost for 13 apps) + (platform build + operate) vs. (Power Apps subscription tied to the **$250K stated spend**, premium-connector needs, and request-limit add-ons) — **using verified prices only.**
- Governance test: can ~60 engineers ship safely without a DLP-equivalent? (§3.2)
- Decision gate: only now is a build-vs-buy (or hybrid) recommendation defensible.

### 6.3 Explicit unknowns the pilot must resolve
- Devin cost per app + per maintenance-month (unit price is a §5.4 gap).
- Effort to reach the customer's **compliance bar** in custom code (PCI/SOC 2 scope is a §4 verification item).
- Whether canvas/model-driven apps have hidden per-app logic not visible from the outside (audit the existing three first).
- The **real** composition of the $250K (seats vs premium connectors vs add-ons vs Dynamics) — needed to compare against anything.

---

## Assumptions, source gaps, and time-sensitive facts

**Assumptions**
- "~$250K/year" is treated as the customer's **total stated Power Platform spend**, not a per-seat or list price. Its internal composition is unknown and must be obtained.
- The three named apps are assumed to be low-to-moderate complexity internal tools (typical for KYC queue / refunds / flag admin); this should be validated by auditing the actual apps.

**Source gaps (could not be closed in this session)**
1. **Devin / Devin Cloud primary sources** (`cognition.ai`, `docs.devin.ai`) — WebFetch to non-`learn.microsoft.com` domains was permission-blocked; Bash network egress required an approval unavailable in this non-interactive session. All Devin-specific capability, pricing, and security claims are therefore **unasserted** and marked for verification (§5.4, §6).
2. **Power Apps published dollar list prices** (`microsoft.com/.../power-apps/pricing`) — not fetchable in-session. No dollar figure is stated.
3. **Microsoft Trust Center compliance certifications** (SOC 2 / ISO 27001 / PCI-DSS / HIPAA scope) and the **secrets/Key Vault + environment variables** page — off-`learn.microsoft.com` or not fetched; treated as verification items in §4.

**Time-sensitive facts (re-verify at decision time; access date 2026-08-09)**
- API request entitlements (40,000 / 6,000 per 24h) and the 50,000-per-add-on figure. ([Requests limits and allocations](https://learn.microsoft.com/en-us/power-platform/admin/api-request-limits-allocations))
- Service-protection limits (6,000 / 1,200s / 52 per web server, 5-min window). ([Service protection API limits](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/api-limits))
- Delegation defaults (500 default, 2,000 max). ([Delegation overview](https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/delegation-overview))
- Canvas source-control tooling: `pac canvas pack/unpack` **deprecated** in favor of Power Platform Git Integration. ([pac canvas reference](https://learn.microsoft.com/en-us/power-platform/developer/cli/reference/canvas))
- Solution size cap (95 MB) and Customer Lockbox timings (8h access / 4-day expiry). ([Solution concepts](https://learn.microsoft.com/en-us/power-platform/alm/solution-concepts-alm); [Customer Lockbox](https://learn.microsoft.com/en-us/power-platform/admin/about-lockbox))

---

## Source list

All accessed 2026-08-09. Publisher: **Microsoft** (`learn.microsoft.com`) unless noted.

1. Security in Microsoft Dataverse — https://learn.microsoft.com/en-us/power-platform/admin/wp-security
2. Column-level security — https://learn.microsoft.com/en-us/power-platform/admin/field-level-security
3. Securely access customer data using Customer Lockbox — https://learn.microsoft.com/en-us/power-platform/admin/about-lockbox
4. Copilot Studio, Power Platform, and Azure Logic Apps connectors documentation — https://learn.microsoft.com/en-us/connectors/
5. Data policies (DLP) — https://learn.microsoft.com/en-us/power-platform/admin/wp-data-loss-prevention
6. Managed environments overview — https://learn.microsoft.com/en-us/power-platform/admin/managed-environment-overview
7. Solution concepts with Power Platform (ALM) — https://learn.microsoft.com/en-us/power-platform/alm/solution-concepts-alm
8. Understand delegation in a canvas app — https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/delegation-overview
9. Requests limits and allocations — https://learn.microsoft.com/en-us/power-platform/admin/api-request-limits-allocations
10. Service protection API limits (Microsoft Dataverse) — https://learn.microsoft.com/en-us/power-apps/developer/data-platform/api-limits
11. Licensing overview for Microsoft Power Platform — https://learn.microsoft.com/en-us/power-platform/admin/pricing-billing-skus
12. Data storage and governance in Power Platform — https://learn.microsoft.com/en-us/power-platform/admin/security/data-storage
13. Manage Dataverse auditing — https://learn.microsoft.com/en-us/power-platform/admin/manage-dataverse-auditing
14. Security overview (Power Platform admin center) — https://learn.microsoft.com/en-us/power-platform/admin/security/security-overview
15. Microsoft Power Platform CLI `canvas` command group — https://learn.microsoft.com/en-us/power-platform/developer/cli/reference/canvas

**Primary sources to consult that were NOT fetchable in this session (verify before deciding):**
- Cognition / Devin — https://cognition.ai and https://docs.devin.ai (capabilities, pricing/usage unit, enterprise security & compliance).
- Power Apps pricing — https://www.microsoft.com/en-us/power-platform/products/power-apps/pricing (list prices).
- Microsoft Trust Center — https://www.microsoft.com/trustcenter (SOC 2 / ISO / PCI-DSS / HIPAA attestations, data-processing terms).
