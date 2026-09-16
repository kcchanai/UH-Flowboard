# Flowboard: Trello-style MVP improvement execution plan

Status: READY FOR LUNA IMPLEMENTATION, not implemented by this planning task.
Authoring model: gpt-6-astra. Intended implementation model: gpt-5.6-luna.
Expected number of top-level steps: **14**.
Automatic development scope: **Steps 1-13**. **Step 14 requires explicit production authorization.**

## 1. Mission and definition of success

Improve the existing Flowboard application into a coherent, attractive, dependable Trello-style MVP. Do not rebuild an already working collaboration system or try to reproduce all of Trello. Optimize this daily loop:

> Open the correct board, capture a task, add useful details, assign and schedule it, move it through lists, find the next task, discuss it with authorized collaborators, and safely recover mistakes.

The product must feel like one application across desktop and phone, local and cloud modes, and owner/editor/viewer roles. Every visible action must work, be clearly unavailable for a stated reason, or be absent. Familiar kanban behavior is the goal, not copying Trello branding, proprietary assets, or enterprise features.

Deliver a tested candidate on an isolated branch, with a visual before/after report and one exact human release gate. Completion of implementation is not the same as production acceptance.

### Product acceptance scenarios

- A new local user can create a blank or template board, create and reorder lists, add several cards, edit a rich card, move it without dragging, mark it complete, filter it, archive/restore it, and reload without losing saved work.
- A returning user can switch boards on a phone, distinguish local from cloud data, and reach all essential actions without a keyboard or hover.
- Owner/editor collaboration continues to work through the real Firebase adapter in isolated Auth/Firestore Emulators. Viewer inspection remains useful without allowing mutations.
- Card edits have predictable Save/Discard behavior. Closing or cancelling never leaks a partial draft into canonical state or a later unrelated save.
- A two-context stale edit cannot overwrite newer work. Revocation, workspace archival, and sign-out stop unsafe work and leave the independent local workspace unchanged.
- Light/dark desktop and phone layouts are deliberately composed, not merely shrunk. Dialogs, menus, controls, metadata, empty states, and errors share a consistent design language.

## 2. Verified planning baseline and limitations

Local repository: `C:/Code/Stacie-Hermes/UH-Trello`
Remote: `https://github.com/kcchanai/UH-Flowboard.git`
Live site: `https://kcchanai.github.io/UH-Flowboard/`
Planning checkout: `main`, clean before creating this document.
Planning SHA: `07859a752e56fd2f01a0b8ff62d1264e2096de93`.

The public site was opened in a fresh anonymous Playwright context using the installed Edge executable. No normal browser profile, real account, or cloud workspace was accessed. HTTP 200 and zero page-level JavaScript errors were observed during this limited inspection. Screenshots covered desktop light/dark, desktop card details, phone board/card details, and 320px layout. This is not a full functional or production security acceptance run.

Planning evidence lives under `C:/Code/Stacie-Hermes/Resources/Flowboard-MVP-Planning/`:
- `live-audit.json`: viewport geometry and non-sensitive seeded-UI observations.
- `desktop-light.png`, `desktop-dark.png`, `desktop-card.png`.
- `mobile-light.png`, `mobile-card.png`, `narrow-light.png`.
- `audit-live.cjs`: reproducible fresh-context public UI audit; not a production probe.

### Existing functionality to preserve, not recreate

Source and README contain multiple boards/templates; board/list/card creation and editing; card drag ordering and Alt+Arrow movement; rich card fields; archive/restore; local undo/recovery/import/export; themes; accessible dialogs; Google authentication; explicit cloud-copy migration and workspace switching; revision-aware granular writes; realtime listeners; roles/invitations/member administration; cloud assignments/comments/activity; and owner workspace rename/archive/restore.

Presence in source or documentation is not fresh verification. Re-run relevant tests and classify each item as source-implemented, automated-tested, production-deployed, or production-accepted.

### Concrete gaps identified

