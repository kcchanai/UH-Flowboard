# Flowboard: one account workspace, board-only navigation

**Status: planning complete; implementation has not started.**

Prepared for Aaron on 2026-09-19 HST. Intended implementer: **gpt-5.6-luna**, after Aaron switches models and explicitly starts implementation. A model switch alone is not permission to implement.

- Repository: `C:/Code/Stacie-Hermes/UH-Trello`
- Live application: https://kcchanai.github.io/UH-Flowboard/
- Companion prompt: [[FLOWBOARD_SINGLE_WORKSPACE_IMPLEMENTATION_HANDOFF]]
- Planning evidence: [audit](artifacts/single-workspace-planning/AUDIT.md), [anonymous browser report](artifacts/single-workspace-planning/live-audit.json), [budget observation](artifacts/single-workspace-planning/budget-observation.json).

## 1. Requested result

Aaron identified a first-start dead end: the application asks users to choose a workspace, but the board manager does not make that choice understandable or actionable, and it offers no visible way to create a board.

Deliver these four outcomes:

1. **One personal workspace per Google account, resolved automatically.** No workspace selection, creation, naming, or default-workspace question during ordinary use.
2. **Users choose boards, not workspaces.** The Boards control opens a clear list of accessible boards. Selecting a board resolves its storage and sharing context internally.
3. **New board is obvious and works from the empty state.** An account does not need an existing active board to create its first one.
4. **An archived board has exactly two owner actions: Restore and Delete permanently.** Restore returns it to the active board selection; Delete permanently removes its app-managed board content irreversibly.

This is a corrective product/bootstrapping release, not another general visual redesign. The preceding cloud-first progress ledger marks its implementation checkpoints complete. Do not restart every historical polish plan or mistake their old planning-status headers for current unfinished scope.

## 2. What was actually verified

### Screenshot findings

Both supplied screenshots were visually inspected. Do not copy their personal content into tests or public artifacts.

- The first-start screen says `Workspace selection needed` and asks the user to choose which existing owner workspace becomes personal. The large explanatory panel offers no inline choice or creation action.
- The Your boards dialog says `No active boards yet`, while populated recovery rows are explicitly cloud workspaces, not individual boards.
- Those rows mix Open/Rename/Archive and Restore under one recovery heading. They are not proof that archived-board behavior is correct.
- No New board or Create board control is visible in either screenshot.

These observations do not prove the underlying account has no boards, that a displayed action is authorized, or that any particular production document is malformed.

### Source-confirmed causes

- `src/adapters/firebase-cloud-workspace.js`, `ensurePersonalWorkspace()` at lines 22-25: any nonempty `workspaceIds` list with no personal pointer returns `needs-selection`, even if the references are shared memberships or stale hints. It does not automatically establish an account home for existing users.
- `app.js`, `activateSession()` near line 138: propagates that result into the workspace-choice gate. `renderGate()` near lines 47-58 repeats the choice/recovery language instead of providing the board-first journey.
- `src/cloud-workspace-ui.js`, `personalScope()` at line 10: derives the creation target from the first directory entry marked `personal`, owner, ready, and verified, rather than from a shared authoritative account-home result.
- The same controller, `loadDirectory()` at line 18, hides `#new-board-form` when that lookup fails. A creation form and handler already exist; this is both a visibility/bootstrap defect and a workflow reliability task, not a missing database feature from scratch.
- The same controller, `renderSpaces()` at line 17, renders every discovered workspace into recovery, including ordinary active workspaces. The primary board UI therefore still exposes the old workspace model.
- `listBoardDirectory()` at lines 40-49 skips archived or unverified containers; its modern query requires `lifecycleState == active`. A caught board-query failure yields `unavailable: true` with an empty board list. Rendering must not translate these conditions into an authoritative empty account or an all-synchronized success message.
- `src/board-lifecycle-ui.js`, `createBoardLifecycleActions()`: current board actions are owner-only and sit under More. An archived row also gets a disabled Archived button from `boardRow()`. The desired archived-board interaction is two direct actions, not a disabled pseudo-action plus a menu.
- `tests/personal-workspace-rules.test.mjs` explicitly expects existing hints to require selection. This obsolete product assertion must change, while retaining its data-preservation and authorization intent.

### Baseline identities and limitations

