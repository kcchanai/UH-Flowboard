# Flowboard full-workflow implementation plan for Luna

Status captured: 2026-08-19 HST

This plan defines how to move Flowboard from a broad, deployed feature set into a workflow-qualified operational v1 that can be tested through realistic local and multi-user project scenarios. Development should continue autonomously without waiting for Aaron-operated tests. The agent must run automated, browser, accessibility, build, and Firebase Emulator validation throughout. Human Google-account and production acceptance are consolidated into one final release-candidate gate.

The risk-ordered production-hardening plan remains `TERRA_NEXT_PHASES_PLAN.md`. The exact paused production state remains in `LUNA_CONTINUATION_HANDOFF.md`. The acceptance steps in that handoff are deferred until the final release candidate. If this plan conflicts with either document on production safety, the stricter safety boundary wins, but the continuous-development sequencing in this plan controls when human acceptance occurs.

## 1. Executive assessment

Flowboard is already a functioning deployed site, not a prototype. It currently supports:

- multiple local boards with blank, website-launch, and personal-task templates;
- local list and card creation, editing, movement, search, due/label filtering, archive/restore, undo, backup, import, and export;
- rich cards with descriptions, labels, due dates, checklists, local assignees, and local activity;
- Google authentication and explicit backup-first cloud copying;
- owner/editor/viewer cloud workspaces;
- granular revision-aware cloud boards, lists, cards, assignments, comments, and activity;
- invitations, member administration, ownership transfer, revocation, realtime convergence, and conflict handling;
- owner-only cloud workspace rename and recoverable archive/restore;
- deny-by-default Firestore Rules, Rules Emulator tests, CI browser checks, accessibility checks, and GitHub Pages deployment.

Current verified release:

```text
Commit: 5a17747e3c9cb526a534659aff39f46f2fd35cbc
URL: https://kcchanai.github.io/UH-Trello/?release=5a17747
Application/tooling tests: 20/20
Firestore Rules tests: 23/23
Browser tests: 10/10
Source budget: 209,453 / 210,000 bytes
Validation run: 31237236599, success
Pages run: 31237236607, success
Production console: 0 messages, 0 JavaScript errors
```

Three independent read-only audits on 2026-08-19 confirmed the same readiness conclusion. Reviewers reran application/static/build validation and the Firestore Rules suite, opened the cache-busted deployed site without authenticating or mutating production, and found no release blocker. They identified the missing user-facing recovery route, lack of a true two-context cloud browser workflow in automation, the still-open production lifecycle/revocation gates, and module-type warnings as the main additional findings. A transient occupied Firestore Emulator port cleared before a successful 23/23 rerun. The warnings and port collision are developer/test-infrastructure concerns, not evidence of a production failure.

The site is not yet ready to be called workflow-qualified because:

1. production lifecycle acceptance is paused mid-sequence and will be restarted against the final release candidate;
2. the disposable fixture is temporarily named `Lifecycle realtime probe` and must be restored;
3. lifecycle archive propagation and role-denial production gates remain open;
4. only 547 raw source bytes remain under the current cap;
5. most browser checks are narrow local or mocked-component scenarios, not a complete shared-project workflow;
6. there is no deterministic browser-level Firestore collaboration workflow in CI;
7. several mature board-management and team-workflow surfaces require an explicit parity/discoverability audit;
8. beta operations, account succession, quota stop conditions, and real-user support are not approved.

## 2. Definition of a fully functioning operational v1

Flowboard operational v1 is complete when a person can safely perform all of the following through supported UI:

1. start a local project from a blank board or template;
2. create and switch boards;
3. create, rename, order, archive, restore, and safely remove the relevant board/list/card entities according to local or cloud retention rules;
4. capture a task, edit its details, assign it, set due data, add a checklist, move it through the workflow, comment on it, and archive/restore it;
5. find work by text, label, due state, assignee, and completion/status where supported;
6. export, import, recover, and reload without losing local data;
7. explicitly create a separate cloud copy without changing the local original;
8. invite an editor and viewer using verified-account links;
9. have an editor perform allowed work and a viewer inspect without mutation;
10. observe realtime updates in independent contexts;
11. reject stale writes instead of silently overwriting;
12. downgrade, remove, revoke, sign out, and reconnect without retaining unauthorized cloud access;
13. archive and restore the cloud workspace while preserving independent local storage exactly;
14. use the core workflows on mobile, with keyboard, with reduced motion, and in forced colors;
15. receive visible, actionable error states for offline, conflict, permission denial, quota/storage failure, and unavailable cloud configuration;
16. complete the workflow against deterministic test infrastructure and then pass a sanitized real-account production acceptance.

