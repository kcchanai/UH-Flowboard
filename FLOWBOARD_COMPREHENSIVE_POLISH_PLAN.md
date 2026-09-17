# Flowboard comprehensive polish plan: desktop office edition

## Status and purpose

**Planning complete. Implementation not started.**

Prepared for Aaron's handoff from Astra to `gpt-5.6-luna`. This document defines a comprehensive reliability, usability, and visual-polish pass, not another feature expansion. The planning request does not authorize implementation, merge, deployment, Rules publication, or real-account testing. Begin implementation only after Aaron switches models and directs continuation.

- App: https://kcchanai.github.io/UH-Flowboard/
- Allowed working root: `C:/Code/Stacie-Hermes`.
- Repository: `C:/Code/Stacie-Hermes/UH-Trello`.
- Remote repository: `kcchanai/UH-Flowboard`.
- Verified local planning baseline: `main`, `b208b564236ead57b3dd5b33b70686445ae92e67`.
- Current planning additions: this plan and `artifacts/polish-planning/`. No application source changes made in this planning pass.
- Proposed implementation branch: `luna/flowboard-comprehensive-polish`, created from freshly verified `origin/main`, not an obsolete development branch.
- Historical MVP V2 release evidence is background only. Do not relabel this new pass as completed because earlier tests passed.

## Product outcome

Make Flowboard feel calm, coherent, and trustworthy for staff working at desktop computers in an office: a board that is immediately understandable, comfortable during sustained use, efficient with mouse and keyboard, and honest about whether work is saved locally or synchronized to the cloud. Optimize desktop work first, not a phone-first interface scaled up.

Preserve the existing local-first/Firebase architecture and recognizable blue/navy identity. Improve hierarchy, alignment, spacing, typography, controls, feedback, and interaction consistency. Do not add a framework, backend, icon/font service, PWA, persistent Firestore cache, offline write queue, paid service, or unrelated feature system for polish.

### Primary environment and scope

- **Primary:** Office desktop browsers, with Chrome/Chromium and Microsoft Edge as the initial qualification targets. This is a testing default, not a claim about the organization's managed-browser inventory.
- **Desktop viewport matrix:** 1280x720, 1440x900, and 1920x1080 CSS pixels, plus a resized/split-window check at 960x720. Record actual viewport dimensions, not just monitor resolution.
- **Daily-use emphasis:** Scan multiple lists and card metadata at once; search and filter quickly; create, edit, move, and review tasks with predictable mouse and keyboard behavior; retain context during repeated work.
- **Accessibility remains required:** Browser zoom, keyboard access, visible focus, contrast, and usable resized windows matter to desktop staff and are not mobile-only concerns.
- **Secondary compatibility only:** Retain existing narrow-width/touch behavior and run a small regression smoke. Do not build a dedicated mobile navigation system, gesture workflow, phone-specific visual matrix, or iPhone acceptance program. Existing mandatory tests must still pass.
- **Mobile-only issues:** Record them honestly and defer non-critical cosmetic refinements rather than delaying desktop polish. Fix shared layout defects and any inaccessible essential controls, data loss, or security issue regardless of viewport. The 320px clipping observation remains evidence, but is not a standalone phone-redesign workstream.

### Priorities

1. **P0: Data and authorization safety.** No false save success, lost drafts, stale workspace results, misleading role controls, or local/cloud cross-contamination.
2. **P1: Core usability.** Correct filters, movement, desktop navigation, mouse/keyboard controls, dialogs, recovery, and feedback.
3. **P2: Visual quality and efficiency.** A coherent desktop visual system, comfortable information density, readable metadata, polished empty/loading/error states, and measured performance.

If a P0 issue cannot be resolved inside the safety boundaries, stop that affected step and report the exact blocker. Do not hide it behind visual improvements.

## Evidence from the planning audit

Evidence files: `artifacts/polish-planning/report.json`, `audit.cjs`, `live-1440.png`, `live-700.png`, `live-390.png`, `live-320.png`, `live-card.png`, and `live-boards.png`.