- Inspected local checkout: `release-final`, clean before planning additions, HEAD `d9d8a47ec9491c354047b09b615f6ee31031c878`.
- Fresh GitHub API main: `2e86332133b1387c484e17fcfefe56455c163153`.
- The GitHub comparison reports divergent history, with differences in `.github/workflows/validate.yml` and `tests/emulator/emulator-browser.spec.mjs`, not application source. Start implementation from freshly reviewed remote main, not the stale local tracking label.
- Local Rules blob: `ab892fb38e3c371d533ffc59c739adf7a9300ffb`.
- Local indexes blob: `79fc192e9b71eb3c18b7fd504b77fc9b07bcd18a`.
- Pages API reports `built`. A fresh isolated anonymous browser loaded HTTP 200 at 1440x900, showed the sign-in gate, had no page-width overflow, and captured zero console errors and zero page errors.
- The anonymous audit did not sign in, read protected workspaces, verify the active Rules release, test index readiness, or reproduce Aaron's authenticated account state.
- No new unit/Rules/Emulator regression suite or fresh production build was run for this planning task. Previous release counts are historical, not acceptance evidence for this change.

## 3. Product and data model decision

### One account home, no workspace picker

Use the existing `users/{uid}.personalWorkspaceId` concept as the single canonical account home. Identify an account by Firebase Auth UID, not display name, email string, avatar, browser, or Google organization.

Every account has one canonical personal workspace used for new-board creation. Ordinary navigation exposes only Boards, Active boards, Archived boards, and New board. Remove normal workspace switching, personal-workspace selection, and workspace lifecycle actions from this surface.

**Important compatibility distinction:** one account-facing workspace does not authorize flattening all historical Firestore containers. Existing legacy and shared containers are still authorization boundaries. Keep them behind the board directory and resolve the actual `(workspaceId, boardId)` internally. A shared board can appear in several people's board directories without becoming a copy or becoming owned by those people.

Do not merge memberships, move another person's board, copy private local data, transfer ownership, or delete old containers to make the interface appear singular. A literal physical consolidation of every historical workspace would be a separate migration/ACL project requiring explicit authorization. It is not necessary to remove the workspace-choice UX.

### Automatic resolution policy

Prefer the smallest safe implementation of the following policy:

1. Auth loading: show `Loading your boards...`; no editable seed board and no workspace choice.
2. Signed out: show Sign in. Do not bootstrap or discover private data before authentication.
3. Verified signed-in account with a valid canonical pointer: reuse it after verifying owner identity/membership and the personal, ready, verified root contract. Do not overwrite the pointer merely because discovery ordering changes.
4. No pointer: atomically create one empty personal scope and set the pointer, even when `workspaceIds` already contains legacy/shared/stale entries. Preserve those existing discovery hints. Do not arbitrarily adopt the first old workspace or match a name such as My workspace.
5. Competing tabs or devices: use the profile document as the transaction coordination point. The losing attempt must observe the winner and must not leave a second root, owner membership, or discovery entry. Generate the candidate ID once per attempt, outside the transaction retry callback.
6. Readback uncertainty, permission errors, or network failure: do not interpret every exception as a missing account home and create another. Retain the operation identity, show an actionable account-setup Retry state, and verify the prior result first.
7. A stale, transferred, archived, malformed, or legacy pointer is a distinct recovery case. Preserve the pointer and original records. Do not automatically clear/repoint it, create a replacement home, unarchive, upgrade, transfer, or delete its target, even if normal opening fails. Show an actionable account-setup recovery state with Retry and the existing backup/restore/upgrade routes where authorized, not a workspace-selection prompt. Any replacement-pointer repair requires a separately designed, explicitly approved recovery procedure; it is not part of routine bootstrap in this release.
8. A pointer to an older root without the required personal/ready/verified contract is not permission to adopt or convert a shared scope silently. Preserve it and classify it for recovery. Keep New board visible with a specific disabled reason until the canonical destination is verified. Keep ordinary Boards navigation and independently authorized existing boards usable where possible; an exceptional recovery state must not become another opaque workspace-choice dead end.
9. Personal setup must not depend on reading every shared board successfully. An unavailable shared/legacy scope is a partial-discovery problem, not a reason to block creation in an otherwise verified account home.

The one-home guarantee is an atomic invariant of the supported application workflow. Current Rules permit general owner workspace creation and mutable owner pointers; do not claim they already enforce global physical uniqueness. In Step 3, require narrow Rules guards that prevent ordinary clearing, deleting, or replacing an established nonempty canonical pointer and bind first assignment to the valid personal-home transaction. Test attempts using null, an empty string, field deletion, and another owned scope. Preserve legitimate hints-only membership/invitation/leave updates without using the pointer as authorization to board data. Include old-client compatibility; do not scan all workspaces or loosen global reads to enforce uniqueness. General legacy/shared root-creation permissions must not be confused with the application's single canonical home.

### Access and sharing remain explicit

