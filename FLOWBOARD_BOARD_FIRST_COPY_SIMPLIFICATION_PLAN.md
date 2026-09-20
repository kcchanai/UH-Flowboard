# Flowboard board-first copy simplification plan

## Goal and decision

Flowboard should not present **My workspace** as a selectable product object when each account has one canonical personal workspace and users actually choose boards.

The user-facing primary model becomes:

1. Account
2. Boards
3. Individual board

The internal workspace model remains unchanged because it still provides Firestore paths, ownership, membership, invitations, shared authorization, lifecycle state, backups, and recovery. This is a presentation and information-architecture change, not a data migration or authorization redesign.

User screenshots that define the reported problem:

- Account dialog repeats **Current workspace**, **My workspace**, **Cloud workspace · owner · Synced**, **Your photo in this workspace**, and **Photo shared with My workspace**.
- Boards manager repeats **MY WORKSPACE**, **My workspace · owner** on every board, and **New board in My workspace**.

## Baseline and release boundary

- Repository: `C:/Code/Stacie-Hermes/UH-Trello`
- Current clean main: `88477363bac20cea90b8bfe78f0fb5b53964c16e`
- Current client source: `299316 / 300000`
- Current configured initial shell gzip: `25908 / 26250`
- Current configured first-party lazy gzip: `58386 / 60000`
- Current Rules blob: `296b595276122918f521d3f86ee6820a5cc876b7`
- Current indexes blob: `79fc192e9b71eb3c18b7fd504b77fc9b07bcd18a`

This planning turn must not modify application code or deploy. Luna implementation should be local and synthetic only, then stop before push, PR, merge, Pages deployment, Rules/index publication, production data access, migration, or real-account acceptance unless Aaron explicitly authorizes a later release.

## Product-language contract

### Remove from ordinary account and board navigation

- **Current workspace**
- **My workspace** as a visible fixed name
- **Cloud workspace** when cloud storage is already the normal product state
- **owner** when it only restates the signed-in account's default personal ownership
- **New board in My workspace**
- **MY WORKSPACE** eyebrow above Your boards

### Retain or translate where the distinction is meaningful

- Internal `workspaceId`, `personalWorkspaceId`, collection paths, roles, and Rules checks remain unchanged.
- Shared authorization must remain visible in board-centric language, such as **Shared · editor** or **Shared · read-only**, when a board is not in the canonical personal home.
- Recovery may distinguish retained legacy authorization containers, but ordinary users should see **older data**, **recovery source**, or another truthful board/data label instead of being asked to choose a workspace.
- Member, invitation, ownership-transfer, and activity controls must disclose that they affect all boards in the access scope. Removing the word workspace must not hide the breadth or consequences of an access change.
- Same-named boards from different internal scopes must remain distinguishable without exposing raw identifiers or flattening permissions.

### Proposed visible copy direction

Account dialog:

- Remove the entire **Current workspace / My workspace / Cloud workspace · owner · Synced** block from the ordinary signed-in state.
- Rename **Your photo in this workspace** to **Profile photo**.
- Replace **Visible to members of this workspace only** with **Visible only to people who can access your boards**.
- Replace **Photo shared with My workspace** with **Photo shared with people who can access your boards**.
- Keep Account, Appearance, Sign out, Boards, Data recovery, and legacy-data review actions.

Boards manager:

- Remove the **MY WORKSPACE** eyebrow, or replace it with a neutral product eyebrow only if visual hierarchy requires one.
- Keep **Your boards** as the dialog heading.
- Change **New board in My workspace** to **New board**.
- For canonical personal boards, remove **My workspace · owner** from each row. Keep only useful board metadata, such as position and current/archived state.
- For shared boards, show board-centric access metadata, such as **Shared · editor** or **Shared · read-only**.
- Replace **Legacy spaces are in Data recovery** with **Older data is available in Data recovery**.
- Change accessible labels such as **Close My workspace** to **Close boards** and **Load more boards from My workspace** to **Load more boards** for the canonical source.

Access, activity, invitation, and recovery dialogs:

- **Cloud workspace access** → **Board access**
- **Members and invitations** → **People and invitations** or **People with access**
- **Workspace activity** → **All board activity**
- **Join a cloud workspace** → **Access shared boards**
- **Workspace assignees** → **Board access members** or **People with access**, after checking the actual field scope
- **Archived spaces and legacy recovery** → **Older data and recovery**, while retaining internal scope IDs and lifecycle behavior

These are planned directions, not permission to perform a blind global replacement. Each string must be classified by whether it refers to the canonical personal home, a shared authorization scope, a retained recovery scope, or a Firestore implementation detail.

## Non-negotiable constraints

