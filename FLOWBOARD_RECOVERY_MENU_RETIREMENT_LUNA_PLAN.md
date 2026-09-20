# Flowboard recovery-menu retirement plan for Luna

## Goal and product decision

Remove both obsolete recovery surfaces from Flowboard:

1. **Data recovery**
2. **Review legacy browser data / Legacy Recovery**

The user-facing model remains:

```text
Account -> Boards -> board
```

The application must no longer expose a workspace browser, retained-workspace lifecycle controls, legacy browser-data import, cloud-workspace backup, or granular-upgrade UI.

This is a customer-surface retirement and safe UI detachment. It is not a backend decommission and is not authorization to delete, migrate, rewrite, merge, or inspect existing browser or Firestore data. Owner-only migration and root-lifecycle maintenance functions must remain protected and dormant until a separately authorized production inventory proves that no archived, migrating, or non-verified historical roots still need them.

The internal Firestore workspace model must remain where it is still required for:

- authorization and Security Rules;
- the canonical personal-board destination;
- shared-board membership and invitations;
- owner/editor/viewer roles;
- realtime subscriptions and revocation;
- activity and member-backed assignment scope;
- board/list/card document paths;
- retained historical data compatibility.

Do not globally rename or remove internal `workspaceId`, `personalWorkspaceId`, `workspaces/{workspaceId}`, adapter parameters, invitation parameters, Rules functions, or synthetic fixtures merely because the old menus are removed.

## Supplied screenshot findings

The screenshots define the reported defect but are not the scope boundary.

### Account

The signed-in Account dialog currently exposes:

- Appearance
- Sign out
- Boards
- Data recovery
- Review legacy browser data

After this work it should expose only:

- Appearance
- Sign out
- Boards

The signed-out Google action remains unchanged.

### Data recovery

The recovery view currently exposes retained workspace rows plus:

- Open
- Rename
- Archive
- Restore
- legacy-format upgrade;
- cloud-workspace backup;
- Manage members;
- View activity.

Manage members and View activity already work from the ordinary Boards manager through the active internal access scope. Preserve those normal Boards actions. Remove the recovery-only workspace rows, lifecycle actions, backup, and upgrade controls.

### Legacy Recovery

The legacy import dialog currently promises an exact browser backup, a count preview, explicit import, unchanged browser data, and no replacement of cloud boards. When the entire dialog is removed, replace its Account safety copy with a simpler truthful invariant:

> Browser-only legacy data stays on this device and is not imported into your boards.

Do not delete the old browser keys. Do not retain wording that promises a review/import workflow that no longer exists.

## Current pinned baseline

- Repository: `C:/Code/Stacie-Hermes/UH-Trello`
- Deployed main SHA: `8d3a66750885cccb3b6a5ac3136ecc1b9e2c5f9e`
- Current branch before implementation: clean `main`
- Raw production source: `297945 / 300000` bytes
- Raw source headroom: `2055` bytes
- Configured initial-shell gzip: `25872 / 26250` bytes
- Configured first-party-lazy gzip: `58360 / 60000` bytes
- Configured document gzip: `5342` bytes
- `src/cloud-workspace-ui.js`: `13983 / 14000` bytes
- `src/legacy-import-ui.js`: `6420 / 7000` bytes
- `src/adapters/firebase-migration.js`: `15716 / 16000` bytes
- Current configured CI grep selection: `10` tests
- Firestore Rules blob: `296b595276122918f521d3f86ee6820a5cc876b7`
- Firestore indexes blob: `79fc192e9b71eb3c18b7fd504b77fc9b07bcd18a`

The cleanup should reduce production source and lazy-bundle size. Do not spend recovered headroom on unrelated features and do not increase any cap.

## Required final product contract

### Remove completely from the built product

- `Data recovery` Account action.
- `Review legacy browser data` Account action.
- Data recovery dialog state and retained-source rows.
- Legacy Recovery dialog and import controls.
- Workspace Rename, Archive, and Restore UI.
- `Download cloud backup` and `Upgrade legacy format` UI.
- All setup/error copy that directs a person to Data recovery.
- All normal visible copy promising separate legacy review, backup, or import.

