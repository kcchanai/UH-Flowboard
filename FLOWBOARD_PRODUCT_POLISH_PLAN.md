# Flowboard product polish and daily-work experience

**Status: verified local release candidate complete on `luna/product-polish`; no remote operation authorized or performed.**

Prepared for Aaron on 2026-09-18. Intended implementer: `gpt-5.6-luna`, after Aaron switches models and explicitly asks to implement this plan. A model switch alone is not implementation authorization.

## 1. Outcome and scope

Make Flowboard feel like a polished, calm office application that is quicker to scan, easier to learn, and faster to operate. Learn from monday.com, Odoo Project and Trello without recreating their enterprise scope or copying their branding.

The release delivers:
- A coherent light/dark visual system and quieter navigation.
- A single board-scoped toolbar, intentional horizontal navigation and Comfortable/Compact density.
- Better task cards with predictable metadata hierarchy.
- One-click focus filters and an honest active-board summary.
- A useful, lazy-loaded List view over the same task data.
- Faster card capture and discoverable keyboard assistance.
- Better-organized card details with explicit Save/Cancel and reliable drafts.
- Regression-tested local data, cloud boundaries, accessibility and performance.

**Not in this release:** Gantt, calendar, dependencies, new priorities/status schema, bulk edits, recurring tasks, automatic assignments, AI agents, email/contacts integrations, uploads, rich-text editor, global dashboards, cross-workspace My Work, notification infrastructure, offline cloud queue, full sidebar redesign, custom backend, new production framework or paid services. Keep those as future decisions rather than half-built menu entries.

### Research and visual artifacts

- [[FLOWBOARD_PRODUCT_POLISH_RESEARCH]] contains source links, verified observations and limitations.
- [Concept contact sheet](artifacts/product-polish-planning/concept-contact-sheet.png).
- [Standalone concept](artifacts/product-polish-planning/concept.html).
- [Current light board](artifacts/product-polish-planning/live-light.png), [dark board](artifacts/product-polish-planning/live-dark.png), [card details](artifacts/product-polish-planning/live-card.png).

The concepts are nonfunctional, use synthetic content and illustrate hierarchy rather than an approved palette migration. They are not production screenshots or completed features.

## 2. Baseline and non-negotiable boundaries

### Exact starting point

Remote main at planning time: `bba3647131d1dac0c05f8e21893e11a82c3a0034`, deployed by PR #9. Implementation branch: `luna/product-polish`, created from that reviewed main SHA. The prior `luna/ux-discoverability` branch is historical and must not receive new implementation commits.

Before implementation, inspect status, preserve the planning package, and compare the remote SHA to the pinned baseline. The implementation branch is now `luna/product-polish`; commit the planning package and each verified step checkpoint without overwriting unrelated work.

### Boundaries

1. All local work stays under `C:/Code/Stacie-Hermes`. No machine configuration changes, profile writes, global installs or new caches outside it without explicit approval. Reuse installed tools.
2. Implementation authorization covers local development and synthetic testing only. Stop at Step 10's verified local release candidate. No push, PR, merge, Pages deployment, Rules publication or real-account testing without a NEW explicit authorization. The previous release's authorization does not carry over.
3. Do not open or mutate `My Flowboard workspace`. Do not touch `Lifecycle realtime probe`. Never inspect the normal browser profile. Use new isolated contexts and synthetic data.
4. Do not print storage payloads, Firebase configuration, email addresses, UIDs, workspace IDs, cookies, tokens or auth artifacts. Log counts, classifications and boolean equality checks only.
5. Keep Firebase Spark, Google Authentication, memory-only Firestore behavior and copyable email-bound invitations. No new OAuth scopes, People API, Gmail, paid dependencies, backend or persistent cloud cache.
6. Keep Firestore Rules and shared data schema unchanged. New view behavior uses current fields and the existing command/transaction path. If a requirement truly needs a schema/Rules change, stop and propose a separately authorized design; do not smuggle it into a polish step.
7. Keep assignments UID/member-based in cloud mode and free-text-compatible locally. Never infer a cloud member by matching a name, initials or email. Profile sharing stays explicit, workspace-scoped, self-only and readback-verified.
8. Preserve raw-string equality of `flowboard-workspace` and `flowboard-data` during navigation, filtering, sorting, density changes, theme changes and read-only activity. Do not parse and reserialize valid local data simply to render a view.
9. Public-facing copy contains no em dashes. Use labelled controls, real state and truthful error messages; do not invent 'Synced', saved, offline or collaboration states.