- New board always targets the canonical account home, even while a shared board is selected. There is no workspace destination dropdown.
- A newly created home starts with only its owner. An existing canonical home might already have members. Never say `Only you` without verifying that claim. Show a read-only access summary on the creation form, such as `Only you can access this board` or `Uses your existing sharing permissions` with an accessible explanation of the actual scope.
- Do not create a new board inside whichever shared or read-only scope happens to be active.
- Preserve existing workspace-scoped invitation/member behavior. If sharing applies to several boards, explain that fact in the sharing dialog; do not relabel it as board-only ACLs.
- Do not expose normal archive/delete/ownership-transfer actions for the canonical account home. Users manage boards. Review corresponding Rules and legacy-action paths so old UI cannot casually invalidate the new invariant. Do not break legitimate transfer or recovery of noncanonical legacy/shared scopes.

## 4. Target journey and interaction contract

### First sign-in with no boards

```text
Flowboard    Boards                         Appearance    Account

Your boards                                      [+ New board]
[Search boards...............................................]
[Active boards] [Archived boards]

Create your first board
Keep your tasks organized in one place.
[Create board]
```

There is no Choose your workspace step. The inline empty-state Create board and the persistent New board button invoke the same form/controller. Do not show a false empty state while setup or discovery is pending.

### Returning user

- Reopen a last-selected accessible active board when an account-scoped selection exists and is still authorized.
- Otherwise show the board chooser, with active boards and New board ready. Do not guess a new workspace choice or select an archived board.
- A missing/stale last selection is a navigation condition, not permission to recreate a deleted board or new account home.
- Boards remains a visible labelled top-level control. Avoid turning sync status into another differently named workspace chooser.
- Selecting Open for a board switches its backend scope internally, loads it once, closes the chooser, and places focus appropriately. No second Open workspace action.

### Boards dialog with existing content

```text
Your boards                                      [+ New board] [Close]
[Search boards.......................................................]
[Active boards] [Archived boards]

Project planning       Can edit                    [Open] [More]
Team tasks             View only                   [Open]
```

An optional noninteractive Shared badge or access-group subtitle can distinguish equal names. It must not become a workspace selector. Identity is the composite backend key, never a title or a board ID alone.

Use a real empty state for no boards, a separate no-search-results message for an active query, loading indicators for pending pages, and explicit partial/unavailable warnings. Search must describe its coverage; do not claim all boards are searched while additional pages remain unfetched. Keep bounded pagination and a clear Load more route where necessary.

### New board

- Visible in the Boards dialog header at ordinary desktop dimensions, including when no board is selected or all boards are archived.
- A signed-in user viewing somebody else's read-only board can still create a board in their own verified account home. Permission to create there is separate from permission to edit the viewed board.
- During home setup or offline failure, keep the affordance visible but disabled with a nearby reason and Retry when applicable. Do not silently remove it.
- Minimal form: Board name, existing template choice with Blank as the safe default, a noneditable access summary, Cancel, and Create board. Reuse supported templates; do not add a template project.
- Validate trimmed title using the existing documented bounds; expose field-level errors. Do not require a workspace name or scope selector.
- On submission: preserve the draft, disable repeat submission, use the existing revision-aware cloud command path, and capture account/home identity before awaiting.
- A successful verified create adds one board and opens that exact board. It must not merely reopen the manager or jump to another pre-existing board.
- A failed transaction keeps the form and input. If the transaction committed but readback failed, say verification is pending and reuse the same board/operation identity on Retry. Do not create a duplicate with a new random ID.
- Cancel, Escape, close, double-click, Enter, refresh, offline/reconnect, late responses, and account-switch paths must be deterministic. A security-driven account change immediately clears the prior account's draft/context.
- Creating the first board and creating another board must use the same supported path. No editable browser-local fallback.

### Archived boards

```text
Your boards                                      [+ New board] [Close]
[Search boards.......................................................]
[Active boards] [Archived boards]

Old project              Archived             [Restore] [Delete permanently]
```

For an owner with an eligible archived board, show exactly these two direct action buttons. The Archived badge is noninteractive. No Open, Rename, Archive again, disabled Archived button, or More menu on that row.

- **Restore:** after acknowledgement and readback, remove the row from Archived and make the same board ID appear once in Active. Preserve lists, cards, comments, ordering, assignments, and independently archived cards. Remain in the chooser with an announcement; do not unexpectedly force-open it.
- **Delete permanently:** invoke the existing board lifecycle/deletion engine. First preflight the exact board and descendant counts, show target identity and irreversibility, require typed board-name confirmation, and offer a visible Cancel. Confirmed deletion removes board payload, lists, active/archived cards, and nested comments within the supported bounds.
- Keep owner-only board archive/restore/permanent-delete authorization unless separately approved to expand it. Viewers and editors do not acquire deletion powers from this UI change. If archived boards are not readable for a role under current Rules, do not expose them with a broader query.
- Disable repeated actions while pending. Preserve recoverability on conflict/denial/offline/interruption. Do not remove a row or announce permanent deletion before verification.
- A job-complete field is not by itself proof of erasure. Retain original-scope resumability, immutable tombstones, anti-recreation checks, and server absence verification. Do not blindly change the existing advisory-completion design to reject all resumes.
- Required metadata such as immutable audit records, tombstones, and minimal control records may remain. Say clearly that external backups/exports are not erased. Do not promise universal erasure or remove workspace roots/members/invitations as part of a board delete.
- No Undo/Restore for a deleted board. Deleting or archiving the final board produces an honest empty chooser with New board still available; no phantom starter board.