1. **Mobile board navigation:** `#boards-button` is hidden below 700px. In the live 390px and 320px views, the board switcher was unavailable. Do not hide the only path to an essential feature.
2. **Crowded mobile header:** search becomes too narrow and sign-in/status text truncates. Separate navigation, search, and board status responsively.
3. **Misleading destructive affordances:** each card exposes an X; list ellipsis currently maps to list deletion rather than a real list menu. Cloud and local removal semantics differ.
4. **Card draft integrity:** `app.js` label/checklist add/remove handlers mutate `dialogCard()` directly before Save. `closeCard()` does not discard a separate draft; `saveDetails()` closes immediately after initiating `mutate`. A fresh anonymous browser reproduction confirmed the label issue: open a seeded card with one label, Add label, close without Save, reopen, and two labels remain in memory. No cloud access was used. Fix this before visual polish hides the defect.
5. **Thin navigation hierarchy:** boards live in a dialog and cloud discovery sits behind account controls. The active workspace, board, access role, and save/sync state need one clear hierarchy.
6. **Metadata honesty:** the seed uses opaque `meta` strings that display comment/attachment/date/completion badges without backing functionality. Preserve legacy data, but stop presenting it as live structured counts or real deadlines.
7. **Filter gaps:** current structured filters are date and color, not label name, assignee, unassigned, or explicit completion. Cloud member-backed assignments are not handled as searchable member identities by the basic state helper.
8. **Completion/date semantics:** `dueState()` derives completion from all checklist items being done and uses a UTC-derived date default. This is not explicit card completion and can classify today incorrectly near local midnight. Due time is not included in overdue classification.
9. **Missing discoverable movement controls:** card movement exists by desktop drag/keyboard, but needs a visible Move dialog for touch and assistive use. List reordering needs a supported UI.
10. **Maintainability constraints:** the raw-source validator reports **198,304 / 210,000 bytes**, leaving **11,696 bytes**. It counts 23 enumerated source files, not compressed downloads. Splitting files does not create aggregate headroom.
11. **Release gating:** `deploy-pages.yml` currently runs `npm run validate` independently of the fuller `validate.yml` workflow. A Pages deployment is not structurally waiting for all Rules/browser/Emulator/accessibility checks on the same SHA.
12. **Stale documentation:** prior hardening and qualification documents still name older branches, production SHAs, and pending gates. Reconcile rather than resuming obsolete tasks or overwriting historical evidence.

## 3. Scope and prioritization

### Required MVP improvements

- Mobile-accessible board/workspace navigation and direct, role-aware collaboration entry points.
- Consistent visual system, compact useful board cards, real contextual menus, polished card dialog, readable status feedback.
- List reordering with keyboard/touch controls; precise card movement and a non-drag alternative.
- Safe card drafts; explicit completion; reliable date semantics; existing labels/checklists/assignees/comments presented coherently.
- Combined text, label, member/unassigned, date, and completion filters with visible chips and reset.
- Honest onboarding/sample data, robust export/recovery, clear local/cloud boundaries.
- Regression coverage, two-context Emulator evidence, accessibility/responsive verification, source/build budgets, and same-SHA deployment gating.

### Explicitly deferred

Do not add attachments/file storage, remote image backgrounds, notification emails, push notifications, recurring-task automation, Butler-like rules, calendar/timeline/table views, workspace-wide full-text search, cross-workspace card moves, cross-board moves carrying comment histories, public boards, enterprise permissions, offline cloud-write queues, PWA/service workers, rich-text HTML editors, integrations, analytics tracking, or new paid services.

Board/list archive lifecycle expansion and bulk list actions are also deferred. Preserve existing card archive and cloud workspace archive semantics; do not turn a cosmetic menu change into a new descendant-authorization lifecycle. Local permanent deletion remains an explicitly confirmed advanced action. Cloud parents remain non-deletable.

Use existing board templates. Additional templates, custom backgrounds, favorites, and cosmetic preferences are optional backlog, not hidden conditions for this 14-step MVP.

## 4. Execution authority and non-negotiable boundaries

- The current request is planning only. Begin implementation only when Aaron subsequently instructs Luna to execute this plan.
- On that instruction, work on `luna/trello-style-mvp-v2` based on the freshly verified remote `main`. Never develop directly on `main`.
- The only allowed filesystem area is `C:/Code/Stacie-Hermes`. Keep temporary artifacts, package caches, browser profiles, and diagnostics inside it. Prefer installed dependencies and the existing Edge executable. Ask before any machine-level or outside-vault change.
- Preserve the current live release. Steps 1-13 authorize local development, synthetic tests, branch commits, and a non-production branch push/draft PR if repository access is available. They do not authorize merging, deployment, workflow dispatch to production, or publishing Rules.
- Do not treat this plan, a green test, previous rename permission, or the phrase 'continue implementation' as authorization for Step 14.
- No real Google-account testing, production Firestore probes/writes, production fixture creation, or sensitive workspace inspection before explicit final approval.
- Never open or mutate `My Flowboard workspace`. Leave `Lifecycle realtime probe` and all earlier production acceptance fixtures unchanged.
- Never inspect Aaron's normal browser profile. Use fresh disposable contexts with synthetic local/Emulator fixtures.
- Redact credentials, Firebase configuration values, emails, UIDs, workspace IDs, invitation links, tokens, cookies, authentication artifacts, and raw fixture payloads from output and committed evidence. Do not read `.env` files just to populate reports.
- Never print raw `flowboard-workspace` or `flowboard-data`. Compare exact raw strings in memory and report equality PASS/FAIL only. Hash equality alone is not the required isolation assertion.
- Firestore Rules remain authoritative. No permissive temporary Rules, administrator writes as authorization evidence, hard-delete cascade inventions, paid services, custom backend, or persistent Firestore caching.
- Local undo/recovery is local-only. Do not relabel it as cloud rollback or silently persist cloud drafts to local workspace storage.
- Public-facing copy must contain no em dashes. Escape user content or use text-safe DOM APIs.
- Keep `/UH-Flowboard/` as the default and retain explicit `/UH-Trello/` compatibility tests. The local folder name is not the deployed repository name.
- Restore `makoaharadasaito` if temporarily switching the machine-wide GitHub CLI account to `kcchanai` for a Flowboard push.

