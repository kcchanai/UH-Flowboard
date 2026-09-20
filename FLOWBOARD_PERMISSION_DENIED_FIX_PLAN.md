# Flowboard Google sign-in permission-denied: diagnosis-first repair plan

## Objective and handoff boundary

Produce a verified local fix for startup after Google sign-in, then stop before deployment. Planning only in this turn; Luna implements in a subsequent explicitly authorized turn. Do not infer authority to inspect real account data, change production records, or publish from this document.

User evidence: the latest screenshot shows **Boards could not be loaded**, **Account setup failed (permission-denied). Retry setup or open Data recovery.**, and **Retry setup** / **Data recovery** buttons. It does NOT show **Repair account setup**. No boards are visible. The image was inspected; no account identifiers were transcribed.

Success is not merely displaying a recovery button. The normal signed-in path must obtain a valid canonical destination, load authorized boards, and successfully persist a new board, with existing data and permissions preserved. A supported failure must offer honest, actionable guidance without pretending data is empty.

## Baseline and important correction

Local clean main inspected at `47454298495dd99f83f3c1f33dac8e8f2ff3b7b2`, also the previously reported deployed release. This planning pass did not independently re-read the active production Rules release.

- Rules blob: `71b5e7aa2fd1fae4b9f2c53d31f8fd6e081b333d`
- Indexes blob: `79fc192e9b71eb3c18b7fd504b77fc9b07bcd18a`
- Prior work: `artifacts/account-bootstrap-fix/README.md` and `validation-summary.json`. These are historical local qualification records, not proof the user's failure was fixed.

**Do not repeat the earlier inference that a stale canonical pointer is the proven production root cause.** `app.js:137-150` catches both personal-home setup and the subsequent workspace fetch. Either may produce the displayed error. In contrast, `ensurePersonalWorkspace` converts failed post-transaction root/member verification to `needs-recovery`, whose UI shows different copy and Repair account setup. The screenshot proves a permission-denied exception reached the general handler, not which operation denied it. Repair attempts may also throw, so this distinction narrows the path without proving the initial trigger.

The existing mixed-case-email fix is already in Rules. Do not apply it again or claim that it explains this screenshot.

## Source map and ranked investigations

### A. Localize the operation, before choosing a patch

- `app.js:137-150`: one catch covers setup and `fetchWorkspace`; the current wording labels every exception as account setup.
- `src/adapters/firebase-cloud-workspace.js:22-25`: forced token refresh, profile transaction read, atomic writes, then root/member server verification. The latter has a broad catch returning needs-recovery.
- Same file `:53-66`: fetches the root, active board query, every visible board's lists and cards. A single failed descendant query rejects the entire workspace fetch. A verified root does not prove this graph can be read.
- Same file `:27-48`: discovery uses allSettled and may omit failed workspace reads or mark board sources unavailable. Never turn partial/denied discovery into a certified empty account.
- `src/runtime-bootstrap.js`, `src/auth-ui.js`, `src/adapters/firebase-workspace-adapter.js`: session activation, adapter initialization, user/token consistency and error presentation.

### B. Profile compatibility hypotheses (not confirmed account facts)

Rules `:897-965` allow exactly uid, emailLower, workspaceIds, and personalWorkspaceId. Profile updates also require unchanged uid/emailLower and only hint/pointer changes. The client merges uid/emailLower plus an arrayUnion into an existing record.

Test missing required fields, unknown legacy fields, normalized versus old stored email, a genuinely changed email, incorrect field types, and 100 existing hints with no canonical home. Those can reject a bootstrap write independently of pointer validity. Do not drop unknown fields, prune hints, rewrite identity, or relax the allowlist as an unreviewed workaround.

### C. Valid home, denied contents or inconsistent lifecycle

Review `fetchCloudWorkspace` queries alongside `boardReadable`, `listIsLive`, tombstones, workspace status, owner/viewer branches, and list/card query Rules around `:1061-1168`. Test populated homes, retained legacy formats, stale lifecycle/tombstone records, read revocation, and concurrent changes. Firestore Rules are not post-query filters. Do not change a permission-denied classification into an index diagnosis: missing indexes commonly produce failed-precondition, which should be kept distinct.

### D. Deployment/environment mismatch

A successful CLI deploy receipt and index readback do not independently prove the active Rules source. If local reproduction cannot explain the failure, the release gate must compare the live client target, active Rules release/source, and index readiness using a separately authorized metadata-only operator route. Consider App Check enforcement/configuration mismatch only as hypotheses. Never disable App Check or security policy to make a test pass.

## Non-negotiable safety constraints

