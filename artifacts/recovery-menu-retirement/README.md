# Flowboard recovery-menu retirement candidate

## Status

Locally qualified candidate on branch `fix/remove-recovery-menus`. Customer-facing Data recovery and Legacy Recovery surfaces are retired. The internal workspace authorization model and protected historical maintenance remain intact. This candidate stops before deployment.

## Immutable identities

- Baseline main: `8d3a66750885cccb3b6a5ac3136ecc1b9e2c5f9e`
- Final implementation/test source: `50d913cb61fe71f4d49b4e2caf75581c05522e09`
- Rules blob: `296b595276122918f521d3f86ee6820a5cc876b7`
- Indexes blob: `79fc192e9b71eb3c18b7fd504b77fc9b07bcd18a`

Checkpoint commits:

- `b7acfebe5b6458df737189aad14535e5ef8706b4` baseline and ledger
- `329a155a1200f0a89e5ea05db94a9efde79556c7` failing retirement contract
- `af19f20c64efd3938b1e0f9ade4aa7f5efa02ab0` customer UI retirement
- `3ecae61` Step 3 configured budget evidence
- `5d817a3ae3686d722242c3f4bbfd12cf31f7faa7` repair confirmation and board safeguards
- `f00c5886eddce6102c6615b1fa3533419cbffea9` obsolete UI graph detachment
- `672b60fa5d65e63cf267811d56ef185682e86a99` test, fixture, CI, and documentation reconciliation
- `50d913cb61fe71f4d49b4e2caf75581c05522e09` final idempotent Retry rendering and repair assertion

## Delivered customer behavior

- Account shows Appearance, Sign out, and Boards, without Data recovery or Review legacy browser data.
- Boards shows active, archived, and shared board rows without retained workspace containers.
- Archived owner boards keep direct Restore and Delete permanently actions.
- Manage members and View activity remain available through ordinary Boards access scope.
- Board actions Local recovery remains available.
- Retry setup is distinct from Repair account setup.
- Repair account setup requires an explicit confirmation and explains new empty destination creation, unchanged earlier data, and no import.
- Legacy browser keys remain untouched and inert during ordinary Account, Boards, Retry, Repair, sign-in, and sign-out flows.
- Protected migration, archived-root lifecycle, local inspection/receipt, and Rules maintenance remain available outside ordinary customer navigation.

## Validation receipts

- Configured `npm.cmd run validate`: 41 unit tests, static/syntax/build/isolation passed.
- Firestore Rules Emulator: 46/46 passed.
- Packaged Auth/Firestore Emulator browser workflow: 19/19 passed.
- Exact configured browser selection: 11/11 passed.
- Lighthouse accessibility: score 1.0 with zero failed audits.
- Final visual capture: 5/5 HTTP 200, zero console/page/request errors, no document overflow, zero visible retired recovery/legacy text.
- Final capture receipt: `final/capture-report.json`.

The Rules suite emits expected denial diagnostics for negative probes. The suite exited successfully and all tests passed.

## Final budgets

Configured:

- Raw source: `284258 / 300000` bytes
- Headroom: `15742` bytes
- Initial shell gzip: `25868 / 26250` bytes
- First-party lazy gzip: `55568 / 60000` bytes
- Document gzip: `4989` bytes

Unconfigured:

- Raw source: `284258 / 300000` bytes
- Initial shell gzip: `25813` bytes
- First-party lazy gzip: `55568` bytes
- Document gzip: `4987` bytes

No source or gzip cap was increased.

## Remaining internal workspace terminology and maintenance

The following remain intentionally internal or protected:

- Firestore workspace IDs, personal pointers, collection paths, invitation parameters, adapter contracts, and Rules functions.
- Owner-only migration and archived-root maintenance for historical data states.
- Protected local inspection/receipt and legacy import/export adapters, with no ordinary Account or Boards route.
- Workspace terminology in technical diagnostics and Rules tests where it identifies the authorization boundary.

A future backend decommission requires a separately authorized production inventory proving no invalid pointers, archived roots, interrupted migrations, or unresolved browser-data support obligations remain.

## Production boundary

No real account, production document, protected workspace, browser profile, token, cookie, Rules publication, index publication, push, PR, merge, or Pages deployment was performed for this candidate.