The live browser audit used a fresh anonymous context, seeded browser-local content, and no Google sign-in or cloud-workspace access. It returned HTTP 200 and captured no console/page errors in the sampled flows. That is a limited anonymous smoke result, not authenticated production acceptance or proof that every workflow is sound.

### Confirmed live/source findings

- **F01: Filter state and UI disagree after Clear filters.** Selecting Due today and clearing filters restores 10 visible starter cards but leaves `#due-filter` at `today` and a `Due today` chip visible. `renderFilters()` synchronizes other controls but not the due select. Regression must assert both results and control/chip state.
- **F02: Narrow list controls are clipped.** At 320px viewport width, the board lane measures 292px while each list remains 325px. Document width is bounded, but the first list's right edge and menu are clipped. A page-overflow assertion alone misses this defect. Treat it as a secondary compatibility finding; fix shared sizing and control reachability without introducing a mobile redesign.
- **F03: Board nesting is structurally wrong.** `index.html` opens `.board-header` and never closes it before the board section. The browser audit confirms `#board` is a child of `.board-header`. Restore the intended sibling structure and requalify layout, rather than merely masking overflow.
- **F04: Visual hierarchy needs refinement.** Screenshots show uneven toolbar alignment, a crowded multirow mobile header, oversized/wrapping utility controls, generic starter label names, and a background seam in the full-page desktop capture. Treat these as visual observations, not proof of performance defects.
- **F05: Card editor field sizing is inconsistent.** The local assignee input is narrow enough to truncate its usage hint. Title/description spacing and secondary-action organization need attention. Preserve local free-text assignment and existing member-backed cloud assignment; do not replace one with the other.
- **F06: Source budget is nearly exhausted.** Fresh measurement: 217,207 raw production-source bytes against 217,500, leaving 293 bytes. This is a maintainability guard, not a Firebase quota or download-size measurement.

### Source-review risks requiring reproduction, not yet confirmed live failures

- **R01: Failed Undo/import persistence.** `undo()` and `applyImport()` call `persist()` but do not condition the subsequent success UI on its boolean result. Verify quota/denied-storage failure at the real storage boundary; investigate history, rollback, import preview, and recovery effects before patching.
- **R02: Late asynchronous cloud results.** Members, activity, and assignment UI await reads while referring to mutable session/workspace/dialog state. Test workspace A-to-B switching, card switching, closure, sign-out, role loss, and delayed responses. Do not claim an authorization bypass solely from this inspection.
- **R03: Move position and save completion.** The Move dialog uses destination card count as its maximum even for a different list; verify append-to-end, archived entries, and same-list indexing. Cloud movement can return before acknowledgement; verify failure does not discard an unsaved editor draft or falsely announce completion.
- **R04: Test confidence gaps.** The preceding release history includes a failed full local browser run without retained failure diagnostics, despite later green CI. Reproduce the full suite from a clean baseline. Existing 200 percent reflow coverage uses a narrower viewport, not proof of actual browser zoom.

Do not carry speculative findings into the final defect count as confirmed. Each must end as reproduced/fixed, disproven with evidence, or explicitly blocked.

## Binding safety and engineering constraints

