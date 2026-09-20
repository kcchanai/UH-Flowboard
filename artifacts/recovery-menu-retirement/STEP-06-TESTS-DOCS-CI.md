# Step 6 tests, fixtures, CI, and documentation evidence

## Test and fixture reconciliation

- Removed the obsolete workspace lifecycle UI smoke test from `tests/browser-smoke.spec.mjs`.
- Removed the obsolete interrupted workspace migration UI smoke block.
- Replaced the Emulator customer legacy-import flows with a synthetic Account/Boards absence and byte-preservation test.
- Updated startup-denial Emulator coverage to assert Retry setup remains while Data recovery is absent.
- Updated `tests/single-workspace-board-ux.spec.mjs` to assert retired selectors are absent rather than hidden.
- Updated `tests/emulator/directory-race.html` and `.mjs` to remove recovery-only DOM and maintenance stubs from the ordinary directory fixture.
- Replaced the axe test's fabricated Data recovery state with reachable Account, Boards, and Repair states.
- Preserved Rules-level migration/lifecycle fixtures and protected adapter maintenance coverage.
- Preserved Board actions Local recovery coverage.

## Documentation reconciliation

Updated current product documents:

- `PRIVACY_AND_DATA_BOUNDARIES.md`
- `COLLABORATION_ARCHITECTURE.md`
- `VALIDATION_CHECKLIST.md`

Historical plans and prior release evidence were not rewritten.

## CI selection

The synchronized configured browser selection now uses:

```text
cloud-first board|Filters stays bounded|configured signed-out build|board manager|retired recovery controls|account repair|New board is visible|archived owner board|streamlined chrome
```

## Verification

- Exact configured CI browser selection: **11 passed**.
- Account, Boards, and Repair axe audits: passed with zero violations.
- Page/console errors in the selected browser group: zero.
- Static workflow gate: passed.
- Source graph remains budgeted with no unbudgeted reachable files.

The remaining full unit, Rules, packaged Emulator, Lighthouse, and configured/unconfigured budget gates are Step 7.
