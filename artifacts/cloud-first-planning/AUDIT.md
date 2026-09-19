# Cloud-first debugging planning audit

## Scope and evidence boundary

Planning only for Aaron's requested gpt-5.6-sol handoff. No application implementation, cloud data mutation, authentication, Rules publication, push, PR, or deployment was performed for this audit.

- Source inspected: `UH-Trello`, branch `main`, commit `d1c00e619e9b9b907d599e0dcbd1981b80841bc0`.
- Rules Git blob verified: `5d7e06e02bb679db2b1a31605cf81deb3f9a9e9a`.
- The earlier chat's duplicated/malformed Rules hash is not authoritative. The value above came from `git rev-parse HEAD:firestore.rules`.
- Worktree was clean before planning artifacts were created.
- All three user-supplied screenshots were inspected. They establish the duplicated navigation and requested removal, not runtime authorization facts.
- Anonymous production inspection used system Chrome in a disposable profile inside this artifact directory. It did not use Aaron's browser profile or sign in. The temporary profile was removed.
- `My Flowboard workspace` and `Lifecycle realtime probe` were not opened or mutated.
- No production Firebase configuration, storage contents, credentials, emails, or workspace identifiers were collected into these artifacts.

## Confirmed findings

### 1. Two real persistence/navigation models, not just two names

`src/main.js` creates the local adapter, `src/runtime-bootstrap.js` imports the app before resolving account state, and `app.js` starts with `{kind:'local'}` and `loadState()`. Account sign-in does not open cloud content automatically. `initializeCloudWorkspaceUI()` provides a separate chooser; `renderWorkspaceList()` only lists boards in the currently loaded workspace.

`initializeCloudSyncController()` and `handleCloudAccessRemoved()` currently return to local content after sign-out/access loss. These paths must change together for cloud-only operation. Renaming the menu would otherwise leave local saves intact.

### 2. A read-only row is not proof of a viewer role

`src/cloud-workspace-ui.js` decides editable status from both owner/editor role and `entry.migration?.state === 'verified'`. An owner of an unconverted snapshot workspace can therefore see a read-only preview plus owner Rename/Archive actions. The screenshot's CSS Tasks row cannot establish its actual migration state or role.

`fetchCloudWorkspace()` distinguishes legacy board snapshots from granular records. `migrateWorkspaceToGranular` retains legacy snapshot fields. Both require an explicit compatibility/migration plan.

### 3. List deletion is intentionally disabled in cloud mode

`app.js:listMarkup()` disables Delete list in editable cloud mode and labels it `Delete list unavailable · retained`. `deleteList()` independently refuses the action. `firestore.rules` denies hard deletion of board, list, card, and comment documents.

This is a verified source policy, not evidence of an intermittent network failure. An enabled button without lifecycle/Rules changes would fail.

### 4. Cloud Delete card is another archive action

The `#delete-card` handler requests `Archive this cloud card?` and sets `archived=true` in cloud mode. It does not permanently delete. The card archive view exposes Restore, but no permanent-delete action. Board archive/restore/delete controls do not exist in the My workspace list.

### 5. Archive/restore completion is not consistently awaited

`mutate()` returns `true` as soon as a cloud operation is started, not after server commit. Archive/delete/duplicate handlers close the editor immediately; Restore calls `showArchive()` immediately. On failure, the board state rolls back but an open archive surface is not necessarily reconciled to authoritative state. This is a source-confirmed reliability risk; the user's exact signed-in failure sequence was not reproduced against production.

### 6. Nested confirmations can lose their action

`runCardAction()` opens a discard confirmation for a dirty card. Its callback may open another confirmation for deletion. The `#confirm-dialog` close handler invokes the shared `pendingAction` and then clears it, so a newly installed nested confirmation action can be erased by the prior handler's cleanup. `requestConfirmation()` also does not reset the reused dialog's `returnValue`.