- Work only inside the allowed root. Do not inspect Aaron's normal browser profile or use personal/sensitive fixtures. Use isolated browser contexts with disposable synthetic data.
- Never open or mutate `My Flowboard workspace`. Leave `Lifecycle realtime probe` and existing acceptance fixtures untouched.
- No production Firestore mutation, credential handling, Rules publication, merge to `main`, or Pages deployment during Steps 1-11.
- Never print raw `flowboard-workspace` or `flowboard-data`. Compare their exact raw strings in memory and report equality booleans; parsed equivalence is insufficient. Preserve missing keys as missing.
- Redact credentials, Firebase configuration values, emails, UIDs, workspace IDs, invitation links, tokens, cookies, and authentication artifacts from reports, traces, screenshots, and chat. Synthetic identity-bearing test artifacts also need redaction before sharing.
- Keep deny-by-default Rules, transactional revision checks, invitation/ownership boundaries, retained cloud parents, and legacy-data compatibility. No schema change or Rules change is planned. If one proves necessary, stop and provide a separate reviewed proposal before depending on it.
- Preserve owner-only recoverable workspace archive/restore. Never substitute permanent recursive deletion.
- Preserve required lifecycle results: `Archived: Cloud workspace · archived · retained` and `Restored: Cloud workspace · owner · editable`.
- Preserve the lifecycle stale-conflict message: `This workspace changed in another session. Refresh and try again.` Missing legacy lifecycle revision normalizes to 0; successful lifecycle rename/archive/restore increments once; stale requests return `REVISION_CONFLICT`.
- Read-only mode must retain visible usable Close, Cancel, navigation, search, inspection, export where allowed, and return-to-local controls. Escape supplements pointer closure; it does not replace it.
- No em dashes in public-facing copy, including accessible names and dynamic status strings.
- Keep raw-source cap 217,500, warning threshold 210,000, existing per-file limits, initial-shell gzip 25,000, and first-party-lazy gzip 55,000. Report HTML document and vendor transfer separately; also show actual total startup transfer so category accounting cannot disguise a regression.
- Do not write package/browser caches or temporary profiles outside the allowed root. Reuse installed tooling when possible. Obtain explicit approval if a required tool operation cannot remain within scope.
- GitHub CLI account switching is machine-wide. Do not switch during planning. During separately authorized repository operations, avoid disrupting concurrent work and restore `makoaharadasaito` if a temporary `kcchanai` switch is explicitly permitted.

## Progress and completion contract

Create `FLOWBOARD_POLISH_PROGRESS.md` when implementation starts. Keep exactly one step `in_progress`. Other states: `not_started`, `blocked`, `complete`, and `awaiting_release_authorization`. Steps below are all currently **not_started**.

At the start of every step send `Step X of 12 in progress: <title>`. Immediately after verified acceptance and the local checkpoint, send:

```text
Step X of 12 complete: <title>
Changed: <specific behavior and files>
Verified: <commands, pass/fail/skip counts, browser matrix, evidence paths>
Budget: <source bytes / 217500; headroom; initial/lazy gzip>
Checkpoint: <full commit SHA; worktree status>
Production: unchanged; Rules unchanged; no real-account testing
Next: Step Y of 12, <title>
```

Use `Step X of 12 blocked` when acceptance is not met. Never mark a step complete because code was written, a focused test passed while the full required suite failed, or a test was skipped. Record failures and retries, not only the eventual successful attempt. A discovered baseline failure may be tracked to its repair step, but baseline evidence must identify it explicitly.

Commit only intended step files after acceptance. Exclude browser profiles, caches, generated `dist`, raw logs, and noisy screenshot churn. Keep curated before/after evidence. If another tool/user changed the worktree, preserve it and reconcile scope before staging.

Continue local/non-production implementation between steps once authorized; do not request approval for every routine design choice. Stop only at a genuine safety, budget, tooling, or release boundary. Do not imply work continues after a final message unless an actual tracked job is running.

## The 12-step implementation plan

### Step 1 of 12: Establish a reproducible baseline

**Work**
- Confirm worktree, local/remote refs, tool availability, and current main. If main moved, record the difference and rebase this plan's assumptions before creating the isolated branch.
- Preserve planning evidence; create the progress ledger and `artifacts/polish/step-01/` baseline manifest.
- Run current validation, built-preview browser smoke, Rules, and emulator-browser suites. Preserve the exact full-suite failure if the historical flake reproduces.
- Capture light/dark states at the primary desktop viewport matrix: populated board, empty board/list, filters, card editor, picker, account, archive, recovery, confirmations. Record a small narrow-width regression sample separately, not the full phone-state matrix. Cloud role fixtures belong in emulator/contract tests, not production.
- Inventory every interactive control and mutation path, including Undo, import, export, reset, archive, bulk actions, member administration, comments, and assignments. Map each to owner/editor/viewer/local/preview behavior and existing tests.

