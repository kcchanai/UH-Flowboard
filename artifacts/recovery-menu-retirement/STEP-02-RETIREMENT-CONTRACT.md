# Step 2 retirement contract evidence

## Failing-before proof

Command against the unchanged baseline build:

```text
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4175/UH-Flowboard/
npx playwright test tests/board-first-copy.spec.mjs --grep="retired recovery controls|account repair"
```

Result: **2 tests failed as expected**.

- `retired recovery controls are absent from Account and Boards` failed because `#open-cloud-recovery` existed.
- `account repair remains explicit and separate from Retry` failed because the baseline built cloud asset did not expose the planned repair-action contract.

These failures prove the new contract is not vacuous before implementation.

## Contract added

- Account and Boards must contain none of the retired recovery/import selectors.
- Account must retain Boards while removing both recovery menu actions.
- Browser-local sentinel keys must remain byte-identical while opening Account and Boards.
- Repair account setup must be an explicit action distinct from Retry and must not expose Data recovery.
- The configured CI grep now selects `retired recovery controls` and `account repair` instead of the retired Data recovery route test.

No production application behavior was changed in this step. Only the contract tests, workflow selection, and validators' selection guard were changed.
