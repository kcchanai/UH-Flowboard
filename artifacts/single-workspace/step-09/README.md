# Step 9 of 10: Full qualification and CI coverage

## Final validation selection

The local validation contract now explicitly selects the new board/recovery/create/archive browser cases:

```text
npx playwright test tests/cloud-first-configured-session.spec.mjs tests/cloud-first-a11y.spec.mjs tests/browser-smoke.spec.mjs tests/single-workspace-board-ux.spec.mjs --grep="cloud-first board|Filters stays bounded|configured signed-out build|board manager|Data recovery route|New board is visible|archived owner board"
```

The same command is present in `.github/workflows/validate.yml` and enforced by `scripts/validate-workflow-gating.mjs`.

## Verification

- `npm.cmd run validate`: passed unit, static, syntax, build, source budget, and isolation gates.
- `npm.cmd run test:rules`: **41 passed, 0 failed**.
- `npm.cmd run test:emulator-browser`: **15 passed, 0 failed**.
- Exact configured browser selection above: **8 passed, 0 failed**.
- Lighthouse accessibility on the served synthetic configured build: **score 1.0, zero failed audits**.
- New loaded Boards/Data recovery axe audit: **zero violations**.
- The workflow contract guard passed.
- Pages deployment remains workflow-run gated on the same validated main SHA.

Evidence:

- `lighthouse-report.json`
- `../step-08/README.md`
- `../step-07/README.md`
- `../step-06/README.md`
- `.github/workflows/validate.yml`
- `scripts/validate-workflow-gating.mjs`

## Budget state

The final source before packaging measures **297,740 / 300,000 raw bytes**. The authorized envelopes remain:

- Initial shell: 26,250 gzip bytes.
- First-party lazy graph: 60,000 gzip bytes.
- `src/cloud-workspace-ui.js`: 14,000 raw bytes.
- All other per-file caps unchanged.

The maintainability warning remains active at 210,000 raw bytes. No further cap change is proposed in this step.

## Production boundary

No real account, normal browser profile, protected workspace, production document, migration, Rules publication, push, PR, merge, or deployment was used.