### Document precedence

This plan controls the new MVP development sequence when Aaron approves execution. Prior plans remain historical acceptance and safety references; their stale baseline commits and task counters do not override the freshly discovered repository state. Existing production restrictions remain in force. Do not erase prior test failures or convert pending production evidence into PASS.

## 5. Progress reporting and resumability contract

Create `MVP_V2_PROGRESS.md` during Step 1. Track the baseline, current branch/SHA, all 14 steps, tests, evidence paths, blockers, schema/Rules changes, and last completed step. Mark each step `not started`, `in progress`, `blocked`, or `complete`.

**Immediately after each completed step, send this Discord update:**

```text
Step 2 of 14 complete: Maintainable foundation
Delivered: [specific working changes]
Verified: [actual test names/results, screenshot or evidence paths]
Checkpoint: [commit SHA, or explicitly uncommitted]
Production: unchanged
Next: Step 3 of 14 - Visual system
```

Use the correct number/title every time. Step 14 reports the actual deployed status instead of 'unchanged'.

Rules:
- Do not batch several step-completion updates at the end.
- Report factual output, not promises. Continue automatically through authorized steps after each update unless blocked.
- Subtasks do not change the denominator. If the scope genuinely requires a new top-level step, explain and obtain approval before renumbering.
- A blocked step is not complete. Say `Step X of 14 blocked`, identify the smallest required decision, and record remaining acceptance criteria.
- If a prerequisite blocks later implementation, continue only independent safe planning/test work; do not claim dependent steps complete.
- If context resets, reload relevant skills and this plan, read the progress ledger, inspect Git state, and resume the first incomplete step. Do not repeat completed mutations or resume the old p2/p5/p6 task list.
- At the release boundary report **`Steps 1-13 of 14 complete. Step 14 awaits your approval.`** Never claim 14/14 merely because the handoff is written.

## 6. Proposed visual specification

These are design targets, not measurements of the current implementation.

- **Identity:** calm, professional Flowboard. Deep blue/indigo navigation, restrained blue board canvas, neutral list surfaces, crisp cards, one primary accent. No decorative illustration dependency or copied Trello assets.
- **Typography:** system font stack; body 14-16px; card title 14px; list heading 14-16px; board heading 22-26px; metadata at least 12px. Wrap task titles rather than making every card a single truncated line.
- **Spacing:** 4/8/12/16/24/32px tokens; approximately 12-16px between lists; 10-12px card padding; clear separation between form groups.
- **Shape:** 8px controls, 10px cards, 12px list panels; restrained elevation; consistent inline SVG icon stroke/size.
- **Desktop:** compact global header; collapsible board navigation around 224px when useful; separate board toolbar; horizontal lane with roughly 280-304px lists. Do not force navigation to consume phone space.
- **Phone:** visible Boards/workspace trigger; search in a usable full-width row or accessible expandable field; board toolbar wraps deliberately; only the board lane scrolls horizontally. Expose a list selector or previous/next-list controls so off-screen lists are discoverable.
- **Card details:** one prominent editable title plus board/list context; clearly grouped details, schedule, labels/members, checklist, and discussion/activity. On wide screens a restrained secondary action column is acceptable; on phones use one column with a reachable close button and save bar.
- **Status:** distinguish location/access from save state. Examples: `Local workspace`, `Cloud workspace · editor`, `Saving`, `Synced`, `Offline - cloud editing unavailable`, `Conflict - refresh required`. Do not show authentication availability as if it were a sync result.
- **Interaction:** consistent menu behavior, focus ring, 44px touch targets, 120-180ms optional transitions, no motion dependence.
- **Contrast:** WCAG AA text contrast, non-text control/focus contrast, and dark-theme parity. Never convey labels, due state, completion, or permission solely by color.
- **Destruction:** no permanent delete X on every card. Put Archive in a contextual menu; explicitly label local-only permanent deletion. Cloud card removal means Archive, not Delete.
- **Empty states:** specific and actionable for blank board, empty list, filtered-out list, no search results, no archived cards, no cloud workspaces, and unavailable/offline cloud state.

## 7. Detailed implementation sequence

### Step 1 of 14 - Reconcile baseline and establish evidence

