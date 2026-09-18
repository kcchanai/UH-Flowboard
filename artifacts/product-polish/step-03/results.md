# Step 3 of 10 results: visual system and application shell

## Delivered

- Moved the existing search control from global navigation into the board header.
- Renamed its visible and accessible scope to `Search this board`.
- Kept the existing `#search` input and app listener, so search behavior and local/cloud data boundaries did not fork.
- Kept global navigation focused on Boards, Appearance, Workspace state and Account.
- Restyled the board search for neutral content surfaces, shared focus tokens and light/dark readability.
- Preserved Appearance's lazy dialog, preview/Save/Cancel/reset behavior, saved palette IDs, canvas finishes and opener focus restoration.
- Kept the board menu and workspace state discoverable; no new shell dependency or asset was added.
- Added browser regression assertions that search is inside `.board-header` and absent from `.topbar`.

The partial right-edge board element remains an intentional horizontal-board issue for Step 4, not a Step 3 shell defect.

## Qualification

- Unit/static/build checks: passed before browser qualification.
- Built browser smoke: **54/54 passed** on strict port 4242.
- Lighthouse accessibility: **score 1; zero failed audits**.
- Production asset isolation: **25/25 passed**.
- Browser console/page errors during the Step 3 shell capture: **0/0** at 1440x900 and 390x844.
- Page width equaled viewport width at both captured sizes: 1440 and 390.
- New structure assertions passed at 1280, 1440, 1920 and 960 widths.
- Existing 390px touch, forced-colors, reduced-motion, palette, focus, dialog and raw-storage regression tests remained green.

## Visual evidence

- `shell-1440x900.png`: board search and Filters read as one board-scoped toolbar; global bar is quieter; card/lane hierarchy remains readable.
- `shell-390x844.png`: mobile header and board controls remain reachable; page overflow remains bounded to the board canvas.
- `capture-shell.cjs`: fresh isolated Playwright contexts with console/page-error listeners.

## Measurements

- Reachable raw source: **248,796 / 300,000 bytes**; **51,204** headroom.
- Initial shell gzip: **24,881 / 25,000 bytes**; **119** headroom.
- First-party lazy gzip: **51,429 / 55,000 bytes**.
- Document gzip: **5,803 bytes**.
- Step 2 to Step 3 raw delta: +41 bytes; shell gzip delta: -1 byte; lazy gzip unchanged.
- Firestore Rules remain unchanged at SHA-1 `5d7e06e02bb679db2b1a31605cf81deb3f9a9e9a`.

## Safety and cleanup

- No workspace payload, identity data, Firebase Rules, cloud schema or production configuration changed.
- No push, PR, merge, deployment, Rules publication or real-account testing.
- Owned preview on port 4242 was stopped. Pre-existing services on ports 4173 and 4214 were untouched.
- Generated Lighthouse/report/test residue was removed and unrelated validation screenshots were restored.
