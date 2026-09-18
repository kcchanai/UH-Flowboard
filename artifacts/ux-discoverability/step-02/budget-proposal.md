# Step 2 of 10: budget gate and proposal

## Decision status

**Blocked pending Aaron's budget decision.** No application source, Rules, or production state was changed in this step.

## Measured current state

- Reachable production source: **239,380 bytes**
- Current hard cap: **240,000 bytes**
- Current headroom: **620 bytes**
- Required final maintenance headroom from the plan: **2,000 bytes**
- Maximum final source under the current cap while preserving that margin: **238,000 bytes**
- Initial shell gzip: **24,512 / 25,000**
- First-party lazy gzip: **50,269 / 55,000**
- Document gzip: **5,587**
- Vendor gzip: **139,736**

## Safe-recovery investigation

The production checkout uses `core.autocrlf=true`. Converting the current working-tree CRLF line endings to LF would reduce the local byte count by 1,210 bytes, but that is not durable semantic recovery: a normal Windows checkout can restore those line endings. It is therefore not counted as release headroom and will not be used to evade the source budget.

No safe semantic deletion large enough to pay for the requested UX scope was identified. The current near-limit files are already intentional production modules:

- `index.html`: 24,696 / 26,000
- `src/cloud-workspace-ui.js`: 12,584 / 13,000
- `src/appearance-ui.js`: 9,334 / 10,000
- `src/members-ui.js`: 10,628 / 12,000
- `src/adapters/firebase-cloud-workspace.js`: 27,141 / 28,000

Removing safety notices, accessible labels, error states, Rules-facing validation, member identity safeguards, recovery behavior, or direct-access test boundaries would violate the approved plan and is not proposed.

## Conservative implementation allocation

This is a planning estimate for the smallest complete scope, not a claim of measured implementation output. It assumes reuse of the current member-profile controller, moving the existing profile section into Account rather than duplicating it, and no new dependency or backend module.

| Area | Raw allocation |
|---|---:|
| Account context/profile/action markup and copy | 1,200 |
| Account rendering, provider-photo button, mode-aware state, focus | 1,800 |
| Roster invalidation and scoped refresh wiring | 700 |
| Navigation, appearance discovery, status/copy adjustments | 1,100 |
| Dialog layout and responsive/accessibility CSS | 900 |
| **Estimated addition** | **5,700** |

At that estimate, the candidate would measure about **245,080 bytes** before the required maintenance margin. A conservative proposed cap is **247,500 bytes**, leaving approximately **2,420 bytes** for maintenance. The warning threshold would remain **210,000 bytes**. The initial-shell gzip cap would remain **25,000 bytes**, and the first-party lazy gzip cap would remain **55,000 bytes**. These limits would not be changed without an explicit decision.

The implementation will still attempt semantic consolidation and remeasure after each step. If the actual measured candidate is lower, the unused cap is not treated as an invitation to add scope.

## Required decision

Choose one:

1. Approve a raw source cap transition from **240,000** to **247,500** bytes, with the warning and gzip limits unchanged, followed by validator/manifest update and the full regression chain.
2. Keep the current **240,000-byte** cap and reduce the UX scope to changes that fit below **238,000 bytes**, which cannot include the complete first-level Account sharing and navigation pass as specified.

No cap was changed, and Step 3 has not started.
