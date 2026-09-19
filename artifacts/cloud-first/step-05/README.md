# Step 5 evidence - unified My workspace directory

## Scope

The normal Boards, Account, and synchronized-status entry points now open the same `My workspace` manager. The obsolete second cloud chooser, copy-to-cloud action, local workspace chooser, and Return to local controls are absent.

The manager displays board metadata only. It does not fetch every board's cards or comments during directory refresh.

## Implemented behavior

- Board identity remains the composite of workspace scope and board ID.
- Accessible workspace scopes are resolved independently, so one stale, revoked, denied, or missing profile hint cannot break other scopes.
- Initial directory pages contain at most 25 boards per scope.
- Visible per-scope Load more controls use a document-ID cursor and append without duplicates.
- Search covers every loaded page and never claims unloaded pages are complete.
- Active and archived boards remain separate.
- Same-named boards in same-named scopes receive non-sensitive `Scope N of M` labels in visible and accessible text.
- New boards always target the personal owner scope, even while a shared scope is active, then open through the existing cloud session bridge.
- One board action changes the backend workspace context, selects the board, closes the modal, and starts the normal scoped cloud runtime.
- Each board-open request increments the UI generation. A slower earlier request cannot replace a later board selection.
- A non-null account switch immediately clears rows, closes the manager, invalidates requests, and removes the prior account's directory from the DOM.
- Closing the real manager restores focus to its actual opener.
- Archived legacy workspace containers remain owner-recoverable in the secondary recovery disclosure.
- Workspace leave copy no longer describes an editable local fallback.

## Verified scenarios

- Fresh personal scope creates its first board and another browser context opens it.
- Thirty directory boards load across two pages without duplicates.
- Same-named boards across same-named workspace containers remain distinguishable and open the intended scope.
- A missing workspace hint is ignored while the two valid scopes remain usable.
- A delayed first board open cannot replace the later selection.
- Switching directly between signed-in accounts closes and clears the prior directory before the new account loads.
- Duplicate board names from legacy import remain four distinct rows with position metadata.
- Account/status/Boards use the same manager; no old chooser exists.
- Manager opening focuses search; visible close restores focus to Boards.
- Interrupted migration and archived-scope recovery remain reachable inside the manager.

## Verification

- `npm.cmd run validate`: passed.
- `npm.cmd run test:rules`: 39 passed, 0 failed.
- `npm.cmd run test:emulator-browser`: 9 passed, 0 failed.
- Configured signed-out built-preview test: 1 passed.
- Unconfigured built-preview tests: 2 passed.
- Focused built manager/migration/dialog tests: 3 passed.
- `git diff --check`: passed.

## Budgets

- Raw source: 285,691 / 300,000 bytes.
- Unconfigured initial shell: 25,758 / 26,250 gzip bytes.
- Configured initial shell: 25,804 / 26,250 gzip bytes.
- First-party lazy graph: 56,510 / 58,000 gzip bytes.
- `src/cloud-workspace-ui.js`: 12,645 / 13,000 bytes.

## Local-only boundary

No push, PR, merge, deployment, Rules/index publication, production migration, real-account test, protected-workspace access, or normal-browser-profile access occurred.