Operational v1 does not mean Trello feature parity.

## 3. Explicit non-goals

Do not add these while executing this plan:

- permanent recursive cloud-workspace deletion from the browser;
- persistent Firestore disk caching;
- durable offline mutation queues;
- presence heartbeats or cursor presence;
- push notifications or paid email delivery;
- Firebase Hosting, App Hosting, Cloud Functions, or a custom backend;
- broad public signup or uncontrolled beta access;
- regulated, FERPA-covered, employment, health, financial, export-controlled, confidential, or institutional production data;
- automated handling of Google passwords, MFA codes, tokens, cookies, or browser profiles;
- a framework rewrite without a measured blocker and separate approval.

## 4. Current implementation inventory

### 4.1 Local workflow - implemented

- Seeded project board and local-first storage.
- Multiple boards, board switching, and three board templates.
- Board/list title editing.
- List and card creation.
- Card movement with pointer and keyboard routes.
- Rich card details: title, description, labels, due date/time, checklist, assignees, local activity.
- Card duplication.
- Card archive and restore.
- Text search and due/label filtering.
- Workspace/board JSON and board CSV export.
- Validated import with merge or replace.
- Session undo and bounded local recovery snapshots.
- Explicit reset confirmation.
- Local schema migration and corrupt-storage fallback.
- Light/dark, responsive, keyboard, focus, reduced-motion, forced-color, and Lighthouse coverage.

### 4.2 Cloud workflow - implemented

- Google sign-in and sign-out.
- Explicit local/cloud mode boundary.
- Backup-first cloud-copy migration with count verification.
- Workspace discovery and explicit open/return-local controls.
- Owner/editor/viewer roles enforced by Rules.
- Granular revision-aware mutations and transactional activity.
- Realtime active-workspace/board/list/card convergence.
- Member-backed assignments.
- Authenticated comments with soft removal.
- Invitations, member role changes, removal, self-leave, and ownership transfer.
- Reconnect membership preflight and revocation fallback.
- Owner-only workspace rename, archive, and restore.
- Archived content retention, non-openability, and hard-delete denial.

### 4.3 Current engineering structure

Measured source concentration:

```text
app.js                                      54,495 bytes, 180 physical lines
state-core.js                                9,742 bytes, 40 physical lines
index.html                                  24,483 bytes, 143 physical lines
styles.css                                  25,746 bytes, 104 physical lines
src/adapters/firebase-cloud-workspace.js    27,755 bytes, 330 physical lines
src/adapters/firebase-workspace-adapter.js   5,026 bytes, 68 physical lines
src/cloud-sync-controller.js                 2,774 bytes, 54 physical lines
```

`app.js` duplicates state/domain helpers that also exist in `state-core.js`. Some modules have dense formatting because the raw-source cap was nearly exhausted. This is a maintainability and security-review concern even though the build and runtime are currently valid.

### 4.4 Current test structure

- Node tests cover state normalization, migration, import recognition, CSV, undo, local adapter behavior, granular migration, sync-controller lifecycle, lifecycle UI, and localStorage acceptance tooling.
- Rules tests cover the Firestore authorization matrix in the Emulator.
- Ten browser checks cover one local create/reload flow, dialog focus, viewer closure, mocked root lifecycle propagation, sign-in boundary copy, lifecycle UI, interrupted migration UI, responsive layout, forced colors, and reduced motion.
- CI builds the production site, runs Rules tests, installs Playwright/Lighthouse ephemerally, runs browser checks, and performs an accessibility audit.
- Production Google authentication and direct Rules acceptance remain necessarily human-operated.

## 5. Confirmed or likely gaps to resolve

Luna must verify each item in source and browser before changing it. Do not assume a likely gap is a defect.

### P0 blockers

1. Finish lifecycle production acceptance and restore the canonical fixture name.
2. Restore at least 10,000 bytes of maintainable raw-source headroom without raising the cap to silence validation.
3. Build complete workflow tests rather than relying on isolated UI mocks.
4. Ensure every local action exposed in cloud mode has a cloud-safe equivalent or clear unavailability behavior.

### P1 workflow completeness

