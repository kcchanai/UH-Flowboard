# Step 5 results: personal appearance selection and persistence

## Changed

- Added a versioned browser-local appearance record under `flowboard-appearance` through `LocalWorkspaceAdapter`.
- Kept appearance separate from `flowboard-workspace` and `flowboard-data`.
- Added lazy `src/appearance-ui.js`: the dialog markup, palette swatches, CSS, and behavior load only when the Appearance control is opened.
- Kept the initial document under its existing per-file limit by moving the dialog markup into the lazy module.
- Added Light, Dark, System, eight canvas choices, Gradient/Solid finish, and Show photos/Use initials radios.
- Added an explicit scope notice: `Appearance applies to this browser. It does not change shared boards.`
- Added draft preview, Save, Cancel, visible Close, Escape cancellation, Reset to defaults, focus return, and actionable save-failure handling.
- Added boot-time allowlisted preference normalization so saved appearance applies after reload without loading the dialog module.
- Preserved legacy `state.preferences.theme` as the fallback when no valid appearance record exists.
- Preserved system color-scheme changes while retaining the selected canvas and finish.
- Set `data-appearancePhotos` for the Step 6 avatar renderer; no profile photos are fetched or published yet.
- Added syntax and source-budget coverage for the new lazy module.

## Verification

- `npm.cmd run validate`: passed; 29 unit tests, static checks, production build, budget, and isolation.
- `npm.cmd run test:rules`: passed; 23 Rules tests.
- `PLAYWRIGHT_EXECUTABLE_PATH='C:/Program Files (x86)/Google/Chrome/Application/chrome.exe' npm.cmd run test:emulator-browser`: passed; 1 Emulator browser test.
- Focused appearance browser tests: passed; lazy dialog, draft cancel, independent save/reload persistence, and save failure.
- Full built-preview browser smoke on the final strict-port build: passed; **45 browser tests**.
- Exact serialized `flowboard-workspace` equality remained unchanged across preview, save, reload, and failure tests. Raw local-storage payloads were not printed.
- Appearance dialog captures:
  - `artifacts/aesthetic/step-05/appearance-dialog.png`
  - `artifacts/aesthetic/step-05/appearance-preview-warm-sand-dark.png`
- Visual review after grid correction confirmed all eight names/descriptions fit without clipping and footer actions remain reachable.

## Budget

- Reachable raw source: **231,102 / 240,000 bytes**.
- Headroom: **8,898 bytes**.
- Initial shell gzip: **24,318 / 25,000 bytes**.
- First-party lazy gzip: **48,031 / 55,000 bytes**.
- Document gzip: **5,478 bytes**, reported separately.
- Vendor gzip: **139,736 bytes**, reported separately.
- Reachable production assets: 25; unbudgeted reachable files: 0.

## Safety

No production data, protected workspace, real account, Rules publication, Pages deployment, or remote push occurred. No Google photo request or cloud write was made by this step. Raw runner logs were removed after this sanitized report was written.