The controls and dialogs must be absent from production DOM and built assets, not merely hidden.

### Preserve

- Boards as the sole board-navigation destination.
- Active and archived board rows.
- New board routed only to the verified canonical personal destination.
- Shared board editor/read-only labels and same-name source distinction.
- Direct Restore and Delete permanently actions for archived owner boards.
- People and invitations, View activity, member-backed assignments, comments, invitations, and role enforcement.
- Existing board CSV export from Board actions.
- The distinct board-scoped **Local recovery** action for rotating browser-local snapshots.
- Explicit account repair for an invalid canonical pointer.
- Exact browser-local legacy-key byte preservation.
- All Firestore authorization and board-data paths.
- Protected backend maintenance for archived roots and interrupted/non-verified migrations, with no ordinary customer UI route.

### Do not replace or decommission in this milestone

Do not invent an account-wide export, an automatic legacy import, a workspace-to-board converter, or a hidden customer recovery route. A future account-level export requires its own board-centric cross-scope design and authorization review.

Do not delete owner-only migration, root restore, legacy import/export, local inspection/receipt, or corresponding Rules capabilities merely because their menus disappear. A later backend decommission requires a separately authorized production inventory proving that no invalid pointers, archived roots, migrating/non-verified roots, or unresolved browser-data support obligations remain.

## Recommended incompatibility fixes

1. **Repair account setup without Data recovery.**
   - Transient startup, network, or permission failures offer **Retry setup** only.
   - A proven invalid canonical pointer offers **Repair account setup**.
   - Repair requires an accessible confirmation explaining that Flowboard creates a new empty board destination, leaves earlier inaccessible data unchanged, and does not import it.
   - Reuse the existing atomic `ensurePersonalWorkspace({recover:true})` path. Do not create another migration mechanism.
   - Never silently repair on page load or in response to a transient error.

2. **Extract the generic confirmation dialog before deleting workspace lifecycle UI.**
   - `src/board-lifecycle-ui.js` currently imports `requestLifecycleConfirmation` from `src/workspace-lifecycle-ui.js`.
   - Move the generic confirmation behavior into a neutral module such as `src/confirmation-dialog-ui.js`, or make it board-owned.
   - Preserve typed permanent-delete confirmation, Cancel, Escape, focus return, pending/error states, and board archive/restore behavior.
   - Only then remove workspace-specific lifecycle rendering.

3. **Detach obsolete UI wiring without deleting maintenance contracts.**
   - Remove every ordinary customer call site for `listWorkspaces`, `renameWorkspace`, `archiveWorkspace`, `restoreWorkspace`, `migrateWorkspaceToGranular`, `importLegacyWorkspace`, and `exportCloudBackup`.
   - Keep these owner-only adapter/Rules capabilities intact and covered while historical archived or interrupted states may exist.
   - Keep `ensurePersonalWorkspace`, `verifyWorkspaceAccess`, `listBoardDirectory`, `fetchWorkspace`, `setBoardArchived`, synchronization, membership, invitation, activity, comment, and deletion methods in normal production use.
   - Keep the internal authorized-space lookup used by `listBoardDirectory`; it is not a user-facing workspace selector.

4. **Retire UI modules without breaking board deletion or historical maintenance.**
   - Remove `src/legacy-import-ui.js` from the customer UI graph after the legacy trigger/dialog and retained-source renderer are removed.
   - Remove workspace-specific rendering from `src/workspace-lifecycle-ui.js`; delete or replace that UI file only after its generic confirmation behavior is safely extracted.
   - Preserve `src/adapters/firebase-migration.js`, `src/adapters/firebase-workspace-lifecycle.js`, and their Rules protections as dormant maintenance capabilities in this release.
   - Preserve the `firebase-deletion.js` exports used by board/list/card deletion.
   - Preserve `src/granular-workspace.js`; normal cloud reads and mutations still use it.

