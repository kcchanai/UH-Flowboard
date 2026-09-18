# Step 3 of 10 results: first-level Account hub

## UX changes

- Renamed the board-list trigger from **My workspace** to **Boards**.
- Added a visible **Appearance** label to the toolbar trigger while preserving its accessible name and lazy dialog behavior.
- Mounted the existing workspace-scoped profile section once inside Account, removing the duplicate Members-dialog profile section.
- Added a current-workspace summary to Account. Local mode explains that a cloud workspace is required for workspace-scoped photo sharing; cloud mode shows workspace name, role, and sync state.
- Changed signed-in account heading to **Account** and signed-out heading to **Sign in**.
- Added an Account shortcut to Appearance and clarified the local-copy action label.
- Moved initial Account focus to the visible Close control instead of Sign out.
- Separated session propagation from ordinary Account, cloud-mode, and Appearance rerenders.
- Reused the safe person badge renderer for the toolbar account control and preserved the local initials-only preference.
- Fixed repeated successful photo renders so the renderer replaces existing image content instead of appending duplicates.

## Verification

- `npm.cmd test`: **31 passed, 0 failed**
- `npm.cmd run check`: passed; 11 semantic/runtime guards and adapter-boundary checks
- `npm.cmd run build`: passed; 47 modules transformed
- `npm.cmd run measure:mvp-v2`: passed
- `node scripts/validate-test-isolation.mjs`: passed; 25 production assets without Emulator-only markers
- Built browser suite: **49 passed, 0 failed**
- New Account-hub browser test: passed
- Browser text/DOM audit: toolbar exposes Flowboard, Boards, Appearance, and local status; Account context and profile sharing controls are reachable in one panel in a synthetic cloud fixture
- Visual audit: 1440px board, Appearance dialog, and 960px board captures reviewed; page width remained bounded at 960px and horizontal continuation stayed inside the intentional board lane
- Console/page errors in qualified browser routes: **0**
- Rules source: unchanged
- Local workspace storage: exact string equality asserted by the focused Account test

## Budget

- Reachable production source: **242,456 / 247,500 bytes**
- Headroom: **5,044 bytes**
- Warning threshold: **210,000 bytes**
- Initial shell gzip: **24,544 / 25,000**
- First-party lazy gzip: **50,851 / 55,000**
- Document gzip: **5,697**
- Vendor gzip: **139,736**
- Reachable sources: **27**
- Unbudgeted reachable sources: **0**

## Safety

No real account, protected workspace, cloud mutation, Rules publication, push, PR, deployment, or production acceptance was used. Synthetic browser fixtures used only non-sensitive test identities and workspace labels.