**Acceptance**
- Exact baseline SHA, Rules hash, command exits/counts, screenshots, viewport/browser versions, and unresolved baseline failures recorded.
- Fresh contexts only; no protected data used. No app changes hidden in the baseline checkpoint.

### Step 2 of 12: Recover safe engineering headroom

**Work**
- Verify reachable production sources match the budget manifest. Inspect per-file constraints and actual configured/unconfigured build categories.
- Produce measured consolidation candidates: genuinely repeated rendering/guard code, duplicate CSS declarations, dead selectors and unreachable code proven unused. Keep changes understandable and reviewable.
- Aim to recover at least 4,000 bytes of usable headroom for the pass, with a measured allocation for remaining work. This is a planning target, not permission to change the cap or a claim that this reduction is already proven feasible.
- Do not minify source into opaque one-line code, remove recovery/accessibility/privacy copy, or exclude reachable files merely to fit.
- If safe reductions cannot accommodate the pass, stop with byte deltas, tests, reduced-scope options, and a quantified proposed cap transition for Aaron. No silent limit increase and no endless superficial compaction.

**Acceptance**
- Behavior-preserving changes pass unit/static/build/isolation and affected browser/Rules checks.
- Before/after raw source, per-file, reachable graph, gzip categories, and planned remaining allocation documented. Either a feasible budget exists or the step is explicitly blocked for a decision.

### Step 3 of 12: Fix core state and persistence reliability

**Primary files:** `app.js`, `state-core.js`, local adapter, state/adapter/browser tests.

**Work**
- Reproduce F01 and R01/R03 with regression tests before fixes. Render filters from one canonical state; synchronize select values, chips, counts, search results, clear-one, clear-all, and board/mode transitions.
- Cover no-match states, combined filters, archived lists/cards, and due/completion interactions. Do not count cards hidden by archived parents as visible results.
- Make Undo, import replace/merge, recovery restore, reset, create/edit/delete, and movement acknowledge persistence correctly. On failure retain the prior canonical persisted state, preserve recoverable drafts/import preview, and show actionable failure instead of success.
- Preserve undo history on failed Undo; verify pre-mutation backups and failure handling when backup storage itself is unavailable. Test the real storage boundary or an explicit test seam, not assignment to a frozen adapter method.
- Qualify end-position movement, same-list moves, empty destinations, filtered moves, no-op moves, mouse/keyboard/drag parity, with existing touch behavior preserved, and failed remote acknowledgement.

**Acceptance**
- Clear-all leaves no active chip, restores every select, and matches expected visible cards.
- Failed writes do not alter raw persisted state, emit false success, consume recoverability, or lose drafts. Successful changes survive reload.
- Movement places each card exactly once at the requested position, with no write/activity event on no-op.

### Step 4 of 12: Harden cloud state transitions and feedback

**Primary files:** cloud sync/controller/UI modules, members/activity/assignment/comments modules, emulator and browser tests.

**Work**
- Reproduce R02 with controllable delayed responses. Capture immutable request identity and generation per session/workspace/board/card as appropriate; discard stale results and stale errors after context changes.
- Invalidate pending UI on sign-out, local return, permission loss, archive, dialog closure, or replacement card. Do not let an old `finally` reset the current request's loading state.
- Verify rapid edits, double-submit, offline/reconnect, transaction conflict, role downgrade, revocation, and same-card remote changes. Keep Saving, Synced, Offline, Conflict, and failed/unsaved states distinct.
- Exercise comments pagination/edit/soft-remove, assignment former-member states, invitations, ownership confirmations, interrupted migration retry, archive/restore identity and revision behavior.
- Preserve Rules and bounded listeners/queries. Fix UI races without adding persistent caching or implying offline queued saves.

