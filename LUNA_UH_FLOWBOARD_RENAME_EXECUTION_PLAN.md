# Luna Execution Plan - Rename `UH-Trello` to `UH-Flowboard`

You are Luna. Execute this as a staged implementation and cutover plan. Do not perform the remote GitHub rename until the explicit human cutover gate in this document.

## Objective

Rename the GitHub repository:

```text
kcchanai/UH-Trello
```

to:

```text
kcchanai/UH-Flowboard
```

while preserving repository history, collaboration settings, CI, Firebase configuration, local data safety, and GitHub Pages availability as closely as possible.

The final Pages URL will be:

```text
https://kcchanai.github.io/UH-Flowboard/
```

GitHub redirects normal repository web and Git traffic after a rename, but GitHub Pages project-site URLs are not redirected. Treat the Pages path change as a production cutover.

Authoritative GitHub behavior reference:

```text
https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository
```

## Current verified baseline

As of the planning checkpoint:

- Local repository: `C:/Code/Stacie-Hermes/UH-Trello`
- Development branch: `luna/flowboard-operational-v1`
- Planning HEAD: `c332ef7f22cca39e2db8c9bebe2280e8181b674b`
- Production `main`: pinned separately in the operational plan
- Origin: `https://github.com/kcchanai/UH-Trello.git`
- Repository visibility: public
- Default branch: `main`
- Pages build type: GitHub Actions workflow
- Current Pages status: `built`
- Current Pages URL: `https://kcchanai.github.io/UH-Trello/`
- `makoaharadasaito` is the active GitHub CLI account by default.
- `kcchanai` is available but inactive.
- A public read lookup did not find `kcchanai/UH-Flowboard`; recheck with the `kcchanai` account before cutover because absence was not an authenticated reservation check.

The local folder may remain named `UH-Trello`. Do not rename the Windows folder as part of this plan. The repository name, Pages base path, and Git remote are separate concerns.

## Required reading

Before editing, read:

```text
.hermes.md
LUNA_FULL_WORKFLOW_IMPLEMENTATION_PLAN.md
LUNA_SOURCE_HEADROOM_EXECUTION_PROMPT.md
LUNA_SOURCE_HEADROOM_IMPLEMENTATION_PLAN.md
WORKFLOW_QUALIFICATION.md
LUNA_CONTINUATION_HANDOFF.md
TERRA_NEXT_PHASES_PLAN.md
README.md
vite.config.mjs
.github/workflows/validate.yml
.github/workflows/deploy-pages.yml
```

If source-headroom implementation is still pending, complete and validate `LUNA_SOURCE_HEADROOM_EXECUTION_PROMPT.md` first. Do not combine an unvalidated source-headroom refactor with the remote rename cutover.

## Non-negotiable boundaries

Do not:

- rename the remote repository during development preparation;
- mutate production Firebase data;
- open or mutate `My Flowboard workspace`;
- open or mutate `Lifecycle realtime probe`;
- publish Firestore Rules;
- handle passwords, verification codes, tokens, or real browser profiles;
- change Firebase credentials or print configuration values;
- enable persistent Firestore caching;
- add paid services, custom infrastructure, or machine-level changes;
- globally replace every occurrence of `UH-Trello`;
- rename `C:/Code/Stacie-Hermes/UH-Trello` unless Aaron gives separate explicit approval;
- merge, deploy, or dispatch production workflows before the cutover gate;
- leave `kcchanai` as the active GitHub CLI account after Flowboard operations.

Public Flowboard copy must contain no em dashes.

## Why a dynamic base-path transition is required

A direct pre-rename replacement from `/UH-Trello/` to `/UH-Flowboard/` would break the currently deployed site before the repository is renamed. Renaming first would make the new Pages path serve an artifact built for the old path until a new deployment completes.

Implement one dual-compatible base-path mechanism first:

