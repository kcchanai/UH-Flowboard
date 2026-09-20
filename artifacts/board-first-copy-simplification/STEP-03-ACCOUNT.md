# Step 3 Account dialog evidence

- Implementation: removed the redundant `#account-workspace-section` markup and controller render path.
- Account status remains available through the existing account status and board gate paths.
- Profile photo heading is `Profile photo`.
- Profile sharing status is scoped to people who can access the user's boards.
- Account actions preserved: Appearance, Sign out, Boards, Data recovery, and Review legacy browser data.
- Runtime member-profile status also uses the board-access audience copy.

## Verification

Command:

```text
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4410 PLAYWRIGHT_EXECUTABLE_PATH=C:/Program Files (x86)/Google/Chrome/Application/chrome.exe npx.cmd playwright test tests/browser-smoke.spec.mjs --grep="account panel is a first-level account"
```

Result: **1 passed**, zero page/console errors reported by the test.

Assertions included:

- `#account-workspace-section` count is 0.
- Profile photo copy and board-access audience text are visible.
- Share Google profile photo remains visible.
- Synthetic account photo is rendered.
- Account close/focus and Appearance focus return still pass.
- `flowboard-workspace` local storage remains byte-for-byte unchanged.

No production account, document, storage payload, or Rules state was accessed or changed.