5. **Make old browser data inert instead of deleting it.**
   - Remove all customer UI calls to `inspectLegacyWorkspace`, migration receipts, import, backup, and upgrade.
   - Keep local inspection/receipt capability protected for a future separately authorized support or decommission workflow unless a production inventory explicitly authorizes deletion.
   - Do not call `removeItem`, rewrite, normalize, import, or upload `flowboard-workspace`, `flowboard-data`, or `flowboard-legacy-migration-v1` during normal app use.
   - Add tests proving Account, Boards, Retry, Repair, sign-in, sign-out, and Local recovery leave the unrelated raw legacy strings byte-for-byte unchanged.

6. **Keep backend compatibility rules and maintenance code unless separately authorized.**
   - This release should leave `firestore.rules` and `firestore.indexes.json` byte-identical unless a fresh Emulator result proves a required change.
   - Keep Rules-level migration and historical lifecycle tests because retained documents still exist and must stay protected.
   - Keep migration resume and archived-root restore callable only through existing protected adapter/Rules boundaries, with no Account or Boards control.
   - Removing adapter methods, old permissions, or retained data is a separate production inventory, migration, and Rules-publication decision.

7. **Update current documentation, not historical evidence.**
   - Correct `PRIVACY_AND_DATA_BOUNDARIES.md`, `COLLABORATION_ARCHITECTURE.md`, and `VALIDATION_CHECKLIST.md` so they no longer claim a customer-facing workspace lifecycle, legacy import, or cloud-workspace export UI.
   - Document that protected maintenance and Rules remain for historical archived/migrating roots but are not ordinary product navigation.
   - State that earlier browser data remains untouched but is no longer imported through the product UI.
   - Do not rewrite old plans, release evidence, or screenshots as though the retired feature never existed.

## Non-negotiable constraints

- Work only under `C:/Code/Stacie-Hermes`.
- Start from exact clean main `8d3a66750885cccb3b6a5ac3136ecc1b9e2c5f9e`.
- Use a new branch such as `fix/remove-recovery-menus`.
- Use only local and synthetic Auth/Firestore Emulator data.
- Do not use any production row shown in the supplied screenshots as a fixture.
- Do not access normal browser profiles, real accounts, production documents, tokens, cookies, raw payloads, or protected workspaces.
- Do not delete or mutate existing browser or Firestore legacy data.
- Do not remove owner-only migration, archived-root restore, local inspection/receipt, or corresponding Rules capabilities in this UI-retirement release.
- Do not weaken authorization or flatten internal workspace/board identity.
- Do not change Firestore Rules or indexes unless a fresh synthetic failure establishes necessity and Aaron separately approves publication.
- No source or gzip cap increase.
- No public-facing em dashes.
- No push, PR, merge, Pages deployment, Rules/index publication, or real-account acceptance during implementation. Stop with a locally qualified candidate.

## Mandatory execution and progress protocol

Create `FLOWBOARD_RECOVERY_MENU_RETIREMENT_PROGRESS.md` with all eight checkpoints before application edits.

After every verified step, send Aaron a short progress update before immediately continuing. Use this exact structure:

```text
Step X of 8 complete: <one-sentence accomplishment>.
Validation: <specific tests/commands and result>.
Budget: <current raw source and configured gzip measurements when applicable>.
Continuing automatically to Step X+1 of 8.
```

For Step 8, end with:

```text
Step 8 of 8 complete: local candidate packaged and ready for review.
Stopped before deployment, Rules publication, production access, or real-account acceptance.
```

Do not wait for approval between successful steps. Stop only at a real authorization, architecture, data-safety, tooling, or hard-budget blocker. If blocked, report `Step X of 8 blocked`, the exact evidence, the safe rollback state, and the decision required.

Commit each completed implementation checkpoint after its acceptance checks pass. Stage only intentional files and clean generated logs, traces, screenshots, test results, and preview processes before each commit.

## Step 1 of 8: Pin the baseline and inventory the complete retirement surface

**Accomplishment:** establish a reproducible baseline and classify every recovery dependency before deletion.

1. Confirm clean main, baseline SHA, Rules/index blobs, CI selection, and configured/unconfigured budgets.
2. Create the isolated branch and eight-step progress ledger.
3. Capture synthetic built-preview baselines for:
   - signed-in Account;
   - ordinary Boards;
   - Data recovery;
   - Legacy Recovery;
   - account setup error/repair.