**Work**
- Read this plan, repository rules, current README, qualification matrix, and safety references. Recheck Git status, remote, branch, current `origin/main`, and historical production acceptance without touching fixtures.
- Preserve unrelated/uncommitted work. Create the new development branch; if the planning document is untracked, include it deliberately rather than discarding it.
- Run the existing unit/static/build, Rules, browser, Emulator-browser, and accessibility suites using documented runners. Record new results instead of copying historical counts.
- Capture baseline screenshots with synthetic data at 1440x900, 1024x768, 390x844, and 320x740, including dark theme and a populated card dialog.
- Add a capability matrix distinguishing local, cloud owner/editor, cloud viewer, automated coverage, and still-pending production evidence. Create the progress ledger.

**Acceptance**
- Known SHA and branch; no production changes; cleanly classified baseline failures; reproducible commands and sanitized evidence.
- A failing baseline is investigated, not quietly weakened. Tests that contact production are excluded and explicitly marked gated.

### Step 2 of 14 - Create a maintainable, testable foundation

**Work**
- Extract only useful seams from `app.js`: pure board/card commands, draft lifecycle, selectors/filtering, and shared dialog/menu utilities. Keep the existing vanilla JS/Vite architecture and adapter boundary.
- Centralize mutation authorization and async success/failure results. UI callers must be able to await a confirmed local save or cloud transaction before dismissing drafts or announcing success.
- Record minimal reproducible regression cases for pre-save label/checklist mutation and close-on-failed-save. Establish passing tests for the isolated draft/async-result seams here; integrate the full UI regressions and fixes in Step 6. Do not leave intentionally failing tests committed as a completed checkpoint.
- Audit source-budget coverage against the full browser import graph. Include newly created source files; do not evade the validator by moving code outside its manifest.
- Measure raw source, initial built first-party/vendor chunks, lazy chunks, gzip transfer, and representative render/filter timings separately. Consolidate duplicated logic and CSS without code golf, removal of safety copy, or a framework rewrite.
- Create `MVP_V2_BUDGETS.md` with the before measurements, per-file constraints, allocation for remaining steps, and final headroom target. Existing 210,000-byte aggregate and per-file caps remain binding unless Aaron explicitly approves a measured replacement.

**Budget decision boundary**
The available 11,696 raw bytes are not a promise that every new feature will fit. If safe consolidation cannot accommodate the required scope, produce a concrete evidence-based budget transition proposal: exact proposed cap, initial/lazy transfer limits, measured performance, alternatives, and impact. Ask for approval before changing the cap. Do not silently omit required features, hand-minify source, or increase the cap solely to silence CI. Independent visual/spec/test work may continue while this decision is pending.

**Acceptance**
- Existing suites remain green after refactoring; configured/unavailable adapter parity preserved; every production module budgeted; written feasible scope/budget allocation or an explicit blocked state.
- No intended UI behavior change hidden inside a refactor checkpoint.

### Step 3 of 14 - Implement the coherent visual system

**Work**
- Consolidate theme, color, spacing, typography, radius, elevation, focus, and motion tokens.
- Build consistent buttons, icon buttons, status pills, menus, text fields, cards, lists, dialogs, inline errors, and toasts. Scope selectors to avoid hiding unrelated button text on mobile.
- Replace metadata emoji with consistent SVG/text indicators where the metadata is real; do not add fake counts.
- Restyle the board shell and card/list surfaces to the specification. Keep dense boards scannable and avoid excessive whitespace inside individual cards.
- Keep named labels visible; render legacy unnamed labels with a meaningful textual fallback rather than color alone.

**Acceptance**
- Before/after screenshots for desktop light/dark and phone.
- All currently available controls remain reachable, focus-visible, and correctly named. No horizontal document overflow or loss of hidden-state semantics.
- Audit contrast in both themes; screenshot production-safe synthetic content only.

### Step 4 of 14 - Make board and workspace navigation obvious

**Work**
- Add a reliable board navigation surface: active board highlight, board search when needed, create-board action, and current workspace identity.
- Use one underlying controller for desktop navigation and the mobile drawer/dialog. The phone must retain Boards, search, theme, and account access.
- Surface explicit local/cloud switching and Return to local. Reuse existing discovery/controllers rather than adding a second authorization or persistence implementation.
- Separate the primary global header from board title, Filters, Share/Members when applicable, and More actions. Keep detailed safety disclosures in the relevant flows without removing essential visible local/cloud context.
- Close stale menus/dialogs and unsubscribe on context changes; do not leak the previous workspace's titles or members into the next one.

**Acceptance**
- Switch among at least three synthetic boards at desktop and phone widths; active highlight/title/cards agree after reload.
- Viewer navigation, search, export, and all close buttons stay usable. Changing board/workspace resolves dirty-card state explicitly.
- Local/cloud switching never silently uploads or replaces local data.

### Step 5 of 14 - Finish practical board and list operations