## 3. Product and interaction contracts

### Navigation

- Global bar: Flowboard, Boards, actionable Workspace status, Appearance and Account. Keep the existing distinction between local Boards and cloud Workspaces. Do not hide recently improved entry points inside an overflow menu.
- Board identity row: editable board name when permitted, concise context and honest role/mode. Avoid repeating the full state in multiple equally loud badges.
- Board toolbar: Board/List view selector, `Search this board`, Filters, density control, primary `Add card`, and labelled Board actions. Keep Add list reachable from Board actions even when the board's trailing composer is off-screen.
- Help/Start here stays visible but secondary. No permanent tutorial panel on a returning user's board.
- At 960px and below, wrap by logical groups. Horizontal overflow belongs to the board or List container, not the entire page. Do not introduce a space-consuming permanent sidebar in this release.

### Visual system

- Keep the current system font and SVG icon approach; no external font/CDN or icon dependency.
- Use an intentional 4/8/12/16/24/32 spacing scale. Board title 24-28px, lane title 14px, card title 14px, supporting text 12-13px. Use fewer heavy font weights.
- Neutral opaque content surfaces, soft borders and restrained shadows. Clearly distinguish canvas, lane and card in dark mode. Reserve danger color for dangerous actions, not all menu items.
- Preserve existing palette IDs, selected canvas/finish, Light/Dark/System and photo-display preferences. Do not silently change the default palette or overwrite saved choices. Neutral app chrome can coexist with every current canvas.
- Comfortable remains the default. Compact reduces padding and metadata whitespace, not essential text or focus visibility. Coarse-pointer hit areas stay at least 44px. Density changes are personal display preferences, not shared board edits.
- Transitions roughly 120-180ms, no layout-shifting hover movement, confetti or decorative animation. Respect reduced motion and forced colors.
- Contrast: 4.5:1 normal text, 3:1 large text and necessary non-text controls. Check disabled/read-only differentiation, gradient interiors, composited buttons and focus indicators, not only endpoints or Lighthouse score.

### Shared view model

Introduce a small pure projection of the active board only, shared by Board and List. Candidate module: `src/board-view-model.js` with focused unit tests. It receives canonical board data, existing filters, injected local date/time and an optional authenticated UID. It returns stable entity references/IDs, visible rows, counts and presentation state without mutating inputs or persisting anything.

- Due status reuses `state-core.js` `dueState`; completed means the actual `completed` boolean, not a list named Done.
- Counts exclude archived cards and archived lists. Summary always says `This board`; it is not workspace-wide. Keep overall counts distinct from `Showing X of Y` under filters.
- Summary values: total active cards, incomplete overdue, incomplete due today, completed. They need not sum to total because categories are intentionally different; an overdue task due earlier today belongs to Overdue, not both urgency badges.
- Recompute time-dependent status at local midnight, relevant due-time boundaries while visible, and window focus; use one disposable client timer, no backend polling or UTC date slicing. Dates without timezone retain the existing local-time semantics, disclosed as `Times use this device's time zone` where due time is edited.
- Filter results and order are identical between views. Table sorting is presentation only and never rewrites board/list order.

### Preferences and ephemeral state

Add a separate versioned, allowlisted UI-preference record behind `LocalWorkspaceAdapter` (proposed key `flowboard-ui-preferences`): `{version:1, density:'comfortable'|'compact', view:'board'|'list'}`. Do not put it in workspace exports or Firestore. Reuse adapter error conventions, migration/default tests and boot normalization. No board IDs, user identifiers or member filters are persisted in it.

Search text, selected assignee, filters, sort and pagination stay in memory. Preserve them across Board/List switching within the same board. Clear board-specific filters on board/workspace change and clear identity-based filters on sign-out or access loss. Close stale dialogs and use request-generation guards.

If preference persistence fails, retain a usable session view but state `Changed for this session; browser preference could not be saved`. Do not claim durable success. Invalid stored values fall back safely. Workspace raw strings remain unchanged.

### Cloud and read-only behavior

