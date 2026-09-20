## Flowboard board-first copy simplification progress

- Baseline main: `88477363bac20cea90b8bfe78f0fb5b53964c16e`
- Branch: `fix/board-first-copy-simplification`
- Authorization: local and synthetic Emulator/browser validation only; stop before deployment

## Checkpoints

- [complete] Step 1 of 7: pin baseline and classify visible workspace terminology
- [complete] Step 2 of 7: define and test the board-first presentation contract
- [in_progress] Step 3 of 7: simplify the Account dialog
- [pending] Step 4 of 7: simplify the Boards manager and row metadata
- [pending] Step 5 of 7: translate access, activity, invitation, and recovery surfaces
- [pending] Step 6 of 7: run full browser, accessibility, Emulator, and budget qualification
- [pending] Step 7 of 7: package evidence and stop before deployment

## Evidence ledger

- Plan and Luna handoff read.
- Required skills loaded: static-web-mvp, emulator-browser-validation, obsidian.
- Baseline screenshots and copy matrix: `artifacts/board-first-copy-simplification/STEP-01-COPY-INVENTORY.md`; capture passed with zero page/console errors.
- Board-first contract: `tests/board-first-copy.spec.mjs`, 3 passed against built preview using system Chrome.
- Static/budget/workflow gates: passed after updating guards for compact row helpers and the new CI selection.
