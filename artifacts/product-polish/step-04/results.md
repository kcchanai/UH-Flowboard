# Step 4 of 10 results: card/lane hierarchy, density and navigation

## Delivered

- Fresh starter cards now use meaningful label names such as Research, Social proof, Copy, Design and UX. Existing user labels are not migrated or rewritten.
- Added browser-local Comfortable/Compact density through the isolated `flowboard-ui-preferences` record. Compact reduces card/list whitespace without reducing essential focus or touch targets.
- Kept density mutation in a lazy first-party chunk so the initial shell remains within its measured gzip envelope.
- Added an explicit `Add a list` Board-actions menu item. It uses the existing list creation command and focus path, so Add list is reachable without horizontally scrolling to the trailing board edge.
- Preserved full-lane drag/drop behavior, filtered-card move restrictions, card metadata and existing cloud/local guards.

## Qualification

- Unit suite: **37/37 passed**.
- Built browser smoke: **55/55 passed** on strict port 4243.
- Lighthouse accessibility: **score 1; zero failed audits**.
- Production asset isolation: **26/26 passed**, including the density lazy chunk.
- Static/syntax/build/check/measure gates passed after the implementation.
- Density browser proof: toggles Comfortable to Compact and back, stores only `flowboard-ui-preferences`, and preserves the exact `flowboard-workspace` string.
- Add-list browser proof: Board-actions Add a list increases list count through the existing mutation path.
- Existing drag/drop, keyboard movement, photo fallback, read-only, dialog, palette, touch, forced-color, reduced-motion and responsive tests remained green.

## Measurements

- Reachable raw source: **251,102 / 300,000 bytes**; **48,898** headroom.
- Initial shell gzip: **25,145 / 25,500 bytes**; **355** headroom.
- First-party lazy gzip: **51,904 / 55,000 bytes**; **3,096** headroom.
- Document gzip: **5,849 bytes**.
- Step 3 to Step 4 raw delta: +2,306 bytes.
- Step 3 to Step 4 initial shell gzip delta: +264 bytes.
- Step 3 to Step 4 lazy gzip delta: +475 bytes, from the new density lazy chunk and existing lazy graph.
- Rules source remains unchanged at SHA-1 `5d7e06e02bb679db2b1a31605cf81deb3f9a9e9a`.

## Budget transition

The measured Step 4 shell reached 25,145 bytes, 145 over the prior 25,000-byte cap. Aaron's implementation instruction pre-approved budget increases. The validator therefore adopts a narrow **25,500-byte initial-shell gzip cap**, retaining the 55,000-byte lazy cap. The exact measured delta and rationale are recorded here; no safety/accessibility copy was shortened and no raw source cap increase was made.

## Safety and cleanup

- No Firestore Rules, cloud schema, workspace payload, identity data or production configuration changed.
- No push, PR, merge, deployment, Rules publication or real-account testing.
- Owned preview on port 4243 was stopped. Pre-existing services on ports 4173 and 4214 were untouched.
- Generated Lighthouse/report/test residue was removed and unrelated validation screenshots were restored.
