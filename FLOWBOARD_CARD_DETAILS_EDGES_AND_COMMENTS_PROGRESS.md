# Flowboard card-details edge coverage and comments progress

Plan: `FLOWBOARD_CARD_DETAILS_EDGES_AND_COMMENTS_LUNA_PLAN.md`

- Base/main SHA: `ffea4adc77ac0d23abf206363092530b1b58220f`
- Branch: `fix/card-details-edges-and-comments`
- Rules blob at baseline: `296b595276122918f521d3f86ee6820a5cc876b7`
- Indexes blob at baseline: `79fc192e9b71eb3c18b7fd504b77fc9b07bcd18a`
- Scope: local synthetic and disposable Emulator qualification only
- Publication: blocked until separately authorized

## Steps

- [x] Step 1 of 8: Pin the current baseline and validation tools.
- [x] Step 2 of 8: Add focused production-markup regressions.
- [x] Step 3 of 8: Repair the card-only header/body/footer layout.
- [x] Step 4 of 8: Remove only the redundant comments sentences.
- [x] Step 5 of 8: Qualify keyboard, draft, theme, and responsive behavior.
- [ ] Step 6 of 8: Verify real Emulator card/comment workflows.
- [ ] Step 7 of 8: Integrate CI and run the final candidate gates.
- [ ] Step 8 of 8: Package evidence and stop before publication.

## Evidence ledger

| Step | Status | Evidence |
|---:|---|---|
| 1 | complete | `artifacts/card-details-edges-implementation/baseline.json`; base and remote main `ffea4adc`; baseline aggregate passed |
| 2 | complete | `tests/card-details-edges-comments.spec.mjs`; `artifacts/card-details-edges-implementation/step-2-baseline.json`; baseline 1 passed, 2 expected failures |
| 3 | complete | `index.html`, `styles.css`, and focused edge contract; 3/3 passed across 9 viewport/scroll cases; zero-gap geometry and fixed budgets pass |
| 4 | complete | `index.html`, `src/comments-ui.js`, `scripts/validate-static.mjs`, `artifacts/card-details-edges-implementation/step-4.json`; focused 3/3 and static/build pass |
| 5 | complete | `tests/card-details-edges-comments.spec.mjs` 5/5; configured axe 2/2; confirmation/board-controls 17/17; responsive/media matrix passed |
| 6 | pending | |
| 7 | pending | |
| 8 | pending | |