1. Add supported recovery controls. The local adapter stores up to five rotating snapshots and exposes `listRecoveryBackups`, but application UI does not call it. Users currently cannot inspect, export, or restore those snapshots through supported controls.
2. Complete board lifecycle discoverability. Current UI clearly creates/switches boards, but operational v1 should explicitly evaluate board duplicate, archive, restore, and local permanent removal. Cloud parents must remain archive-only where hard deletion is denied.
3. Complete list lifecycle semantics. Cloud list permanent deletion is correctly blocked, but the visible action should not look like a normal Delete control that only reports refusal. Prefer a clear archive/restore model if Rules and data retention support it.
4. Evaluate list reordering. Cards can move; a realistic kanban setup also benefits from pointer and keyboard list ordering.
5. Add assignee and completion/status filtering if the existing model supports it cleanly. Current first-class filters are due state and label color, while text search covers assignee names.
6. Audit the legacy local-only `Collaboration plan` alongside real Firebase collaboration. Rename, reposition, or scope it so users do not mistake a local preview for authorization.
7. Add a concise first-run path that explains Local workspace, Create cloud copy, Cloud workspaces, export, and retention boundaries without forcing account creation.
8. Ensure mode/status and save/error feedback remain visible and actionable on mobile.

### P1 test gaps

1. No full local project scenario is automated from clean storage through export/reload/recovery.
2. No browser workflow currently creates multiple boards and proves isolation.
3. No browser workflow exercises complete rich-card editing, filtering, ordering, archive/restore, and undo together.
4. No browser-level Firestore workflow exercises two users against Emulator Rules.
5. No deterministic invitation -> editor work -> viewer denial -> revocation scenario runs in CI.
6. Production acceptance is documented as many narrow probes rather than one sanitized project workflow report.

### P2 operational gaps

1. Beta user count, allowed data, support owner, quota warning/stop thresholds, incident response, and account succession require written approval.
2. Manual assistive-technology testing remains distinct from Lighthouse.
3. The application has no trusted permanent purge path, so onboarding and retention copy must remain explicit.
4. Node test runs currently emit module-type warnings because `package.json` does not declare a module type while `.js` modules use ESM syntax. This is developer friction, not a release blocker. Resolve it only with regression coverage for `state-core.js` and every browser/global/CommonJS compatibility boundary.

## 6. Real workflow qualification scenarios

Each scenario gets a stable identifier, deterministic fixture, automated coverage where possible, a manual production boundary where required, and a sanitized result row.

### WF-01 - First-time local project

Starting state: clean browser storage.

Steps:

1. Load Flowboard and understand local mode without signing in.
2. Open My workspace.
3. Create `Workflow qualification local` from Blank Board.
4. Create lists `Backlog`, `Ready`, `Doing`, `Review`, and `Done`.
5. Add at least six cards with realistic titles.
6. Add descriptions, labels, due dates, checklists, and local assignees to selected cards.
7. Move/reorder cards with pointer and keyboard.
8. Filter by text, label, due state, assignee, and completion/status where implemented.
9. Reload and verify exact project structure persists.

Pass gate: a new user can create and organize a real project without hidden setup or console errors.

### WF-02 - Local execution and recovery

1. Complete checklist items and move tasks through Doing, Review, and Done.
2. Archive and restore a card.
3. Delete or archive a permitted local entity, then Undo.
4. Export workspace JSON, board JSON, and CSV.
5. Import board JSON as a new board.
6. Replace a clean test browser with the workspace export.
7. Reject malformed import without storage mutation.
8. Open a supported Recovery surface, inspect timestamp and count-only snapshot summaries without exposing task content unexpectedly, and export a selected snapshot.
9. Restore a selected snapshot only after an accessible confirmation, after first backing up the current workspace.
10. Confirm recovery remains local-only, snapshots remain bounded, malformed snapshots fail without mutation, and storage-failure guidance is visible.

Pass gate: task execution, recovery, and portability work without data loss.

### WF-03 - Owner creates a shared project

Use a dedicated disposable cloud workspace created through supported UI only. Never use `My Flowboard workspace` or the lifecycle fixture.

Proposed production fixture name, requiring explicit approval before creation:

```text
Flowboard workflow qualification
```

Steps:

1. Capture the localStorage baseline.
2. Sign in normally.
3. Review cloud-copy counts and download backup.
4. Create and verify the cloud copy.
5. Confirm the local workspace remains active and byte-identical.
6. Open the cloud workspace explicitly.
7. Verify all boards/lists/cards and active mode copy.
8. Create editor and viewer invitations through supported UI.