- before rename, GitHub Actions derives `/UH-Trello/` from `GITHUB_REPOSITORY`;
- after rename, the same source derives `/UH-Flowboard/` automatically;
- local validation can explicitly override the repository name to test both paths;
- browser-runtime test loaders derive their path from `import.meta.url` or `location`, not a hard-coded repository name.

This compatibility change must be merged and deployed successfully under the old name before Aaron clicks Rename.

## Stage 0 - preflight and classification

1. Confirm the active branch and clean worktree.
2. Confirm the current `origin` URL.
3. Record `HEAD`, `origin/main`, current Pages status, current Pages URL, and recent Actions state.
4. With read-only commands, classify every `UH-Trello` occurrence as one of:
   - GitHub repository identifier that must become `UH-Flowboard`;
   - Pages base path that must become dynamic;
   - old URL retained only as migration history;
   - local filesystem path `C:/Code/Stacie-Hermes/UH-Trello` that must remain unchanged;
   - historical document text that should remain historical;
   - test fixture or fallback that must become dynamic.
5. Search for hosted-action references such as:

```text
uses: kcchanai/UH-Trello@...
```

GitHub does not redirect Actions hosted by renamed repositories. There should be no such live dependency. If one exists, stop and design a specific migration rather than assuming a redirect.
6. Temporarily switch `gh` to `kcchanai` only for the authenticated availability and permissions checks, then immediately restore `makoaharadasaito`:
   - confirm `kcchanai/UH-Flowboard` does not already exist;
   - confirm `kcchanai` has repository admin access;
   - confirm Actions and Pages settings are readable;
   - do not rename anything.
7. Never print token values. `gh auth status` may show masked tokens only.

## Stage 1 - centralize repository-name and base-path derivation

Create a small, readable shared Node module, for example:

```text
scripts/repository-path.mjs
```

It should derive a validated repository name using this priority:

1. explicit local/test override such as `FLOWBOARD_REPOSITORY_NAME`;
2. repository component of GitHub Actions `GITHUB_REPOSITORY`;
3. local fallback `UH-Trello` until the cutover commit is intentionally updated after rename, if a fallback remains necessary.

Export values such as:

```text
repositoryName
basePath
previewUrl(port)
```

Requirements:

- repository name must match a conservative GitHub repository-name character allowlist;
- `basePath` must contain exactly one leading and trailing slash;
- no untrusted value may produce `..`, query text, fragments, backslashes, or an external URL;
- browser production code must not import Node-only helpers;
- keep the helper small enough that the source budget remains at or below the required threshold;
- add dependency-free Node tests for old name, new name, GitHub Actions input, explicit override, and invalid values.

If importing the helper from `vite.config.mjs` creates avoidable complexity, keep equivalent derivation in the config and use one separately tested Node helper for test/workflow tooling. Do not duplicate repository-name parsing across many files.

## Stage 2 - make Vite and automated validation dual-compatible

### `vite.config.mjs`

Replace the hard-coded:

```text
base: '/UH-Trello/'
```

with the validated derived base path.

Required behavior:

- ordinary local development defaults safely to the current repository name before cutover;
- `FLOWBOARD_REPOSITORY_NAME=UH-Flowboard` builds and previews at `/UH-Flowboard/`;
- GitHub Actions automatically uses the repository component of `GITHUB_REPOSITORY`;
- the final build contains no accidental double prefix or root-only asset URL.

### `.github/workflows/validate.yml`

Remove hard-coded `/UH-Trello/` health and Lighthouse URLs.

Derive the base path from `${GITHUB_REPOSITORY#*/}` in shell or set a validated workflow environment value. Use the same derived path for:

- preview readiness;
- browser tests;
- Lighthouse;
- any diagnostic URL.

Do not use workflow expression syntax that is invalid inside shell parameter expansion. Test the actual YAML and shell behavior.

### `.github/workflows/deploy-pages.yml`