### Legacy recovery is secondary, not workspace navigation

Remove the workspace rows from the normal Boards dialog. Move the existing backup/upgrade/archived-container recovery tools behind an explicit **Account > Data recovery** route (or an equivalently labelled secondary dialog), with visible Close and clear retained-data explanations.

- Keep legacy data reachable. Removing the chooser is not permission to remove its only backup, resume-upgrade, restore-container, or interrupted-deletion recovery path.
- Do not present a legacy workspace root as an archived board, or reuse Delete permanently on an entire legacy workspace.
- Ready compatible boards from old containers appear directly in the board directory without moving documents.
- Some old boards may lack lifecycle fields required by modern queries or belong to an unverified/archived parent. Establish a Rules-safe metadata inventory and compatibility classification. Do not loosen reads or silently migrate data just to populate the chooser.
- If preparation is needed before those boards can be opened/listed, show a concise `Older boards need attention` notice and link to recovery. Do not display an unqualified `No boards yet` while hiding known inaccessible legacy content.
- Backup-first upgrade and archived-container restoration remain explicit owner actions. They are exceptional recovery operations, never a request to choose the account's normal workspace.
- No automatic browser-only upload. Preserve the exact raw legacy keys and existing export/import consent.

## 5. Safety, scope, and implementation authority

This request authorizes the plan and planning evidence only.

After Aaron explicitly starts implementation:

- Work continuously on a new isolated local branch, suggested `luna/single-workspace-board-ux`, from reviewed current main. Preserve this package when changing branches.
- Restrict files, scratch profiles, tools, caches, and artifacts to `C:/Code/Stacie-Hermes`. Ask before operations requiring a path exception or a missing-tool install outside that boundary.
- Use synthetic fixtures and fresh `demo-*` Auth/Firestore Emulators. Never inspect a normal browser profile, reuse real-account browser sessions, or inspect production credential files.
- Do not open or mutate the protected `My Flowboard workspace` or `Lifecycle realtime probe` fixtures. The screenshots are evidence only, not authorization to use their data for tests.
- Do not print Firebase configuration, credentials, emails, UIDs, workspace IDs, invitation URLs, document bodies, tokens, cookies, or raw legacy storage. Report classifications/counts/booleans and sanitized screenshots.
- No production document reads for debugging, no production migration, no push/PR/merge/Pages deployment, and no Rules/index publication during implementation. Stop at a verified local release candidate.
- Keep Firebase Spark, static GitHub Pages, memory-only cloud content, copyable invitations, and existing OAuth scopes. No paid backend, Cloud Functions, account deletion, uploads, offline write queue, or persistent Firestore cache.
- Narrow schema/Rules changes needed for safe account bootstrap and canonical-home protection may be implemented and tested locally. Broader ACL redesign or physical workspace consolidation is out of scope. Publication remains a separate gate.
- Preserve appearance/photo preferences, member-backed assignment, comments, drafts, search/filter behavior, accessible pointer Close/Cancel, read-only navigation, and viewport-bounded board scrolling.
- No em dashes in public copy.

## 6. Budget gate

Fresh source observation during planning:

- Enumerated raw production source: **295,374 / 300,000 bytes**.
- Raw headroom: **4,626 bytes**; maintainability warning remains **210,000**.
- Unbudgeted reachable modules: none.
- Existing `dist` measurement: initial shell **26,150 / 26,250 gzip**, first-party lazy **57,982 / 58,000 gzip**, document **5,385 gzip**, vendor **139,809 gzip**.

The `dist` directory was not rebuilt for planning. These are artifact observations, not a qualified configured-build budget. The historical cloud-first package recorded configured-shell headroom of only 6 gzip bytes. Rebuild both configured and unconfigured variants before planning new allocations.

Prefer removing the obsolete workspace-choice/redundant workspace-row UI and centralizing account-home resolution over adding another parallel controller. Keep recovery reachable via lazy UI. Do not delete privacy, error, accessibility, rollback, or recovery behavior to obtain space. Register every new reachable source/style module.

