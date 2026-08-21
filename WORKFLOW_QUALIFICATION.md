# Flowboard Workflow Qualification

Status: development candidate on `luna/flowboard-operational-v1`

This matrix is the sanitized qualification contract for WF-01 through WF-10. It contains no production credentials, UIDs, workspace IDs, invitation links, tokens, cookies, or raw workspace contents.

## Fixture boundaries

- Local fixture: `Workflow qualification local`, created only in an isolated browser profile.
- Emulator fixture: `Flowboard Emulator Workflow`, created in fresh Auth and Firestore Emulators with synthetic owner, editor, viewer, removed-member, and non-member contexts.
- Proposed production fixture: `Flowboard workflow qualification`. It must not be created or mutated before the consolidated Phase 7 Final Human Gate.
- Protected production workspace: `My Flowboard workspace`. Never use it for qualification.
- Lifecycle fixture: `Lifecycle realtime probe`. Leave it unchanged through Development Phases 0-6.
- Cleanup: local and Emulator fixtures are disposable; Emulator state is reset per run; production fixture disposition requires explicit Phase 7 approval.

## Result matrix

| Scenario | Deterministic start and evidence | Current result | Boundary / follow-up |
| --- | --- | --- | --- |
| WF-01 First-time local project | Clean browser storage; local board, lists, rich cards, reload, search/filter/order coverage in browser smoke | PASS locally | Continue broadening the automated matrix if a named control lacks coverage |
| WF-02 Local execution and recovery | Local Recovery browser flow lists bounded snapshots, exports a selected snapshot, creates a pre-restore safety snapshot, restores, and preserves focus | PASS locally | Malformed snapshot and storage-failure paths remain release-candidate review items |
| WF-03 Owner creates shared project | Synthetic Emulator owner seeds and opens a shared fixture; Auth/Firestore are isolated from production | PASS in Emulator | Real Google sign-in and production cloud-copy acceptance are Phase 7 only |
| WF-04 Editor executes assigned work | Synthetic editor mutation converges to owner and viewer; revision conflict is exercised | PASS in Emulator | Production invitation and Google-account acceptance are Phase 7 only |
| WF-05 Viewer review | Synthetic viewer discovers the fixture, receives `permission-denied` on direct write, and remains read-only | PASS in Emulator | Complete manual production viewer evidence only at Phase 7 |
| WF-06 Membership and revocation | Synthetic role downgrade changes editor to preview; removal returns the context to local mode and blocks writes | PASS in Emulator | Ownership-transfer production evidence is deferred |
| WF-07 Workspace lifecycle | Synthetic archive propagates to independent contexts; restore returns the retained workspace to owner-editable state | PASS in Emulator | Production lifecycle fixture remains untouched |
| WF-08 Resilience and errors | Rules tests cover stale revisions, denied writes, role removal, lifecycle conflicts, and bounded authorization; browser workflow covers stale mutation and revocation | PASS for covered automated cases | Offline/quota/malformed-recovery matrix needs explicit release-candidate expansion |
| WF-09 Mobile and accessibility | Browser smoke covers responsive widths, forced colors, reduced motion, keyboard closure/focus; Lighthouse score is 1 with zero failed audits | PASS automated | Manual assistive-technology testing remains separate and deferred |
| WF-10 Release and operations | Unit, static, source-budget, build, Rules Emulator, browser, Emulator-browser, and Lighthouse commands pass on the development branch | PASS locally for current checkpoint | CI, Pages, production console, real accounts, and deployment remain Phase 7 gates |

## Automated evidence commands

```text
npm test
npm run check
npm run build
npm run test:rules
npm run test:emulator-browser
PLAYWRIGHT_EXECUTABLE_PATH='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' npx playwright test tests/browser-smoke.spec.mjs --reporter=line
npx lighthouse http://127.0.0.1:4173/UH-Trello/ --only-categories=accessibility --chrome-flags='--headless --no-sandbox' --output=json --output-path=lighthouse-report.json
node scripts/assert-lighthouse.mjs
```

The current checkpoint was validated with 21 unit tests, 23 Rules tests, 11 production-preview browser tests, one Emulator-backed multi-user workflow test, a passing production build/isolation guard, and Lighthouse accessibility score 1 with zero failed audits.

## Phase 7 human gate

Do not publish Rules, merge to `main`, deploy, mutate production fixtures, use real Google accounts, or claim production acceptance from this document. Phase 7 must present one consolidated release-candidate report with the exact candidate SHA, CI result, deployment result, sanitized production matrix, fixture disposition, and explicit stop conditions.
