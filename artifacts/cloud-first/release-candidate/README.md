# Flowboard cloud-first local release candidate

This package records the fully verified local candidate produced by the 13-step cloud-first debugging plan.

## Candidate identity

- Implementation commit: `9880959fc25fcd3925ab7e5ff1096e546eea3d3d`
- Rules blob: `ab892fb38e3c371d533ffc59c739adf7a9300ffb`
- Index blob: `79fc192e9b71eb3c18b7fd504b77fc9b07bcd18a`
- Production baseline remains `d1c00e619e9b9b907d599e0dcbd1981b80841bc0`.
- The package commit is recorded in `ATTESTATION.md`.

## Delivered behavior

- Account-backed `My workspace` is the normal editable interface.
- Browser-only legacy data stays inert until explicit backup-first import.
- Board, list, and card archive/delete operations have honest, distinct semantics.
- Permanent deletion uses immutable scope, tombstones, explicit descendant/comment cleanup, resumable jobs, and server verification.
- Horizontal board scrolling remains inside the visible viewport.
- Filters is bounded and dismissible, and Start here is removed.

## Final evidence

- Unit/domain/adapter: 43 passed.
- Firestore Rules: 40 passed.
- Auth/Firestore Emulator browser: 18 passed.
- Built-preview session/accessibility/geometry: 6 focused tests passed.
- Lighthouse accessibility: score 1, zero failed audits.
- Loaded board and card dialog: zero axe violations.
- 1,000-card benchmark: render median 68.8 ms, maximum 90.1 ms; filter median 31.1 ms, maximum 50.3 ms.

See `../step-06/` through `../step-12/` for detailed evidence.

## Important limitations

- This is a local candidate, not a production release.
- Firestore Rules and indexes have not been published.
- GitHub Pages has not been deployed from this branch.
- No real account or production workspace has been tested or migrated.
- Completed permanent deletion cannot be undone.
- Configured shell headroom is 6 gzip bytes and lazy headroom is 18 gzip bytes. Any source change requires remeasurement.

## Production boundary

No push, PR, merge, Pages deployment, Rules/index publication, production migration, real-account testing, normal-browser-profile access, or protected-workspace access occurred.