- Work only under `C:/Code/Stacie-Hermes`.
- Preserve one canonical personal workspace per account and board-only normal navigation.
- Preserve existing boards, board IDs, workspace IDs, memberships, invitations, roles, sharing permissions, archives, deletion jobs, backups, migration receipts, and recovery hints.
- Do not rename Firestore collections, fields, Rules functions, adapter methods, event names, or stored workspace names merely to change visible copy.
- Do not merge or adopt unrelated shared/legacy scopes.
- Keep Data recovery available and honest.
- Keep pointer-accessible Close controls and keyboard focus return.
- Keep visible access scope for destructive or authorization-changing actions.
- No public-facing em dashes.
- No source or gzip cap increase.
- Do not use production accounts, normal browser profiles, protected workspaces, or production document fixtures.

## Step 1 of 7: Pin baseline and inventory every visible use

**Accomplishment:** classify every workspace-related string before changing copy.

1. Load `static-web-mvp` and read this plan, current main, source-budget scripts, CI selection, and the existing single-workspace evidence.
2. Create `fix/board-first-copy-simplification` from exact main and `FLOWBOARD_BOARD_FIRST_COPY_PROGRESS.md` with seven checkpoints.
3. Inventory visible strings in:
   - `index.html`
   - `app.js`
   - `src/auth-ui.js`
   - `src/cloud-workspace-ui.js`
   - `src/activity-ui.js`
   - `src/assignment-ui.js`
   - `src/members-ui.js`
   - `src/invite-ui.js`
   - `src/legacy-import-ui.js`
   - lifecycle and recovery UI modules
4. Classify each occurrence as:
   - ordinary personal-board navigation
   - shared-board access
   - account setup/error state
   - member/invitation administration
   - activity scope
   - legacy/recovery scope
   - internal-only implementation term
5. Record baseline screenshots for the Account dialog and Boards manager with synthetic data at 1440x900 and a 960px compatibility width.

**Pass criteria:** complete copy matrix with source anchors, baseline identities, clean branch, and no application behavior change.

## Step 2 of 7: Define and test the board-first presentation contract

**Accomplishment:** encode what users should and should not see before rewriting individual strings.

Add focused browser assertions that initially fail on the current interface:

- Account dialog has no visible **Current workspace**, **My workspace**, or **Cloud workspace · owner · Synced** block.
- Profile-photo copy describes its audience in terms of people with board access.
- Boards manager heading remains **Your boards** without a **MY WORKSPACE** eyebrow.
- Canonical board rows do not repeat **My workspace** or **owner**.
- Shared board rows still expose **Shared**, editor/viewer access, and read-only state where applicable.
- New-board form says **New board**.
- Close/focus labels say **Close boards**.
- Same-named boards from different internal scopes remain distinguishable.
- Recovery still lists retained sources separately and never presents them as ordinary board choices.
- No raw workspace/document identifier is rendered.

Do not use broad negative assertions against all occurrences of “workspace.” Account setup errors and access administration may still require the term until their replacement wording is proven equivalent.

**Pass criteria:** a failing-before copy contract that preserves shared/recovery distinctions and is selected by local and CI browser workflows.

## Step 3 of 7: Simplify the Account dialog

**Accomplishment:** remove the redundant current-workspace block and make photo-sharing language audience-focused.

1. Remove or permanently hide `#account-workspace-section` from the ordinary signed-in presentation. Prefer removing obsolete DOM/controller work if it is no longer needed elsewhere, but keep internal mode/status state intact.
2. Remove now-unused `workspaceName` and `workspaceDetail` render paths only after searching all consumers.
3. Preserve account identity, sign-in/out, Appearance, Boards, Data recovery, and legacy-data review.
4. Rewrite profile-photo heading, status, and success/error copy around **people who can access your boards**.
5. Confirm owner/editor/viewer photo-sharing permissions still come from membership Rules and are not implied by copy.
6. Keep sync/error status available where actionable, such as account status or the board gate, without restoring a redundant workspace identity card.

**Pass criteria:** Account dialog is visibly shorter, contains no implied workspace switcher, retains all safe actions, and passes account/photo browser and accessibility checks.

## Step 4 of 7: Simplify the Boards manager and row metadata

**Accomplishment:** make board choice the only normal navigation decision.

1. Remove the **MY WORKSPACE** eyebrow from `#workspace-dialog`; retain **Your boards** and **+ New board**.
2. Change **New board in My workspace** to **New board**.
3. Replace fixed personal-source labels in `scopeLabel()` and `boardRow()` with a board-centric metadata function:
   - canonical personal board: position plus active/current/archived state only
   - shared editor board: **Shared · editor** plus position/state
   - shared viewer board: **Shared · read-only** plus position/state
   - duplicated board names across scopes: add a non-sensitive **Source 1 of N** distinction only when needed
