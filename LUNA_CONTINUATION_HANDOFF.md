# Flowboard Luna continuation handoff

Status captured: 2026-08-19 HST

This is a live handoff companion to `TERRA_NEXT_PHASES_PLAN.md`. The authoritative sequential plan remains that file. Use this note to resume from the exact current production checkpoint without reconstructing state from chat.

For the continuous operational-v1 development sequence, real-workflow scenarios, engineering phases, and Luna implementation protocol, see `LUNA_FULL_WORKFLOW_IMPLEMENTATION_PLAN.md`. Development Phases 0 through 6 may proceed without closing this handoff's production acceptance. The acceptance below is deferred and must be restarted against the final release candidate.

## Routing recommendation

The remaining work in this handoff is stateful production acceptance. It is no longer a prerequisite for non-production development. Preserve this evidence as the `5a17747` baseline, leave the production fixtures untouched, and conduct final acceptance only after Development Phases 0 through 6 produce a validated release candidate.

Do not resume the production operator checklist during continuous development. Work on an isolated development branch, run automated and Emulator tests without user intervention, and stop at the single Phase 7 Final Human Gate before Rules publication, production merge/deployment, or real-account acceptance.

## Repository and release

- Repository: `C:/Code/Stacie-Hermes/UH-Trello`
- Branch: `main`
- Released commit: `5a17747e3c9cb526a534659aff39f46f2fd35cbc`
- Commit title: `Propagate cloud workspace lifecycle updates`
- Production URL: `https://kcchanai.github.io/UH-Trello/?release=5a17747`
- Validation run: `31237236599`, success
- Pages run: `31237236607`, success
- Validation annotations: 0
- Production smoke: expected local board loaded, `Google sign-in available`, zero console messages, zero JavaScript errors
- GitHub CLI was restored to `makoaharadasaito`
- Worktree was clean before this local handoff note was created
- No Firestore Rules, indexes, Firebase deployment configuration, or workflow files changed in the corrective release

## Verified release gates

- Application/tooling tests: 20/20 passed
- Firestore Rules tests: 23/23 passed
- Browser tests: 10/10 passed twice after final readiness corrections
- Static validation: passed
- Production build: passed
- Lighthouse accessibility: score 1, zero failed audits
- Source budget: 209,453 / 210,000 bytes, 547 bytes headroom
- Independent runtime review: no blockers
- Independent final browser-regression review: no blockers

## Non-negotiable production boundary

Only mutate the disposable fixture. Its canonical name is:

```text
Lifecycle acceptance renamed
```

Never open, rename, archive, restore, migrate, or otherwise mutate:

```text
My Flowboard workspace
```

Do not edit boards, lists, or cards while inspecting retained content. Do not request or print credentials, emails, UIDs, workspace IDs, invitation links, tokens, cookies, Firebase configuration, response bodies, or full errors. Persistent Firestore disk caching stays disabled. Parent hard deletion stays denied.

## Production acceptance already completed on release 5a17747

Aaron prepared two independent authenticated owner contexts using the released client.

Completed owner rename/stale sequence:

1. Both contexts opened `Lifecycle acceptance renamed` in cloud owner mode.
2. Session B opened Rename, entered `Lifecycle stale write probe`, and left the dialog unsaved, preserving its stale lifecycle revision.
3. Session A renamed the fixture to `Lifecycle realtime probe`.
4. Session B attempted its stale rename without refreshing.
5. Session B received exactly:

   ```text
   This workspace changed in another session. Refresh and try again.
   ```

6. Session B's active name converged without refresh to `Lifecycle realtime probe`.
7. Session A refreshed discovery and proved `Lifecycle stale write probe` was not written.
8. Source inspection confirms that exact message is produced by the lifecycle adapter's revision-mismatch branch with classification `REVISION_CONFLICT`.

Accepted evidence reported by Aaron:

```text
SESSION A RENAME PASS
SESSION B STALE MESSAGE PASS
SESSION B LIVE NAME PASS
STALE VALUE NOT WRITTEN PASS
```

## Exact current production state

The disposable fixture is temporarily named:

```text
Lifecycle realtime probe
```

Canonical restoration has not yet occurred.

Likely context state at pause:

- Session A: owner-authenticated; the workspace chooser was reopened to verify the temporary name and may still be open.
- Session B: owner-authenticated; active cloud mode shows `Lifecycle realtime probe · owner · cloud`; stale dialog was cancelled and the chooser closed.
- Neither context was refreshed during the accepted convergence/stale sequence.

If the visible state differs from this description, stop and ask Aaron for only the displayed fixture name, role/status text, and whether each context is local or cloud. Do not ask for identifiers.

## Deferred final acceptance: restart from Checkpoint 3