- List view consumes the same current-board state and existing subscriptions; it creates no extra Firestore listeners or cross-board/member directory queries.
- Lazy UI loading gets a visible loading/error/Retry state and a working return to Board. A failed import must not strand navigation.
- Viewer/preview users can search, filter, sort, change view/density, inspect a card, close dialogs and return local. They cannot create, complete, drag, archive, import or edit.
- Any task action reuses the central command/mutation guard and expected-revision transaction. Never wire a new table cell directly to storage or Firestore.
- On mode/role/workspace/board change, invalidate async renders and return focus safely. Duplicated initializers must not register duplicate mutations or repaint another root.

## 4. Budget gate and delivery priorities

### Current measured constraints

- Reachable first-party raw source: **245,459 / 247,500 bytes**, only **2,041** remaining.
- Initial shell gzip: **24,719 / 25,000**, only **281** remaining.
- First-party lazy gzip: **51,429 / 55,000**, **3,571** remaining.
- Document gzip: **5,817**, separately classified.
- Warning threshold: **210,000**, already exceeded.

A genuine List view plus safer interaction improvements cannot responsibly be promised within the remaining source bytes. Do not shorten safety copy or minify author code into unreadable identifiers just to claim compliance.

### Approved implementation envelope

Aaron pre-approved budget increases in the implementation instruction. Step 2 measured the transition and adopted the raw cap below. Step 4 then adopted a narrow 25,500-byte initial-shell gzip cap after measuring a 25,145-byte shell; the lazy cap remains 55,000. Future budget changes still require measured evidence and a new explicit scope decision.

**Approved raw cap: 300,000 bytes**, leaving 51,245 bytes of measured Step 2 headroom and an estimated maintenance envelope above the current implementation. Final release must retain at least 10,000 raw bytes under this cap. Keep the 210,000 maintainability warning visible.

The approved Step 7 envelope is shell 26,000, index.html 27,000, and lazy 58,000 gzip/source limits as measured in `artifacts/product-polish/step-07/results.md`. The configured CI build later measured 26,053 initial-shell gzip bytes because public configuration values are embedded at build time, so the verified release envelope transitions narrowly to shell 26,250 with 197 bytes of configured-CI headroom. Future measured prototypes may propose another transition, but no limit is raised merely to avoid consolidation; document and vendor transfer remain measured separately.

Step 2 recorded the exact measured delta: 245,459 to 248,755 raw bytes, with initial shell gzip moving from 24,719 to 24,882 and lazy gzip unchanged at 51,429. Step 4 recorded the later shell transition at 25,145 / 25,500 and lazy at 51,904 / 55,000. Future cap changes require a new explicit scope decision and measured evidence.

If no increase is approved, offer a reduced presentation-only release: token cleanup, toolbar grouping and detail hierarchy using measured recovered space. Defer List view and additional filters rather than calling the full ten-step plan complete. Any scope change needs an explicit decision.

## 5. Execution and reporting contract

Run steps in order. Create `FLOWBOARD_PRODUCT_POLISH_PROGRESS.md` with one row per step and only one `in_progress`. Evidence lives under `artifacts/product-polish/step-XX/`. Keep planning artifacts separate. Each step has a tested checkpoint commit; stage only intentional files.

After each completed step, immediately send:

> **Step X of 10 complete: [name]**
> Summary: [one or two short sentences].
> Verified: [actual checks and counts].
> Budget: [raw used/cap/headroom; shell and lazy gzip].
> Checkpoint: [actual commit]. Production: unchanged. Next: [next step or explicit blocker].

Do not report a step complete for code merely written, a concept image, a partial test run or skipped acceptance criteria. If blocked, report `Step X of 10 blocked`, explain the exact decision needed, and stop safely. Do not pause for routine approval between otherwise authorized local steps. Do not promise off-turn progress without a running tracked worker.

Common gate for every code step: syntax/static checks, relevant unit/browser tests, build, budget measurement, `git diff --check`, no new console/page errors, production isolation for new chunks. Rerun the complete affected final chain after any late fix. Record commands actually run; do not present prior-release test counts as current evidence.

## Step 1 of 10: Pin the baseline and establish proof

**Goal:** start from the deployed release with safe, reproducible fixtures and measurable before/after evidence.

