# Step 9 evidence - card lifecycle

## Implemented

- Archive/Restore remains reversible and distinct from Delete.
- Delete performs permanent lifecycle deletion, including authenticated comments and server absence verification.
- Archived-card recovery rows expose Restore and Delete permanently to editable roles and remain non-mutating for viewers.
- Dirty-card deletion preserves the two-stage discard then delete confirmation.
- Failed archive attempts reconcile to authoritative active content and leave the archive list accurate.

## Verification

- Real Emulator UI exercised dirty-card permanent deletion and archived-card permanent deletion.
- The archive-failure fixture proved the card remains active and the archive list remains empty.
- Deletion-engine coverage removed 12 paged comments from a card and verified the target was absent.
- Auth/Firestore Emulator browser workflow: 18 passed, 0 failed.
