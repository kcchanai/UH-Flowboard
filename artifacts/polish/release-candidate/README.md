# Flowboard polish release-candidate qualification

## Candidate identity

- Candidate source SHA: `2bd93e93673b3cfb641934c67c4016e581bc9041`
- Implementation branch: `luna/flowboard-comprehensive-polish`
- Base `main` and current `origin/main`: `b208b564236ead57b3dd5b33b70686445ae92e67`
- Firestore Rules SHA-256: `6e736958316b451a207cb0954d0f6ca39aedf007cd63130c1b3f4d3485f2ada8`

## Qualification results

- Unit/static/build/budget/isolation validation: passed.
- Unit tests: 29 passed, 0 failed, 0 skipped.
- Firestore Rules tests: 23 passed, 0 failed, 0 skipped.
- Emulator browser workflow: 1 passed.
- Built-preview browser smoke: 40 passed in each of three consecutive isolated runs.
- Lighthouse accessibility: 100/100, zero failed scored audits.
- Native browser zoom remains a disclosed manual qualification item, not an automated pass.

## Budget results

- Reachable raw source: 216,103 / 217,500 bytes.
- Headroom: 1,397 bytes.
- Initial shell gzip: 23,767 / 25,000.
- First-party lazy gzip: 44,248 / 55,000.
- Document gzip: 5,455, reported separately.
- Maintainability warning above 210,000 bytes remains intentional and non-blocking.

## Performance evidence

The synthetic desktop benchmark used 10 lists and 1,000 cards at 1440x900. Across three samples:

- Median render: 623.1 ms; maximum: 626.5 ms.
- Median navigation to usable: 645 ms; maximum: 648 ms.
- Median single-term filter: 47.2 ms; maximum: 50.8 ms.
- Zero console errors and zero page errors.

See the three `benchmark-1000*.json` files in this directory.

## Production boundary and release gate

This is a locally qualified, not deployed, release candidate. No merge, push, Pages deployment, Rules publication, production Firestore mutation, real-account testing, or protected-workspace access occurred.

The next action is the human release gate. Do not report this candidate as production-accepted until Aaron explicitly authorizes the reviewed merge/deployment path and completes the redacted real-account acceptance matrix.

## Curated evidence

- `manifest.json`
- `lighthouse.json`
- `benchmark-1000.json`
- `benchmark-1000-2.json`
- `benchmark-1000-3.json`
- Step-specific results and screenshots under `artifacts/polish/step-01` through `artifacts/polish/step-10`
