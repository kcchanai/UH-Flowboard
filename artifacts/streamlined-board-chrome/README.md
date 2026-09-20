# Streamlined board chrome

## Delivered

- Flowboard is static branding rather than a link.
- Boards remains the sole top-level workspace-manager control.
- The redundant cloud workspace status button is hidden.
- The redundant board workspace/role/cloud pill is hidden.
- The Comfortable/Compact control and density behavior are removed from the production path; the board uses the comfortable layout.
- Board actions follows List view directly and shares its row at 1440px and wider. It may wrap at narrower compatibility widths without horizontal page overflow.

## Qualification

- Aggregate validation: exit 0, including 43 unit tests, syntax, static, build, workflow-gate, source budget, and asset isolation.
- Firestore Rules: 46 passed.
- Packaged Emulator browser workflow: 20 passed.
- Affected header/status/layout browser tests: 7 passed.
- Exact configured CI browser selection: 9 passed, including the new streamlined-header regression.
- Lighthouse accessibility: score 1, zero failed audits.
- Visual inspection at 1900x700: no clipping or overlap; Board actions immediately follows List view on the same row.

## Budget

- Raw source: 299316 / 300000.
- Configured initial shell gzip: 25908 / 26250.
- Configured first-party lazy gzip: 58386 / 60000.

## Evidence

- `wide.png`: synthetic 1900x700 rendered board.
- `configured-budget.json`: final configured build measurement.

This is a presentation-only change. Firestore Rules, indexes, board data, memberships, and cloud authorization are unchanged.