Pass gate: cloud setup is explicit, reversible, and does not alter the local original.

### WF-04 - Editor executes assigned work

1. Editor accepts the invitation with the intended verified Google account.
2. Owner assigns a card to the editor.
3. Editor sees the assignment without refresh.
4. Editor edits details, checklist, due data, and labels.
5. Editor moves the card to Doing and adds a comment.
6. Owner sees each supported update converge.
7. Activity shows privacy-minimal action evidence without copying content.
8. Concurrent owner/editor edit produces deterministic conflict behavior and no silent overwrite.

Pass gate: an editor can perform the normal project-execution loop and both contexts converge.

### WF-05 - Viewer review

1. Viewer accepts the matching invitation.
2. Viewer can discover and open the workspace in read-only preview.
3. Viewer can inspect cards, search/filter, view activity/comments, export where approved, close dialogs, and return local.
4. Editing, dragging, assignment, commenting, archive, membership, invitation, and lifecycle controls are absent or disabled honestly.
5. Direct Rules probes reject viewer writes with `permission-denied`.

Pass gate: viewer inspection is useful and all mutation boundaries agree between UI and Rules.

### WF-06 - Membership and revocation

1. Owner changes editor to viewer and back.
2. Open editor card controls become read-only immediately after downgrade.
3. Owner revokes/removes the member while the member has an active card surface.
4. Listeners stop, dialogs close safely, and the removed context returns to unchanged local mode.
5. Direct reads/writes fail.
6. A reconnect does not restore access.
7. Self-leave cleans discovery and local mode safely.
8. Ownership transfer is tested only with disposable identities and is restored atomically.

Pass gate: role loss and revocation fail closed without leaking or corrupting local data.

### WF-07 - Workspace lifecycle

1. Independent-context rename convergence.
2. Stale lifecycle mutation rejected as `REVISION_CONFLICT` with no write.
3. Canonical name restoration.
4. Session B exact localStorage baseline capture.
5. Owner archive from Session A.
6. Session B immediate listener stop, dialog closure, local fallback, and no reconnect loop.
7. Exact raw localStorage equality.
8. Archived retained row and non-openability.
9. Owner Restore and retained-content verification without edits.
10. Final approved retained fixture state.

Pass gate: complete `TERRA_NEXT_PHASES_PLAN.md` Phase 1 and Phase 3 evidence.

### WF-08 - Resilience and errors

1. Offline before edit and reconnect.
2. Offline pending mutation rejected after revocation.
3. Stale board/list/card revision conflict.
4. Storage quota/write failure.
5. Firestore unavailable/quota-style failure classification.
6. Sign-out during active cloud use.
7. Missing/denied stale workspace discovery reference.
8. Interrupted migration retry.
9. Late listener callbacks after teardown.

Pass gate: every failure is visible, classified, recoverable where appropriate, and never reported as synced incorrectly.

### WF-09 - Mobile and accessibility

Run WF-01 task capture and WF-04 card execution at 390 px and keyboard-only desktop.

Require:

- no page-level horizontal overflow outside the board lane;
- all pointer targets at least 44 px for coarse input;
- visible focus and logical order;
- Escape and close buttons with focus return;
- screen-reader context for cards, positions, and mutation status;
- no color-only status;
- forced colors and reduced motion;
- Lighthouse score 1 with zero failed audits;
- a manual pass with the intended beta user’s actual assistive technology where relevant.

### WF-10 - Release and operations

1. Clean diff and intended commit scope.
2. Full local/Rules/browser/accessibility/build validation.
3. Correct GitHub account for push, then restore `makoaharadasaito`.
4. CI and Pages success for full SHA.
5. Cache-busted production smoke and zero console errors.
6. Sanitized workflow matrix.
7. Quota review and beta stop conditions.
8. Export/recovery and incident instructions.

## 7. Luna execution protocol

Luna should work continuously through Development Phases 0 through 6 after one start authorization. Do not pause for Aaron to exercise the site between phases. Send progress and checkpoint reports for visibility, but those reports are not approval gates. Human testing is deferred to Phase 7.

Continuous-development cadence:

