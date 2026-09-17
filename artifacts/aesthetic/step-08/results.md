# Step 8 results: UID-backed assignee identity integration

## Changed

- Added `data-assignee-uids` to cloud-capable card assignee stacks while preserving local free-text assignees.
- Added lazy `src/cloud-roster-ui.js` for configured cloud mode only.
- The roster controller:
  - Fetches one active-workspace member roster.
  - Maps stable assignment UIDs to member display names, emails, photos, and former-member fallbacks.
  - Reuses the shared person-badge renderer.
  - Shows at most three badges plus `+N` overflow.
  - Updates after cloud workspace selection, preview changes, appearance changes, and DOM card rerenders.
  - Uses one observer and one roster fetch path rather than per-card listeners.
  - Clears roster data outside cloud mode.
- Assignment UIDs remain authoritative. Local free-text assignment remains unchanged.
- Viewer/read-only boundaries remain unchanged; this step adds presentation only.

## Verification

- `npm.cmd run validate`: passed; 31 unit tests, static checks, build, source budget, and isolation.
- `npm.cmd run test:rules`: passed; 24 Rules tests.
- `PLAYWRIGHT_EXECUTABLE_PATH='C:/Program Files (x86)/Google/Chrome/Application/chrome.exe' npm.cmd run test:emulator-browser`: passed; 1 Emulator browser test.
- Focused cloud-roster browser test: passed; four UIDs rendered three badges, `+1`, and a full accessible assignment summary.
- Full built-preview browser smoke on strict port 4209: **48 passed**.

## Budget

- Reachable raw source: **239,382 / 240,000 bytes**.
- Headroom: **618 bytes**.
- Initial shell and lazy gzip budgets remained under their unchanged limits in the Step 8 validation build.
- Reachable production assets: 27; unbudgeted reachable files: 0.

## Safety and scope limit

No production data, protected workspace, real account, Rules publication, Pages deployment, or remote push occurred. Shared roster behavior remains Emulator/UI-contract qualified only. The raw-source margin is now nearly exhausted; Step 9 must be qualification and evidence work, not additional production feature growth, unless a new measured budget decision is made.