- Work only under `C:/Code/Stacie-Hermes`; use repository-local scratch/evidence. Read named skills through skill_view. Do not read browser profiles, credential files, or cached documents outside the vault.
- Local implementation and fresh demo Auth/Firestore emulators only. Never use My Flowboard workspace or Lifecycle realtime probe as fixtures.
- No push, PR, merge, Pages deployment, Firebase Rules/index publication, production document inspection/mutation, data migration, or real-account acceptance during implementation.
- Do not clear browser storage, reset the account, delete profiles, or create replacement homes on generic permission-denied/offline failures.
- Preserve all old boards, ACLs, memberships, invitations, hints, backups, and operation metadata. Identity remains UID-based. Shared scope is not a personal home.
- Never log tokens, configuration values, email addresses, UIDs, document paths/IDs, raw errors or record bodies. Use fixed stage labels, normalized error codes and aggregate counts only.
- No cap increase and no shortening safety/accessibility disclosures to squeeze under a cap. Stop at a measured budget boundary if semantic consolidation cannot fund the patch.
- No em dashes in public-facing copy. Close/recovery navigation stays usable in read-only and failed states.

## Step 1 of 7: Pin the release and capture the actual execution map

**Accomplishment:** a reproducible baseline and explicit candidate causes, not a guessed fix.

1. Load `static-web-mvp` and `emulator-browser-validation`; read this plan, prior evidence, source, Rules, packaged runner and CI workflow.
2. Inspect status/diffs first. Preserve this plan and other user files. Create an isolated branch from reviewed main without discarding planning files. Record full source/Rules/index identities.
3. Create `FLOWBOARD_PERMISSION_DENIED_PROGRESS.md` and `artifacts/permission-denied-fix/` with a seven-step ledger.
4. Draw a short operation map from Auth callback through profile read/transaction, root/member verification, root fetch, board query, list query and card query. Note which catches preserve versus swallow errors.
5. Run baseline packaged validation and record known flaky fixtures separately from product defects.

**Pass:** pinned identities, safety scope, execution map and baseline test results recorded. No changes to production.

## Step 2 of 7: Add privacy-safe stage attribution locally

**Accomplishment:** distinguish a bootstrap denial from a board-content denial.

Use small fixed stage labels such as `auth-refresh`, `profile-read`, `home-transaction`, `home-verify`, `workspace-root`, `boards-query`, `lists-query`, `cards-query`. Attribute failures at the actual async boundary. A transaction may retry; do not label a queued write as committed or keep a mutable stale stage across attempts.

Carry only an allowlisted stage and normalized code to the outer handler. Distinguish an invalid home from a network/read failure; do not silently reinterpret denial as structural corruption. Preserve the original rejection and fail-closed state. Add tests for error wrapping, sanitized output, session-generation guards and stale results.

Show a short diagnostic classification, not raw SDK errors. Do not upload telemetry or add privileged APIs. If diagnosis needs a live diagnostic-only build, stop with that patch and request separate deployment authorization; do not deploy it under the local-only scope.

**Pass:** deliberately failed boundaries report different fixed stages with no identifiers, and neither a failure nor Retry rewrites/replaces an established home blindly.

## Step 3 of 7: Reproduce the denied operation with real SDK and Rules

**Accomplishment:** a failing-before/passing-after regression that exercises the actual production adapter.

Required scenario matrix:

- Fresh verified account, hints-only existing account, valid empty personal home, valid populated personal home.
- Profile absent, missing/extra legacy fields, email case variance, changed email, malformed hint types, hint capacity at limit and one over.
- Canonical root non-personal, missing, unreadable, archived, migrating, missing verification metadata; missing/wrong-role membership. Keep permission denial, structural invalidity and offline distinct.
- Valid root/member checks followed by denied board/list/card queries; retained/importing/deleting records and lifecycle races; a successful empty query is not equivalent to a denied query.
- Owner/editor/viewer/non-member, revoked membership, sign-out/account switch while reads are pending.
- Concurrent first login and concurrent explicit recovery; no extra personal homes or lost hints.

Use minimal synthetic records seeded before authentication listeners begin. Exercise real Google-style emulator auth and real adapter mutations, not only a copied transaction helper. Auth Emulator normalizes provider email, so explicit token-claims Rules tests are needed for mixed-case token coverage.

Preserve existing `hintsOnly`/`seedOnly` test seams for administrative fixture setup, but also add a production-like startup test with unsuppressed Auth callbacks. Do not fix races by only widening expected results or suppressing the behavior being tested. Rule-denied probes must be executed with authenticated clients, not admin bypass.

**Pass:** denied operation and violated invariant identified with source anchors and a failing regression on baseline. If multiple synthetic causes match and none can be tied to the account, mark cause unconfirmed and use the diagnostic gate, rather than choosing arbitrarily.

## Step 4 of 7: Implement the smallest justified correction

**Accomplishment:** correct the proven cause while preserving authorization and data.

Conditional approach, based on Step 3:

- **Profile compatibility:** design an explicit versioned owner-only transition if necessary. Preserve unknown data in a safe retained form; do not expand accepted fields indiscriminately or rewrite email identity as part of ordinary bootstrap. Where a migration decision is required, stop for that decision.
- **Query/Rules contract:** align the exact query with supported Rules and lifecycle state. Verify both allowed results and forbidden reads. Do not bypass Rules, fetch every document as admin, or call unauthorized data an empty result.
- **Unnecessarily coupled startup:** consider separating canonical-home readiness, metadata directory availability, and opening an individual board if one retained board can poison the full fetch. Preserve access checks, partial-state warnings, stable IDs, and safe creation destination; this is not permission to hide the failed read.
- **Environment-only cause:** do not change application Rules to compensate for wrong deployment/configuration. Produce a metadata-verification/cutover checklist for an authorized operator.

