# Step 1 of 10 baseline evidence

Status: **complete**

## Baseline identity

- Branch: `luna/visual-cleanup`
- Main baseline: `a9d2ff46add71aa246da468ff2e343cce47dd276`
- Rules blob: `5d7e06e02bb679db2b1a31605cf81deb3f9a9e9a`
- Pre-existing untracked plan/planning artifacts preserved.
- Pre-existing previews on ports 4173 and 4214 left untouched.
- Owned preview on port 4260 stopped after validation.

## Commands and results

- `npm.cmd run validate` - passed. Unit tests **37/37**; static/syntax/runtime guards passed; production build passed with 52 modules transformed; source/budget validation passed; production isolation **28/28**.
- `npm.cmd run test:rules` - passed. Firestore Rules Emulator **24/24**. Expected denied probes emitted redacted Emulator diagnostics; process exit code 0.
- `PLAYWRIGHT_EXECUTABLE_PATH='C:/Program Files (x86)/Google/Chrome/Application/chrome.exe' npm.cmd run test:emulator-browser` - passed. Tracked Emulator-browser workflow **1/1**.
- Built preview on owned strict port 4260 - served the `/UH-Flowboard/` base path successfully.
- `PLAYWRIGHT_BASE_URL='http://127.0.0.1:4260' PLAYWRIGHT_EXECUTABLE_PATH='C:/Program Files (x86)/Google/Chrome/Application/chrome.exe' npx.cmd --no-install playwright test tests/browser-smoke.spec.mjs` - passed **58/58**.
- `npx.cmd --no-install lighthouse http://127.0.0.1:4260/UH-Flowboard/ ... --output-path=lighthouse-report.json` followed by `node scripts/assert-lighthouse.mjs` - passed. Lighthouse accessibility **score 1 with zero failed audits**. Lighthouse 12.8.2 was installed only in the repository with explicit approval, then removed; no production dependency or package manifest change remains.

## Visual reproduction source

Planning audits already captured the four supplied examples and a wider live/synthetic matrix under `artifacts/visual-cleanup-planning/`. The synthetic audit used production markup/controllers with isolated fake adapters and intercepted network only. It reproduced:

- Cloud chooser: two desktop workspace-name elements at zero width and overflowing row containers.
- Members panel: overflowing containers at desktop and narrow widths.
- Account spacing and toolbar centerline defects from measured DOM geometry.
- Live anonymous board/List/card/Account/Appearance/quick-add/dark surfaces with zero console/page errors in the final planning audit.

## Boundary

- No application source code was changed in Step 1.
- No production sign-in, cloud workspace access, Rules publication, push, PR, merge, Pages deployment, or real-account testing occurred.
- The Step 1 baseline is complete and Step 2 may begin.
