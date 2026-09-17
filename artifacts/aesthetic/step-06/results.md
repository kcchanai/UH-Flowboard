# Step 6 results: resilient person badges and own-account photos

## Changed

- Added `src/person-badges.js` with reusable initials, safe-photo URL validation, and DOM badge rendering.
- Allowed only HTTPS photos from `lh3.googleusercontent.com`; rejected HTTP, arbitrary hosts, data URLs, credentials, and lookalike domains.
- Added stable display-name/email fallback initials.
- Added broken-image fallback from photo to initials without retry loops.
- Applied `referrerPolicy="no-referrer"`, async decoding, and lazy image loading.
- Reused the badge renderer in the Firebase account profile using the current authenticated session's `photoURL`.
- Connected the browser-local appearance preference so `Use initials` creates no image element or photo request.
- Preserved decorative account-profile semantics while retaining accessible person labels for non-decorative future badges.
- Added pure unit tests and production lazy-auth browser coverage.
- Added a synthetic broken-image DOM error assertion that verifies fallback behavior.
- No shared member photo fields, team photo publication, additional OAuth scopes, cloud writes, or real photo requests were introduced.

## Verification

- `npm.cmd run validate`: passed; **31 unit tests**, static checks, production build, source budget, and isolation.
- `npm.cmd run test:rules`: passed; 23 Rules tests.
- `PLAYWRIGHT_EXECUTABLE_PATH='C:/Program Files (x86)/Google/Chrome/Application/chrome.exe' npm.cmd run test:emulator-browser`: passed; 1 Emulator browser test.
- Focused person-badge browser test: passed.
- Exact final built-preview browser suite on strict port 4207: **46 passed**.
- Browser assertions covered:
  - Approved and rejected photo URL classification.
  - Stable initials generation.
  - Initials-only mode with no image element.
  - Broken image error fallback to initials.
- No real Google account or production photo URL was used.

## Budget

- Reachable raw source: **233,548 / 240,000 bytes**.
- Headroom: **6,452 bytes**.
- Initial shell gzip: **24,374 / 25,000 bytes**.
- First-party lazy gzip: **48,556 / 55,000 bytes**.
- Document gzip: **5,486 bytes**, reported separately.
- Vendor gzip: **139,736 bytes**, reported separately.
- Reachable production assets: 26; unbudgeted reachable files: 0.

## Safety

No production data, protected workspace, real account, Rules publication, Pages deployment, or remote push occurred. Raw test logs were removed after this sanitized report was written.