**Acceptance**
- Two-context emulator flows prove convergence and denial; raw local-key equality holds across cloud transitions.
- A late A response never paints B, resurrects a closed dialog, changes assignments on another card, or exposes obsolete owner controls.
- Listener teardown is verified. Direct Rules tests remain separate from UI guards. Emulator success is not called real-Google production acceptance.

### Step 5 of 12: Optimize desktop workspace layout and navigation

**Primary files:** `index.html`, `styles.css`, responsive/browser tests.

**Work**
- Fix F03 with properly closed semantic sections: app navigation, board header/toolbar, then board lane. Check resulting DOM relationships, not just source substrings.
- Organize a stable desktop header: clear workspace/board identity, readily available search and filters, aligned board actions, and concise mode/role status. Avoid unnecessary wrapping or large onboarding blocks that displace working content. Keep full safety meaning accessible without relying solely on hover tooltips.
- Use desktop width to show multiple readable lists without stretching cards excessively. Keep intentional horizontal board scrolling discoverable and usable with mouse, trackpad, and keyboard. Preserve scroll position and focus through routine rerenders where appropriate.
- Test menus near viewport edges, long workspace/board/list titles, filter chips, dense statuses, resized/split windows, and short desktop viewport heights. Essential controls must remain reachable without clipping or being hidden to force a fit.
- Run a limited narrow-width regression after shared structural changes. Fix shared control-reachability defects with minimal responsive rules; defer mobile-only layout embellishments.

**Acceptance**
- At 1280x720, 1440x900, 1920x1080, and the 960x720 resized-window check, the workspace uses available width well, document width is bounded, and list/card controls and menus are reachable. Existing narrow-width accessibility and regression checks still pass; no dedicated mobile redesign is required.
- Only the board lane intentionally scrolls horizontally. Search/title/actions remain usable and no sticky region obscures content or focus.
- DOM structure regression and screenshots cover both themes and populated/empty states.

### Step 6 of 12: Apply a coherent visual system

**Primary files:** `styles.css`, presentation markup and curated screenshots.

**Work**
- Define a compact token system for canvas/surface/text/border/action/danger colors, spacing, type scale, radius, shadow, and interaction states. Reuse existing fonts/icons; no external font dependency.
- Retain the blue/navy identity while reducing excessive saturation and background discontinuities. Use restrained shadows, clean surfaces, consistent utility-button treatment, and a clear primary action per context.
- Align header controls. Establish readable card/list hierarchy, consistent card padding and metadata, and comfortable desktop density for sustained scanning. Avoid oversized touch-first spacing on ordinary mouse-driven desktop controls, but keep adequate hit areas and preserve coarse-pointer rules. Make hover/focus/pressed/disabled states clear without hiding essential actions until hover.
- Use meaningful labels for newly seeded demo content where appropriate, without silently rewriting existing users' boards. Do not infer completion solely from a list called Done.
- Keep variable list heights when appropriate; do not stretch sparse cards merely to fill the screen. Intentional whitespace is acceptable.

**Acceptance**
- Before/after visual review across the desktop viewport matrix and resized-window check, both themes, empty and dense boards. Screenshots are actually inspected, not only generated. Check narrow compatibility once after shared changes rather than duplicating the full visual matrix on phones.
- No accidental clipping, background seams, inconsistent alignment, unreadable secondary text, or unexplained style variants in the representative matrix.
- Visual changes preserve behavior, accessibility, and budgets.

### Step 7 of 12: Refine the card editor and action dialogs

**Work**
- Fix F05: readable full-width local assignee guidance, balanced date/time/completion layout, consistent section spacing, and clear label/checklist editors.
- Keep cloud member selection distinct from local free-text names, including loading/error/read-only/former-member states.
- Make desktop dialogs comfortably sized, with balanced field columns where they improve scanning rather than overly long single-column forms. Keep a scrollable body and reachable Close/Cancel/Save actions at shorter desktop heights and browser zoom. Verify long descriptions, many labels/checklist items, comments, and activity.
- Group routine actions predictably; separate destructive actions with explicit confirmation. Keep Move discoverable, not buried to achieve visual simplicity.
- Clarify dirty-state discard and save-failure behavior across close button, Escape, backdrop, navigation, and remote invalidation. Event objects must never accidentally act as a force-close flag.
- Audit reused confirmation forms: hidden required fields must not block unrelated submissions.

