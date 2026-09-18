# Step 9 of 10 results: full final-source qualification

## Final source identity

- Branch: `luna/product-polish`
- Final implementation source before packaging: `0b33766` plus Step 9 evidence only
- Base main: `bba3647131d1dac0c05f8e21893e11a82c3a0034`
- Firestore Rules SHA-1: `5d7e06e02bb679db2b1a31605cf81deb3f9a9e9a`
- Rules source unchanged throughout UX work.

## Qualification matrix

| Gate | Result |
|---|---:|
| Aggregate `npm.cmd run validate` | passed |
| Unit suite | 37/37 |
| Static/syntax/runtime guards | passed |
| Production build | passed; 52 modules transformed |
| Final raw source | 265,366 / 300,000 bytes |
| Initial shell gzip | 25,942 / 26,000 bytes |
| First-party lazy gzip | 55,798 / 58,000 bytes |
| Document gzip | 5,997 bytes |
| Firestore Rules Emulator | 24/24 |
| Tracked Emulator-browser workflow | 1/1 |
| Final unconfigured browser smoke | 58/58 |
| Synthetic configured-cloud browser smoke | 58/58 |
| Final Lighthouse accessibility | score 1; zero failed audits |
| Final production asset isolation | 28/28 |
| Public source em-dash scan | 0 files |
| `git diff --check` | passed |

Synthetic configured-cloud qualification used only non-production synthetic public values. No real configuration, account, workspace, token or credential was accessed or logged.

## Performance

Final unconfigured build, 1440x900, system Chrome, synthetic local workspace, 20 lists x 50 cards, three samples:

- Initial render: **594.5 ms median**, **685.7 ms maximum**.
- Navigation to usable: **627 ms median**, **720 ms maximum**.
- Single-term filter: **64.4 ms median**, **71.7 ms maximum**.
- All runs: 1,000 cards, one filtered result, document width 1,440px, board scroll width 7,754px, zero console/page errors.

## Visual matrix

Fresh isolated Playwright contexts captured Board and dark-mode views at:

- 1280x720
- 1440x900
- 1920x1080
- 960x720
- 390x844
- 320x720

Additional final evidence:

- Card dialog at office desktop sizes through 960x720.
- List view at 1440x900.
- Console/page errors: **0/0** in every capture.
- Document width stayed equal to viewport width in every capture; intended horizontal scrolling remains confined to the board/List canvas.

Evidence files are under `artifacts/product-polish/step-09/screens/`. Visual review found no blocking clipping, contrast or focus defect. Known minor follow-up notes are the existing partial right-edge board affordance and future semantic clarification between workflow-list names such as Done and the explicit completion field.

## Boundary verification

- No push, PR, merge, deployment, Rules publication or real-account testing.
- No protected workspace or disposable lifecycle fixture touched.
- Owned preview and Emulator processes were stopped; pre-existing ports 4173 and 4214 were left untouched.
- Generated reports/logs/test results were removed.
