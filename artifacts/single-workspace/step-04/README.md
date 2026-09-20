# Step 4 of 10: Board-only discovery and secondary recovery

## Delivered

- Normal Boards navigation now renders active and archived **boards only**. Workspace-container rows are hidden from the normal dialog.
- Account now exposes a separate **Data recovery** route that reuses the existing dialog and retained-space lifecycle controls.
- Data recovery shows legacy/shared workspace containers only in its secondary route, preserving Open/Rename/Archive/Restore, backup, and upgrade paths without presenting them as boards.
- Recovery rows remain internally scoped by the existing composite workspace/board identity. No containers, memberships, invitations, or board documents were merged.
- Normal directory loading now distinguishes unavailable sources, additional pages, synchronized metadata, and a genuine no-board state. It no longer reports all metadata synchronized after a failed source query.
- The account shortcut is labelled **Boards**. The separate **Data recovery** action is visible only while signed in.
- The synthetic directory-race page was updated to match the production dialog structure and remains a test-only fixture.

## Verification

- `npm.cmd run check`: passed syntax, static, adapter-boundary, performance, and workflow guards.
- `npm.cmd test`: **43 passed, 0 failed** in the final full-chain run before the final test-shell-only fixture adjustments.
- `npm.cmd run test:rules`: **41 passed, 0 failed**, including the hints-only profile-create assertion.
- `npm.cmd run test:emulator-browser`: **15 passed, 0 failed** after the final fixture and account-label adjustments.
- Focused built-preview browser checks: **4 passed, 0 failed**:
  - interrupted legacy recovery retry;
  - normal board manager hides legacy workspace rows;
  - Data recovery exposes retained workspace rows separately;
  - pre-Step-6 archived-row action baseline.
- `git diff --check`: passed during the verified checkpoints.

## Budget decision

The recovery renderer was moved into the existing legacy-recovery controller to stay within per-file limits. The resulting measured first-party lazy graph was **58,364 gzip bytes**. Aaron then explicitly authorized a narrow cap transition from **58,000 to 60,000 gzip bytes** for this implementation.

`budget.json` records both modes and the decision. Final Step 4 observations:

| Mode | Raw source | Raw headroom | Initial shell gzip | First-party lazy gzip |
| --- | ---: | ---: | ---: | ---: |
| Unconfigured | 296,554 / 300,000 | 3,446 | 25,951 / 26,250 | 58,364 / 60,000 |
| Synthetic configured | 296,554 / 300,000 | 3,446 | 25,995 / 26,250 | 58,364 / 60,000 |

Per-file caps pass, including `src/cloud-workspace-ui.js` at **12,658 / 13,000** and `src/legacy-import-ui.js` at **6,476 / 7,000**. The maintainability warning remains active at 210,000 bytes. No raw or initial-shell cap was raised.

## Production boundary

No real account, normal browser profile, protected workspace, production document, migration, Rules publication, push, PR, merge, or deployment was used. The lazy cap transition affects local/CI validation only and is not production authorization.