1. Aaron gives one explicit start instruction for the continuous-development sequence.
2. Create a dedicated development branch from the pinned `5a17747` baseline. Do not develop directly on production `main`.
3. Complete Development Phases 0 through 6 autonomously, reevaluating and adjusting later work from actual test results.
4. Run focused automated tests after each coherent change and the full local validation suite at every checkpoint. Do not intentionally accumulate untested code merely because user testing is deferred.
5. Use local preview browsers, synthetic fixtures, Firebase Auth/Firestore Emulators, independent browser contexts, and accessibility tooling without requesting user intervention.
6. Commit coherent checkpoints to the development branch. A draft pull request may provide CI validation, but it must not trigger or merge a production Pages release.
7. Progress reports must separate implemented, locally validated, branch-committed, CI-validated, production-deployed, production-accepted, deferred, and blocked results.
8. Continue after ordinary test failures by diagnosing and correcting them. Do not ask Aaron to reproduce failures that can be reproduced locally or in Emulators.
9. Stop at the single Final Human Gate before production Rules publication, merge/deployment, real Google-account tests, or beta approval.
10. If Aaron is unavailable at the Final Human Gate, preserve the validated release candidate and exact instructions without publishing or mutating production.

For every development checkpoint:

1. inspect `git status`, active branch, `HEAD`, and `origin/main`;
2. read the exact files and tests affected;
3. state the intended change boundary;
4. add or update focused tests first where practical;
5. implement the smallest coherent change;
6. run focused validation;
7. run the complete required validation chain;
8. inspect the exact diff and credential/public-copy scans;
9. obtain independent review for security-sensitive, Rules, lifecycle, persistence, or cross-mode changes without pausing for user approval;
10. commit only intended files;
11. switch GitHub CLI to `kcchanai` only if pushing the development branch or draft pull request;
12. verify branch CI when available, but do not merge `main` or trigger production Pages;
13. restore GitHub CLI to `makoaharadasaito` after every push;
14. report branch results separately from deferred production-human evidence.

Development does not stop merely because:

- a planned feature needs user acceptance later;
- production Google accounts are unavailable;
- a Rules change can be developed and fully Emulator-tested but not yet published;
- a local automated test initially fails;
- the old production browser contexts are no longer available;
- a nonessential product choice has a safe reversible default.

Stop or isolate only the affected workstream if:

- a credential, production identifier, browser profile, token, or administrator write would be needed;
- production `main`, production Rules, or production data would be changed before the Final Human Gate;
- a test demonstrates actual data loss or an authorization bypass and no safe local fix is available;
- source headroom cannot be recovered without unreadable compaction or cap changes;
- a destructive or irreversible production action is proposed;
- the protected workspace could be affected;
- a paid service, new infrastructure, persistent cache, backend, or machine-level change would be required.

When one workstream is blocked, document it and continue independent safe work. Escalate security-sensitive design to Terra through independent review, not by waiting for Aaron to perform tests.

## 8. Implementation phases

### Development Phase 0 - preserve production and open the development stream

Goal: continue development without invalidating or mutating the current production baseline.

Tasks:

1. Record the deployed `5a17747` production evidence and the exact paused fixture state from `LUNA_CONTINUATION_HANDOFF.md`.
2. Treat the previous rename/stale results as historical release evidence, not final operational-v1 acceptance.
3. Do not ask Aaron to preserve, refresh, or operate the old browser contexts. Final acceptance will create fresh independent contexts against the final release candidate.
4. Leave `Lifecycle realtime probe` and `My Flowboard workspace` untouched throughout development.
5. Create a dedicated development branch from `5a17747` after first committing or otherwise preserving the approved planning documents.
6. Confirm branch CI cannot deploy GitHub Pages production. Use a draft pull request or branch-only checks as appropriate.
7. Record the Final Human Gate requirements in `WORKFLOW_QUALIFICATION.md` so they cannot be mistaken for completed evidence.

Exit gate:

- development is isolated from production `main`;
- current production data and Rules are untouched;
- no user test is required to proceed to Development Phase 1.

### Development Phase 1 - restore engineering headroom and reviewability

Goal: create room for workflow work before adding it.

Tasks:

