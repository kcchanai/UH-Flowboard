# Flowboard recovery-menu retirement progress

- Baseline main: `8d3a66750885cccb3b6a5ac3136ecc1b9e2c5f9e`
- Branch: `fix/remove-recovery-menus`
- Scope: local and synthetic Auth/Firestore Emulator validation only; stop before deployment
- Rules blob baseline: `296b595276122918f521d3f86ee6820a5cc876b7`
- Indexes blob baseline: `79fc192e9b71eb3c18b7fd504b77fc9b07bcd18a`

## Checkpoints

- [complete] Step 1 of 8: pin baseline and inventory recovery dependencies
- [complete] Step 2 of 8: add failing-before retirement and safety contract
- [complete] Step 3 of 8: remove Account and Boards recovery surfaces
- [complete] Step 4 of 8: make account repair self-contained and preserve board safeguards
- [complete] Step 5 of 8: detach obsolete customer UI graph and tighten contracts
- [in_progress] Step 6 of 8: reconcile tests, CI, fixtures, and current documentation
- [pending] Step 7 of 8: run full configured, Emulator, accessibility, and budget qualification
- [pending] Step 8 of 8: package the Luna candidate and stop before deployment

## Evidence ledger

- Plan: `FLOWBOARD_RECOVERY_MENU_RETIREMENT_LUNA_PLAN.md`
- Baseline command and fixture inventory: `artifacts/recovery-menu-retirement/STEP-01-BASELINE-INVENTORY.md`, synthetic built preview, 5/5 HTTP 200, 0 console/page errors, no overflow.
- Step 2 retirement contract: `artifacts/recovery-menu-retirement/STEP-02-RETIREMENT-CONTRACT.md`, 2/2 expected baseline failures and synchronized CI grep.
- Retirement contract: complete in `artifacts/recovery-menu-retirement/STEP-02-RETIREMENT-CONTRACT.md`.
- Account/Boards implementation: `artifacts/recovery-menu-retirement/STEP-03-UI-RETIREMENT.md`, board-first 6/6, static/check passed, raw source 291725 bytes.
- Repair and board-safety implementation: `artifacts/recovery-menu-retirement/STEP-04-REPAIR-CONFIRMATION.md`, board-first 7/7, repair/archive confirmation and focus checks passed, raw source 294687 bytes.
- Customer-UI graph detachment: `artifacts/recovery-menu-retirement/STEP-05-UI-GRAPH.md`, unit 41/41, Rules 46/46, static/check passed, raw source 284179 bytes.
- Test/docs/CI reconciliation: in progress.
- Final validation package: pending Step 8
