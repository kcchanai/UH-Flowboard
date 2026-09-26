# Flowboard audit items 1-8: local implementation receipt

## Scope and release boundary

Approved implementation: items **1-8** in `FLOWBOARD_COMPREHENSIVE_AUDIT_APPROVAL_PLAN.md`. Items 9-10 remain out of scope. This is a **locally verified candidate** on `fix/audit-items-1-8`; no push, PR, merge, Rules/index publication, real-account acceptance, production data mutation or Pages deployment is authorized by this implementation request.

Baseline: `ce62dac2fe86e2dfcb463ca3d78bcf55d6aca3a9`.

## Implemented changes

1. **List-menu focus:** Escape returns focus to the originating list action button. Outside pointer dismissal still leaves focus on the clicked control. Focus tests cover first, middle and last list menus.
2. **Contrast and readability:** Light helper text has stronger contrast. Dark primary buttons use a deeper interactive blue distinct from decorative canvas accents, with dark text-button treatment and clearer list/card separation. The generated Appearance dialog retains all eight palettes and both theme modes.
3. **Mobile header:** Brand icon width is reserved; wordmark collapses on narrow screens; Appearance retains its accessible name with an icon-sized control. Boards remains the sole navigation entry.
4. **Filters semantics:** Toggle has `aria-controls="filter-panel"` and the panel is a named group. Open/close, Escape focus and selected state remain unchanged.
5. **Current-feature suite:** `npm run test:current` runs current synthetic controller/browser tests in separate unconfigured/configured lanes, Rules tests, and fresh demo Auth/Firestore Emulator browser jobs. `npm run test:legacy-diagnostic` retains the historical local-first suite as an explicitly red-capable diagnostic. Coverage map is in `tests/audit-coverage-map.md`. New focused access/appearance tests are also in CI validation. No historical safety test was deleted or silently skipped.
6. **Signed-out action:** The central gate has a Sign in with Google button routed to the existing Account dialog; header and central controls return focus to their respective opener. Main copy is short, and existing browser-data reassurance is separate. No new recovery path or automatic browser-data activation.
7. **Appearance dialog:** Contained settings scroller with persistent visible header/Close and Save/Cancel footer. Preview, Cancel, Reset preview, save error/draft retention and successful Save are covered by browser tests. A failed save scrolls the settings body's meaningful error into view without discarding the draft.
8. **Restrained polish:** Bounded mobile board summary has a deliberate row below full-width Search; short-desktop spacing is tighter; dark lists/cards have clearer surfaces; Account/board/dialog rhythm stays quiet; only passive “Board opened” toasts use a subdued treatment while errors and assistive announcements remain intact. Equal-height columns and intentional board-lane scrolling remain.

## Verified results

- Final `npm run test:current`: **162 passed, 0 failed, 0 skipped**, exit 0. Breakdown: 41 unit/controller/local-data safety; 46 Firestore Rules; 24 packaged demo Auth/Firestore Emulator browser; 2 unconfigured cloud-first browser; 49 configured production-controller browser. Both build lanes and unconfigured production asset isolation exited 0 and are **not** counted as tests.
- Final `npm run validate`: **41/41 unit tests**, static/workflow checks, configured production build, source/gzip budgets and production isolation passed. Source manifest is **289,211 / 300,000 bytes** (10,789 bytes headroom), and the initial-shell gzip total is **26,238 / 26,250 bytes** on the local public-variable build, with no cap increase. PR CI must independently verify the Linux build.
- Focused browser regression: **6/6** passed after correcting fixture bootstrap timing and using the actual production bundle rather than a development-only source import.
- Independent built-preview matrix: **97/97 checks**, zero page errors, **16** Appearance theme/palette contrast states. Evidence: `artifacts/audit-implementation/integration/verify-ui.json` and screenshots.
- Synthetic loaded-board responsive matrix: **28/28 before and 28/28 after**, zero page errors in both, 14 screenshots per state at 320, 390, 960 (standard/short), 1280, 1440 and 1920, light/dark. Before images use an isolated git-archived source copy of the exact baseline SHA and the same synthetic fixture. Evidence: `artifacts/audit-implementation/integration/before/`, `board-matrix.json` and `board-*.png`.
- Isolated packaged demo Emulator browser rerun: **19 + 1 + 4** passed. The first aggregate attempt had a card-details worker timeout and fixture/reporting issues; they were investigated, and the final two complete aggregate runs passed. Do not reclassify a transient test failure as a product defect without reproduction.

## Explicit remaining acceptance boundaries

- Actual Google OAuth return, real institutional account policies, native Safari/Firefox/iOS, physical touch/trackpad and screen-reader output were **not** exercised with this local candidate.
- The legacy browser-smoke fixture remains runnable but does not model the current configured signed-out application as a green full-current-product suite. The supported current-feature suite and its remaining manual map are distinct.
- No production Auth/Firestore user, board, browser profile or storage was used. Synthetic raw sentinel strings were tested in disposable browser contexts; the real signed-in acceptance remains owner-gated.

## Preservation

`firestore.rules`, `firestore.indexes.json`, `src/confirmation-dialog-ui.js`, schema, IDs, ownership and protected maintenance were not edited. Their final blobs remain `296b595276122918f521d3f86ee6820a5cc876b7`, `79fc192e9b71eb3c18b7fd504b77fc9b07bcd18a`, and `ef38ad85682df387c4ac143fbbd762d344128cb1`, respectively. Test-generated changes to ten tracked historical screenshots were restored by explicit path; their originals and all pre-existing untracked plans/audit artifacts remain untouched. Owned local preview/Emulator ports were closed.
