# Step 6 of 10 results: navigation and Appearance discovery

## UX changes

- Renamed the board-list control to **Boards**.
- Turned the current cloud/local status into a clearly labeled **Workspace** entry point: the status button opens the existing Cloud workspaces chooser when a session is available.
- Kept the status button disabled and honestly labeled when cloud workspaces are unavailable.
- Preserved active workspace name, role, and sync state in the status text and Account context.
- Renamed the chooser heading to **Cloud workspaces** instead of Cloud workspace previews, matching its ability to open editable owner/editor workspaces as well as read-only previews.
- Preserved existing archived retained-data, migration, export, return-local, and lifecycle actions.
- Kept **Appearance** visible in the top toolbar and available from Account.
- Clarified the Appearance scope notice: browser-local view settings are separate from profile-photo management in Account.
- Strengthened the enabled Workspace status with a pill affordance while leaving disabled local-only state visually restrained.
- Kept Appearance display preference and workspace profile sharing separate. No automatic opt-in was added.

## Verification

- `npm.cmd run build`: passed; 47 modules transformed
- `npm.cmd run check`: passed; 11 semantic/runtime guards and per-file budgets
- `npm.cmd run measure:mvp-v2`: passed
- `node scripts/validate-test-isolation.mjs`: passed; 25 production assets without Emulator-only markers
- Built browser suite: **51 passed, 0 failed**
- Focused navigation/Appearance tests: passed, including Workspace status chooser, Account hub, Appearance preview/save, and touch-target coverage
- Final visual captures reviewed at 1440px: Boards, Appearance, and Workspace status affordances are readable; final Appearance copy is clear and unclipped
- Page width remains bounded in the 960px compatibility path; intentional horizontal continuation is confined to the board lane
- Rules source: unchanged
- `git diff --check`: passed

The board lane still shows a partial next element at the far right because horizontal board scrolling is intentional and existing. Primary header/toolbar controls remain reachable and readable.

## Budget

- Reachable production source: **245,489 / 247,500 bytes**
- Headroom: **2,011 bytes**
- Warning threshold: **210,000 bytes**
- Initial shell gzip: **24,675 / 25,000**
- First-party lazy gzip: **51,358 / 55,000**
- Document gzip: **5,728**
- Vendor gzip: **139,736**
- Reachable sources: **27**
- Unbudgeted reachable sources: **0**

## Safety

No real account, protected workspace, production cloud mutation, Rules publication, push, PR, deployment, or production acceptance was used. The Workspace status route is non-mutating until the user deliberately selects a cloud workspace from the existing chooser.