**Acceptance**
- Mouse and keyboard can open, edit, save, cancel, move, archive, and close efficiently without losing unsaved work unexpectedly. Repeated editing has predictable focus and does not force unnecessary reopening or scrolling.
- Viewer Close/Cancel/navigation remain usable; editing stays unavailable.
- At the desktop matrix, resized-window width, short desktop heights, and required zoom/reflow settings, every essential control is reachable; focus is contained and returns to a sensible visible target. Preserve basic narrow-width access without phone-specific dialog redesign.

### Step 8 of 12: Polish discovery, onboarding, and secondary workflows

**Work**
- Make workspace/board discovery and return-to-local clear, searchable, and stable with many boards and long names.
- Distinguish local starter content, cloud membership, local recovery, archive retention, and explicit cloud-copy operations with concise task-focused language. Remove contradictory legacy copy, not safety meaning.
- Refine Start here into unobtrusive contextual help. Do not obscure the board or repeatedly interrupt established users.
- Give empty search, empty board/list, archive, recovery, member/invitation history, activity/comments, loading, unavailable, clipboard failure, and import errors actionable states.
- Keep export/import/reset/recovery reachable; validate export round trips and CSV escaping. Confirm invitations remain copyable links, not implied automatic email delivery.
- Make status announcements concise and non-competing; ensure positive feedback is tied to actual persistence or acknowledgement.

**Acceptance**
- A new staff member can create a board/card, discover editing/movement, recover/export, and understand where data is stored without reading a long manual. An experienced staff workflow can find an assigned or due task, edit/check it, move it, and return to the board efficiently using existing capabilities. Do not add unrequested productivity features merely to expand this scenario.
- Empty and error states offer a working next action; onboarding can be dismissed/closed without losing navigation.
- Owner/editor/viewer/local terminology is accurate. Public-copy scan finds no em dashes.

### Step 9 of 12: Qualify desktop accessibility and mouse/keyboard workflows

**Work**
- Audit semantic landmarks/headings, labels, visible-label/name agreement, status regions, disabled reasons, and menu/dialog semantics.
- Exercise complete keyboard paths: skip link, board navigation, filters, menus, card editing/movement, confirmations, recovery, role-restricted inspection, and focus after rerender.
- Prioritize visible keyboard focus, contrast, forced colors, reduced motion, non-color status cues, and comfortably clickable desktop targets. Preserve existing 44px coarse-pointer target rules and their regression tests; do not impose phone-sized spacing on every desktop control.
- Test 200% reflow and record its exact method. A half-width viewport or device scale factor is not native browser zoom proof. Run actual browser zoom when safely available, otherwise label that acceptance item manual, not passed.
- Inspect dialogs and stateful views with automated accessibility tools, not just the initial landing board. Manually inspect focus and announcements; automated scores alone are insufficient.

**Acceptance**
- Lighthouse accessibility 1.0 with no failed scored audit in its tested state; no serious/critical automated accessibility findings in additional audited states, with lesser findings triaged.
- No keyboard traps, invisible focus, pointer-only necessary action, inaccessible closure, or editing control enabled solely because of a UI race.
- Untested screen-reader/device combinations are disclosed rather than certified.

### Step 10 of 12: Stress-test performance and browser resilience

