# Step 1 results: baseline and acceptance contract

## Pinned state

- Branch: `luna/aesthetic-personalization`
- Baseline SHA: `7bc5ff5230ebe1d36c2ca5debd11703e596979f4`
- Baseline `origin/main`: `7bc5ff5230ebe1d36c2ca5debd11703e596979f4`
- Source changes during baseline capture: none.
- Firestore Rules SHA-256: `6e736958316b451a207cb0954d0f6ca39aedf007cd63130c1b3f4d3485f2ada8`

## Validation results

- `npm.cmd run validate`: passed.
  - Unit tests: 29 passed.
  - Static/runtime checks: passed, including 11 semantic/runtime guards and adapter-boundary checks.
  - Production build: passed.
  - Source budget: 216,498 / 217,500 bytes; 1,002 bytes headroom; 23 reachable production source files; warning threshold 210,000 remains exceeded.
  - Built-asset isolation: 21 production assets passed the Emulator-marker guard.
- `npm.cmd run test:rules`: passed; 23 Rules tests.
- `PLAYWRIGHT_EXECUTABLE_PATH='C:/Program Files (x86)/Google/Chrome/Application/chrome.exe' npm.cmd run test:emulator-browser`: passed; 1 Emulator browser test.
- Built-preview Playwright smoke on `http://127.0.0.1:4197/UH-Flowboard/`: passed; 40 browser tests.
- The first Emulator-browser invocation without the explicit installed-browser path failed in the environment; the unchanged packaged workflow passed with the existing Chrome path. No source, Rules, or runner changes were made for that environmental prerequisite.

## Visual baseline

The synthetic fixture contains four lists and ten cards with long titles, labels, due dates, checklist progress, descriptions, completed cards, and multiple local assignee names. It was injected only into isolated browser contexts.

- 1280x720: 10 cards; 0 page errors; 0 console errors; document width 1280.
- 1440x900: 10 cards; 0 page errors; 0 console errors; document width 1440.
- 1920x1080: 10 cards; 0 page errors; 0 console errors; document width 1920.
- 960x720: 10 cards; 0 page errors; 0 console errors; document width 960.
- 700x720 proportional compatibility: 10 cards; 0 page errors; 0 console errors; document width 700.

Screenshots and the reproducible synthetic capture script are under this directory. The 1440px review shows a blue-dominant canvas, white cards over pale columns, strong text weights, small initials badges, and broad unused lower canvas. The 960px review shows intentional board overflow with partial columns in the captured viewport; no mobile redesign is in scope.

## Safety boundary

No protected workspace, disposable lifecycle fixture, real account, credential, production Firestore data, Rules publication, Pages deployment, or remote push was used. Raw test logs were removed after this summary; only sanitized results, synthetic screenshots, and the reproducible capture script are retained.
