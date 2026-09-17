# Step 2 results: authorized source-budget transition

## Authorization and budget

- Aaron explicitly authorized raising the raw-source cap after Step 2 was blocked.
- New raw-source cap: **225,000 bytes**.
- Warning threshold remains **210,000 bytes**.
- Initial shell gzip cap remains **25,000 bytes**.
- First-party lazy gzip cap remains **55,000 bytes**.
- Document gzip remains reported separately.
- No per-file limit or safety/accessibility/public-copy rule was weakened.

## Measured result

- Current reachable production source: **216,127 / 225,000 bytes**.
- Current raw headroom: **8,873 bytes**.
- Reachable production graph: 23 files; unbudgeted reachable files: 0.
- Initial shell gzip: **23,767 / 25,000 bytes**.
- First-party lazy gzip: **44,248 / 55,000 bytes**.
- The maintainability warning remains intentionally exceeded; this is separate from transfer-size budgets.

## Safe recovery retained

- Firebase adapter fixed-export dispatch consolidation: 308 bytes saved while preserving the `REMOTE_METHODS` contract and static method parser.
- Redundant narrow-width CSS declarations: 63 bytes saved while retaining the distinct narrow search-wrap padding.
- Combined measured recovery from the Step 1 working tree: 371 bytes.

## Verification after cap transition

- `npm.cmd run validate`: passed; 29 unit tests, static checks, production build, budget, and isolation.
- `npm.cmd run test:rules`: passed; 23 Rules tests.
- `PLAYWRIGHT_EXECUTABLE_PATH='C:/Program Files (x86)/Google/Chrome/Application/chrome.exe' npm.cmd run test:emulator-browser`: passed; 1 Emulator browser test.
- Built-preview Playwright smoke at `http://127.0.0.1:4199/UH-Flowboard/`: passed; 40 browser tests.
- `git diff --check`: passed.

## Safety

No production data, protected workspace, real account, Rules publication, Pages deployment, or remote push occurred. The cap transition is a source-maintainability policy change only; the gzip limits and production safety boundaries are unchanged.
