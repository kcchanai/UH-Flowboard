# Step 1 - Baseline qualification and reproductions

Status: complete

## Pinned state

- Branch: `sol/cloud-first-debugging`
- Baseline: `d1c00e619e9b9b907d599e0dcbd1981b80841bc0`
- Baseline Rules blob: `5d7e06e02bb679db2b1a31605cf81deb3f9a9e9a`
- No remote operations or production access were performed.

## Prerequisites

- Node: 22.23.0
- npm: 10.9.8
- Java: Temurin 21.0.12
- System Chrome: available at the approved path
- Test-only packages installed together with `--no-save --ignore-scripts --no-audit --no-fund` and a repository-local `.npm-cache`.
- `package-lock.json` stayed byte-identical across the ephemeral install.

## Baseline results

- Aggregate `npm.cmd run validate`: pass.
  - Unit/domain: 37 pass, 0 fail.
  - Expected regressions: 7 TODO entries covering the requested defects.
  - Static guards, syntax, performance and workflow release gating: pass.
  - Production asset isolation: 31 assets pass.
- Firestore Rules Emulator: 24 pass, 0 fail.
- Auth/Firestore Emulator browser workflow: 1 pass, 0 fail.
- Unconfigured built-preview browser suite: 59 pass, 0 fail.
- Synthetic-configured built-preview browser suite: 59 pass, 0 fail.
- Lighthouse accessibility: score 1, zero failed audits.
- Planning anonymous production audit: zero console errors and zero page errors; no sign-in or mutation.

Expected Firestore `PERMISSION_DENIED` diagnostics were emitted by negative authorization tests; the suite exit code and TAP counts were successful.

## Measured baseline budgets

- Raw source: 272,829 / 300,000 bytes.
- `index.html`: 26,777 / 27,250 bytes.
- Unconfigured initial shell: 26,100 / 26,250 gzip bytes.
- Synthetic-configured initial shell: 26,155 / 26,250 gzip bytes.
- First-party lazy graph: 57,940 / 58,000 gzip bytes.
- Document gzip: 6,004 unconfigured; 6,003 configured.

The configured shell has 95 gzip bytes of headroom and the lazy graph has 60. Removal/consolidation must fund implementation before feature growth.

## Reproduced defects and confirmed policies

- Board horizontal overflow is real, but the track is below the viewport at both measured desktop heights.
- Filters remains open after an outside click and extends about 132px beyond the viewport's left edge.
- Cloud list deletion is deliberately disabled in UI and Rules.
- Cloud Delete card is deliberately implemented as archive.
- Dirty-card nested confirmation can lose the second pending action due to shared cleanup order.
- Archive/restore UI can close or refresh before the cloud promise commits.
- Current normalization cannot represent an empty cloud workspace without seeding a board.
- Start here exists as `details.collaboration-notice` containing `#start-here-copy`.

## Cleanup

Owned preview and Emulator processes exited. Generated debug logs and test results were removed. Three historical smoke-test screenshots changed during the baseline run and were restored from Git before the checkpoint commit.