1. Record baseline source, initial/lazy chunks, gzip output, and test counts.
2. Consolidate duplicated `app.js` state/domain helpers into `FlowboardState`.
3. Preserve cloud-only `revision` and `clientMutationId` at workspace, board, list, and card levels.
4. Add focused tests for local normalization plus cloud revision/mutation overlay preservation.
5. Split orchestration into readable modules only where it improves ownership; splitting alone does not reduce aggregate raw bytes.
6. Remove obsolete Phase A/local-only duplication only after proving no live dependency.
7. Keep safety, privacy, authorization, and accessibility copy readable.
8. Do not raise the 210,000-byte cap merely to pass.
9. Target at least 10,000 bytes raw-source headroom and document built transfer/parse measurements separately.
10. Evaluate the Node module-type warning separately. Prefer a clear module boundary, but do not add `"type": "module"` until tests prove the browser-global and any CommonJS-compatible `state-core.js` consumers still work. Do not mix an unverified module-mode transition into behavior changes.

Required gates:

```text
npm test
npm run check
npm run build
npm run test:rules
git diff --check
```

Also run all browser checks and Lighthouse. Require local/cloud normalization, rich cards, imports, migration, and realtime behavior to remain unchanged.

Exit gate:

- source usage is at most 200,000 / 210,000 bytes or a stricter equivalent margin;
- code is more readable, not merely shorter;
- no Rules or product behavior change is hidden in the refactor.

### Development Phase 2 - freeze the workflow contract and fixture model

Goal: make “real workflow” executable and auditable.

Tasks:

1. Create `WORKFLOW_QUALIFICATION.md` from scenarios WF-01 through WF-10.
2. Define deterministic local fixtures with stable semantic names and generated IDs.
3. Define emulator-only synthetic users: owner, editor, viewer, non-member, removed member. Use non-real example addresses and never production identities.
4. Define a separate production workflow fixture name, but do not create it until the Final Human Gate.
5. Define cleanup/retention for every fixture.
6. Add a sanitized matrix schema: scenario, operation, expected role/result, actual classification, PASS/FAIL, release SHA.
7. Define test selectors using roles, labels, and stable test fixture boundaries rather than brittle text where wording is not the behavior under test.
8. Add package/CI scripts only after deciding whether Playwright remains ephemeral or becomes a pinned dev dependency. Document license, size, and security rationale.

Exit gate:

- every workflow has a deterministic start state, action sequence, observable result, cleanup state, and privacy boundary;
- no production credential or identifier appears in fixtures.

### Development Phase 3 - local operational-v1 workflow completion

Goal: close only the UX gaps required by WF-01 and WF-02.

Discovery tasks before coding:

1. Exercise current clean-storage onboarding, board creation/switching, templates, list/card setup, filters, ordering, archive, undo, and import/export in a real browser.
2. Mark each route as PASS, awkward, misleading, missing, or deliberately deferred.
3. Do not implement historical-roadmap items that do not support a named workflow.

Likely implementation candidates, subject to discovery:

1. First-run explanation of local mode, cloud-copy separation, export, recovery, and retention.
2. A local Recovery surface backed by `listRecoveryBackups`: timestamp/count summary, selected-snapshot export, pre-restore backup, accessible confirmation, exact restore, and safe malformed-entry handling. It must be hidden or clearly local-only while a cloud workspace is active.
3. Complete local board lifecycle: duplicate, archive, restore, and separately confirmed permanent local removal.
4. Complete cloud board lifecycle with archive/restore only if Rules and retention model permit it; never expose unsafe hard deletion.
5. Honest list lifecycle: local delete where allowed, cloud archive/restore instead of a misleading Delete refusal.
6. Pointer and keyboard list reordering.
7. Assignee and completion/status filters, with active filter summary and one-click clear.
8. Clarify the legacy local-only Collaboration plan so it cannot be mistaken for real authorization.
9. Improve mode/error/save feedback at narrow widths.

Automated browser coverage:

- clean first-run -> create board -> create five lists -> add rich cards -> reload;
- multiple-board isolation and active-board persistence;
- pointer and keyboard card/list ordering;
- search and every supported filter;
- card archive/restore, local removal, and Undo;
- export/import round trip and malformed-import no-change proof;
- Recovery surface list/export/restore, current-state pre-restore backup, bounded snapshots, malformed-snapshot no-change proof, and cloud-mode isolation;
- mobile and keyboard workflow.

Exit gate:

- WF-01 and WF-02 pass through automated and agent-operated real-browser testing;
- every visible local control works;
- cloud mode never exposes a local-only destructive promise.

### Development Phase 4 - deterministic collaboration workflow test architecture

Goal: test shared behavior in CI without real credentials or production mutation.

Preferred design:

