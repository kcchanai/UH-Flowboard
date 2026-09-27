# Flowboard visual and UX implementation

Status: implemented and validated on local branch `feat/flowboard-visual-ux-polish`. Not pushed, merged, published, or tested with production credentials/data. Separate approval is required for a PR or live deployment.

## The seven approved changes

1. Board toolbar: title and Add card lead; Board/List and Archived cards remain together; search and quick filters occupy a second band; the card count is quieter. The sole Boards entry and lower New board form remain.
2. Columns: sparse lists wrap their content instead of stretching to the bottom, retaining a minimum drop area and scrolling for dense lists. A small rightward cue appears only while more board content remains offscreen, then hides at the end.
3. Cards: title precedes labels and supporting metadata. Due state, checklist, description, and completion retain their real data and text meaning.
4. List view: at narrow widths the semantic six-column table displays stacked, labeled task records with a wide card-open target and visible Task/Due sort controls. Desktop retains sortable column headers, pagination, and filtering.
5. Your boards: routine synchronized-status copy is cleared after successful loading; status errors and actionable notices remain. Active and archived row actions are grouped with their board identity, including when More expands or names wrap.
6. Themes: the existing light/dark palette is retained, dark list/card surface separation is strengthened, and redundant dark token declarations were removed. No new production dependency or budget increase was introduced.
7. Dialogs and entry: empty Card Details sections are tighter; the cloud People field is visually quieter without hiding loading or failure text; Appearance Reset announces that defaults are only a preview until Save; gated heading and status card are aligned. Visible close controls and browser-only-data disclosures remain.

## Evidence

- `npm run validate` passed: 41/41 Node tests, syntax/static/performance/workflow gates, build, budget, and production-asset isolation.
- `npm run test:current` passed on the final production code: 168/168 total (41 synthetic controller/data-safety, 46 Firestore Rules, 24 Auth/Firestore Emulator browser, 2 unconfigured browser, 55 configured synthetic production-controller browser). The latest run passed. An earlier run exposed a stale status assertion, which was updated. Another run had a one-off timeout while opening a card after deletion in the lifecycle Emulator suite; a fresh packaged Emulator replay and the latest aggregate run passed without changing product behavior. This transient remains worth watching in CI.
- Focused responsive/board-row/visual browser matrix: 13/13 passed. A follow-up drag-target check passed in the visual spec. Viewports include 320, 390, 960, 1280, 1440 and 1920 pixels, short-height, dark theme and forced-color cases across the suites.
- Production source: 293,307 / 300,000 bytes. Initial-shell gzip: 26,170 / 26,250 bytes in the unconfigured build and 26,216 / 26,250 in the configured synthetic build. First-party lazy gzip: 58,128 / 60,000 bytes. The existing 210,000-byte source maintainability warning still applies; the hard caps pass.
- `firestore.rules` and `firestore.indexes.json` remain byte-identical to HEAD. `src/confirmation-dialog-ui.js` remains byte-identical, 3,978 LF-only bytes.
- Live authenticated production actions, real accounts/boards, and native Safari/iOS are intentionally unverified. Visual screenshots in this directory use fresh synthetic fixtures or the signed-out local build.

## Release boundary

No Rules/index/schema/authorization changes or production writes. Do not treat these local checks as publication authorization. For live release, request an explicit go-ahead, then use PR validation on the exact merged main SHA before gated Pages deployment and a fresh signed-out smoke check.