Actions:
- Inspect status; preserve the planning package. Fetch and review main. Branch from the approved baseline, not the old squash-merged feature history.
- Load the relevant static-web and Emulator-browser skills. Read the previous release manifest, source budgets and CI workflow.
- Create the progress ledger and a synthetic fixture with long titles, multiple labels, due-today/overdue/complete/no-date tasks, checklists, local initials and cloud member/photo fallbacks. No real account data.
- Capture current Board and card dialog at 1280x720, 1440x900, 1920x1080 and 960x720, plus 390px/320px compatibility. Use the SAME fixture for comparisons.
- Run the baseline unit/static/build/budget/browser/Rules/Emulator suite. Measure three 1,000-card samples using the existing benchmark runner; record median and maximum.
- Record task paths: find an overdue card, filter by assignee, create in a chosen list, edit a checklist and dismiss without saving, reopen after reload, inspect a read-only card. Separate automated click/focus counts from any future human usability study.

**Acceptance:** clean isolated branch, baseline SHA and Rules hash, reproducible fixtures and actual test/performance results recorded; no protected workspace touched. Previous release counts are reference only.

**Completion summary:** baseline pinned and safety/performance evidence established.

## Step 2 of 10: Resolve budgets and establish the view boundary

**Goal:** fund the scope honestly before accumulating feature code.

Actions:
- Read the source graph/byte validator and per-file limits. Check line-ending behavior; CRLF normalization is not durable semantic recovery.
- Dry-run low-risk deduplication and optional-UI extraction; list exact source and build deltas. Do not delete diagnostics, rollback paths or accessibility copy.
- Prototype only enough view-model/lazy-List structure locally to measure cost; prototypes cannot touch production or bypass a failed budget.
- Present the raw/gzip cap decision described above. Stop for explicit approval if required. On approval, update the single source of truth and manifest together, then rerun the baseline validation chain.
- Implement the pure shared projection and separate UI preference adapter, with immutable-input, corrupted-preference, storage-failure and exact workspace-string tests. Register new files with all source/syntax/isolation guards.

**Acceptance:** authorized, measured source and gzip envelopes; approved per-file limits; view preferences isolated from data; no unreachable modules hidden from accounting. If approval is missing, this step is blocked, not complete.

**Completion summary:** sustainable budgets and a tested shared-view foundation established.

## Step 3 of 10: Unify the visual system and application shell

**Goal:** a calmer, coherent app without losing discoverability.

Primary files: `styles.css`, `index.html`, `src/appearance-ui.js`, `src/canvas-palettes.js`, relevant `app.js` wiring.

Actions:
- Consolidate spacing, typography, borders, elevation, semantic color and interactive states. Replace conflicting hard-coded chrome colors with tokens.
- Group global vs board controls according to the navigation contract; move the EXISTING search input rather than leaving two independent searches/listeners.
- Keep Boards, actionable Workspace status, Appearance and Account visible. Place role/mode/sync feedback so it remains readable and accurately labelled.
- Reduce competing emphasis of help and secondary actions. Keep Board actions explicitly labelled, not unexplained dots.
- Preserve every saved palette and both finishes. Add no external assets. Keep Appearance preview/Save/Cancel/reset and actual-opener focus return.

**Acceptance:** before/after review at all desktop sizes, no page overflow, no duplicated landmarks/IDs/listeners, labels included in accessible names, keyboard focus visible, all current theme/palette choices load after refresh. Record contrast checks including pastel canvases and dark chrome.

**Completion summary:** navigation and visual hierarchy are consistent and readable.

## Step 4 of 10: Polish board lanes, cards and density

**Goal:** faster scanning with less visual noise and better board navigation.

Primary files: `app.js` renderer, `styles.css`, `src/person-badges.js`, `src/cloud-roster-ui.js`, UI preference adapter.

Actions:
- Stable card hierarchy: named labels, title, concise due/checklist/description indicators, assignee badges. Hide absent metadata rather than show empty decorative chips.
- Differentiate completed tasks using text/icon as well as color; do not infer completion from lane title or reduce title readability.
- Support Comfortable/Compact via the isolated preference. Do not reduce essential touch areas or truncate titles without an accessible full-title route.
- Improve lane headings/counts and consistent Add card footers. Keep an explicit Add list action reachable without scrolling to the end.
- Make board horizontal overflow intentional with a visible scrollbar/edge affordance; no new carousel or forced scroll snapping.
- Preserve full-lane drop zones and keyboard move behavior. Keep drag unavailable where filtered order is ambiguous unless existing supported semantics are proven.
- Improve meaningful category names only in fresh starter templates; never migrate existing user label text for aesthetics.

