# Flowboard product polish local release candidate

This directory is the Step 10 local release-candidate handoff for the Flowboard product-polish branch.

## Candidate identity

- Branch: `luna/product-polish`
- Candidate commit: `c7bc8eddddd5e5a0c1f3b738aa3da91fe259f1d6`
- Base `origin/main`: `bba3647131d1dac0c05f8e21893e11a82c3a0034`
- Local branch status at packaging: clean, ahead of `origin/main` by 10 commits
- Rules source: unchanged from base; Git blob SHA-1 `5d7e06e02bb679db2b1a31605cf81deb3f9a9e9a`

## Included product work

- Board shell with board-scoped search and visible navigation.
- Comfortable and Compact browser-local density preferences.
- Focus filters and board summary counts.
- Lazy Board/List view with shared projection, sorting, pagination, parity and focus-safe card opening.
- Lazy quick capture with explicit destination list and optional detail opening.
- Ctrl/Cmd+Enter capture submission with plain-Enter multiline behavior and IME protection.
- Guarded `/` shortcut for Board search.
- Card detail Cancel, unsaved-draft status and failed-save feedback.
- Existing local/cloud/read-only safeguards, UID-based identity, import/export boundaries and Rules behavior retained.

## Qualification summary

- Unit tests: **37/37**.
- Firestore Rules Emulator: **24/24**.
- Tracked Emulator-browser workflow: **1/1**.
- Final unconfigured browser smoke: **58/58**.
- Synthetic configured-cloud browser smoke: **58/58**.
- Lighthouse accessibility: **score 1; zero failed audits**.
- Production asset isolation: **28/28**.
- Final visual matrix: Board and dark mode at 1280x720, 1440x900, 1920x1080, 960x720, 390x844 and 320x720; List at 1440x900; card dialog at desktop widths; zero console/page errors.
- Large-board benchmark: 1,000 cards across three samples; render median 594.5 ms, navigation median 627 ms, filter median 64.4 ms.

## Measured budgets

- Raw source: **265,366 / 300,000 bytes**.
- Initial shell gzip: **25,942 / 26,000 bytes**.
- First-party lazy gzip: **55,798 / 58,000 bytes**.
- `index.html` source: **27,051 / 27,250 bytes**.
- Document gzip: **5,997 bytes**.

## Reproduce locally

From `C:/Code/Stacie-Hermes/UH-Trello`:

```text
npm.cmd run validate
npm.cmd run test:rules
PLAYWRIGHT_EXECUTABLE_PATH="C:/Program Files (x86)/Google/Chrome/Application/chrome.exe" npm.cmd run test:emulator-browser
npm.cmd run build
npm.cmd run measure:mvp-v2
```

Serve the built `dist/` at the repository base path `/UH-Flowboard/`, then run the browser smoke and Lighthouse checks documented in `artifacts/product-polish/step-09/results.md`.

## Stop boundary

This is a local-only release candidate. Do not push, create a pull request, merge, deploy Pages, publish Firestore Rules, or perform real-account testing without separate authorization. No protected workspace or disposable lifecycle fixture was used.

The detailed evidence is in `artifacts/product-polish/step-01/` through `artifacts/product-polish/step-09/`. `MANIFEST.json` contains the machine-readable candidate record.
