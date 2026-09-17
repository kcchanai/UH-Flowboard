# Step 4 results: curated canvas library

## Changed

- Added `src/canvas-palettes.js` with eight immutable, allowlisted presets:
  `classic-flow`, `ocean-slate`, `lagoon`, `sage-studio`, `warm-sand`, `lavender-mist`, `dusk-plum`, and `graphite`.
- Each preset has light and dark gradient endpoints, a solid finish, a display name, and a short note.
- Added `getCanvasPalette` fallback behavior for unknown identifiers.
- Added `applyCanvasPalette` to set only allowlisted canvas variables, finish, mode, and dataset state. Arbitrary CSS values are not accepted.
- Added solid-mode background handling that removes the gradient while preserving document-level canvas continuity.
- Exposed the frozen palette catalog and setter through the existing runtime bootstrap for Step 5 appearance controls.
- Classic Flow remains the default for existing users. User selection and persistence remain Step 5 scope.
- Added the palette module to the reachable source-budget manifest and updated the static runtime guard for the safe runtime shape.
- Extended the synthetic capture harness to select a palette and viewport without changing its default Step 1 behavior.

## Palette values

The current source values are recorded in `artifacts/aesthetic-planning/palettes.json` and the production module. Actual-app light gradient captures are in `artifacts/aesthetic/step-04/`, with a side-by-side sheet at `palette-comparison.png`.

The actual-app sheet uses the same ten-card fixture at 1440px for all eight presets. It is explicitly marked synthetic and not yet user-selectable. Visual review found the core hierarchy intact. Sage Studio, Warm Sand, Lavender Mist, Graphite, and Ocean Slate are flagged for extra contrast/state testing in Step 9; this is not a measured WCAG result.

## Verification

- `npm.cmd run validate`: passed; 29 unit tests, static checks, production build, source budget, and isolation.
- `npm.cmd run test:rules`: passed; 23 Rules tests.
- `PLAYWRIGHT_EXECUTABLE_PATH='C:/Program Files (x86)/Google/Chrome/Application/chrome.exe' npm.cmd run test:emulator-browser`: passed; 1 Emulator browser test.
- Focused curated-palette browser test: passed for all eight presets, gradient and solid finishes, light and dark modes.
- Full built-preview browser smoke on strict port 4201: passed; **42 browser tests**.
- Eight actual-app 1440px light-gradient captures: all completed successfully with zero page/console errors per capture.
- `git diff --check`: passed.

## Budget

- Reachable raw source: **220,409 / 225,000 bytes**.
- Headroom: **4,591 bytes**.
- Initial shell gzip: **24,928 / 25,000 bytes**.
- First-party lazy gzip: **44,265 / 55,000 bytes**.
- The initial-shell gzip margin is 72 bytes; later steps must remeasure and must not exceed the unchanged gzip cap.

## Safety

No production data, protected workspace, real account, Rules publication, Pages deployment, or remote push occurred. Raw palette-capture command logs were removed after this sanitized report was written.