**Work**
- Benchmark synthetic 10-list/200-card and 20-list/1,000-card fixtures with deterministic seeded content. Extend the existing benchmark rather than claiming its current 200-card run covers 1,000 cards.
- Capture usable-render, filter response, dialog open/save, movement, long tasks, and memory/listener behavior over repeated navigation. Use repeated comparable samples and report median/tail observations with device/browser details.
- Test configured and unconfigured boot, denied storage, malformed/legacy data, slow/failed network, long Unicode/IME input, repeated UI actions, and full suite order independence.
- Prioritize desktop Chrome/Chromium and Microsoft Edge. Record which actual binaries were exercised; one Chromium run must not be reported as separate Chrome and Edge results. Check Firefox or desktop Safari/WebKit if already available or required by the office browser policy. Missing primary-browser coverage is a qualification gap; optional browser and mobile-device coverage is disclosed but is not automatically a release blocker.
- Optimize measured hotspots without premature framework migration or virtualization. Verify lazy loading and no test/emulator payload leakage in built assets.

**Acceptance**
- No unhandled page errors in normal flows; expected negative-path errors are classified and redacted, not suppressed to fake a clean console.
- Establish comparable baseline distributions in Step 1. Target no median regression greater than 10%; investigate any repeatable regression before accepting it. This is a local comparison, not a universal-device performance guarantee.
- Budgets and isolation pass; listener/request growth is bounded. No unresolved data-loss, permission, or persistence defect remains.

### Step 11 of 12: Package and independently qualify the release candidate

**Work**
- Freeze candidate source and run the entire chain on the exact revision, for configured/unconfigured modes as applicable. Run the full critical browser suite three consecutive times in isolated contexts; preserve retries/failures and resolve application flakes rather than weakening assertions.
- Re-run Rules and emulator multi-user flows; verify Rules byte identity against baseline. Capture the final desktop visual matrix, resized-window and zoom evidence, and mouse/keyboard staff-workflow evidence. Retain a small narrow-width regression result without requiring real-phone acceptance.
- Reconcile every F/R finding and inventory entry with a test or an explicitly disclosed gap. Verify all new tests are actually discovered by the commands/CI.
- Create `artifacts/polish/release-candidate/README.md` and `manifest.json`: full client SHA, Rules hash, tool/browser versions, exact counts, build/source budgets, curated evidence, known issues, rollback procedure, and production boundaries.
- Prepare a proposed PR body/release notes locally. Do not merge, deploy, publish Rules, run production probes, or switch GitHub identities as part of packaging.

**Acceptance**
- All required local/CI-available qualification checks pass, or the candidate is explicitly blocked. No unexplained failed full run can be replaced with a focused pass.
- Tests cover reliability, role safety, local isolation, responsive rendering, accessibility, and visual quality; historical evidence is not substituted for candidate evidence.
- Stop and send **READY FOR COMPREHENSIVE POLISH HUMAN RELEASE GATE** with a concise change summary, remaining manual matrix, and exact approval action. Steps 1-11 complete does not mean Step 12 complete.

### Step 12 of 12: Authorized release and real-user acceptance

**Execution gate:** Requires new, explicit Aaron approval for this candidate. Earlier MVP V2 approval does not authorize this release.

**Work after approval only**
- Verify unchanged candidate and clean intended worktree; use a reviewed PR and the existing complete same-SHA validation/deployment gate. Do not bypass checks.
- Verify merged full SHA, successful main validation, corresponding Pages workflow/artifact, and the actual served assets. An HTTP 200 or Pages `built` alone is insufficient.
- Perform isolated anonymous live smoke: startup, basic local create/edit/reload, filters, responsive controls, assets, and captured errors. Do not sign in or touch cloud fixtures automatically.
- Give Aaron one exact, redacted, self-contained acceptance handoff for fresh owner/editor/viewer/non-member sessions in a newly authorized disposable workspace. Cover convergence, denied direct access, revocation, archive/restore, local-key equality, console cleanliness, and outstanding desktop-browser/zoom checks. Ask staff to complete a representative task-review and editing workflow on an office desktop. Real-phone testing is optional and is not a release requirement for this desktop-focused pass.
- Never ask for credentials, tokens, full storage payloads, or verbose Firebase logs. Do not reuse protected or existing lifecycle fixtures.
- If release fails, stop rollout and propose a reviewed client revert to the recorded baseline. Re-run same-SHA validation/deployment verification; do not restore/delete cloud data or force-push as a rollback shortcut.