**Work**
- Preserve create blank/template board and rename behavior; validate blank/oversized titles with inline feedback.
- Replace the misleading list ellipsis/delete shortcut with a real menu: rename, move left/right or choose position, and the currently supported removal action with honest mode-specific wording.
- Implement list reorder through stable IDs and existing array/rank serialization, including keyboard/touch buttons and boundary no-ops. Desktop list dragging is optional polish only if the explicit controls already pass.
- Show useful list counts; while filtered, distinguish visible from total. Add helpful empty-list and empty-board actions.
- Do not introduce list/board archiving or cloud hard deletion in this step. Unsupported cloud list deletion must not masquerade as an available action.

**Acceptance**
- Local list order survives reload/export/import; Emulator owner/editor reorder converges in a second context without duplicate or missing lists.
- Viewer reorder denied in UI and adapter/Rules tests. Moving first list left or last list right is a no-op, not a successful mutation/activity event.
- Retained cards/comments and parent references are unchanged by list reorder.

### Step 6 of 14 - Fix card draft safety and redesign card details

**Work**
- Open a cloned, isolated draft with base entity revision. Labels, checklist edits, descriptions, dates, and assignments modify only the draft until Save.
- Use one clear editable title, board/list breadcrumb, grouped fields, member/label chips, checklist progress and inline entry, and a reachable save/close area.
- On Close, Escape, navigation, Archive, Duplicate, or Move while dirty, offer explicit Save/Discard/Keep editing semantics. Never silently save or discard.
- Await mutation completion; prevent duplicate submission; keep the draft and inline errors for recoverable failures. Only close after a successful save or deliberate discard.
- On conflict, require authoritative refresh and deliberate reapplication rather than replacing the draft's old revision with a new one and auto-saving stale fields.
- Revocation/sign-out/workspace archive overrides ordinary dirty prompts: stop privileged actions and clear inaccessible cloud content without writing a local recovery copy. Do not retain unauthorized content in a hidden draft.
- Keep authenticated comments as explicit separate operations with their own sending/error state. Saving card details must not post an unsubmitted comment.

**Acceptance**
- Add/remove/edit labels and checklist entries, discard, perform an unrelated save, reload: discarded changes never appear.
- Failed local storage/cloud save does not falsely announce success, discard input, or create duplicate activity.
- Two-context stale draft cannot overwrite remote edits; access-loss behavior remains fail-closed.
- Viewer can inspect/scroll/close card details and comments without enabled mutation controls.

### Step 7 of 14 - Make card capture and movement fast on every device

**Work**
- Improve inline capture: Enter adds, Shift+Enter inserts a newline where supported, Escape cancels, continued entry is easy, and focus remains predictable. Guard IME composition.
- Add a visible Move card action with destination list and position within the active board. Do not add cross-board/workspace moves that would break comment lineage.
- Share the same tested move command across drag, Alt+Arrow, and the Move dialog.
- Provide precise before/after drop indication, whole-list drop acceptance, empty-list handling, drag cancellation, and bounded edge scroll where safe. Phone users must not need native HTML drag support.
- Define filtered-board behavior: disable ambiguous drag reordering with visible guidance while filters are active; allow explicit Move using the full canonical destination order.
- Replace permanent card X controls with contextual actions. Archive is recoverable; duplicate gets new entity IDs and never copies authenticated comments/audit authorship as new real events.

**Acceptance**
- First/last/same-list/cross-list/empty-list moves, self-drop, cancellation, filtered move, and duplicate are tested.
- Each successful move results in exactly one card in both Emulator contexts; no-op produces no success/activity write.
- Focus returns to the moved card or a stable fallback; announcements name the destination and position.

### Step 8 of 14 - Add meaningful completion, scheduling, and filters

**Work**
- Introduce explicit card completion independent of checklist progress and list names. Prefer one bounded boolean (`completed`) with a documented legacy default and schema migration. Do not infer completion from opaque legacy `meta` text.
- Audit every normalization, clone, import/export, local adapter, granular serialization/diff, cloud transaction, and Rules path for the new field. Bump the local schema only deliberately and preserve all supported old versions.
- Keep date-only deadlines as calendar dates. Define today from local calendar components, not UTC truncation. Date-only overdue starts the following local day.
- For due time, require a date and state the time interpretation visibly. MVP uses device-local wall-clock interpretation consistently; do not claim a shared timezone-independent instant. If choosing an absolute-time model instead, document and test that migration before implementation.
- Completed cards are not overdue. Checklist completion is shown separately. Clear date/time intentionally; use injected clocks for tests around midnight and timezone boundaries.
- Implement combined text + named-label + member/unassigned + due + completed filters. OR within a multi-select group, AND across groups. Derive label choices from actual labels, with color/name fallback for legacy records.
- Match cloud assignees by authorized membership identity, never by guessing email/name equivalence. Offer `Assigned to me` only in authenticated cloud mode. Keep local free-text assignees explicitly local.
- Show active filter chips, visible result counts, Clear all, and accurate no-results states. Filter changes never mutate cards/order and never query every cloud workspace.