The Pages workflow should continue building from the same source and deploying `dist`. It normally does not need a literal repository name after Vite becomes dynamic.

Confirm:

- the workflow contains no old hard-coded Pages URL;
- `actions/configure-pages`, artifact upload, and deployment remain unchanged unless a verified requirement says otherwise;
- deployment remains gated by the project’s existing validation expectations for the same commit.

### Browser tests

Update `tests/browser-smoke.spec.mjs` so the base URL comes from:

1. an explicit environment override when provided;
2. the derived repository base path;
3. the current local default before cutover.

Do not hard-code `/UH-Flowboard/` as the only path. Luna must run the suite against both names before cutover.

### Emulator browser harness

Update:

```text
tests/emulator/index.html
tests/emulator/loader.mjs
tests/emulator/emulator-browser.spec.mjs
scripts/run-emulator-browser.mjs
```

Requirements:

- the static test-shell module path remains Vite-relative so Vite applies its configured base;
- runtime-injected URLs derive from `import.meta.url`, `location`, or the shared validated test base;
- no `/UH-Trello/UH-Trello/` or `/UH-Flowboard/UH-Flowboard/` duplication is possible;
- the runner’s default and explicit override work on Windows and CI;
- Emulator hosts, project IDs, test globals, and seed controls remain absent from production chunks.

## Stage 3 - update active documentation without corrupting local paths

Update active repository and Pages links to the future name where appropriate, but do not perform an indiscriminate replacement.

Review at minimum:

```text
README.md
VALIDATION_CHECKLIST.md
WORKFLOW_QUALIFICATION.md
LUNA_FULL_WORKFLOW_IMPLEMENTATION_PLAN.md
LUNA_CONTINUATION_HANDOFF.md
LUNA_SOURCE_HEADROOM_EXECUTION_PROMPT.md
LUNA_SOURCE_HEADROOM_IMPLEMENTATION_PLAN.md
AUTH_COLLABORATION_IMPLEMENTATION_PLAN.md
FIREBASE_COLLABORATION_PLAN.md
TERRA_AUTH_COLLABORATION_PROMPT.md
```

Rules:

- keep `C:/Code/Stacie-Hermes/UH-Trello` wherever it describes the existing local directory;
- change repository URLs to `kcchanai/UH-Flowboard` only when they describe the post-cutover remote;
- change Pages URLs to `/UH-Flowboard/` only when they describe the post-cutover site;
- label the old repository and Pages URLs as historical/cutover values when retained;
- prefer relative repository links in README where possible;
- do not rewrite pinned commit hashes or historical evidence;
- update instructions so future validation defaults to the derived base rather than embedding either name.

Add a concise rename note documenting:

- old and new repository URLs;
- old and new Pages URLs;
- GitHub repository redirects apply;
- project Pages URL redirects do not apply;
- the old name must not be reused for a new repository because that would break redirects;
- local folder name remains unchanged.

## Stage 4 - local dual-path qualification

Before any remote rename, validate both base paths from the same candidate source.

### Current-name compatibility

Run build, preview, browser tests, and Lighthouse with:

```text
FLOWBOARD_REPOSITORY_NAME=UH-Trello
```

Require the served path:

```text
/UH-Trello/
```

### Future-name compatibility

Run the same build, preview, browser tests, Emulator-browser workflow, production-asset isolation, and Lighthouse with:

```text
FLOWBOARD_REPOSITORY_NAME=UH-Flowboard
```

Require the served path:

```text
/UH-Flowboard/
```

### Complete validation

At minimum run:

```text
npm test
npm run check
npm run build
npm run test:rules
npm run test:emulator-browser
git diff --check
```

For each base path, run the full production-preview browser suite and Lighthouse accessibility. Require:

