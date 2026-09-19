# gpt-5.6-sol implementation handoff

The plan is finalized. No application implementation or deployment has started for this request.

After switching to **gpt-5.6-sol**, paste this instruction:

```text
Implement UH-Trello/FLOWBOARD_CLOUD_FIRST_DEBUGGING_PLAN.md.

Read the entire plan and artifacts/cloud-first-planning/AUDIT.md first. Work only under C:/Code/Stacie-Hermes, with the app in C:/Code/Stacie-Hermes/UH-Trello. Verify the current repository state against audited main d1c00e619e9b9b907d599e0dcbd1981b80841bc0; reconcile any changes before editing.

Follow all 13 steps. Create a local feature branch and progress ledger. Send a short "Step X of 13 complete" update only after each checkpoint passes. Continue non-production implementation and testing without unnecessary approval pauses, but honor the plan's hard security, architecture, dependency and budget gates.

Deliver one cloud-backed My workspace board manager with no normal editable local mode, explicit lossless legacy migration, board archive/restore/permanent delete, working list deletion, reliable card archive/restore/permanent delete, an always-reachable visible horizontal board scroll control, no Start here, and Filters outside-click dismissal plus correct placement.

Preserve tenancy and membership boundaries, UID identity, read-only navigation, draft protection, confirmations and legacy raw data. Do not merge security scopes or auto-upload old local content. Prove the bounded deletion protocol with the real Firebase SDK and Rules Emulators before building its UI. Never enable generic recursive client deletes, mistake a client-owned completion flag for server proof, or relabel archive as permanent deletion. If safe cleanup cannot be qualified within Spark/no-backend constraints, stop with the exact architecture decision needed. Do not silently raise byte caps or enable paid infrastructure.

Use only synthetic data and fresh isolated Auth/Firestore Emulator/browser contexts. Do not inspect normal browser profiles, production configuration/auth material, My Flowboard workspace, or Lifecycle realtime probe. Keep all diagnostics redacted and generated files/caches inside the approved vault unless separately authorized.

Stop at the fully verified local release candidate. No push, PR creation, merge, Pages deployment, Firebase Rules/index publication, production migration, or real-account testing. Package actual test results, screenshots, budget measurements, exact client/Rules identities, migration guidance, and a separate production cutover/rollback checklist. Report blockers honestly instead of marking partial work complete.
```

## Deliverables to expect

- All requested fixes and the cloud-only transition implemented locally.
- `FLOWBOARD_CLOUD_FIRST_PROGRESS.md`, one checkpoint at a time.
- Actual unit/static/build/budget, Rules, real-adapter multi-user Emulator, built-browser and accessibility evidence.
- `artifacts/cloud-first/release-candidate/` with README, manifest, screenshot index, migration guide and later cutover instructions.
- An explicit final stop before any production side effect.

## Important distinction

The previous visual cleanup is live. This cloud-first debugging plan is a **new, unimplemented release** that requires Rules/schema qualification. The prior Pages deployment does not authorize the next deployment or publish its future Rules.

## Links

- [[FLOWBOARD_CLOUD_FIRST_DEBUGGING_PLAN]]
- [[artifacts/cloud-first-planning/AUDIT]]