Audit the recently added explicit repair path even if it is not the cause: a denied prior-root read must not authorize replacement; missing-field Rules evaluation must fail safely; do not permit arbitrary scope adoption, loss of other hints, or replacement of a valid home. An explicit repair that creates a new home must disclose that effect and retain old data. Test fresh-destination requirements and recovery concurrency. Do not broaden this path based solely on the screenshot.

**Pass:** red-to-green regression, negative authorization tests, unchanged unrelated records and browser legacy bytes, valid canonical destination for new writes.

## Step 5 of 7: Qualify user-visible recovery and creation

**Accomplishment:** signed-in users can recover from the supported fault and create a persisted board without misleading empty states.

- Show stage-appropriate wording: do not label a descendant-query denial as account creation failure.
- Retry is single-flight, uses the current account, and cannot resume into a newer account/context.
- Ordinary retry never silently invokes pointer repair. Explicit repair and retained-data recovery are separate decisions.
- Keep New board visible; enable it only when its canonical destination is verified and authorized. Explain a disabled state visibly.
- Verify empty/all-archived states and creation while viewing a shared read-only board; creation must target the canonical personal home, not the shared scope.
- Preserve draft on failed create; prevent duplicates; prove committed data after reload and in an independent emulator context.
- Provide visible pointer Close, keyboard focus return, Retry and Data recovery at 1440x900 and short desktop 960x540; add narrow non-regression coverage.
- Capture and inspect before/after synthetic screenshots with actual markup, and run axe on the failed and recovered dialogs.

**Pass:** demonstrated startup -> verified destination -> New board -> persisted board -> reload, plus meaningful non-destructive failed-state behavior. A synthetic injected error validates presentation only and cannot establish the real account's root cause.

## Step 6 of 7: Full qualification, actual CI selection, and budgets

**Accomplishment:** all final-source gates pass, not only focused fixtures.

Run, sequentially where emulator ports overlap:

1. `npm.cmd run validate`
2. `npm.cmd run test:rules`
3. `npm.cmd run test:emulator-browser`
4. Synthetic configured build, the exact configured browser selection in `.github/workflows/validate.yml`, and Lighthouse.
5. The exact CI emulator selection with a synthetic configured Vite server in fresh emulators. Local packaged runner includes deletion-engine coverage that CI's current command does not; enumerate and report the difference. Ensure every new regression is selected in both intended paths.
6. Repeat race-sensitive startup cases with fresh accounts/contexts; attach listeners before navigation and record sanitized console/page errors.

Measured planning baseline: raw source **299,703 / 300,000**, only **297 bytes** left. Workspace controller **13,990 / 14,000**, only **10 bytes** left. Hard gzip caps: initial shell **26,250**, lazy **60,000**. Prior reported configured shell **25,981**, lazy **58,795**; remeasure both builds on final source. No budget transition is authorized. Diagnostics may need consolidation or a budget decision; do not simply increase limits, remove negative tests, or rely on line-ending savings.

Use installed tooling and keep temporary files/logs under the repository. Capture raw test output privately, report only sanitized counts/classifications, remove raw logs after preserving redacted evidence. Stop owned servers and restore only known test-generated artifacts. Never call expected-denial stderr a failure or call the suite green when TAP/exit status failed.

**Pass:** exact commands, exit codes/counts, configured/unconfigured measurements, CI selection, inspected screenshots and clean process state recorded for the final source.

## Step 7 of 7: Package and STOP before deployment

**Accomplishment:** an honest local release candidate with an executable owner handoff.

Commit only intentional local implementation/tests/evidence. Record full implementation/evidence SHAs, Rules/index blobs, root cause classification, affected records/queries, test matrix, budget results, screenshot index, and remaining limitations in `artifacts/permission-denied-fix/README.md`. Preserve historical evidence rather than relabel it as current success.

Include a separate release checklist:

- Explicit authorization for client push/PR/merge/Pages and any Rules/index publication.
- Exact-head PR checks and exact-main checks. No bypassing failed CI.
- Rules/client compatibility and ordered cutover, with active Rules source independently read back through an authenticated metadata-only route. Index-list success is not Rules-source verification.
- Pages deployment SHA and cache-busted anonymous smoke. This is not signed-in acceptance.
- Separate owner-operated acceptance on the affected account, returning only fixed diagnostic code/stage and pass/fail. No unattended repair of protected workspaces.
- Rollback implications if an explicit recovery has already changed a pointer. Do not automatically undo user data or silently create another home.

**STOP:** do not push or deploy. Notify Aaron that the handoff is ready for review/model switch. If the real cause remains unconfirmed, state that prominently and offer the narrow diagnostic gate instead of calling the user's issue resolved.

## Progress cadence

After each verified checkpoint report: `Step X of 7 complete`, concrete result, test evidence, budget measurement if code changed, and local commit or explicit uncommitted status. Continue local steps without asking at every checkpoint. Pause for missing production evidence, migration/architecture choices, tool authorization or a real budget boundary.
