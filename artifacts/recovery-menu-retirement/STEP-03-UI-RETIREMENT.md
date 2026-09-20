# Step 3 Account and Boards recovery-surface removal

## Implementation

- Removed `#open-cloud-recovery` and `#open-cloud-migration` from Account markup.
- Removed the Legacy Recovery dialog, retained-source details, upgrade button, and cloud-backup button from `index.html`.
- Removed recovery mode, retained-source rendering, backup/upgrade handlers, and legacy UI initialization from `src/cloud-workspace-ui.js`.
- Simplified `accountSetupActions` to one visible Retry/Repair action instead of adding a Data recovery action.
- Replaced Account safety copy with `Browser-only legacy data stays on this device and is not imported into your boards.`
- Removed `Older data is available in Data recovery.` from the normal Boards safety notice.
- Retained the internal workspace authorization model, Boards directory, shared labels, member/activity controls, board lifecycle controls, and separate Board actions Local recovery.

## Verification

- Full `tests/board-first-copy.spec.mjs`: **6 passed**.
- New retirement contracts passed:
  - retired recovery controls absent from Account and Boards;
  - raw browser legacy sentinel keys unchanged;
  - Repair account setup rendered separately from Retry in a synthetic needs-recovery Boards state.
- `npm.cmd run check`: passed, including static validation and workflow gating.
- Configured build budget:
  - raw source: **291725 / 300000** bytes;
  - initial shell gzip: **25866 / 26250** bytes;
  - first-party lazy gzip: **55400 / 60000** bytes;
  - document gzip: **4988** bytes;
  - reachable production sources: **34**.
- Retired selector scan: no matching selectors remain in `index.html` or `src/cloud-workspace-ui.js`.
- No Rules/index files were changed.

## Boundary

This checkpoint removes customer UI and ordinary call paths only. Protected migration, archived-root lifecycle, local inspection/receipt, and Rules capabilities remain for historical maintenance and later inventory-based decommission.