No cap increase is approved by this request. If tested semantic recovery cannot fund the scope, stop at the budget gate with actual raw/per-file/shell/lazy deltas, a maintenance reserve proposal, and one explicit reduced-scope or cap-transition decision. Do not repeatedly code-golf source, silently raise caps, or count checkout line-ending changes as feature headroom.

## 7. Ten-step Luna execution plan

All steps are currently **not_started**. Create `FLOWBOARD_SINGLE_WORKSPACE_PROGRESS.md` only when implementation begins. Use one `in_progress` step, evidence in `artifacts/single-workspace/step-NN/`, and verified checkpoint commits.

### Step 1 of 10: Pin the current release and reproduce the failures

**Work**
- Load relevant skills and repository rules. Preserve current work; obtain the latest main SHA and review differences before creating the implementation branch.
- Pin application source, Rules/index blobs, package scripts, runner, CI commands, and installed tooling. Treat stale local origin/main as historical.
- Add synthetic reproductions for fresh account, existing hints without pointer, shared-only memberships, multiple legacy scopes, pointer failure, all boards archived, and creation from read-only shared-board context.
- Exercise actual production markup/controllers with synthetic adapters for layout; exercise the real SDK/Rules in Emulators for bootstrap and mutations.
- Run baseline unit/static/build/budget, current configured/unconfigured browser checks, Rules, and tracked Emulator runner. Record baseline failures, not just pass counts.

**Pass**: the reported dead end and hidden creation form are reproduced without a real account; exact baseline and failures are recorded; no application repair is hidden in the baseline checkpoint.

**Completion summary**: `Step 1 of 10 complete: The startup and board-creation failures are reproduced with isolated fixtures.`

### Step 2 of 10: Lock the account-home contract and budget

**Work**
- Write the state/transition contract from sections 3-4, including ambiguous errors versus verified stale pointers, legacy/shared isolation, access-summary copy, and canonical-home lifecycle protection.
- Map every old chooser control to its new board action, secondary recovery route, or intentional removal. No orphaned recovery capability.
- Rebuild configured and unconfigured variants with synthetic configuration; quantify removed workspace UI and any lazy recovery extraction.
- Document required Rules/index changes and mixed old/new-client behavior before depending on them.

**Pass**: one canonical destination contract shared by bootstrap, creation, directory, and imports; measured feasible allocation, or an explicit budget blocker. No choice-screen fallback.

**Completion summary**: `Step 2 of 10 complete: Automatic account setup, legacy safety, and the byte budget are defined.`

### Step 3 of 10: Implement automatic account-home setup

**Work**
- Replace the hints-to-needs-selection branch with transaction-coordinated home establishment, preserving existing references and memberships.
- Return/store the verified canonical destination once for all consumers. Remove the UI's first-personal-entry heuristic.
- Add precise loading/retry/recovery states and guard all asynchronous success, error, and finally paths against account/session changes. No automatic replacement-pointer repair.
- Implement and test narrow Rules guards for first pointer assignment, established-pointer immutability, and protection of the canonical home from ordinary archive/transfer paths. Preserve compatible hints-only profile updates and test invitation acceptance/self-leave with an unchanged pointer. Do not claim global singleton enforcement unless negative Rules tests prove it.
- Update obsolete needs-selection tests instead of dropping their preservation assertions. Test production adapter logic, not only a duplicated miniature bootstrap helper.

**Pass**: new and existing-hint accounts need no workspace selection; two independent concurrent sessions converge; repeated login does not duplicate roots; bad network/denial does not create replacement loops; negative authorization tests pass.

**Completion summary**: `Step 3 of 10 complete: Each account automatically resolves one personal workspace without a setup choice.`

### Step 4 of 10: Make board discovery the only normal navigation

**Work**
- Refactor the existing manager into Your boards with Active and Archived sections/tabs and one board search.
- Remove normal workspace rows and workspace-selection language. Keep composite keys and internal scope routing.
- Preserve last accessible active board selection per account; otherwise open the board chooser. Never cross-account reuse or restore deleted selections.
- Classify complete, paginated, partial, unavailable, legacy-preparation, and truly empty results. Give clear Retry/Load more paths; do not announce All synchronized after a failed scope query.
- Move backup/upgrade/archived-root recovery into the secondary Account route and retain every supported recovery operation. Avoid mandatory workspace selection there too.

**Pass**: one-click board open works across existing scopes; names do not determine identity; active legacy-ready boards stay discoverable; unresolved legacy data is acknowledged instead of concealed; recovery remains accessible.

**Completion summary**: `Step 4 of 10 complete: Users browse boards while storage scopes stay behind the scenes.`

### Step 5 of 10: Make New board visible and reliable