4. Attach console and page-error listeners before navigation.
5. Inventory selectors, text, listeners, imports, adapter methods, tests, CSS, static guards, workflow grep terms, and current documentation for:
   - `#open-cloud-recovery`;
   - `#open-cloud-migration`;
   - `#cloud-migration-dialog`;
   - `#legacy-spaces-section` and `#legacy-spaces-list`;
   - `#migrate-cloud-workspace` and `#export-cloud-workspace`;
   - Data recovery and legacy-import copy;
   - workspace lifecycle controllers and adapters.
6. Classify each dependency as remove, preserve internally, extract for board use, or update documentation.

**Pass criteria:** complete source-anchored inventory, synthetic baseline images, exact budget/hash record, clean isolated branch, and no application behavior change.

## Step 2 of 8: Add a failing-before retirement and safety contract

**Accomplishment:** encode the intended absence and the preserved safety behavior before implementation.

Add focused built-preview and Emulator assertions that fail against the baseline:

- Account contains no Data recovery or Review legacy browser data action.
- Production DOM contains none of the retired dialog/section/control IDs.
- Boards contains no Older data/recovery section and no recovery-mode heading.
- Built production assets do not contain retired visible strings or legacy-menu selectors.
- Signed-in Account still exposes Appearance, Sign out, and Boards exactly once.
- Boards still exposes New board, active/archived board rows, Manage members, and View activity.
- Archived owner boards still expose Restore and Delete permanently.
- Transient startup denial exposes Retry setup but no recovery route.
- Invalid canonical setup exposes an explicit confirmed Repair account setup path.
- Cancel and Escape from repair return focus and do not repoint the account.
- Confirmed repair creates a new canonical personal destination only after the old pointer is proven invalid.
- Legacy local-storage sentinel strings remain byte-identical throughout all non-import flows.
- Shared editor/viewer labels, same-named boards, invitations, activity, comments, and access revocation remain intact.

Update the configured CI browser selection and `scripts/validate-workflow-gating.mjs` so the new retirement contract is selected. Do not weaken the workflow by merely deleting Data recovery from the grep expression. Use synchronized test titles and an exact replacement selection such as:

```text
cloud-first board|Filters stays bounded|configured signed-out build|board manager|retired recovery controls|account repair|New board is visible|archived owner board|streamlined chrome
```

Keep the full five-file Playwright command in the workflow and workflow-gating guard.

**Pass criteria:** the new contract demonstrably fails on the old menus, preserved-function tests remain green, and the expected failing assertions are recorded without changing production code.

## Step 3 of 8: Remove the Account and Boards recovery surfaces

**Accomplishment:** remove both menus and all obsolete visible promises from production markup and navigation.

1. In `index.html`, remove:
   - Data recovery action;
   - Review legacy browser data action;
   - Legacy Recovery dialog markup;
   - Older data/recovery details and list;
   - workspace upgrade and cloud-backup buttons.
2. Simplify Account actions to Appearance, Sign out, and Boards for signed-in users.
3. Replace the Account notice with truthful no-import language. Do not promise a review workflow.
4. In `src/auth-ui.js`, remove recovery element lookup/rendering and all `Retry or Data recovery` wording.
5. In `src/cloud-workspace-ui.js`, remove recovery mode, recovery opener/list rendering, selected retained-source backup state, upgrade, and cloud-backup handlers.
6. Keep one Boards dialog with its pointer-accessible Close control and focus return.
7. Keep the separate Board actions **Local recovery** feature and its snapshot safeguards unchanged.
8. Remove obsolete recovery CSS only when no remaining component uses it. Preserve shared dialog, board-row, and board-lifecycle styles.
9. Search all public HTML/JS copy for retired labels and em dashes.

**Pass criteria:** the controls and dialogs are absent rather than hidden, Account/Boards layout is clean at desktop and narrow widths, focus behavior passes, and no useful board/member/activity control is lost.

## Step 4 of 8: Make account repair self-contained and preserve board safeguards

**Accomplishment:** replace the removed recovery route with a safe, explicit account-repair flow while preserving board lifecycle confirmation.

