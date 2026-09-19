# Migration and compatibility guide

## Browser legacy data

1. Signing in never activates, rewrites, removes, or uploads `flowboard-workspace` or `flowboard-data`.
2. The user opens **Review legacy browser data**.
3. Flowboard previews counts without mutating source bytes.
4. The exact original backup must be downloaded first.
5. Import is an explicit second action into the personal `My workspace` destination.
6. Imports are deterministic, account/destination/content bound, capped at four boards, and finalized atomically only after server verification.
7. Original browser bytes remain unchanged after successful import.

## Snapshot-backed cloud workspaces

- Owner-only upgrade converts snapshot content into granular board/list/card documents.
- Migration writes are grouped in fours to stay within measured Rules access limits.
- Imported/migrating payloads remain hidden until verification.
- Snapshot removal is operation-bound and happens only after server readback verifies retained counts.
- Interrupted migration is resumable.

## Client and Rules compatibility

- **Old client + old production Rules:** current production behavior remains unchanged until cutover.
- **New client + old Rules:** lifecycle and migration actions may be denied. Do not deploy the client before the compatible Rules/index gate.
- **Old client + new Rules:** old generic lifecycle paths may be denied or hidden. Do not publish the new Rules without the approved coordinated client cutover.
- **New client + new Rules:** locally qualified combination represented by this candidate.

## Rollback limits

- A client rollback cannot undo a completed permanent deletion.
- Never restore permissive old Rules to work around a lifecycle denial.
- Tombstones and lifecycle controls are retained to prevent deleted identifiers from being recreated.
- Incomplete deletion jobs must be resumed by compatible client code. Do not repair them with administrator console edits.
- Legacy browser data is not an automatic rollback source and must never silently resurrect deleted cloud content.
