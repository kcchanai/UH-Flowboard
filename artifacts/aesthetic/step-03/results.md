# Step 3 results: reusable visual token system

## Changed

- Added independent canvas tokens for foreground, softened foreground, control fill, control hover, border, focus, and scrollbar treatment in light and dark themes.
- Added an independent topbar foreground token so future pastel canvases do not change global navigation text unintentionally.
- Updated board-header title, search count, filter chips, quiet board actions, collaboration summary, board scrollbar, and add-list controls to consume canvas tokens.
- Preserved semantic accent, danger, success, warning, dialog, card, and list surface tokens separately.
- Added a browser regression that verifies canvas tokens drive board-header and add-list rendering in both light and dark modes.
- Parameterized the synthetic visual capture harness by preview URL, output directory, theme, and filename prefix without changing its default Step 1 behavior.

## Verification

- `npm.cmd run validate`: passed; 29 unit tests, static checks, production build, source budget, and isolation.
- `npm.cmd run test:rules`: passed; 23 Rules tests.
- `PLAYWRIGHT_EXECUTABLE_PATH='C:/Program Files (x86)/Google/Chrome/Application/chrome.exe' npm.cmd run test:emulator-browser`: passed; 1 Emulator browser test.
- Focused `canvas tokens` browser test: passed.
- Full built-preview browser smoke on strict port 4200: passed; **41 browser tests**.
- `git diff --check`: passed.

## Budget

- Reachable raw source: **216,755 / 225,000 bytes**.
- Headroom: **8,245 bytes**.
- Initial shell gzip: **23,796 / 25,000 bytes**.
- First-party lazy gzip: **44,265 / 55,000 bytes**.
- Warning threshold remains exceeded as a maintainability signal; no gzip budget is exceeded.

## Visual evidence

Using the identical ten-card synthetic fixture:

- `artifacts/aesthetic/step-03/desktop-1440x900.png`
- `artifacts/aesthetic/step-03/dark-desktop-1440x900.png`
- `artifacts/aesthetic/step-03/resized-960x720.png`
- Additional 1280px, 1920px, and 700px light/dark captures in the same directory.

Visual review found no visible Classic Flow regression. Light and dark board foregrounds, controls, lists, cards, metadata, and assignee initials remain coherent. The existing intentional board-lane overflow at 960px remains; it is not a new page overflow.

This step establishes tokens only. Palette-specific values, appearance selection, and contrast measurement are deferred to later steps.

## Safety

No production data, protected workspace, real account, Rules publication, Pages deployment, or remote push occurred. Raw command logs were removed after this sanitized report was written.
