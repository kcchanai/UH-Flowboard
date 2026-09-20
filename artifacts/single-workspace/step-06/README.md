# Step 6 of 10: Archived-board Restore and Delete permanently

## Delivered

- Active owner board rows retain the existing More menu with Archive and Delete permanently.
- Archived owner board rows now expose exactly two direct actions: **Restore** and **Delete permanently**.
- The old disabled `Archived` pseudo-action and archived-row More disclosure are hidden.
- Non-owner rows do not receive lifecycle maintenance actions.
- Restore continues through the existing revision-aware `setBoardArchived` command and refreshes the directory.
- Delete permanently continues through the existing preflight, typed board-name confirmation, bounded deletion engine, tombstones, and server-verification path. No second purge implementation was introduced.
- The lifecycle callback now refreshes selection for both Archive and Restore while preserving the owner’s currently selected recovery target when another row is restored.

## Verification

- `npm.cmd run check`: passed syntax, static, adapter-boundary, performance, and workflow guards.
- `npm.cmd test`: **43 passed, 0 failed**.
- `npm.cmd run test:rules`: **41 passed, 0 failed**.
- `npm.cmd run test:emulator-browser`: **15 passed, 0 failed**.
  - Existing lifecycle/deletion workflows cover descendants, comments, restore, purge, last-board state, and failure reconciliation.
- Focused built-preview direct-action browser test: **1 passed**.
- Focused Step 4 and Step 5 browser regressions were retained and passed during the preceding checkpoint.
- `git diff --check`: passed during checkpoint validation.

## Budget

The separately authorized envelopes remain raw 300,000 bytes, initial shell 26,250 gzip, first-party lazy 60,000 gzip, and `src/cloud-workspace-ui.js` 14,000 bytes. Step 6 final measurements in `budget.json`:

| Mode | Raw source | Raw headroom | Initial shell gzip | First-party lazy gzip |
| --- | ---: | ---: | ---: | ---: |
| Unconfigured | 297,457 / 300,000 | 2,543 | 25,950 / 26,250 | 58,493 / 60,000 |
| Synthetic configured | 297,457 / 300,000 | 2,543 | 25,995 / 26,250 | 58,493 / 60,000 |

Per-file limits pass. The maintainability warning remains active at 210,000 bytes.

## Production boundary

No real account, normal browser profile, protected workspace, production document, migration, Rules publication, push, PR, merge, or deployment was used.
