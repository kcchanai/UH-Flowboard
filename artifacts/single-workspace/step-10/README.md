# Flowboard single-workspace / board-only local release candidate

## Status

This is a **verified local release candidate** for owner review. It is not deployed and has not been exercised with real accounts.

- Repository: `C:/Code/Stacie-Hermes/UH-Trello`
- Branch: `luna/single-workspace-board-ux`
- Implementation commit: `289d15abe15547b69480cfee62698279d0b5ba9b`
- Rules blob: `0d73c6e9317dfdc949b1f8d2320fb232b3e6fbe0`
- Indexes blob: `79fc192e9b71eb3c18b7fd504b77fc9b07bcd18a`
- Live production client: unchanged

## Product result

- A signed-in account without a canonical personal pointer receives one new empty personal workspace atomically. Existing hints and shared/legacy scopes are preserved.
- Ordinary navigation is board-only. Workspace containers and retained legacy tools are under Data recovery.
- New board is visible in the Boards dialog header and empty state, including when no active board exists.
- Archived owner boards expose direct Restore and Delete permanently actions. The existing typed-confirmation and bounded deletion engine remains the destructive boundary.
- Existing board identities, memberships, invitations, assignments, browser-local legacy data, and recovery paths remain intact.

## Validation summary

- 43 unit/domain/adapter tests passed.
- 41 Firestore Rules tests passed.
- 15 Auth/Firestore Emulator browser tests passed.
- Expanded CI-style configured browser selection passed 8/8.
- Focused Step 5/6 browser selection passed 5/5.
- Lighthouse accessibility score 1.0 with zero failed audits.
- Loaded Boards/Data recovery axe audit reported zero violations.
- No raw credentials, production identifiers, protected-workspace data, or real-account data are included in this package.

## Budget summary

- Raw production source: 297,740 / 300,000 bytes.
- Unconfigured initial shell: 25,949 / 26,250 gzip.
- Synthetic configured initial shell: 25,994 / 26,250 gzip.
- First-party lazy graph: 58,545 / 60,000 gzip.
- `src/cloud-workspace-ui.js`: 13,178 / 14,000 bytes in the final Step 6 measurement.
- Maintainability warning at 210,000 bytes remains visible and is not a runtime failure.

The 60,000 lazy cap and 14,000 cloud-workspace controller cap were explicit, measured implementation decisions. No production authorization is implied by passing these budgets.

## Release boundary

Not performed:

- Git push, pull request, merge, or Pages deployment.
- Firebase Rules or index publication.
- Production document reads or writes.
- Real Google-account owner/editor/viewer/non-member acceptance.
- Legacy-data migration.
- Access to protected workspaces or normal browser profiles.

See `RELEASE_CHECKLIST.md` for the owner-operated release gates.