- all unit tests pass with exact count;
- all Rules tests pass with exact count;
- all browser tests pass with exact count under both base paths;
- Emulator browser workflow passes;
- production build passes under both names;
- production asset isolation passes;
- Lighthouse accessibility score is 1 with zero failed audits under both names;
- no unexpected browser console errors;
- no page-level path or asset 404s;
- source budget remains at or below the operational threshold;
- public-copy em-dash scan passes;
- generated logs and reports are removed.

Obtain independent read-only review of:

- base-path derivation and input validation;
- Actions shell/YAML correctness;
- Pages cutover order;
- Firebase Auth host assumptions;
- accidental local-path replacements;
- production and rollback safety.

## Stage 5 - commit preparation only

Commit the dual-compatible rename preparation on `luna/flowboard-operational-v1`.

Suggested commit message:

```text
Prepare Flowboard for repository rename
```

Do not push, merge, deploy, dispatch workflows, or rename the repository yet.

Report a single readiness checkpoint containing:

- candidate commit SHA;
- exact source and test results;
- old-name and new-name browser/Lighthouse results;
- all files containing an intentional old-name reference;
- independent-review result;
- expected cutover steps;
- rollback steps;
- explicit line:

```text
READY FOR UH-FLOWBOARD CUTOVER
```

Then stop and wait for Aaron’s explicit cutover authorization.

## Human cutover gate

The cutover must be treated as one coordinated production operation because the Pages project URL changes.

Aaron must explicitly authorize:

1. merging the exact dual-compatible candidate to `main` while the repository is still named `UH-Trello`;
2. deploying and verifying the old Pages URL from that exact commit;
3. renaming the repository to `UH-Flowboard`;
4. dispatching or triggering the new-name Pages build;
5. verifying the new repository and Pages URLs.

Do not interpret preparation approval as cutover approval.

## Stage 6 - pre-rename production compatibility deployment

Only after explicit cutover authorization:

1. Temporarily switch GitHub CLI to `kcchanai` for Flowboard operations.
2. Push the exact candidate branch.
3. Open or update the review path required by repository policy.
4. Verify CI for the exact full SHA.
5. Merge only the exact approved candidate to `main`.
6. Verify the deployment workflow for that exact main SHA.
7. Load a cache-busted current URL:

```text
https://kcchanai.github.io/UH-Trello/?rename-preflight=<full-sha>
```

8. Verify:
   - normal local-mode rendering;
   - zero unexpected console errors;
   - asset URLs remain under `/UH-Trello/`;
   - no local or production Firebase data is mutated;
   - the active Pages deployment SHA matches the approved commit.
9. Restore `makoaharadasaito` as the active GitHub CLI account immediately after the bounded operation.
10. If old-name production verification fails, stop. Do not rename the repository.

## Stage 7 - Aaron renames the repository

After Luna reports that the old-name compatibility deployment passed, Aaron performs the GitHub settings action:

1. Open `https://github.com/kcchanai/UH-Trello/settings`.
2. In Repository name, enter exactly:

```text
UH-Flowboard
```

3. Click **Rename** once.
4. Do not create another repository named `UH-Trello` afterward.
5. Report only that the rename completed. Do not send credentials or tokens.

Luna must not guess that the rename succeeded. Verify the new repository directly before continuing.

## Stage 8 - immediate post-rename cutover

After Aaron reports completion:

1. Verify:

```text
https://github.com/kcchanai/UH-Flowboard
```

resolves to the expected repository and retains the same repository identity/history.
2. Verify the old repository URL redirects to the new repository.
3. Update the local remote:

```text
git remote set-url origin https://github.com/kcchanai/UH-Flowboard.git
```

4. Read back `git remote -v` and verify both fetch and push URLs exactly.
5. Do not rename the local folder.
6. Temporarily switch `gh` to `kcchanai`.
7. Verify repository variables and Pages settings still exist without printing variable values.
8. Trigger the deployment workflow for the exact current `main` SHA if the rename did not automatically produce a successful new-name deployment.
9. Poll Actions until validation and Pages deployment for the exact SHA succeed.
10. Poll Pages status until built.
11. Load a cache-busted new URL:

```text
https://kcchanai.github.io/UH-Flowboard/?rename-cutover=<full-sha>
```

12. Verify:
   - HTTP success;
   - all JS/CSS assets load from `/UH-Flowboard/`;
   - no requests use `/UH-Trello/` except an explicitly tested old URL;
   - local mode loads normally;
   - account/cloud configuration reports the expected configured or local-only state without exposing values;
   - zero unexpected console errors;
   - no production workspace is opened or mutated.
13. Restore `makoaharadasaito` as the active GitHub CLI account.

## Stage 9 - post-cutover cleanup commit

After the new site is verified:

1. Update any documentation that intentionally remained on the old URL until cutover.
2. Change a local fallback from `UH-Trello` to `UH-Flowboard` only if the dynamic mechanism still needs a fallback.
3. Keep a clearly labelled historical old URL only in the rename record.
4. Search again for:

```text
/UH-Trello/
kcchanai/UH-Trello
UH-Trello.git
```

Every remaining occurrence must be one of:

- existing local filesystem path;
- historical migration record;
- explicit redirect verification;
- rollback documentation.

5. Rerun validation under the new default.
6. Commit the documentation/fallback cleanup separately.
7. Push and verify CI if explicitly authorized as part of the cutover.

Suggested commit message:

```text
Complete UH-Flowboard repository cutover
```

## Firebase and authentication verification

The Pages host remains `kcchanai.github.io`; only the path changes. Firebase authorized-domain configuration is generally host-based, so the path rename should not require a new authorized domain. Do not assume this is sufficient proof.

Verify without exposing configuration values:

- production build recognizes the existing Firebase configuration;
- Google sign-in button/configuration state is unchanged;
- no OAuth or callback configuration contains a path-specific `/UH-Trello/` value;
- invitation links generated after cutover use `/UH-Flowboard/`;
- old invitation links are treated as old-site links and are not claimed to redirect through Pages;
- no real sign-in or production account testing occurs unless separately authorized at the applicable human gate.

## Rollback strategy

### Before remote rename

If compatibility implementation or old-name production verification fails:

- leave repository name unchanged;
- revert or fix the candidate through normal branch review;
- keep the old Pages site active;
- do not proceed to rename.

### After remote rename but before new Pages verification

Prefer completing the new-name deployment over immediately renaming back, because repeated renames can create link confusion.

If a critical issue cannot be corrected promptly:

1. preserve the failing workflow and console diagnostics without sensitive content;
2. determine whether the fault is repository settings, Actions variables, Pages configuration, or base-path output;
3. if Aaron authorizes rollback, rename the repository back to `UH-Trello`;
4. restore the old remote URL;
5. dispatch and verify the old-name Pages build;
6. document the failed cutover and do not reuse `UH-Flowboard` until the next reviewed attempt.

Do not create a second repository as a shortcut. Do not reuse the old name for a different repository.

## Required final report

Report:

- old and new repository URLs;
- old and new Pages URLs;
- preparation, merge, rename, and cleanup commit SHAs;
- exact CI and Pages workflow run URLs/IDs;
- exact test counts;
- both pre-cutover base-path validation results;
- post-cutover HTTP, asset-path, and console results;
- `origin` fetch/push URLs after cutover;
- confirmation that repository history, issues, settings, Actions variables, and Pages configuration remain attached;
- Firebase host/path verification result without values;
- remaining intentional `UH-Trello` references;
- confirmation that the local folder was not renamed;
- confirmation that `makoaharadasaito` was restored as the active GitHub CLI account;
- confirmation that Firestore Rules, production data, protected workspaces, and real accounts were untouched unless separately authorized;
- any external links or bookmarks Aaron still needs to update.

The rename is complete only when the new repository URL and new Pages URL are verified against the exact approved `main` SHA. A successful GitHub Rename button alone is not completion proof.