**Work**
- Add/reuse the persistent labelled New board action and inline empty-state Create board action, both wired to one form.
- Resolve the canonical destination independently of selected board/role. Do not hide creation simply because no active board is loaded or a shared board is read-only.
- Preserve existing supported templates and title bounds. Show access scope without a destination selector.
- Use one stable board/operation identity for a submitted command, authoritative acknowledgement, and verification-pending Retry.
- After success, insert/open the exact new board; preserve form/draft on failure, prevent duplicates, and revalidate account generation after awaits.

**Pass**: first/second board, all-archived account, shared-viewer context, two-tab creation, blank/invalid titles, Cancel, double-submit, denial, offline, and ambiguous readback all behave as specified; reload proves persisted identity/content.

**Completion summary**: `Step 5 of 10 complete: New board is visible from every signed-in board-selection state and opens the saved board.`

### Step 6 of 10: Simplify archived-board restore and deletion

**Work**
- Render owner archived rows with Restore and Delete permanently directly; remove the disabled Archived control and More menu there.
- Restore through the existing lifecycle command and refresh the directory from verified data, making the board selectable in Active once.
- Reuse preflight, typed confirmation, bounded purge, tombstones, and readback for deletion. Do not build a second deletion path.
- Test independently archived descendants, many comment pages, stale preflight counts, conflict, denied role, interrupted jobs, exact-scope resume, and retained metadata.

**Pass**: two direct eligible-owner actions only; restore preserves content and identity; permanent delete proves payload absence and no resurrection; unauthorized users cannot invoke the underlying operation; final-board actions retain a usable empty state.

**Completion summary**: `Step 6 of 10 complete: Archived boards have clear Restore and Delete permanently actions with verified outcomes.`

### Step 7 of 10: Close session, realtime, and recovery edge cases

**Work**
- Guard directory load/pagination, bootstrap, create, restore, delete preflight/confirmation, and finally blocks with captured account/request/target identity.
- Test sign-out, account switch, access removal, role change, active-board archive/delete in another context, and reconnect.
- Use bounded refresh/subscriptions for an open board manager; converge after a remote restore without requiring a full page reload. Preserve existing active-content listener teardown and cost bounds.
- Check dirty card drafts before deliberate board navigation; clear confidential data immediately on access loss. Do not let a late operation repaint another account.
- Retest legacy upgrade/export/import and interrupted-purge recovery through the relocated route, including raw legacy-storage equality.

**Pass**: no stale/account-crossing UI, listener leaks, duplicate operations, phantom boards, lost recoverability, or optimistic success on failed verification.

**Completion summary**: `Step 7 of 10 complete: Account changes, remote lifecycle events, and recovery stay coherent.`

### Step 8 of 10: Qualify onboarding, copy, and accessible layout

**Work**
- Audit actual markup for loading, empty, existing, search-no-results, partial failure, all-archived, create pending/failure, restore, and deletion confirmation states.
- Preserve current brand/palettes and desktop-first density. Test 1280x720, 1440x900, 1920x1080, resized 960x720, and 320/390px compatibility.
- Check short-height scrolling, long names, exactly reachable New board/Close/Cancel controls, focus containment/return, Escape, keyboard tab behavior, coarse-pointer targets, 200% reflow, reduced motion, forced colors, light/dark contrast, and no page overflow.
- Remove ordinary Choose workspace / workspace selection needed copy across app, Account, status, accessible names, and error recovery, not just the pictured heading.
- Do not describe a data-recovery container as a board or imply shared board-specific ACLs that do not exist.

**Pass**: a first-time user can sign in and create a board without workspace terminology decisions; screenshots are inspected; essential controls work for pointer and keyboard; no new console/page errors or public em dashes.

**Completion summary**: `Step 8 of 10 complete: The simplified board journey is clear and accessible across supported layouts.`

### Step 9 of 10: Run full qualification and make CI cover this release

**Work**
- Rerun the complete final source chain after the last fix: unit, static, syntax, build, raw/per-file/gzip budgets, isolation, Rules, real SDK multi-context Emulator, built-preview browser, and accessibility.
- Inventory all affected browser specs against both package runner and remote-main CI. The local workflow and independently read remote-main workflow both filter by `cloud-first board|Filters stays bounded`, and their CI Emulator command names only one spec; a green workflow does not prove other fixtures ran. Add explicit new bootstrap/creation/archive spec coverage and update the workflow-contract validator.
- Keep configured and unconfigured tests correctly separated; run browser tests against the built preview when they import hashed assets. List/discovery and loaded-dialog accessibility must be audited, not just the anonymous gate.
- Exercise current deployed-client/new-Rules and candidate-client/current-Rules combinations in Emulators. If a safe mixed-version path cannot be demonstrated, document a release blocker rather than relying on browser reload instructions alone.
- Measure repeated large-directory/board workloads, bounded reads/listeners, creation/restore responsiveness, and the existing 1,000-card benchmark. Separate actual samples from forecasts.