1. Refactor setup actions by state:
   - loading/transient failure/offline: Retry setup only;
   - known invalid canonical setup: Repair account setup;
   - no generic link to retained data.
2. Extract the generic lifecycle confirmation behavior from `workspace-lifecycle-ui.js` into a neutral confirmation module.
3. Rewire `board-lifecycle-ui.js` to that neutral confirmation module without changing board archive, restore, or permanent-delete semantics.
4. Use the same accessible confirmation foundation for Repair account setup.
5. Repair confirmation must state:
   - a new empty destination for personal boards will be created;
   - inaccessible earlier data will stay unchanged;
   - no old data will be imported;
   - Cancel leaves the current pointer unchanged.
6. Preserve the existing server transaction and Rules contract for `ensurePersonalWorkspace({recover:true})`.
7. Add Emulator assertions for valid-pointer denial, invalid-pointer repair, retained prior hint, no adoption of an old owner scope, no duplicate home under concurrent contexts, and byte-identical local legacy keys.

**Pass criteria:** account failure remains truthful and recoverable without either removed menu, destructive ambiguity is eliminated, board confirmations still pass, and no transient error silently creates a replacement destination.

## Step 5 of 8: Detach the obsolete customer UI graph and tighten contracts

**Accomplishment:** prevent hidden UI reactivation while retaining protected maintenance capabilities for historical data states.

1. Remove the legacy import/recovery controller from `cloud-workspace-ui.js` and the customer UI graph after Step 4 extraction.
2. Remove or replace workspace-specific lifecycle UI exports, but keep the neutral confirmation used by board archive/restore/delete and account repair.
3. Keep `REMOTE_METHODS`, `firebase-migration.js`, `firebase-workspace-lifecycle.js`, local inspection/receipt methods, and the corresponding Rules paths unless a separately authorized inventory proves they can be decommissioned.
4. Ensure no Account, Boards, gate, keyboard, or focus path calls the dormant maintenance methods.
5. Keep internal `listCloudWorkspaces` and normal `listBoardDirectory` discovery for canonical and shared boards. Do not expose container rows.
6. Update synthetic UI adapters so ordinary fixtures no longer require recovery-only DOM or invoke maintenance operations; retain dedicated backend/Rules fixtures for migration and lifecycle safety.
7. Update `scripts/source-budget.mjs` and per-file limits only for UI modules actually deleted or replaced. Do not remove protected backend modules from the manifest while they remain reachable and do not raise limits.
8. Strengthen `scripts/validate-static.mjs` with:
   - negative guards for retired production selectors, visible strings, and customer call sites;
   - positive guards for Retry/Repair separation, board lifecycle confirmation, Local recovery, raw-key non-mutation, and protected maintenance exports;
   - an assertion that Rules/index blobs remain unchanged.
9. Keep `unbudgetedReachableFiles` empty and rebuild before claiming any byte savings.

**Pass criteria:** syntax, static isolation, focused browser tests, board lifecycle tests, adapter contract tests, and backend maintenance tests pass; retired UI modules/selectors are absent from the customer graph; protected migration/lifecycle methods remain covered but unreachable from normal UI; Rules/index files remain byte-identical; and actual source/lazy measurements are recorded without a cap increase.

## Step 6 of 8: Reconcile tests, CI, fixtures, and current documentation

**Accomplishment:** replace obsolete feature claims with durable board-first coverage and accurate documentation.

1. Remove or replace UI tests that intentionally open Data recovery, Legacy Recovery, or workspace lifecycle dialogs.
2. Remove recovery-only DOM and customer interactions from ordinary Emulator/browser fixtures, but retain dedicated adapter/Rules fixtures that qualify legacy import, backup, archived-root restore, and interrupted migration maintenance.
3. Keep Rules-level historical migration/lifecycle coverage while the Rules remain deployed and retained records still exist.
4. Keep or strengthen tests for:
   - canonical home bootstrap;
   - explicit invalid-pointer repair;
   - shared-board discovery and read-only behavior;
   - member/invitation/activity access scope;
   - realtime convergence and revocation;
   - board archive/restore/permanent deletion;
   - Board actions Local recovery and board CSV export;
   - archived/migrating root fail-closed behavior plus protected maintenance qualification;
   - stale request and account-switch cleanup;
   - exact local legacy-key preservation.
