# Step 2 of 10 results: budget envelope and shared view foundation

## Scope and authorization

Aaron explicitly pre-approved increasing any budget limits in the implementation instruction. The raw source hard cap was therefore raised from 247,500 to **300,000 bytes** in `scripts/source-budget.mjs`. The 210,000-byte maintainability warning remains unchanged. Initial-shell and first-party-lazy gzip caps remain unchanged.

No Firestore Rules, cloud schema, production config, real account, protected workspace or production deployment was touched.

## Measured transition

| Measurement | Baseline | Step 2 | Delta | Limit |
|---|---:|---:|---:|---:|
| Reachable source manifest | 245,459 | 248,755 | +3,296 | 300,000 |
| Raw headroom | 2,041 | 51,245 | +49,204 | hard cap |
| Initial shell gzip | 24,719 | 24,882 | +163 | 25,000 |
| Initial shell gzip headroom | 281 | 118 | -163 | unchanged |
| First-party lazy gzip | 51,429 | 51,429 | 0 | 55,000 |
| Document gzip | 5,817 | 5,816 | -1 | separately measured |

The new source manifest has 29 files, with 28 reachable in the current production graph. `src/board-view-model.js` is explicitly budgeted and syntax-checked as the shared projection foundation; it becomes reachable when Board/List integration is wired in Steps 5/6. No reachable file is unbudgeted.

The initial shell is now within 118 gzip bytes of its unchanged cap. Future shell additions must be lazy-loaded or funded by measured consolidation; no shell-limit increase was made in Step 2.

## Delivered foundation

- `src/board-view-model.js`
  - Pure active-board projection.
  - Excludes archived lists/cards.
  - Produces stable row metadata and summary counts.
  - Handles search/filter projection through injected existing `cardMatches` and `dueState` functions.
  - Resolves `member:'me'` only through an explicit current UID.
  - Provides stable title/due presentation sorting without mutating board data.
- `src/ui-preferences.js`
  - Version 1 allowlist for `density: comfortable|compact` and `view: board|list`.
  - Invalid versions/values and unknown fields normalize safely.
- `LocalWorkspaceAdapter`
  - Adds `loadUiPreferences()` and `saveUiPreferences()` under `flowboard-ui-preferences`.
  - UI preference writes are separate from workspace and legacy storage.
  - Storage failures return `{ok:false}` and do not claim persistence.
- Test registration and static guards cover both new modules.

## Qualification

- Unit suite: **37/37 passed**. This includes 3 UI-preference tests and 3 view-projection/sorting tests.
- Static/syntax/runtime guards: passed; 11 semantic/runtime guards plus adapter-boundary checks.
- Production build: passed, 48 modules transformed.
- Built browser smoke: **54/54 passed** on strict port 4241.
- Firestore Rules Emulator: **24/24 passed**.
- Tracked Emulator-browser workflow: **1/1 passed**.
- Production asset isolation: **25/25 passed**.
- `git diff --check`: passed after generated validation residue cleanup.
- Rules identity remains the Step 1 SHA-1 `fc008e6a08becc87dd4079a9c2b977731e5d7256`.

## Reproduction commands

```text
npm.cmd test
npm.cmd run check
npm.cmd run build
npm.cmd run measure:mvp-v2
npm.cmd run test:rules
PLAYWRIGHT_EXECUTABLE_PATH='C:/Program Files (x86)/Google/Chrome/Application/chrome.exe' npm.cmd run test:emulator-browser
npm.cmd run preview -- --host 127.0.0.1 --port 4241 --strictPort
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4241/UH-Flowboard PLAYWRIGHT_EXECUTABLE_PATH='C:/Program Files (x86)/Google/Chrome/Application/chrome.exe' npx.cmd playwright test tests/browser-smoke.spec.mjs --reporter=line
node scripts/validate-test-isolation.mjs
```

The owned preview on port 4241 and Emulator processes were stopped. Pre-existing services on ports 4173 and 4214 were not touched. Generated test results, Emulator logs, reports and unrelated screenshots were removed or restored.
