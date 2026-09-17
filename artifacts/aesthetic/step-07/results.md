# Step 7 results: workspace-scoped photo sharing under strict Rules

## Changed

- Added optional membership presentation fields: `displayName`, `photoURL`, and `profileUpdatedAt`.
- Added strict Firestore Rules validation for optional field types, lengths, server timestamps, and the exact HTTPS `lh3.googleusercontent.com/` prefix.
- Added `validOwnMemberProfileUpdate` with self-only, active-workspace, exact-field, role/UID/email-preserving authorization.
- Existing membership creation now validates optional presentation fields without requiring them, preserving legacy members and invite flows.
- Added `updateOwnMemberProfile` to the adapter contract, Firebase adapter, and cloud workspace adapter.
- Added explicit member-dialog controls:
  - Share Google profile photo.
  - Refresh shared photo.
  - Stop sharing photo.
- Sharing does not add OAuth scopes, modify `users/{uid}` access, alter assignments, or change role/ownership permissions.
- Existing reduced member-dialog fixtures remain compatible when the optional profile section is absent.

## Rules coverage

The new Emulator Rules test verifies:

- Current owner/editor/viewer-style member can update only presentation fields.
- Approved Google-host photo URL can be shared.
- Empty photo URL can remove sharing.
- Role escalation is denied.
- Evil-host photo URL is denied.
- Unknown fields are denied.
- Another user cannot update the member's profile.
- Invalid photo on new member creation is denied.
- Archived workspace profile updates are denied.

## Verification

- `npm.cmd run validate`: passed; **31 unit tests**, static checks, production build, source budget, and isolation.
- `npm.cmd run test:rules`: passed; **24 Rules tests**.
- `PLAYWRIGHT_EXECUTABLE_PATH='C:/Program Files (x86)/Google/Chrome/Application/chrome.exe' npm.cmd run test:emulator-browser`: passed; 1 Emulator browser test.
- Member profile UI focused browser test: passed with synthetic owner/session and fake adapter only.
- Full built-preview browser smoke on strict port 4208: **47 passed**.
- Rules source was changed locally but not published.

## Budget

- Reachable raw source: **236,512 / 240,000 bytes**.
- Headroom: **3,488 bytes**.
- Initial shell gzip: **24,426 / 25,000 bytes**.
- First-party lazy gzip: **49,391 / 55,000 bytes**.
- Document gzip: **5,587 bytes**, reported separately.
- Vendor gzip: **139,736 bytes**, reported separately.
- Reachable production assets: 26; unbudgeted reachable files: 0.

## Safety

No Rules publication, production Firestore mutation, real account, protected workspace, Pages deployment, or remote push occurred. The profile UI and Rules are Emulator/local-only qualification at this step. Raw runner logs were removed after this sanitized report was written.
