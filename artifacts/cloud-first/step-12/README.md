# Step 12 evidence - final local qualification

## Final validation matrix

- Unit/domain/adapter: 43 passed, 0 failed, 0 TODO.
- Syntax, static guards, workflow gate, source graph, and performance budgets: passed.
- Firestore Rules Emulator: 40 passed, 0 failed.
- Auth/Firestore Emulator browser workflow: 18 passed, 0 failed.
- Unconfigured built-preview session tests: 2 passed.
- Synthetic-configured signed-out preview: 1 passed.
- Loaded board/card-dialog axe audit: 1 passed with zero violations.
- Scrolling and Filters built-preview tests: 2 passed.
- Lighthouse accessibility: score 1 with zero failed audits.
- Test asset isolation and `git diff --check`: passed.

## Budgets

- Raw source: 295,676 / 300,000 bytes.
- `index.html`: 23,314 / 27,250 bytes.
- Unconfigured initial shell: 26,183 / 26,250 gzip bytes.
- Synthetic-configured initial shell: 26,244 / 26,250 gzip bytes.
- First-party lazy graph: 57,982 / 58,000 gzip bytes.
- All per-file caps passed.

No cap was raised. The configured shell has 6 gzip bytes of remaining headroom, and the lazy graph has 18 gzip bytes.

## Synthetic 1,000-card benchmark

Three in-memory cloud-workspace samples at 1440x900:

- render median 68.8 ms, maximum 90.1 ms;
- single-term filter median 31.1 ms, maximum 50.3 ms;
- document width matched the 1440 px viewport;
- board scroll width was 3,821 px inside a 1,356 px board viewport;
- zero console errors and zero page errors.

The full machine-readable report is `benchmark.json`.

## Security review disposition

The final review found no Steps 10-11 blocker and no additional Steps 6-9 issue except a concern that complete deletion jobs remain resumable. That behavior is intentional and required: client completion cannot prove descendant collections are empty. Job scope and lifecycle controls are immutable, target tombstones cannot be removed, and target identifiers cannot be recreated. Resuming a complete job therefore removes only retained residue from the original operation scope. Returning early on `complete` would preserve orphaned data after an early or forged finalization.

## Immutable identities

- Rules blob: `ab892fb38e3c371d533ffc59c739adf7a9300ffb`
- Index blob: `79fc192e9b71eb3c18b7fd504b77fc9b07bcd18a`

## Boundary

All tests used synthetic local fixtures, in-memory browser data, or fresh `demo-*` Firebase Emulators. Nothing was pushed, deployed, published, migrated in production, or tested with a real account or protected workspace.