**Acceptance:** rich and empty cards, long text, one/many lists, photo fallback, initials-only with no image requests, both densities, reload persistence and raw workspace equality. Keyboard and pointer moves retain exact-once placement and existing order semantics. Read-only remains non-mutating.

**Completion summary:** cards are easier to scan, density is personal, and board navigation is clearer.

## Step 5 of 10: Add focused filtering and board summary

**Goal:** answer 'What needs attention on this board?' without adding a dashboard product.

Primary files: shared view model, `state-core.js` only for tested shared helpers if needed, existing filters in `app.js`, `index.html`/lazy filter markup.

Actions:
- Build on existing search, label, assignee, due and completion controls; do not recreate already implemented filters. `renderFilters()` already exposes Assigned, Unassigned and cloud Assigned to me. This step promotes those existing choices into quick controls; it is not a new assignment system.
- Add labelled quick controls: Overdue, Due today, Unassigned, and Assigned to me only when a current cloud UID exists. Label the latter's active-board scope. No fake local 'me' identity.
- Cloud Assigned to me must test `assigneeUids` against the current session UID, never the free-text `assignees` fallback. A local label that happens to equal a UID must not count as a cloud assignment. Quick controls modify the same filter state as the detailed panel. Different filter dimensions combine with AND; due choices within one dimension are exclusive. Make toggle/clear behavior predictable with pressed states and removable chips.
- Retain search/filter selection when switching Board/List. Clear all is explicit; use distinct 'No cards yet' versus 'No matches' empty states, with a visible Clear filters action.
- Show compact whole-board totals and `Showing X of Y`. Do not invent progress percentages based on column names or imply these counts cover unloaded workspaces.
- Recompute on canonical state updates, board change and local-time boundary. Former/unavailable member identity must not silently map to someone else.

**Acceptance:** exact known fixture counts, local/cloud identity separation, archived exclusion, overdue/today/completed boundaries including midnight, combined filters, Clear all, no-results, no storage mutation. Read-only users can use every filter.

**Completion summary:** users can find urgent and assigned work with clear scope and recoverable filters.

## Step 6 of 10: Deliver a useful lazy-loaded List view

**Goal:** efficient office-style review without duplicating task data or authorization logic.

Candidate files: `src/list-view-ui.js`, shared view model, one view coordinator in `app.js`, lazy styles, browser tests.

Actions:
- Provide Board/List as accessible view-selection buttons with a clear selected state, not a complex ARIA grid unless fully implemented.
- List columns: task title, list/stage, assignees, due, checklist progress and completion. Use a semantic table with a real card-open button/link. Do not make an entire row a focusable container with nested interactive controls.
- Support stable title and due sorting with `aria-sort`; missing due dates sort last, ties use original order. Default is board/list order. Sorting is view-only.
- Share the same filters and counts. Opening a row uses the EXISTING card dialog and command path; no spreadsheet inline editing or batch writes in this release.
- Start with 100 rows and explicit `Show 100 more`, with correct displayed/total counts. Do not silently truncate 1,000-card boards or implement premature virtualization. Reset pagination when filters/board change, preserve it when merely closing a card where practical.
- Keep identity and row keys stable through updates. On save, reopen/restore focus to the same row; if a task disappears from the filtered result, return to the results heading and announce why.
- Lazy-load on first selection, show honest loading and retry states, cancel stale loads on context change. On a narrow screen, contain table overflow and keep title/open controls usable.

**Acceptance:** exact Board/List identity/count parity, sort stability, no data reordering, all 1,000 rows reachable, lazy chunk absent before use, lazy failure recoverable, role downgrade closes editing, realtime updates converge without duplicate subscriptions, raw local strings unchanged. Board remains usable if List fails.

**Completion summary:** a fast, accessible List view shows the same tasks without adding a second data model.

## Step 7 of 10: Make task capture and keyboard use faster

**Goal:** fewer steps for routine work without hidden magic or duplicate writes.

Primary files: `app.js` command/composer handlers, small lazy quick-add/help module if justified, existing templates and tests.