**Pass**: every acceptance case has a result and evidence path, no hidden skipped required tests, Lighthouse accessibility score 1 with zero failed audits, zero relevant axe violations, all budgets pass, and CI actually selects the new regressions.

**Completion summary**: `Step 9 of 10 complete: The final candidate passes automated regression, authorization, accessibility, and budget gates.`

### Step 10 of 10: Package the local release candidate and stop

**Work**
- Create `artifacts/single-workspace/release-candidate/README.md`, `MANIFEST.json`, `SCREENSHOT_INDEX.md`, and `RELEASE_CHECKLIST.md`.
- Record exact implementation/package commits, Rules/index blobs, test commands and selected counts, screenshot states, budget headroom, setup/repair policy, recovery limitations, and compatibility findings.
- Include the future operator journey: sign in, see boards without choosing a workspace, create a disposable board, archive it, restore it into Active, archive again, then verify permanent delete using separate authorized test fixtures.
- State whether Rules/index publication is required by the final diff. If unchanged, prove byte identity; if changed, provide exact files and independent revision/index-readiness verification steps.
- Clean only owned scratch profiles/processes/logs. Keep intentional evidence and preserve unrelated work. Record final worktree state.

**Pass**: the requested product outcomes are mapped to verified evidence; all named files exist and are internally consistent; no production side effects occurred; no remaining block is disguised as completion.

**Completion summary**: `Step 10 of 10 complete: The verified local candidate and exact release handoff are ready for Aaron's approval.`

## 8. Acceptance checklist

### Account and data boundaries

- [ ] Fresh verified account bootstraps once, without a workspace question.
- [ ] Existing hints without a pointer, including shared-only and stale-hint fixtures, do not cause needs-selection.
- [ ] Existing valid pointer remains stable; concurrent first-login tabs create one canonical root; ordinary clear/delete/repoint attempts are Rules-denied.
- [ ] Missing target, archived/transferred/malformed pointer, non-personal legacy root, and transient denial/offline cases preserve the established pointer and never create automatic replacements. Recovery is actionable without a workspace-choice step.
- [ ] Existing hints, memberships, invitations, ownership, and legacy raw strings are preserved.
- [ ] Full 100-entry hint-list boundary is explicitly handled without silently dropping access or looping bootstrap. Do not increase the bound without Rules/cost evidence.
- [ ] Anonymous, unverified, viewer, non-member, cross-account, and forged-pointer operations are denied appropriately.

### Board discovery and creation

- [ ] Ordinary navigation contains no workspace selection or workspace rows.
- [ ] Same-named boards and equal board IDs in different legacy scopes remain distinct.
- [ ] Pagination, partial failure, unavailable indexes/query errors, legacy metadata, search, and truly empty results are distinguishable.
- [ ] New board is visible before any active board exists and when all boards are archived.
- [ ] Viewing a shared/read-only board does not change the new-board destination or disable personal creation.
- [ ] Cancel/invalid input never writes; successful create opens exactly the saved board; retry after ambiguous commit does not duplicate it.
- [ ] Switching Google accounts never shows prior-account selection, draft, or board data.

### Archive, restore, deletion, and recovery

- [ ] Owner archived rows have only Restore and Delete permanently as direct actions.
- [ ] Restored board returns once to Active with identity, order, fields, and comments preserved.
- [ ] Deleted board payload and descendants are server-verified absent; retained metadata is explained; no Undo or snapshot resurrection.
- [ ] Viewer/editor restrictions, stale revisions/counts, double submission, interruption, revocation, and scoped job resume are tested through Rules and the real SDK.
- [ ] Final-board archive/delete leaves New board usable and never seeds a phantom board.
- [ ] Archived-root and legacy-format recovery remain reachable separately without masquerading as board restore/delete.
- [ ] Sign-in and navigation never upload or rewrite browser-local legacy content.

### Release quality

- [ ] Desktop/narrow/light/dark/short-height/keyboard/zoom/read-only UI and loaded-dialog accessibility pass.
- [ ] Current CI explicitly runs the new cases; exact test selection/counts are recorded.
- [ ] Configured and unconfigured source/build/transfer caps pass on final source.
- [ ] Candidate manifest and screenshots use the exact verified source and no private fixtures.

## 9. Source and test map

