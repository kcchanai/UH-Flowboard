# Step 4 Boards manager evidence

## Delivered behavior

- The Boards manager uses `Boards` hierarchy and `Your boards`; it no longer presents `My workspace` as a selectable parent.
- Canonical personal rows omit redundant `My workspace` and `owner` labels.
- Personal rows retain position plus `Current`, `Active`, or `Archived · retained` state.
- Noncanonical rows use `Shared · editor` or `Shared · read-only`.
- Duplicate board titles across internal scopes use `Source N of N` markers without raw IDs.
- New-board copy is `New board`; the verified personal pointer remains the only creation destination.
- Pagination says `Load more boards`; recovery is separate from ordinary board selection.
- Close/focus labels use `Close boards`.
- Search now searches board titles rather than hidden workspace names.

## Verification

- `tests/board-first-copy.spec.mjs`: **3 passed**.
- Selected browser smoke manager/header group: **3 passed**.
- `PLAYWRIGHT_EXECUTABLE_PATH=C:/Program Files (x86)/Google/Chrome/Application/chrome.exe npm.cmd run test:emulator-browser`: **20 passed**.
- `npm.cmd run check`: passed, including static validation and workflow gating.
- Source budget: **298,114 / 300,000** total source bytes after the final copy changes; no cap increase.
- `src/cloud-workspace-ui.js`: **13,993 / 14,000** bytes.

The Emulator workflow used fresh synthetic Auth/Firestore state and the real adapter/Rules path. No production account or protected workspace was used.