1. Add Firebase Authentication Emulator alongside Firestore Emulator for browser workflow tests.
2. Create a test-only browser entry or dependency-injected runtime that is never referenced by production `src/main.js`.
3. Connect only the test entry to `127.0.0.1` emulator endpoints.
4. Seed synthetic users and workspaces through supported Emulator/test APIs.
5. Exercise the real production adapters and Firestore Rules, not a permissive fake backend.
6. Add a static guard proving emulator hosts, test accounts, bypass flags, and seed controls are absent from production chunks.
7. Keep Google-provider UI acceptance separate; CI may use emulator email/password or custom synthetic auth solely for deterministic role contexts.
8. Use two independent Playwright browser contexts for realtime and revocation scenarios.
9. Reset Emulator data between tests and make tests serial where they share lifecycle state.
10. Archive diagnostics only on failure and redact document contents/identifiers from normal output.

Minimum emulator-browser suites:

- owner creates/opens a workspace fixture;
- editor and viewer discovery;
- editor rich-card mutation and owner convergence;
- viewer UI and direct write denial;
- concurrent stale mutation conflict;
- comments, assignments, and activity;
- role downgrade and removal;
- reconnect membership preflight;
- workspace archive propagation and Restore;
- exact browser-local storage isolation.

Exit gate:

- the complete synthetic WF-03 through WF-08 workflow runs in CI against Emulator Rules;
- no test hook appears in the deployed bundle;
- Google sign-in remains a separate production-human gate.

### Development Phase 5 - collaboration UX parity and workflow completion

Goal: fix issues exposed by Phase 4 rather than adding speculative features.

Audit and repair:

1. Owner invitation creation, durable copy-link access, revoke, expiry, and accepted state.
2. Editor/viewer role presentation and control availability.
3. Member-backed assignment choices, former-member rendering, and refresh.
4. Comment create/edit/soft-remove, pagination, stale revision, and author-state rendering.
5. Activity pagination and privacy-minimal labels.
6. Board/list/card mutation parity across local, editor cloud, and viewer preview.
7. Conflict rollback and authoritative resubscription.
8. Dialog closure and focus return after remote role/content changes.
9. Sign-out, leave, removal, and ownership-transfer cleanup.
10. Archived workspace discovery and restored control reconstruction.

Rules changes:

- Do not weaken Rules to make UI tests pass.
- If behavior requires a Rules change, document the exact authorization requirement, add failing Emulator tests first, implement and independently review the least-privilege Rules change, and continue Emulator validation. Defer publication to the Final Human Gate.

Exit gate:

- WF-03 through WF-07 pass against emulators;
- UI controls and direct Rules results agree for every role;
- no private content is copied into activity or diagnostics.

### Development Phase 6 - resilience, performance, and accessibility qualification

Goal: prove operational behavior under realistic stress and failure.

Tasks:

1. Execute WF-08 failure matrix.
2. Add large local and emulator fixtures, for example 20 lists and 500 cards, without production data.
3. Measure initial load, interaction latency, mutation completion, listener reads, and memory on a representative mid-range device/browser.
4. Verify bounded Firestore queries and comment/activity page limits.
5. Verify quota-style failures are visible and do not discard unsaved local work.
6. Run 320, 390, 440, 700, and desktop widths.
7. Run keyboard, forced-colors, reduced-motion, 200% zoom, and Lighthouse.
8. Perform manual screen-reader workflow where relevant.
9. Recheck public copy for no em dashes and honest retention/deletion language.

Exit gate:

- WF-08 and WF-09 pass;
- representative large-board behavior meets documented thresholds;
- no serious/critical accessibility issue remains;
- source and deployed performance budgets are documented separately.

### Phase 7 - Final Human Gate and production workflow qualification

Goal: prove the released site with real Google authentication and deployed Rules after deterministic tests pass.

This is the first point after continuous development where Aaron-operated testing or production authorization is required.

Prerequisites:

- explicit Aaron approval of the validated release candidate;
- dedicated disposable workflow workspace, not the lifecycle fixture and never `My Flowboard workspace`;
- separate real owner/editor/viewer/non-member sessions authenticated normally;
- no credential transfer, browser-profile copying, or token handling;
- exact candidate SHA and branch CI recorded;
- complete automated WF-01 through WF-09 matrix passed;
- any Rules change fully Emulator-tested and independently reviewed but not yet published.

Execution:

