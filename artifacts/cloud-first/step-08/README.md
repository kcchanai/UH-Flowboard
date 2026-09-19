# Step 8 evidence - list deletion

## Implemented

- Cloud list menus expose Delete list to owners and editors and keep it disabled for viewers.
- Confirmation is based on a fresh server preflight and reports card/comment descendant counts.
- The lifecycle engine deletes active and archived cards, all paged comments, the list payload, and verifies absence before unlocking the board.
- The active UI removes only the target list and preserves unrelated lists/cards.
- Realtime listening is suspended for the initiating lifecycle operation and restarted after completion or failure.

## Verification

- Real Emulator UI deleted a nonempty list containing active and archived cards plus comments.
- Unrelated list and card records remained present.
- Deletion-engine coverage includes multi-page comments, interrupted jobs, role denial, tombstones, and resurrection denial.
- Auth/Firestore Emulator browser workflow: 18 passed, 0 failed.