Add deterministic browser reproductions for dirty card -> Delete -> Discard -> final Delete, and prior confirmed action -> reopen -> Escape. Do not claim a production destructive operation was performed to reproduce this.

### 7. Horizontal scrolling is below the viewport

Source has independent viewport-based minimum heights for `main`, `.board`, and `.list`. Actual anonymous DOM measurements:

- At 1440x900, board top 217, bottom 959, document height 991; board scrollWidth 1658 versus clientWidth 1351.
- At 1280x720, board top 217, bottom 779, document height 811; board scrollWidth 1658 versus clientWidth 1191.

Thus genuine horizontal overflow exists, but its bottom track is below the visible viewport. The Add another list control contributes to width even when all named columns appear to fit. Screenshots alone do not reveal the full overflow width; DOM measurements do.

### 8. Filters lacks outside dismissal and clips off-screen

The filter toggle and Escape handler update visibility. Document click handlers dismiss Board actions and list menus, but not Filters.

In the isolated production audit, clicking the board heading left Filters open. Escape closed it. Filter panel bounds at 1440x900 were left `-131.96875`, right `98.03125`, width `230`. Desktop `.filter-panel {right:0}` aligns a wide panel to the right edge of its left-positioned trigger. The plan includes placement correction, not dismissal alone.

### 9. Start here is a removable disclosure

The production DOM contains one Start here control. Remove its actual `details.collaboration-notice` disclosure containing `#start-here-copy` and obsolete handlers/styles/tests, not just its label. Preserve the real actions referenced by the guide elsewhere.

## Test and budget checks performed during planning

- `npm.cmd test`: 37 passed, 0 failed, exit 0. Existing MODULE_TYPELESS_PACKAGE_JSON warnings were observed; no module-format changes were made.
- Anonymous browser audit: 0 captured console errors, 0 page errors, exit 0; listeners installed before navigation.
- `node scripts/measure-mvp-v2-budgets.mjs`: exit 0; current raw source 272,829 / 300,000 bytes; index.html 26,777 / 27,250.
- Existing local dist measured shell 26,100 / 26,250 gzip and lazy 57,940 / 58,000 gzip. This directory was NOT rebuilt in the planning turn, so those are existing-artifact readings, not newly qualified configured-build values.
- Historical release package reports configured shell 26,166 / 26,250. Rebuild both unconfigured and synthetic-configured candidates during implementation. Do not assume exact equality with the historical package or treat line-ending savings as durable headroom.
- No full Rules/Emulator/browser regression suite was rerun during planning. Playwright packages are currently absent; the audit used Node's built-in WebSocket and system Chrome without installing dependencies.

## Evidence files

- `audit-public.cjs`: repeatable anonymous inspection with owned-profile cleanup.
- `public-audit.json`: measured bounds, dismissal checks, and runtime error counts.
- `anonymous-board-1440.png`
- `anonymous-board-1280.png`
- `anonymous-filters-outside-click.png`
- `anonymous-my-workspace.png`
- `anonymous-board-dark.png` (temporary in-memory theme application, no preference save).

## Authoritative platform constraints consulted

- https://firebase.google.com/docs/firestore/manage-data/delete-data
  - Document deletion does not cascade into subcollections.
  - Firebase recommends a trusted server for unbounded collection deletion; client collection deletion has security/performance implications.
- https://firebase.google.com/docs/firestore/security/rules-conditions
  - Rules use exact-document `get/exists/getAfter` checks, not collection scans; Rules are not query filters.
  - Document access limits apply to every operation and batch/transaction.
- https://firebase.google.com/docs/firestore/quotas
  - Spark quotas and request/Rules limits constrain migrations and cascades. TTL deletion is not a free-quota alternative.

The plan must not present a one-call delete, generic client recursion, forged completion counter, or parent-first deletion as a safe cascade.

## Links

- [[FLOWBOARD_CLOUD_FIRST_DEBUGGING_PLAN]]
- [[FLOWBOARD_CLOUD_FIRST_IMPLEMENTATION_HANDOFF]]