5. Replace the Boards/Data recovery axe test with Account, Boards, Repair confirmation, member, and activity audits.
6. Update test-only HTML shells after selector removal so fixture failures do not mask product behavior.
7. Update `.github/workflows/validate.yml` and its static guard with an exact configured selection that covers the retirement contract.
8. Update current architecture/privacy/validation documents. Preserve historical plans and evidence unchanged.
9. Produce an explicit remaining-terminology inventory explaining why internal workspace identifiers remain.

**Pass criteria:** no stale test expects a removed menu, the exact CI selection covers every preserved critical path, current docs describe the new product honestly, and historical evidence remains immutable.

## Step 7 of 8: Run full configured, Emulator, accessibility, and budget qualification

**Accomplishment:** prove menu retirement did not alter authorization, board operations, or data.

Run on the final source:

1. `npm.cmd run validate`
2. `npm.cmd run test:rules`
3. `npm.cmd run test:emulator-browser`
4. The exact configured CI browser selection with synthetic non-production Firebase Web configuration.
5. Lighthouse accessibility with score 1 and zero failed audits.
6. Focused responsive checks at 1440x900, 1900x700, 960x720, 390x720, and 320x720.
7. Configured and unconfigured source/dist budget measurement.
8. Production-asset isolation and retired-string/selector scan.

Required final assertions:

- Account has only Appearance, Sign out, and Boards when signed in.
- No retired menu, dialog, selector, visible copy, or customer focus/click route remains. Protected backend maintenance names may remain only in non-UI modules and tests.
- Account and Boards opening/closing do not mutate browser legacy keys or cloud documents.
- Retry and confirmed Repair behave differently and truthfully.
- New board still targets the verified canonical destination.
- Shared labels and duplicate-title source markers remain accurate.
- Manage members and View activity remain reachable from Boards.
- Archived board Restore/Delete permanently actions remain direct and accessible.
- Board CSV export and Board actions Local recovery remain available.
- Archived/migrating root scopes remain fail-closed in normal UI while their protected maintenance paths stay qualified.
- Page/console/request error count is zero in final synthetic captures.
- No horizontal page overflow or inaccessible Close/Cancel action exists.
- Rules and indexes blobs match the baseline unless an explicitly approved change occurred.
- No hard cap changed.

Capture and inspect final synthetic screenshots for signed-in Account, ordinary Boards with active and archived boards, shared read-only board rows, transient Retry, confirmed Repair, and the 320px layout.

**Pass criteria:** every final gate passes on one exact implementation SHA, screenshots show no recovery/legacy UI, budgets pass with no cap increase, and generated residue is cleaned.

## Step 8 of 8: Package the Luna candidate and stop before deployment

**Accomplishment:** create a reviewable local candidate with immutable evidence.

1. Create `artifacts/recovery-menu-retirement/` containing:
   - `README.md`;
   - `validation-summary.json`;
   - `SCREENSHOT_INDEX.md`;
   - configured and unconfigured budget JSON;
   - redacted baseline/final screenshots;
   - the removed-selector and customer-call-site inventory;
   - the remaining internal workspace and protected-maintenance inventory.
2. Record baseline SHA, implementation SHA, evidence SHA, Rules/index blobs, exact test counts, exit codes, and source/gzip values.
3. State clearly which customer UI modules and call sites were removed, which backend methods remain protected, and which internal workspace contracts remain.
4. Verify a clean worktree, stopped owned processes, closed Emulator ports, and no logs, traces, browser profiles, or `test-results` residue.
5. Stop before push, PR, merge, Pages deployment, Rules/index publication, production migration, or real-account acceptance.

**Pass criteria:** clean local branch, complete evidence package, honest compatibility inventory, no production side effects, and the exact Step 8 completion message specified above.

## Primary implementation files

### Product UI and behavior

