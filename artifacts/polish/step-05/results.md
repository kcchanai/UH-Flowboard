# Step 5 results: desktop workspace layout and navigation

## Changes

- Closed the board-header section before the board lane so the DOM now has a semantic header sibling and board sibling under the main workspace.
- Added a desktop-office browser qualification across 1280, 1440, 1920, and resized 960 CSS-pixel widths.
- The qualification asserts bounded page width, intentional board-lane overflow where needed, reachable search and Board actions controls, usable list geometry, and no board nesting inside the header.
- Retained narrow-width regression coverage without introducing a phone-specific layout system.

## Visual review

- At 1440px, four complete lists scan side by side with consistent gutters, menus, cards, and Add a card controls.
- At 960px, the board remains a desktop horizontal canvas; header, search, Filters, Board actions, status, and Start here remain reachable.
- The partial next list at the right edge is intentional board continuation, not a wrapped or collapsed layout.
- The lower background band and horizontal-scroll affordance remain visual-system follow-ups for Step 6.

## Verification

- `npm.cmd run validate`: exit 0. Unit tests: 29 passed, 0 failed, 0 skipped.
- `npm.cmd run test:rules`: exit 0. Rules tests: 23 passed, 0 failed, 0 skipped.
- Built-preview browser suite: 38 passed, 0 failed, 0 skipped.
- Emulator browser workflow: 1 passed, 0 failed.
- Curated screenshots: `desktop-1440x900.png` and `resized-960x720.png`.

## Final budget

- Reachable source: 215,728 / 217,500 bytes.
- Headroom: 1,772 bytes.
- Maintainability warning threshold: 210,000 bytes, still a warning by design.
- Initial-shell gzip: 23,694 / 25,000.
- First-party-lazy gzip: 44,248 / 55,000.
- Document gzip: 5,437, reported separately.
- Reachable sources: 23; production asset isolation passed.

## Boundaries

- Firestore Rules source and production cloud data unchanged.
- No protected workspace, real account, merge, push, or deployment touched.
- Raw runner logs and generated emulator debug output were removed after extracting sanitized results.
