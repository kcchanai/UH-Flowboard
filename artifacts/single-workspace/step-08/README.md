# Step 8 of 10: Onboarding, copy, accessibility, and layout

## Verified outcomes

- Production source and markup no longer contain the ordinary workspace-selection phrases. The only remaining historical references are in planning/evidence notes.
- Boards and Data recovery have distinct visible names and routes.
- The empty board state directs users to the visible New board action.
- The New board header control stayed within the 960px dialog bounds in the loaded-state browser audit.
- The existing desktop/resized/narrow dialog geometry suites remain in the repository and the Step 4/5 focused browser checks passed.
- No public-facing em dash was introduced in the changed source paths.

## Accessibility verification

- Existing loaded cloud board/card dialog axe test: **passed**.
- New loaded Boards/Data recovery dialog axe test: **passed**.
- New loaded-state audit used the actual built lazy cloud UI asset, synthetic signed-in directory data, a 960x720 viewport, and listeners installed before navigation.
- Axe returned zero violations for both Boards and Data recovery.
- Page errors and console errors: zero.

## Scope boundary

This step qualified the changed dialogs and copy against synthetic state. It did not perform human screen-reader testing, real-account acceptance, production data access, or deployment. Those remain release gates.
