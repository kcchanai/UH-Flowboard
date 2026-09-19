# Step 7 evidence - board lifecycle

## Implemented

- `My workspace` exposes owner-only board Archive, Restore, and Delete permanently actions.
- Archive and restore are revision-aware and server-verified.
- Permanent delete uses server preflight counts, typed board-name confirmation, the durable deletion engine, descendant/comment purge, and server absence verification.
- Archived board payloads remain owner-only. Editors and viewers query only active, non-archived metadata.
- Archiving or deleting the selected board selects a remaining active board. A last-board operation renders the honest empty workspace state.

## Verification

- Firestore Rules: 40 passed, 0 failed.
- Auth/Firestore Emulator browser workflow: 18 passed, 0 failed on the current lifecycle tree.
- Browser coverage includes archive, restore, descendant counts, typed confirmation, fallback selection, last-board empty state, and permanent deletion.
- Production was not accessed or changed.