**Acceptance**
- Old exports load without losing metadata; new completion round-trips locally and in Emulator cloud; older client compatibility/rollback is explicitly assessed.
- Empty checklists, full checklists, completed tasks without due dates, date-only deadlines, due time, Hawaii-local midnight, and another timezone have deterministic unit tests.
- Combined filters and member changes work for owner/editor/viewer; named labels of the same color remain distinguishable.
- If Rules changes are necessary, test them in Emulators only and include exact publication requirements in the final gate.

### Step 9 of 14 - Make existing collaboration understandable

**Work**
- Expose role-aware Members/Share from the active cloud workspace context, not exclusively inside account administration. In local mode, label the separate backup-first `Create cloud copy` action honestly rather than implying local sharing.
- Reuse verified-email link invitations, Copy link, revoke, membership, self-leave, ownership transfer, and workspace lifecycle controls. No new fake collaboration planner.
- Improve member picker and avatars using existing authorized membership data; preserve unknown/former-member semantics without exposing raw UIDs.
- Make comments, comment edit/remove, pagination, and workspace activity readable, bounded, and consistent with the card design. Do not invent board comment counts that require one listener per card.
- Keep location, role, save state, offline, conflict, permission loss, and errors distinct. A listener snapshot cannot mark an in-flight write Synced.
- Preserve exact lifecycle safeguards and visible workspace identity beside Archive/Restore:
  - `Archived: Cloud workspace · archived · retained`
  - `Restored: Cloud workspace · owner · editable`
  - `This workspace changed in another session. Refresh and try again.`

**Acceptance**
- Synthetic owner/editor/viewer/non-member/removed-member paths covered using the actual Firebase adapter and Rules.
- Two independent contexts prove comments, assignments, moves, role downgrade/removal, and lifecycle convergence with correct listener cleanup.
- Close/navigation/export remain usable in read-only mode. Hidden controls do not constitute security proof.
- Raw local storage equality is preserved through cloud operations, revocation, archival, and return-to-local.

### Step 10 of 14 - Improve onboarding, truthful samples, and recovery

**Work**
- Offer a clear first-run choice to use a small sample board or start blank, with short guidance to Add card, open details, and Move. Never reset an existing workspace to show onboarding.
- Build new samples from real labels/checklists/descriptions and structured dates only. Remove fake attachment/comment badges from new samples. Preserve old `meta` in imports/exports and expose it only as clearly identified legacy notes if needed.
- Explain local storage, cloud copy, and cross-device behavior briefly where relevant. Keep export/recovery discoverable in navigation and More actions.
- Preserve import preview, merge default, confirmed replacement, safety snapshot before restore, and failure feedback. Malformed, unsupported, oversized, or malicious input must not corrupt the current workspace.
- Review CSV quoting and spreadsheet formula-injection handling, while preserving the original values in JSON exports. Document the chosen safe CSV representation.
- Improve offline, no-results, no-members, no-workspaces, storage-full, and access-loss empty/error states. Do not claim an offline cloud queue.

**Acceptance**
- Existing data bypasses onboarding; blank/sample selection works in clean contexts; no fake feature badges.
- Invalid import, cancelled replacement, storage quota failure, malformed recovery, successful restore, and export round-trip are tested.
- Cloud data never lands in browser-local backups. Local undo remains truthful and bounded.

### Step 11 of 14 - Complete mobile and accessibility qualification

**Work**
- Exercise actual flows at 320, 390, 768, 1024, and 1440 CSS-pixel widths; light/dark, coarse pointer, reduced motion, forced colors, and 200% zoom/reflow.
- Ensure only the board lane intentionally scrolls sideways. Keep horizontal list navigation, search, workspace switcher, theme, menus, and card close/save reachable.
- Use dynamic viewport units and safe-area padding where appropriate. Test the virtual-keyboard layout on a real phone during the final human gate; emulation is not that evidence.
- Verify landmarks/headings, names/labels, logical focus order, native dialog containment, Escape/visible close, focus return, menu keyboard behavior, status announcements, and error associations.
- Test real long titles, label names, workspace names, status text, and multiple member chips. Do not rely on truncated status text to convey permission or failure.
- Capture a stable synthetic screenshot matrix and inspect it. Do not automatically accept new snapshots merely to clear a visual diff.

**Acceptance**
- No document-level overflow at required widths; no essential control hidden solely for width; 44px coarse-pointer targets.
- Complete create/edit/move/filter/archive/restore workflow possible with keyboard and with touch controls.
- Lighthouse accessibility score 1 and zero failed audits on representative built pages; additional dialog/menu/state checks cover surfaces not reached by the default Lighthouse page.
- Automated checks and visual inspection are recorded separately from manual screen-reader/real-device acceptance.

