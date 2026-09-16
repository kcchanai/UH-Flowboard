# Flowboard release candidate handoff

Status: **ready for human review, not released**.

- Candidate branch: `luna/trello-style-mvp-v2`
- Candidate client SHA: `69a182d66bbdb65b146c18b6c66cf49fcbc0c06b`
- Local/remote `main` SHA: `07859a752e56fd2f01a0b8ff62d1264e2096de93`
- Remote candidate ref: none; the branch is intentionally unpushed.
- Firestore Rules: unchanged from `main`; no Rules publication was performed.
- Production: unchanged; no merge, Pages deployment, real-account test, protected-workspace access, or production fixture mutation.

## Verified gates

- Unit/static/build/budget/isolation: `npm.cmd run validate`, **29/29 unit tests**, passed.
- Firestore Rules Emulator: **23/23**.
- Emulator browser workflow: **1/1**.
- Built-preview browser suite: **29/29** on the settled rerun.
- Lighthouse accessibility: **1.0**, zero failed audits.
- Served evidence: HTTP 200, zero console errors, zero page errors.
- Pages workflow release guard: passed; deployment waits for successful same-SHA `Validate Flowboard` completion on `main`.

## Budget

- Raw source: **217,500/217,500 bytes**; the 210,000-byte maintainability warning is active and raw headroom is **0 bytes**.
- Initial shell gzip: **23,607/25,000 bytes**.
- First-party lazy gzip: **49,560/55,000 bytes**.

## Human gate

Do not push, merge, deploy, publish Rules, use real Google accounts, mutate production fixtures, or approve beta from this handoff alone. Aaron must explicitly approve the candidate and provide the operator path for final real-account acceptance. Use a fresh dedicated disposable fixture, never `My Flowboard workspace`, and request only redacted pass lines.

Machine-readable details and build asset hashes: [`manifest.json`](manifest.json).
