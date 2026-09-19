# Step 1 source inventory

## Boot and persistence

- `src/main.js`: always constructs `LocalWorkspaceAdapter`; lazily creates Firebase adapter when configured.
- `src/runtime-bootstrap.js`: exposes both adapters and imports `app.js` before auth state is known.
- `app.js`: starts in local mode, calls `loadState()`, seeds through normalization, and uses local persistence unless explicitly switched to cloud.
- `src/adapters/local-workspace-adapter.js`: owns legacy keys, migration, local workspace storage, backups, UI/appearance preference records.

## Cloud discovery and session

- `src/auth-ui.js`: account state/copy and local/cloud mode labels.
- `src/cloud-workspace-ui.js`: separate chooser, local-to-cloud copy, legacy granular migration, Return to local.
- `src/cloud-sync-controller.js`: active workspace/board listeners, role changes, offline/access-loss fallback.
- `src/adapters/firebase-workspace-adapter.js`: public adapter facade and method contract.
- `src/adapters/firebase-cloud-workspace.js`: workspace discovery/full fetch, granular mutations, migration, comments, activity, realtime subscriptions.
- `src/workspace-lifecycle-ui.js` and `src/adapters/firebase-workspace-lifecycle.js`: workspace-root rename/archive/restore, not entity lifecycle.

## Entity behavior

- `state-core.js`: schema 5 and normalization that seeds a board when none exist.
- `app.js:mutate`: local boolean/cloud started-before-commit completion semantics.
- `app.js:listMarkup`, `deleteList`: cloud list deletion disabled and refused.
- `app.js:showArchive` and card handlers: card archive/restore plus cloud Delete-as-Archive.
- `app.js:requestConfirmation`, confirmation close listener: shared pending action and nested cleanup risk.
- `app.js:renderWorkspaceList`: board list for only the currently loaded in-memory workspace.
- `src/granular-workspace.js`: board/list/card conversion, with cards and lists as sibling board subcollections.

## Authorization and descendants

- `firestore.rules`: denies hard deletion of board/list/card/comment; immutable activity; workspace membership/role and invitation gates.
- Comments are nested under cards; cards reference `listId` and are not nested under lists.
- Board documents may retain a legacy `snapshot` field after granular migration.
- `firestore.indexes.json`: current tracked index source, to be extended only if proven query shapes require it.

## Interaction/layout

- `index.html`: My workspace and Cloud workspaces dialogs, Start here disclosure, Filters, shared confirmation and archive dialogs.
- `styles.css`: independent viewport calculations for main/board/list, filter right alignment, horizontal board overflow.
- `tests/browser-smoke.spec.mjs`: 59 browser checks and several local-first assertions that must be deliberately replaced, not simply removed.
- `tests/emulator/emulator-browser.spec.mjs`: real adapter/Rules multi-role seam.

## Validators and release gates

- `scripts/source-budget.mjs`, `measure-mvp-v2-budgets.mjs`: raw/per-file/shell/lazy budget accounting.
- `scripts/validate-static.mjs`, `validate-test-isolation.mjs`, `validate-workflow-gating.mjs`: semantic, production-isolation and same-SHA release checks.
- `.github/workflows/validate.yml`: unit/build/budget, Rules, built browser, multi-user Emulator browser and Lighthouse.