- `src/adapters/firebase-cloud-workspace.js`: canonical bootstrap, profile hints, directory classification, board lifecycle readback.
- `src/adapters/firebase-workspace-adapter.js` and `adapter-contract.js`: expose any shared account-home result or required narrow operation through the adapter boundary.
- `app.js`: session activation, empty/error gates, create/select command outcomes, account-scoped last selection, dirty draft guards.
- `src/runtime-bootstrap.js`: one shared initialization path and session propagation.
- `src/cloud-workspace-ui.js`: Boards manager, canonical creation destination, pagination/error states, recovery separation, stale request guards.
- `src/auth-ui.js`: Account route, Data recovery, and status/selection wording.
- `src/board-lifecycle-ui.js`: direct archived-row actions and exact-target confirmation.
- `src/workspace-lifecycle-ui.js`, `src/adapters/firebase-workspace-lifecycle.js`: legacy-only recovery and canonical-home lifecycle restrictions.
- `src/adapters/firebase-deletion.js`: preserve existing scoped purge protocol; change only for demonstrated regressions.
- `src/legacy-import-ui.js`, `src/adapters/firebase-migration.js`: canonical import destination, consent, backup, resume, and preserved legacy eligibility.
- `firestore.rules`, `firestore.indexes.json`: exact authorization/query dependencies; no automatic production publication.
- `index.html`, `styles.css`, component style modules: visible New board, Active/Archived navigation, modal hierarchy, recovery route, responsive bounds.
- `tests/personal-workspace-rules.test.mjs`, `tests/cloud-first-regressions.test.mjs`, `tests/adapter-contract.test.mjs`: product invariant and authorization regressions.
- `tests/emulator/entry.mjs`, `emulator-browser.spec.mjs`, `board-lifecycle-ui.spec.mjs`, `deletion-engine.spec.mjs`: real SDK multi-session setup/create/restore/purge proof. Add focused new specs as needed.
- `tests/cloud-first-configured-session.spec.mjs`, `tests/cloud-first-a11y.spec.mjs`, `tests/browser-smoke.spec.mjs`: configured/unconfigured and real-markup checks.
- `scripts/run-emulator-browser.mjs`, `.github/workflows/validate.yml`, `scripts/validate-workflow-gating.mjs`: keep local/CI selection truthful and include new cases.
- `scripts/source-budget.mjs`, `measure-mvp-v2-budgets.mjs`, `validate-test-isolation.mjs`: reachable graph, transfer caps, and production test isolation.

## 10. Execution commands and reporting

Verify installed prerequisites first. Use native Windows `npm.cmd` / `npx.cmd` from the repository; scope caches and browser scratch data to the vault. Do not trigger an unapproved external installation just because a package script uses npx.

```text
npm.cmd test
npm.cmd run check
npm.cmd run build
npm.cmd run measure:mvp-v2
node scripts/validate-test-isolation.mjs
npm.cmd run test:rules
npm.cmd run test:emulator-browser
npm.cmd run validate
git diff --check
```

Start an owned strict-port built preview under `/UH-Flowboard/` for the browser suite and accessibility. Use synthetic configuration for the configured build. Keep Emulator integration tests distinct from fake-adapter UI tests. Verify the packaged runner itself; do not reuse an unknown occupied server.

After each verified checkpoint, immediately send:

```text
Step X of 10 complete: <title>
Changed: <specific product result>
Verified: <actual commands, counts, and evidence>
Budget: <raw/cap; configured shell; lazy gzip>
Checkpoint: <commit and worktree status>
Production: unchanged. Next: <next step or release gate>
```

If blocked, say `Step X of 10 blocked`, state the exact evidence and decision needed, and do not mark the step complete. Continue authorized local steps without routine approval requests; stop at genuine budget, scope, credential, or release boundaries.

## 11. Later release gate, not authorized by this plan

1. Review the final candidate and recheck exact remote main/Pages state.
2. Authorize any required Rules/index publication separately; verify active revision, content identity where available, and required index readiness. A successful CLI deployment receipt or index count alone is not a complete independent Rules/readiness verification.
3. Follow the tested mixed-version deployment order from the compatibility matrix.
4. Authorize push, PR, validated merge, and Pages deployment on the exact reviewed SHA; verify the actual published client.
5. Separately authorize real Google-account acceptance with fresh disposable fixtures. Never use protected workspaces as test targets or administrator Console writes as evidence of Security Rules enforcement.
6. Any real legacy migration remains an explicit owner action with backup, preview, and content verification. Deploying automatic setup is not permission for a bulk migration.

**Definition of done for Luna:** a fully verified local candidate where normal accounts never choose a workspace, users select boards, New board is consistently visible and persistent, archived boards offer the two requested operations, existing access/data remain safe, and deployment waits for Aaron's next instruction.

## Links

- [[FLOWBOARD_SINGLE_WORKSPACE_IMPLEMENTATION_HANDOFF]]
- [[FLOWBOARD_CLOUD_FIRST_DEBUGGING_PLAN]]
- [[FLOWBOARD_CLOUD_FIRST_PROGRESS]]
