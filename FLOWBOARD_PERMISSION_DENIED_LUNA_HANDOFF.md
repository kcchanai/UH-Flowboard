# Luna implementation handoff: persistent sign-in permission denial

Copy this prompt after switching to Luna:

```text
Implement C:/Code/Stacie-Hermes/UH-Trello/FLOWBOARD_PERMISSION_DENIED_FIX_PLAN.md.

Latest user screenshot: Boards could not be loaded; Account setup failed (permission-denied). Retry setup or open Data recovery. Visible buttons are Retry setup and Data recovery, NOT Repair account setup.

Start by reading the plan, current main, the previous account-bootstrap-fix evidence, production adapters, Rules, packaged tests and actual CI selection. Load static-web-mvp and emulator-browser-validation. Preserve planning files; create an isolated local implementation branch and FLOWBOARD_PERMISSION_DENIED_PROGRESS.md. Follow all 7 steps and report each verified checkpoint with evidence and budget results.

Critical correction: app.js catches BOTH ensurePersonalWorkspace and fetchWorkspace. The screenshot does not prove stale pointer corruption, mixed-case email, or any particular denied operation. Existing post-transaction verification catches often return needs-recovery instead. Attribute the exact stage safely and reproduce the failure through real SDK/Rules before selecting a patch. Test existing populated homes and descendant query denials, not only fresh empty accounts. Do not call an injected UI denial proof of the production cause.

Authorization: local code and synthetic fresh demo Auth/Firestore Emulator tests only. Work only under C:/Code/Stacie-Hermes. No real-account or normal browser-profile access, production document inspection/mutation, protected-workspace access, migration, push/PR/merge, Pages deployment, or Rules/index publication. Never use My Flowboard workspace or Lifecycle realtime probe as fixtures. Never expose tokens, credentials, configuration, email/UID/document identifiers, or raw payloads/logs.

Keep authorization fail-closed. Preserve existing boards, ACLs, memberships, invitations, hints, backups and canonical identity. Do not reset profiles/storage, automatically replace homes on permission-denied, silently prune hints, weaken Rules to pass tests, or conflate Retry with explicit repair. Review the existing repair path with negative tests rather than expanding it speculatively.

No source/gzip cap increase is approved. Planning baseline: raw source 299703/300000; cloud-workspace-ui.js 13990/14000; gzip caps initial 26250 and lazy 60000. Reclaim semantic headroom without weakening safeguards or stop with measured evidence. Requalify configured and unconfigured builds, actual packaged runner and exact CI selection after final changes. Forward fixture options and seed before Auth listeners; retain production-like unsuppressed-startup coverage.

If local evidence cannot determine the account's denied operation, STOP with a minimal privacy-safe diagnostic candidate and a precise operator gate. Do not guess or deploy diagnostics without separate authorization.

Finish with a verified local candidate, immutable implementation/Rules/index identities, exact final test results, inspected screenshots, and a separate compatibility/release/rollback checklist. Explicitly distinguish synthetic proof from affected-account acceptance. STOP BEFORE DEPLOYMENT and notify Aaron.
```
