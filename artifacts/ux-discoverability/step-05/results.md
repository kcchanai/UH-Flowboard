# Step 5 of 10 results: immediate roster refresh

## Behavior

- Verified profile mutations emit an internal `flowboard:profile-change` event only after successful write and targeted readback verification.
- The cloud roster listens for the event and refreshes the active member map, then repaints only the board root captured by its initializer.
- Roster reads are coalesced while one read is pending. A change arriving during an active read queues one bounded follow-up refresh rather than starting an uncontrolled fanout.
- Generation tokens still discard late responses after workspace, session, or mode changes.
- Returning to a visible tab triggers one bounded roster refresh. There is no polling, persistent Firestore cache, or offline queue.
- The open assignment member picker refreshes its member choices on the same internal event.
- Existing three-badge maximum, overflow badge, former-member fallback, UID identity, photo host validation, no-referrer image behavior, broken-image fallback, and initials-only preference remain intact.

## Verification

- `npm.cmd test`: **31 passed, 0 failed**
- `npm.cmd run check`: passed
- `npm.cmd run build`: passed; 47 modules transformed
- `npm.cmd run measure:mvp-v2`: passed
- `node scripts/validate-test-isolation.mjs`: passed; 25 production assets without Emulator-only markers
- Built browser suite: **50 passed, 0 failed**
- Focused Account/profile/roster tests: **4 passed, 0 failed**
- Same-tab refresh assertion: profile-change event caused an additional member read and a photo image replaced the initials badge
- `git diff --check`: passed
- Rules source: unchanged

## Budget

- Reachable production source: **244,322 / 247,500 bytes**
- Headroom: **3,178 bytes**
- Warning threshold: **210,000 bytes**
- Initial shell gzip: **24,543 / 25,000**
- First-party lazy gzip: **51,283 / 55,000**
- Document gzip: **5,713**
- Vendor gzip: **139,736**
- Reachable sources: **27**
- Unbudgeted reachable sources: **0**

## Safety

No real account, protected workspace, production cloud mutation, Rules publication, push, PR, deployment, or production acceptance was used. The existing port 4180 was left untouched; fresh browser validation used owned ports. Generated logs and unrelated screenshots were removed or restored.