Actions:
- Add one visible board-level Add card action: a small dialog with title and explicit destination list; optional 'Create and open details'. Default to the last valid destination for this board/session, otherwise the first active list. If no list exists, guide creation first.
- Reuse the same central creation command as lane composers. IMPORTANT: the current `mutate(message, fn, undoLabel, hooks)` returns `true` when a cloud operation is queued, not when it is durably saved. Use its `hooks.success` / `hooks.failure` (or an equivalently tested completion contract) for closing the composer and clearing drafts. Handle synchronous local success as well as async cloud success. Disable repeated submit while pending; preserve title/list on storage or cloud failure; announce success only after the existing mutation path confirms it.
- Keep the current Enter/newline behavior unless deliberately qualified. Use Ctrl/Cmd+Enter for quick-add submission; plain Enter must not accidentally submit multiline text or an IME composition.
- Add discoverable shortcut help and a guarded `/` shortcut to focus board search when not typing, composing, dragging, or inside a modal. Keep all shortcuts optional conveniences with pointer equivalents. Do not override browser Ctrl/Cmd+K.
- Preserve existing Alt+arrow movement and Escape behavior. Avoid bare-letter create shortcuts that interfere with assistive navigation.
- If active filters hide a newly created card, say so and offer Clear filters; do not silently apply selected assignees/labels/deadlines to the new card.

**Acceptance:** chosen-list placement exactly once, rapid submit, failed write with retained draft, empty/archived destination, filtered-out result feedback, keyboard/IME/input exclusion, viewer denial, local reload persistence and cloud conflict handling. No new board templates product or bulk paste path.

**Completion summary:** common capture and navigation workflows are quicker and remain explicit and safe.

## Step 8 of 10: Refine card details and feedback

**Goal:** replace the flat form feeling with a clear task workspace while preserving reliable save semantics.

Primary files: existing card dialog/rendering in `index.html` and `app.js`, `styles.css`, `src/assignment-ui.js`, `src/comments-ui.js`, `src/activity-ui.js`.

Actions:
- Order essential fields intentionally: title, description, ownership/due/completion, labels, checklist, discussion/history. Keep a labelled title input; do not replace it with fragile contenteditable merely to remove duplication.
- Desktop may use a wider two-column composition for metadata and content, collapsing at short/narrow sizes. Keep one understandable scroll model and sticky Close/Cancel/Save controls; avoid multiple competing tall scroll regions.
- Add visible Cancel next to Save changes, dirty-state feedback and an explicit saving/error state. Keep draft normalization, failed-save retention and unsaved-close confirmation. No silent switch to autosave.
- Move less-frequent Duplicate/Move/Archive/Delete into a clearly labelled Card actions area/menu. Preserve each action's mode restrictions and confirmations. Before side-effect actions with a dirty draft, explicitly require save/discard/cancel; do not duplicate an uncertain blend of saved and draft content.
- Show local assignee labels as local text, cloud choices as current member identities. Improve layout/search within the EXISTING member picker only if useful; do not build a global directory or alter UID mapping.
- Reuse checklist progress, add clear empty-state actions, and permit fast keyboard item entry without stealing focus after rerender.
- Keep cloud comments and local history honestly distinct. Label comments as independently sent if they commit separately from Save changes. Do not imply Cancel can retract already sent comments. Bounded comment/activity loading remains unchanged and stops on close.
- Display due-time device timezone context without changing stored semantics. Keep date-only and no-date tasks valid.

**Acceptance:** saved vs draft data, Cancel/X/Escape, dirty secondary actions, backup failure, primary-save failure, cloud conflict/revocation, comment independent-save semantics, long discussion and short-height scrolling, focus return from both views, duplicate initialization and stale async response safety. No Rules or schema change.

**Completion summary:** task details have clearer priorities, less clutter and dependable editing feedback.

## Step 9 of 10: Qualify the whole experience

**Goal:** prove the final source, not isolated screenshots or an earlier build.

Run and record:
- `npm.cmd run validate` and relevant new unit suites registered in the aggregate command.
- `npm.cmd run test:rules`.
- `PLAYWRIGHT_EXECUTABLE_PATH='C:/Program Files (x86)/Google/Chrome/Application/chrome.exe' npm.cmd run test:emulator-browser`.
- Complete built-browser suite on a strict, owned preview port and `/UH-Flowboard/` base. Do not run hashed-asset tests against source-mode Vite.
- Repeat configured bootstrap coverage with explicitly synthetic public values and a demo project only; never load real `.env` or log config. Reset to the intended final build afterward.
- Lighthouse accessibility against that final served build, score 1 and zero failed audits; keyboard checks remain a separate requirement.
- `node scripts/validate-test-isolation.mjs`, source/gzip/per-file budgets, public-copy scan, Rules hash comparison, `git diff --check`.
- Three 1,000-card benchmark runs on the same machine/browser/viewport as Step 1. Compare median and maximum render/navigation/filter measurements; flag any median regression above 20% for investigation and optimization, not an automatic cap increase. Re-run if machine noise is suspected and retain both results. List first-open and filter medians should remain under 1,000ms and 150ms respectively on that same reference setup; these are local acceptance targets, not guarantees on all devices.
- Check no new Firestore listeners/read loops when toggling views or changing density. Require current-board listener ownership and zero new cross-workspace queries.