**Acceptance**
- Client deployment verified and authenticated/manual results recorded against the exact candidate and active Rules revision.
- Until human checks finish, report `Step 12 of 12 awaiting real-user acceptance`, separating deployed-client status from production acceptance.
- Only then report `Step 12 of 12 complete`, remaining limitations, and final URLs. No Rules publication is needed for byte-identical Rules; any changed Rules require their own explicit approval and verification.

## Validation execution notes for Luna

Start by reading `package.json`, the existing browser/emulator runners, workflows, and source-budget scripts. Commands below exist now; discover any changed flags rather than inventing them.

```bash
# Working directory: C:/Code/Stacie-Hermes/UH-Trello
npm.cmd run validate
npm.cmd run test:rules
npm.cmd run test:emulator-browser
npm.cmd run measure:mvp-v2
```

`validate` includes unit/static/build/budget/isolation checks, but does NOT include the browser suite, Rules suite, emulator-browser suite, or Lighthouse. Report each separately.

For the browser suite, build first, launch a Vite `preview` with `--host 127.0.0.1 --port <available-port> --strictPort`, and verify HTTP readiness at `/UH-Flowboard/`. Set `PLAYWRIGHT_BASE_URL` to that preview origin and invoke installed Playwright with `tests/browser-smoke.spec.mjs`. Tests importing built hashed assets must not run against the Vite dev server. The emulator harness is a deliberate separate test-only development shell.

Use `MVP_BENCHMARK_URL` and `MVP_BENCHMARK_OUTPUT` to point the existing benchmark to the owned preview and new step evidence, avoiding overwrite of historical MVP V2 results. Run Lighthouse on the same served base path and use `scripts/assert-lighthouse.mjs` with its actual expected output location. Keep any reports under the allowed root.

Use deterministic application/auth readiness, not blind sleeps or merely DOMContentLoaded. Retain diagnostics on failure. Do not reuse unknown occupied ports or kill unrelated processes. Clean up only owned previews/contexts and verify owned ports are released. If a runner invokes ephemeral installs outside scope, stop for approval or configure an in-scope cache before executing it.

## Required final handoff contents

- Numbered progress ledger with all 12 states and evidence, not an unsupported overall percentage.
- Confirmed defects fixed, source risks disproven/confirmed, and deliberately deferred items.
- Before/after screenshots and inspection notes for both themes at the desktop viewport matrix and resized-window check; include only limited narrow-width regression evidence. Clearly distinguish required office-browser results from optional mobile coverage.
- Exact test totals derived from output, including failures, skips, retries, and unavailable device coverage.
- Source/build/transfer and performance measurements with methodology.
- Full candidate/release SHA, Rules identity, worktree state, and production authorization status.
- A short end-user change summary and precise remaining manual actions.

## Model-switch handoff

After switching to `gpt-5.6-luna`, Aaron can send:

```text
Implement FLOWBOARD_COMPREHENSIVE_POLISH_PLAN.md in C:/Code/Stacie-Hermes/UH-Trello. Prioritize desktop office use, mouse/keyboard efficiency, readable multi-column boards, and desktop-browser reliability. Keep mobile to basic non-regression and accessibility compatibility, not a redesign or real-phone release gate. Start at Step 1 of 12, verify the current baseline, and create the isolated implementation branch and progress ledger. Report the start and verified completion of every step. Continue through non-production Steps 1-11 without asking at routine checkpoints. Preserve the plan's data, authorization, budget, filesystem, and privacy boundaries. Do not merge, deploy, publish Rules, or perform real-account/production fixture tests. Stop at READY FOR COMPREHENSIVE POLISH HUMAN RELEASE GATE, or earlier only for a genuine documented blocker.
```
