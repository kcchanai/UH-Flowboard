# Step 1 of 10 results: baseline pinned and qualified

## Checkpoint

- Branch: `luna/product-polish`
- Starting `origin/main` and local HEAD: `bba3647131d1dac0c05f8e21893e11a82c3a0034`
- Firestore Rules SHA-1: `fc008e6a08becc87dd4079a9c2b977731e5d7256`
- Production: unchanged. No push, PR, merge, deployment, Rules publication or real-account testing.
- Protected workspace and disposable lifecycle fixture: untouched.

## Baseline qualification

| Gate | Result |
|---|---:|
| `npm.cmd run validate` unit tests | 31/31 passed |
| Static/syntax/runtime guards | passed, 11 semantic/runtime guards plus adapter-boundary checks |
| Production build | passed, 47 modules transformed |
| Reachable source budget | 245,459 / 247,500 bytes; 2,041 headroom |
| Initial shell gzip | 24,719 / 25,000 bytes |
| First-party lazy gzip | 51,429 / 55,000 bytes |
| Document gzip | 5,817 bytes |
| Production asset isolation | 25/25 assets passed |
| Firestore Rules Emulator | 24/24 passed |
| Tracked Emulator-browser workflow | 1/1 passed |
| Built browser smoke | 54/54 passed |
| Lighthouse accessibility | score 1; zero failed audits |

The source maintainability warning is expected at 245,459 bytes over the 210,000 warning threshold. It is below the current hard cap.

## Performance baseline

Reference: 1440x900, system Chrome, synthetic local workspace, 20 lists x 50 cards = 1,000 cards, three runs, zero console/page errors.

- Initial board render: samples 587.7 / 552.4 / 563.3 ms; median 563.3 ms; maximum 587.7 ms.
- Browser navigation to usable: samples 605 / 575 / 583 ms; median 583 ms; maximum 605 ms.
- Single-term filter: samples 58.5 / 52.2 / 59.6 ms; median 58.5 ms; maximum 59.6 ms.
- After filtering: 1 visible card; document width 1,440px; board scroll width 7,754px.
- JSON samples: `benchmark-1.json`, `benchmark-2.json`, `benchmark-3.json`.

## Visual matrix

Fresh isolated Playwright contexts, anonymous local starter board, no persistent normal browser profile:

- Board screenshots: 1280x720, 1440x900, 1920x1080, 960x720, 390x844, 320x720.
- Card-dialog screenshots: 1280x720, 1440x900, 1920x1080, 960x720.
- All six viewport runs: document width stayed equal to the viewport width and captured zero console/page errors.
- Baseline dialog at 960x720 kept Close, all visible fields, and footer actions reachable.
- Visual findings recorded: generous toolbar height, semantic-poor starter label names such as color labels, modestly oversized simple cards, partial right-edge add-list visibility, and dark-mode card/lane surface separation as polish targets. These are baseline observations, not failures.

## Reproduction

```text
npm.cmd run validate
npm.cmd run test:rules
PLAYWRIGHT_EXECUTABLE_PATH='C:/Program Files (x86)/Google/Chrome/Application/chrome.exe' npm.cmd run test:emulator-browser
npm.cmd run preview -- --host 127.0.0.1 --port 4240 --strictPort
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4240/UH-Flowboard PLAYWRIGHT_EXECUTABLE_PATH='C:/Program Files (x86)/Google/Chrome/Application/chrome.exe' npx.cmd playwright test tests/browser-smoke.spec.mjs --reporter=line
CHROME_PATH='C:/Program Files (x86)/Google/Chrome/Application/chrome.exe' npx.cmd --yes lighthouse@12.8.2 http://127.0.0.1:4240/UH-Flowboard/ --only-categories=accessibility --chrome-flags='--headless --no-sandbox' --output=json --output-path=lighthouse-report.json && node scripts/assert-lighthouse.mjs
MVP_BENCHMARK_URL='http://127.0.0.1:4240/UH-Flowboard/' MVP_BENCHMARK_LISTS=20 MVP_BENCHMARK_CARDS_PER_LIST=50 PLAYWRIGHT_EXECUTABLE_PATH='C:/Program Files (x86)/Google/Chrome/Application/chrome.exe' node scripts/benchmark-mvp-v2.cjs
```

The preview used port 4240 and was stopped. Pre-existing incumbents on ports 4173 and 4214 were not touched. Generated reports, emulator logs and test results were removed.