4. Do not infer canonical status from a name. Use the verified personal pointer and existing personal/owner/ready metadata.
5. Preserve New board destination gating to the verified canonical home even while viewing a shared read-only board.
6. Update pagination, empty, unavailable, archive, restore, and focus-return labels to avoid **My workspace** in normal navigation.
7. Keep archived-owner actions and destructive confirmations unchanged except for necessary visible scope wording.

**Pass criteria:** users see boards, access level only when relevant, and one creation route. Existing same-name/same-scope, pagination, shared read-only, archived, and creation-destination tests remain green.

## Step 5 of 7: Translate access, activity, invitation, and recovery surfaces

**Accomplishment:** remove product-facing workspace jargon without hiding authorization scope.

Audit each administration surface individually:

- Member dialog should explain that access applies to the user's boards in that access group.
- Ownership transfer must explicitly state that it affects all boards in the group; do not shorten this into an ambiguous account transfer.
- Activity should say **All board activity** if it truly covers every board in the scope.
- Invitation acceptance should say **Access shared boards** and still preserve privacy before authenticated Rules authorization.
- Assignment language should use **people with access** only if the roster is actually scoped that way.
- Data recovery should use **older data**, **recovery source**, or **retained source**, while preserving exact backup, upgrade, archive/restore, and deletion safeguards.
- Internal developer/error diagnostics may continue to say workspace where that is the precise technical boundary.

Update `scripts/validate-static.mjs` and any exact-string workflow/static guards to the new contract. Replace guards with equally strong new wording assertions; do not delete safeguards simply to make copy changes pass.

**Pass criteria:** no ordinary surface implies workspace selection, access-changing controls retain truthful breadth, and recovery remains separate from Boards.

## Step 6 of 7: Full browser, accessibility, Emulator, and budget qualification

**Accomplishment:** prove the copy change did not alter identity, authorization, navigation, or data.

Run on final source:

1. `npm.cmd run validate`
2. `npm.cmd run test:rules`
3. `npm.cmd run test:emulator-browser`
4. Exact configured CI browser selection with synthetic non-production Firebase values
5. Lighthouse accessibility with score 1 and zero failed audits
6. Focused board-first copy tests at 1440x900, 1900x700, 960x720, 390x720, and 320x720

Required behavioral assertions:

- Boards opens and closes with focus return.
- New board targets the canonical personal home.
- Shared viewer/editor board labels remain accurate.
- Same-named boards stay distinct by internal tuple and conditional visible source marker.
- Manage access, invitation, activity, archive/restore, and Data recovery still target the correct internal scope.
- Account/photo actions remain available and Rules-backed.
- No local-storage or cloud document mutation occurs merely from opening Account or Boards.
- No console/page errors, horizontal page overflow, clipped copy, inaccessible Close controls, or duplicate controls.

Final budgets must remain below current hard caps. Re-measure configured and unconfigured builds. Copy simplification should normally reduce bytes; do not consume recovered headroom with unrelated features.

Capture and inspect final synthetic screenshots:

- Account dialog, signed in
- Boards manager with two personal boards
- Boards manager with a shared read-only board
- Data recovery with retained legacy sources
- Narrow compatibility view

**Pass criteria:** all gates pass, screenshots match the board-first model, source/initial/lazy budgets pass without cap changes, and generated logs/historical screenshots are cleaned.

## Step 7 of 7: Package the local candidate and stop before deployment

**Accomplishment:** produce a reviewable Luna handoff with immutable evidence.

1. Commit intentional implementation and tests on the isolated branch.
2. Create `artifacts/board-first-copy-simplification/` containing:
   - `README.md`
   - `validation-summary.json`
   - `SCREENSHOT_INDEX.md`
   - configured and unconfigured budget results
   - inspected screenshots
3. Record:
   - baseline SHA
   - implementation SHA
   - evidence SHA
   - Rules and indexes blobs
   - exact test counts and exit codes
   - remaining visible uses of “workspace” and why each is necessary
4. Verify clean worktree, stopped owned processes, and no disposable logs/test results.
5. Stop before push, PR, merge, Pages deployment, Rules/index publication, or production acceptance.

**Pass criteria:** verified local release candidate, honest remaining terminology inventory, separate deployment checklist, and a clear message to Aaron that implementation is ready for review.

## Final acceptance summary

The plan is complete only when the ordinary experience no longer asks users to understand or select **My workspace**, while Flowboard still preserves every internal authorization scope and clearly explains shared access, all-board administration, legacy recovery, and destructive consequences.