Visual matrix:
- Primary: 1280x720, 1440x900, 1920x1080, 960x720; Board, List and card details; rich/empty/filtered/read-only states.
- Compatibility: 390px, 320px, 200% zoom/reflow, coarse pointer, reduced motion and forced colors.
- All existing eight palettes, both Light/Dark modes and Solid/Gradient finishes: automate contrast sampling at foreground/background combinations and representative gradient points; visually inspect representative pastel, saturated and dark states. System theme must react live and respect saved overrides.
- Long titles, many labels, initials/photo/broken photo, no-photo preference, partial member lookup failures, long success/error messages and newly added controls.

Safety matrix:
- Compare raw local workspace/legacy strings around every non-mutating operation and local/cloud transitions, returning only equality booleans.
- Separate deterministic fake-adapter UI tests from SDK/Rules Emulator multi-context evidence.
- Owner/editor/viewer, conflict, revocation, sign-out, archive/restore, stale picker/read, failed write and draft preservation regressions remain passing.

**Acceptance:** all final-source gates pass under approved budgets with maintenance margin, no known high-severity UX/data/accessibility defects, evidence lists exact commands/counts and any retries. If a late fix lands, rerun every affected gate before declaring this step complete.

**Completion summary:** final UX is qualified across display modes, permissions, storage boundaries and large boards.

## Step 10 of 10: Package the local release candidate and stop

**Goal:** provide a reviewable implementation and exact next-action handoff without publishing it.

Create `artifacts/product-polish/release-candidate/README.md` and `MANIFEST.json` containing:
- Reviewed base SHA, implementation SHA, checkpoint history and exact Rules identity.
- Scope delivered, deferred items and all current acceptance results.
- Final measured source/gzip/per-file usage, approved limits and remaining margin.
- Before/after contact sheet from identical fixtures, with theme/viewport labels and no personal data.
- Known limitations and a concise manual acceptance sequence: compare Board/List; find an overdue card; create in a chosen list; edit/cancel; switch density; check cloud member/photo view only after separate authorization.
- Reproduction commands, original research links and source-grounded design rationale.
- Explicit statement: no push/PR/merge/deploy/Rules publication/real-account acceptance performed.

Remove only generated validation residue owned by this run, stop only owned servers/emulators, retain reproducible intentional evidence, commit the package and verify clean status. Keep pre-existing services untouched. Record final packaging SHA in the report rather than creating a self-referential manifest hash.

**Acceptance:** complete ledger, clean worktree, actual commit identity and working local candidate backed by Step 9 output. User-facing final message states the candidate is ready for review, with a separate release-authorization gate.

**Completion summary:** the polished local release candidate is packaged; production is unchanged.

## 6. Implementation handoff for Luna

Copy only after switching models and deciding to authorize local implementation:

```text
Implement UH-Trello/FLOWBOARD_PRODUCT_POLISH_PLAN.md.
Read FLOWBOARD_PRODUCT_POLISH_RESEARCH.md and inspect the planning concept.
Start from the reviewed current main on a new luna/product-polish branch.
Preserve all existing local/cloud data, identity and permission boundaries.
Follow all ten steps and send a short 'Step X of 10 complete' update after each verified checkpoint.
Current budget limits remain binding. Step 2 must obtain explicit approval before any cap increase; estimates in the plan are not approval.
Continue authorized local development between checkpoints, but stop on an unresolved budget/safety decision.
Stop at the verified local release candidate before any push, PR, merge, deployment, Rules publication or real-account testing.
Do not use protected workspaces, normal browser profiles, real account fixtures or sensitive logs.
```

## 7. Readiness definition

The plan is ready when its source research, current-source/live audit, visual direction, ten steps, implementation contracts, budget gate, test matrix and release boundary are documented and its linked artifacts exist. Plan readiness is not implementation completion. No application code changes or production deployment are authorized by this planning document.