Do not execute these steps against `5a17747` during continuous development. At the Final Human Gate, use fresh independent contexts on the final deployed candidate and rerun the affected lifecycle sequence. The old contexts do not need to be preserved.

Do not refresh either context unless a later instruction explicitly requires it.

### A. Restore canonical name from Session A

1. In Session A, use the freshly discovered disposable row.
2. Rename only `Lifecycle realtime probe` to:

   ```text
   Lifecycle acceptance renamed
   ```

3. Save.
4. Require Session A to show:

   ```text
   Lifecycle acceptance renamed
   Cloud workspace · owner · editable
   ```

### B. Verify second realtime convergence in Session B

Without refreshing Session B, require its active summary to become:

```text
Lifecycle acceptance renamed · owner · cloud
```

### C. Return Session B to local mode

1. Open `My workspace`.
2. Select `Return to local`.
3. Close the chooser if needed.
4. Require:

   ```text
   Local owner · owner · local-only
   ```

Do not edit the local board.

### D. Capture exact Session B localStorage baseline

Use the acceptance-only same-tab probe already provided in chat or `scripts/local-storage-lifecycle-acceptance.js`. Before capture, clear only:

```text
flowboard-lifecycle-local-storage-baseline-v1
```

from `sessionStorage`, then capture. The probe must print only key names, presence, byte counts, and `LOCAL STORAGE BASELINE CAPTURED`. It must never print raw values. Keep the same Session B tab alive for the later comparison.

Expected operator response shape:

```text
CANONICAL NAME RESTORED PASS
SESSION B CANONICAL LIVE NAME PASS
SESSION B LOCAL MODE PASS
flowboard-workspace: present [true/false], bytes [number/null]
flowboard-data: present [true/false], bytes [number/null]
LOCAL STORAGE BASELINE CAPTURED
```

## Deferred final checkpoint: archive propagation and exact local preservation

Proceed only after Checkpoint 3 passes.

1. In Session B, reopen only `Lifecycle acceptance renamed` in cloud owner mode.
2. Confirm both contexts are actively using that disposable cloud workspace.
3. In Session B, open a reversible cloud UI dialog so archive propagation can prove unsafe dialog closure; do not edit content.
4. In Session A, archive only the disposable fixture through the accessible retained-data dialog.
5. Require Session B, without refresh, to:
   - close the unsafe cloud dialog;
   - stop its cloud listeners;
   - return automatically to local mode;
   - show the independent local board;
   - avoid repeated permission errors;
   - remain local after one synthetic `online` event;
   - avoid reconnecting.
6. Run the same acceptance probe in Session B. Require strict raw-string equality for both `flowboard-workspace` and `flowboard-data` and:

   ```text
   LOCAL STORAGE BYTE EQUALITY PASS
   ```

7. Require the archived row presentation:

   ```text
   Lifecycle acceptance renamed
   Cloud workspace · archived · retained
   Restore
   ```

8. Restore from Session A.
9. Reopen retained content without editing and verify the recorded board, four lists, and cards remain.
10. Return both contexts to local mode.

Stop immediately if Session B remains cloud, reconnects, emits repeated permission errors, fails exact storage equality, or any protected workspace is involved.

## Remaining final acceptance after owner archive propagation

Complete only the remaining final production-acceptance subset from `TERRA_NEXT_PHASES_PLAN.md`; continuous development sequencing is controlled by `LUNA_FULL_WORKFLOW_IMPLEMENTATION_PLAN.md`:

1. Production editor lifecycle denial.
2. Production viewer lifecycle denial.
3. Non-member denial without metadata disclosure.
4. Former-member and revoked-member denial plus listener shutdown.
5. Continued hard-delete denial.
6. Sanitized production acceptance matrix.
7. Explicit approval for final disposable fixture disposition, recommended archived and retained.
8. Final documentation closeout and verification, with `makoaharadasaito` restored as the active GitHub CLI account.
9. Explicit limited-beta readiness decision.
10. Verify that the source-headroom and workflow work completed during Development Phases 1 through 6 remains valid in the exact final candidate. Do not begin another broad refactor after production acceptance.

## Final production-acceptance stop conditions

Stop production actions and switch back to Terra if:

- any expected status text differs;
- the canonical or temporary fixture name cannot be reconciled;
- a stale or unauthorized lifecycle mutation succeeds;
- any operation targets `My Flowboard workspace`;
- raw identifiers or credentials would be required;
- Session B does not fall back to local immediately after archive;
- localStorage exact equality fails;
- repeated permission errors or reconnect loops appear;
- Firestore Rules, data model, runtime code, or deployment configuration might need modification;
- a destructive or irreversible action is proposed.
