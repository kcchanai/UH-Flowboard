# Step 5 of 10: Visible, reliable New board

## Delivered

- Added a visible labelled `+ New board` action in the `Your boards` dialog header.
- The header action uses the existing `#new-board-form` and focuses `#new-board-title`; no second create mutation path was introduced.
- The action is visible in the empty personal-home state and while the board manager has no active board.
- It is disabled with a truthful title when the canonical personal destination is not ready.
- The empty active-board message now directs the user to the visible New board action.
- Existing cloud creation keeps the canonical personal-home destination instead of using the currently selected shared/read-only scope.
- Existing form behavior remains intact: title validation, template choice, disabled repeat submission, command completion callbacks, reload/readback path, and failure status.

## Verification

- `npm.cmd test`: **43 passed, 0 failed**.
- `npm.cmd run check`: passed syntax, static, adapter-boundary, performance, and workflow guards.
- `npm.cmd run test:rules`: **41 passed, 0 failed**.
- `npm.cmd run test:emulator-browser`: **15 passed, 0 failed**.
  - The cross-context first-board flow now clicks the header `+ New board` control and verifies title-field focus before creating.
- Focused built-preview browser checks: **5 passed, 0 failed**:
  - interrupted legacy recovery retry;
  - normal board manager hides legacy workspace rows;
  - Data recovery exposes retained workspace rows separately;
  - empty personal home shows and focuses New board;
  - pre-Step-6 archived-row action baseline.
- `git diff --check`: passed during checkpoint validation.

## Budget

The raw source cap remains 300,000 bytes, initial shell remains 26,250 gzip, and first-party lazy remains 60,000 gzip after the separately authorized Step 4 transition. Aaron also authorized a narrow per-file transition for `src/cloud-workspace-ui.js` from 13,000 to 14,000 bytes to fund the labelled header action and its disabled-state/focus behavior.

Final Step 5 measurement in `budget.json`:

| Mode | Raw source | Raw headroom | Initial shell gzip | First-party lazy gzip |
| --- | ---: | ---: | ---: | ---: |
| Unconfigured | 297,180 / 300,000 | 2,820 | 25,951 / 26,250 | 58,476 / 60,000 |
| Synthetic configured | 297,180 / 300,000 | 2,820 | 25,996 / 26,250 | 58,476 / 60,000 |

Per-file evidence: `src/cloud-workspace-ui.js` **13,149 / 14,000**. All other measured per-file limits pass. The maintainability warning remains active at 210,000 bytes.

## Production boundary

No real account, normal browser profile, protected workspace, production document, migration, Rules publication, push, PR, merge, or deployment was used.
