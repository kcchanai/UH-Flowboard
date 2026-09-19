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
- [x] Step 2 of 13 - prove cloud and deletion architecture
- [x] Step 3 of 13 - cloud-only session bootstrap and empty states
- [x] Step 4 of 13 - safe legacy migration and schema upgrade
- [x] Step 5 of 13 - unified My workspace directory
- [x] Step 6 of 13 - reliable command, confirmation, and lifecycle engine
- [x] Step 7 of 13 - board archive, restore, and permanent deletion
- [x] Step 8 of 13 - working list deletion
- [x] Step 9 of 13 - reliable card archive, restore, and deletion
- [x] Step 10 of 13 - viewport-bounded board and persistent horizontal scrolling
- [x] Step 11 of 13 - remove Start here and finish Filters behavior
- [x] Step 12 of 13 - full local qualification and security regression
- [ ] Step 13 of 13 - package verified local release candidate and stop **(active)**

## Evidence contract

Each completed step records its exact commit, checks, sanitized counts, budget status, and blockers under `artifacts/cloud-first/step-NN/`. A checkbox is marked only after its checkpoint passes. Historical results are not reused as current final evidence.

## Latest verified checkpoint

- Step 4 evidence: `artifacts/cloud-first/step-04/README.md`
- Step 5 evidence: `artifacts/cloud-first/step-05/README.md`
- Step 6 evidence: `artifacts/cloud-first/step-06/README.md`
- Step 7-11 evidence: `artifacts/cloud-first/step-07/` through `step-11/`.
- Unit/domain/adapter: 43 passed, 0 TODO, 0 failed.
- Firestore Rules: 40 passed, 0 failed.
- Auth/Firestore Emulator browser: 18 passed, 0 failed.
- Built-preview session checks: configured 1 passed; unconfigured 2 passed.
- Focused unified-manager, dialog, and interrupted-migration browser checks: 3 passed.
- Raw source: 295,676 / 300,000 bytes.
- Initial shell gzip: unconfigured 26,183 / 26,250; configured 26,244 / 26,250.
- First-party lazy gzip: 57,982 / 58,000.
- Candidate Rules blob: `ab892fb38e3c371d533ffc59c739adf7a9300ffb`.
- Candidate index blob: `79fc192e9b71eb3c18b7fd504b77fc9b07bcd18a`.
- Production boundary held: no push, deployment, Rules/index publication, production migration, protected-workspace access, normal-profile access, or real-account testing.
