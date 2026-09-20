# Flowboard recovery-menu retirement progress

- Baseline main: `8d3a66750885cccb3b6a5ac3136ecc1b9e2c5f9e`
- Branch: `fix/remove-recovery-menus`
- Scope: local and synthetic Auth/Firestore Emulator validation only; stop before deployment
- Rules blob baseline: `296b595276122918f521d3f86ee6820a5cc876b7`
- Indexes blob baseline: `79fc192e9b71eb3c18b7fd504b77fc9b07bcd18a`

## Checkpoints

- [complete] Step 1 of 8: pin baseline and inventory recovery dependencies
- [complete] Step 2 of 8: add failing-before retirement and safety contract
- [in_progress] Step 3 of 8: remove Account and Boards recovery surfaces
- [pending] Step 4 of 8: make account repair self-contained and preserve board safeguards
- [pending] Step 5 of 8: detach obsolete customer UI graph and tighten contracts
- [pending] Step 6 of 8: reconcile tests, CI, fixtures, and current documentation
- [pending] Step 7 of 8: run full configured, Emulator, accessibility, and budget qualification
- [pending] Step 8 of 8: package the Luna candidate and stop before deployment

## Evidence ledger

- Plan: `FLOWBOARD_RECOVERY_MENU_RETIREMENT_LUNA_PLAN.md`
- Baseline command and fixture inventory: `artifacts/recovery-menu-retirement/STEP-01-BASELINE-INVENTORY.md`, synthetic built preview, 5/5 HTTP 200, 0 console/page errors, no overflow.
- Step 2 retirement contract: `artifacts/recovery-menu-retirement/STEP-02-RETIREMENT-CONTRACT.md`, 2/2 expected baseline failures and synchronized CI grep.
- Retirement contract: complete in `artifacts/recovery-menu-retirement/STEP-02-RETIREMENT-CONTRACT.md`.
- Account/Boards implementation: pending Step 3
- Repair and board-safety implementation: pending Step 4
- Customer-UI graph detachment: pending Step 5
- Test/docs/CI reconciliation: pending Step 6
- Final validation package: pending Step 8