- `index.html`
- `styles.css`
- `app.js`
- `src/auth-ui.js`
- `src/cloud-workspace-ui.js`
- `src/board-lifecycle-ui.js`
- `src/legacy-import-ui.js`
- `src/workspace-lifecycle-ui.js`
- `src/runtime-bootstrap.js`
- `src/cloud-ui.js`

### Persistence and adapters

- `src/main.js`
- `src/adapters/adapter-contract.js`
- `src/adapters/local-workspace-adapter.js`
- `src/adapters/firebase-workspace-adapter.js`
- `src/adapters/firebase-cloud-workspace.js`
- `src/adapters/firebase-migration.js`
- `src/adapters/firebase-workspace-lifecycle.js`
- `src/adapters/firebase-deletion.js`
- `src/granular-workspace.js`
- `state-core.js`

### Tests and validation

- `tests/board-first-copy.spec.mjs`
- `tests/single-workspace-board-ux.spec.mjs`
- `tests/browser-smoke.spec.mjs`
- `tests/cloud-first-a11y.spec.mjs`
- `tests/cloud-first-configured-session.spec.mjs`
- `tests/emulator/emulator-browser.spec.mjs`
- `tests/emulator/entry.mjs`
- `tests/emulator/directory-race.html`
- `tests/emulator/directory-race.mjs`
- `tests/local-workspace-adapter.test.mjs`
- `tests/adapter-contract.test.mjs`
- `tests/workspace-lifecycle.test.mjs`
- `tests/granular-workspace.test.mjs`
- `scripts/validate-static.mjs`
- `scripts/validate-workflow-gating.mjs`
- `scripts/source-budget.mjs`
- `.github/workflows/validate.yml`

### Current documentation

- `PRIVACY_AND_DATA_BOUNDARIES.md`
- `COLLABORATION_ARCHITECTURE.md`
- `VALIDATION_CHECKLIST.md`

## Copy-paste Luna implementation prompt

```text
Implement C:/Code/Stacie-Hermes/UH-Trello/FLOWBOARD_RECOVERY_MENU_RETIREMENT_LUNA_PLAN.md.

Start from exact clean main 8d3a66750885cccb3b6a5ac3136ecc1b9e2c5f9e. Work only under C:/Code/Stacie-Hermes. Load static-web-mvp and emulator-browser-validation. Create the isolated branch and eight-step progress ledger specified by the plan.

Remove both Data recovery and Review legacy browser data / Legacy Recovery from the built customer UI. Remove the recovery-only workspace rows, workspace lifecycle UI, legacy import dialog, cloud-workspace backup control, and granular-upgrade control. Preserve Account -> Boards -> board, canonical New board routing, shared roles, People and invitations, activity, comments, board CSV export, Board actions Local recovery, and archived-board Restore/Delete permanently.

Do not globally remove internal workspace identifiers or the Firestore workspace authorization model. Do not delete, import, normalize, upload, or rewrite old browser or Firestore data. Preserve the protected backend migration, archived-root restore, local inspection/receipt, and Rules capabilities until a separately authorized production inventory permits decommission. Preserve explicit invalid-pointer Repair account setup, but require an accessible confirmation and reuse the existing atomic recover path. Extract the generic confirmation used by board lifecycle before deleting workspace-specific lifecycle UI.

After every verified step, send `Step X of 8 complete`, concrete validation and budget results, then `Continuing automatically to Step X+1 of 8.` Do not wait for approval between successful steps. Stop only at a real authorization, architecture, data-safety, tooling, or hard-budget blocker.

Use only local and synthetic Emulator/browser data. No real accounts, production documents, protected fixtures, push, PR, merge, Pages deployment, Rules/index publication, or production migration. No source/gzip cap increase and no public-facing em dashes. Finish with the evidence package and stop before deployment.
```

## Final acceptance summary

The plan is complete only when Flowboard has no visible or hidden-in-DOM recovery/legacy menus, no ordinary customer focus/click path for workspace lifecycle or legacy import/backup/upgrade, and no copy that promises those workflows, while canonical account repair, shared authorization, board operations, Local recovery, accessibility, local-data non-mutation, protected historical maintenance, and the internal Firestore workspace security model remain verified.