### Step 12 of 14 - Run full regression and repair release gating

**Work**
- Run all existing and new unit, adapter, static, migration, Rules, built-browser, two-context Emulator, accessibility, isolation, and performance checks. No skipped safety test hidden in a green aggregate.
- Add deterministic synthetic load fixtures: 10 lists/200 cards for typical use and 20 lists/1,000 cards as a stress case. Record browser/device/viewport, render/filter timings, and memory/listener behavior. Do not create these fixtures in production.
- Use proposed lab targets of <=200ms p95 filter response and <=1s usable initial board render for the typical fixture on the recorded test machine. These are acceptance targets, not previously measured results or universal device guarantees. Investigate failures; do not add virtualization without evidence.
- Enforce the Step 2 source/build budgets. Treat Firebase vendor transfer separately from first-party UI changes; prove cloud features remain lazy-loaded where intended.
- Preserve `/UH-Trello/` explicit compatibility and `/UH-Flowboard/` default builds/browser tests; audit generated asset URLs.
- Change CI design so deployment depends on the full validation chain for the exact same full SHA, preferably shared reusable validation with a deployment `needs` dependency. A manually dispatched deployment must pass that gate too.
- Workflow changes are developed and checked on the branch. Do not run the production deployment to test the gate before Step 14. Use structural tests or a deployment-disabled validation route.
- Keep test/Emulator hooks, synthetic project markers, private diagnostics, and source secrets out of production bundles. Verify `git diff --check` and sanitize artifacts.

**Acceptance**
- All named layers pass for the exact candidate; failures and retries are retained honestly in evidence.
- A failing validation cannot reach upload/deploy, and a passing different SHA cannot authorize the candidate.
- No unexplained performance regression, source cap bypass, unbounded listener/query growth, or new paid dependency.

### Step 13 of 14 - Package and review the release candidate

**Work**
- Commit scoped checkpoints and the final candidate on the development branch. Push only the non-production branch and open/update one draft PR if authorized repository access works; never merge it here.
- Independently review sensitive changes: drafts, mutation authorization, Rules, schema migration, ordering, privacy, and deployment gating. Fix blockers and rerun affected suites.
- Update README, qualification, privacy/retention notes, and release notes to describe the candidate accurately, without claiming deployment or real-account acceptance. Link this plan and mark older roadmap baselines historical rather than deleting evidence.
- Produce `MVP_V2_RELEASE_CANDIDATE.md` with exact candidate SHA, remote branch verification, test results, before/after screenshots, source/build/performance measurements, Rules diff status, compatibility/rollback analysis, known limitations, and manual acceptance instructions.
- Produce a concise production operator checklist. No token copying, machine-clipboard assumptions, or browser-console scripts split across Discord messages. Prefer links and attachments suitable for Aaron on a phone.

**Acceptance**
- All required MVP scenarios covered, no unresolved authorization/data-loss blockers, exact branch/SHA and CI state verified, clean worktree or explicitly listed evidence-only files.
- Rules publication requirement is explicit: byte-identical Rules do not require republication; changed Rules require separately verified publication and compatibility analysis.
- Report `READY FOR MVP V2 HUMAN RELEASE GATE` and `Steps 1-13 of 14 complete. Step 14 awaits your approval.`
- Stop. Do not merge, deploy, publish Rules, sign into real accounts, or touch fixtures.

### Step 14 of 14 - Authorized release and real-user acceptance

**Entry requirement**
Aaron explicitly approves the named candidate and requested production actions. If approval covers only deployment, do not infer permission to mutate production fixtures or test real accounts. Break the operator checklist into separately authorized actions when necessary.

**Work after approval only**
- Verify candidate SHA, backup/export strategy, workflow state, Rules compatibility, and rollback plan. If additive Rules are required, publish and verify the exact approved revision before enabling dependent client behavior. Avoid a window where existing clients cannot operate.
- Merge through the approved PR flow. Validate and deploy the exact resulting main SHA through the corrected gate; do not dispatch an unvalidated artifact.
- Read back Actions/Pages status, new URL, generated asset paths, and browser console in a clean context. Verify `/UH-Flowboard/` has no broken or old-base assets.
- Let Aaron operate real sign-in and approve a new disposable production acceptance fixture. Never use protected workspaces or silently repurpose previous fixtures.
- Run the final owner/editor/viewer/non-member/revoked-member matrix, independent-context conflict and lifecycle tests, and actual phone usability checks. Report only sanitized outcomes; verify exact local-storage equality.
- Inspect the approved fixture's final retained state; clean up only as authorized. Do not hard-delete cloud parents.
- If acceptance fails, halt expansion. Roll back only to a compatible client/Rules combination with approval; never reset user data or normalize away unsupported new fields. Forward-fix may be safer for schema changes.

