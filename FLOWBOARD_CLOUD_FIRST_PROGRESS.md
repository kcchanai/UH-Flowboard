# Flowboard cloud-first implementation progress

## Release boundary

- Branch: `sol/cloud-first-debugging`
- Baseline commit: `d1c00e619e9b9b907d599e0dcbd1981b80841bc0`
- Baseline Rules blob: `5d7e06e02bb679db2b1a31605cf81deb3f9a9e9a`
- Target: fully verified local release candidate only.
- Prohibited in this phase: push, PR, merge, Pages deployment, Firebase Rules/index publication, production migration, real-account testing, protected-workspace access.
- Test data: synthetic local fixtures and fresh `demo-*` Firebase Emulators only.

## Checkpoints

- [x] Step 1 of 13 - pin baseline and add reproductions
- [ ] Step 2 of 13 - prove cloud and deletion architecture
- [ ] Step 3 of 13 - cloud-only session bootstrap and empty states
- [ ] Step 4 of 13 - safe legacy migration and schema upgrade
- [ ] Step 5 of 13 - unified My workspace directory
- [ ] Step 6 of 13 - reliable command, confirmation, and lifecycle engine
- [ ] Step 7 of 13 - board archive, restore, and permanent deletion
- [ ] Step 8 of 13 - working list deletion
- [ ] Step 9 of 13 - reliable card archive, restore, and deletion
- [ ] Step 10 of 13 - viewport-bounded board and persistent horizontal scrolling
- [ ] Step 11 of 13 - remove Start here and finish Filters behavior
- [ ] Step 12 of 13 - full local qualification and security regression
- [ ] Step 13 of 13 - package verified local release candidate and stop

## Evidence contract

Each completed step records its exact commit, checks, sanitized counts, budget status, and blockers under `artifacts/cloud-first/step-NN/`. A checkbox is marked only after its checkpoint passes. Historical results are not reused as current final evidence.