1. Present one consolidated release-candidate report and one consolidated operator plan rather than requesting tests phase by phase.
2. Publish the exact reviewed Rules revision only if Rules changed and Aaron explicitly authorizes the production publication path.
3. Merge/deploy the exact candidate client SHA only after required Rules ordering is satisfied.
4. Open fresh independent authenticated contexts. Do not depend on the old paused browser state.
5. Restore the lifecycle fixture from `Lifecycle realtime probe` to `Lifecycle acceptance renamed`, then restart the affected lifecycle evidence sequence against the final SHA.
6. Complete archive propagation, exact localStorage equality, retained-content Restore, and lifecycle role denials.
7. Run WF-03 through WF-07 using a separate approved workflow fixture and synthetic non-sensitive content.
8. Request only sanitized PASS lines and error classifications.
9. Stop immediately if an expected denial succeeds.
10. Restore roles and archive disposable fixtures after retained-content verification, subject to approval.
11. Verify localStorage isolation per context, production console cleanliness, and no reconnect loops.

Exit gate:

- owner/editor/viewer/non-member workflow matrix passes;
- production behavior matches Emulator behavior;
- no protected workspace or sensitive identifier is involved;
- fixture disposition is approved and verified.

### Phase 8 - beta operations and limited release

Goal: permit real use only within an explicit operational boundary.

Required decisions and artifacts:

1. Intended users and maximum workspace/member counts.
2. Personal/non-regulated data only unless separate written institutional approval exists.
3. Firebase project/account succession plan.
4. Support owner and support channel.
5. Incident triage and rollback procedure.
6. Export/recovery instructions.
7. Archive-only retention and no-permanent-purge explanation.
8. Firestore read/write/storage quota warning and stop thresholds.
9. Scheduled quota review cadence.
10. User-facing known limitations and prohibited-data notice.
11. Small reversible beta with explicit expansion approval.

Exit gate:

- Aaron approves scope, data boundary, support owner, quota thresholds, and succession;
- invited beta users complete WF-01, WF-03, WF-04, and WF-05 safely;
- no unresolved authorization, isolation, retention, or data-loss defect remains.

### Phase 9 - closeout and definition of done

Produce one final report containing:

- operational-v1 feature matrix;
- workflow qualification matrix WF-01 through WF-10;
- exact client commit and deployed URL;
- exact Rules source revision/hash;
- local, Rules, browser, accessibility, performance, CI, Pages, and console results;
- sanitized production role evidence;
- local/cloud isolation evidence;
- fixture disposition;
- known limitations and deferred architecture;
- beta decision and stop conditions.

Operational v1 is complete only if repository docs, tests, deployed behavior, privacy copy, and the report agree.

## 9. Required validation commands and evidence

Base commands for every development checkpoint:

```bash
npm test
npm run check
npm run build
npm run test:rules
git diff --check
```

Browser and accessibility changes also require the repository’s pinned CI versions of Playwright and Lighthouse, the production `/UH-Trello/` base path, and the complete browser suite. If running locally with installed Microsoft Edge, use the existing Edge executable route and cleanly terminate preview processes afterward. Do not treat a successful local run as a replacement for CI.

The single final production release requires:

```text
Focused tests: passed
Application/tooling tests: passed with exact count
Rules tests: passed with exact count
Browser tests: passed with exact count
Static/source budget: passed with exact bytes
Build: passed
Accessibility: score 1, zero failed audits
Diff/privacy/public-copy scans: passed
CI validation: success for full SHA
Pages deployment: success for full SHA
Production console: zero unexpected messages/errors
GitHub CLI restored: makoaharadasaito
```

## 10. Luna startup instruction

Use this instruction when handing execution to Luna:

```text
Read C:/Code/Stacie-Hermes/UH-Trello/LUNA_FULL_WORKFLOW_IMPLEMENTATION_PLAN.md, LUNA_CONTINUATION_HANDOFF.md, and TERRA_NEXT_PHASES_PLAN.md. Start Continuous Development Phase 0 from deployed commit 5a17747. Create an isolated development branch, keep production main and production data untouched, and continue autonomously through Development Phases 1 through 6. Run all automated, browser, accessibility, build, and Firebase Emulator tests yourself. Do not wait for Aaron-operated testing between phases. Send non-blocking progress reports. Stop at the single Phase 7 Final Human Gate before production Rules publication, main merge/deployment, real Google-account testing, or beta approval. Never touch My Flowboard workspace.
```
