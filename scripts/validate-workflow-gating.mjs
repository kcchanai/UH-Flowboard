import {readFile} from 'node:fs/promises';

const [validate, deploy] = await Promise.all([
  readFile('.github/workflows/validate.yml', 'utf8'),
  readFile('.github/workflows/deploy-pages.yml', 'utf8')
]);
const requiredValidation = [
  'npm run validate', 'npm run test:rules', 'npx playwright test tests/cloud-first-configured-session.spec.mjs tests/cloud-first-a11y.spec.mjs tests/browser-smoke.spec.mjs --grep="cloud-first board|Filters stays bounded"',
  'emulators:exec --only auth,firestore', 'npx lighthouse', 'node scripts/assert-lighthouse.mjs'
];
for (const step of requiredValidation) if (!validate.includes(step)) throw new Error(`Validation workflow is missing ${step}.`);
if (!deploy.includes('workflow_run:') || !deploy.includes('workflows: ["Validate Flowboard"]')) throw new Error('Pages deployment is not gated by the validation workflow.');
if (!deploy.includes("github.event.workflow_run.conclusion == 'success'") || !deploy.includes("github.event.workflow_run.event == 'push'") || !deploy.includes("github.event.workflow_run.head_branch == 'main'")) throw new Error('Pages deployment lacks a successful main-push workflow gate.');
if (!deploy.includes('ref: ${{ github.event.workflow_run.head_sha || github.sha }}')) throw new Error('Pages deployment does not checkout the validated commit SHA.');
if (/\n  push:\n/.test(deploy)) throw new Error('Pages deployment must not deploy directly from an independent push trigger.');
if (!deploy.includes('run: npm run build')) throw new Error('Pages deployment does not build the checked-out validated commit.');
console.log('Workflow release gate passed: Pages deploys only after successful same-SHA main validation.');