**Acceptance**
- Deployed SHA and full validation match; Pages/assets pass; approved real-account/phone checks pass; fixture disposition and remaining limitations documented.
- Only then report `Step 14 of 14 complete` and `MVP V2 released and accepted`.
- If only client deployment passed, say `deployed; production acceptance pending`, not 14/14 complete.

## 8. Test implementation and command guidance

Start with existing scripts rather than inventing a parallel test system:

```text
npm.cmd run validate
npm.cmd run test:rules
npm.cmd run test:emulator-browser
git diff --check
```

For local Emulator-browser runs on this Windows host, an explicit installed-browser setting may be needed:

```bash
PLAYWRIGHT_EXECUTABLE_PATH='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' npm.cmd run test:emulator-browser
```

Use `tests/browser-smoke.spec.mjs` against an actual built preview and `tests/emulator/emulator-browser.spec.mjs` against isolated Auth/Firestore Emulators. The runner, base URLs, preview readiness, and cleanup must be checked before invoking them. Configure local scratch/cache locations inside the vault; do not solve missing dependencies by an unapproved machine-level installation.

Add focused files such as `tests/card-draft.test.mjs`, `tests/card-movement.test.mjs`, `tests/card-filtering.test.mjs`, and browser spec modules only where they earn their keep. Add every file to the actual runner and syntax checks; an unregistered test file is not validation.

### Required negative cases

- Viewer attempts mutation through UI and direct adapter/Rules path.
- Removed/downgraded member with an open dirty card or comment composer.
- Stale revision on Save and multi-document move; read-before-write ordering in transactions.
- Same-card self-drop and boundary moves do not write duplicate activity.
- Invalid and unsupported import leaves exact raw local storage unchanged.
- Storage quota/save failure preserves recoverability and never announces Saved.
- Draft cancellation followed by another mutation does not persist discarded edits.
- Sign-out/archive/revocation stops subscriptions, prevents late callbacks, closes unsafe surfaces, and restores independent local data.
- User-controlled HTML/script-like titles, descriptions, labels, and comments render as text.
- Prototype-like/malformed JSON keys, excessive input, and spreadsheet-formula cells are handled deliberately.
- Dynamic menu/dialog controls keep accessible names and pointer-visible close controls in viewer/mobile states.
- New schema/fields round-trip through local/cloud/import/export without dropping legacy collaboration or other retained metadata.

### Results taxonomy

Label evidence precisely:
- Unit/domain test.
- Fake-adapter UI/contract test.
- Auth/Firestore Emulator integration.
- Two-context Emulator browser workflow.
- Built-site browser/visual/accessibility test.
- Public anonymous Pages smoke.
- Approved real-account production acceptance.

No one category substitutes for another. Do not describe a mocked UI check as authenticated E2E, or an anonymous page visit as production authorization verification.

## 9. Deliverables and final handoff contract

Luna should leave:
- A maintainable implementation, not only screenshots or a plan.
- This execution plan and `MVP_V2_PROGRESS.md` with accurate 14-step state.
- `MVP_V2_BUDGETS.md` with measured budgets and any approved adjustment.
- Automated regression tests and a safe same-SHA validation/deployment design.
- Sanitized visual before/after evidence, including phone and dark theme.
- `MVP_V2_RELEASE_CANDIDATE.md`, exact SHA/CI evidence, and the final human checklist.
- Updated documentation that distinguishes deployed baseline, candidate, and pending production acceptance.

No runtime dependencies, backend services, or large frameworks should be introduced without a documented need and approval. Preserve the working Firebase/local adapter architecture and invest in a complete, safe daily workflow rather than adding cosmetic controls for deferred features.

## 10. Luna launch prompt

```text
Read C:/Code/Stacie-Hermes/UH-Trello/LUNA_TRELLO_STYLE_MVP_EXECUTION_PLAN.md and execute its authorized non-production implementation scope.

Use the freshly verified main baseline and a dedicated luna/trello-style-mvp-v2 branch. Preserve all safety/data boundaries. Implement Steps 1-13, test each step, maintain MVP_V2_PROGRESS.md, and send a factual Discord update immediately after every completed step using "Step X of 14 complete". Do not count a blocked or partially tested step as complete.

Do not merge main, deploy, publish Rules, perform real-account testing, or mutate production fixtures. Stop at READY FOR MVP V2 HUMAN RELEASE GATE with the exact candidate SHA, real validation evidence, visual before/after artifacts, known limitations, and precise Step 14 approval request. Ask before changing the existing source cap, adding services/dependencies that require approval, or writing outside C:/Code/Stacie-Hermes.

Do not restart superseded rename work or old task counters. This is an improvement of the existing application, not a rewrite or a simulated collaboration demo.
```
