import {test, expect} from '@playwright/test';
import {previewUrl} from '../../scripts/repository-path.mjs';

test.describe.configure({mode: 'serial'});
const baseURL = (process.env.PLAYWRIGHT_EMULATOR_BASE_URL || previewUrl(4174)).replace(/\/$/, '');
const fixtureName = 'Flowboard Emulator Workflow';
const cardName = 'Synthetic shared card';

async function openRole(page, role) {
  await page.goto(`${baseURL}/tests/emulator/index.html?role=${role}`);
  await page.waitForFunction(() => globalThis.__flowboardEmulatorTest?.ready === true);
  await expect(page.locator('#account-button')).toBeVisible();
}

async function openFixture(page) {
  await page.locator('#account-button').click();
  const account = page.locator('#account-dialog');
  await expect(account).toBeVisible();
  await account.getByRole('button', {name: 'Cloud workspaces'}).click();
  const picker = page.locator('#cloud-workspaces-dialog');
  const row = picker.locator('.workspace-entry').filter({hasText: fixtureName});
  await expect(row).toBeVisible();
  await row.getByRole('button', {name: `Open ${fixtureName}`}).click();
  await expect(page.locator('.card-open').filter({hasText: cardName})).toBeVisible();
  await page.locator('#close-cloud-workspaces').click();
}

test('Auth and Firestore Emulator workflow proves discovery, convergence, denial, conflict, revocation, and lifecycle', async ({browser}) => {
  const ownerContext = await browser.newContext();
  const editorContext = await browser.newContext();
  const viewerContext = await browser.newContext();
  const owner = await ownerContext.newPage();
  const editor = await editorContext.newPage();
  const viewer = await viewerContext.newPage();
  try {
    await openRole(owner, 'owner');
    await owner.evaluate(() => globalThis.__flowboardEmulatorTest.seedFixture());
    await openFixture(owner);

    await openRole(editor, 'editor');
    await openFixture(editor);
    await openRole(viewer, 'viewer');
    await openFixture(viewer);
    await expect(viewer.locator('#cloud-status')).toContainText('Cloud preview');

    await editor.locator('.list').first().locator('.list-menu').click();
    await editor.locator('.list').first().getByRole('menuitem', {name:'Move right'}).click();
    await expect.poll(() => owner.locator('.list-title').first().inputValue()).toBe('Review');
    await expect.poll(() => viewer.locator('.list-title').first().inputValue()).toBe('Review');

    const firstUpdate = 'Editor converged update';
    await editor.evaluate(title => globalThis.__flowboardEmulatorTest.mutateCard(title), firstUpdate);
    await expect(owner.locator('.card-open').filter({hasText: firstUpdate})).toBeVisible();
    await expect(viewer.locator('.card-open').filter({hasText: firstUpdate})).toBeVisible();

    const denied = await viewer.evaluate(() => globalThis.__flowboardEmulatorTest.viewerWriteAttempt());
    expect(denied.result).toBe('permission-denied');

    await owner.evaluate(() => globalThis.__flowboardEmulatorTest.captureWorkspace());
    const secondUpdate = 'Editor current update';
    await editor.evaluate(title => globalThis.__flowboardEmulatorTest.mutateCard(title), secondUpdate);
    const conflict = await owner.evaluate(async title => {
      try {
        await globalThis.__flowboardEmulatorTest.mutateCapturedCard(title);
        return 'unexpected-success';
      } catch (error) {
        return error.code || 'unknown';
      }
    }, 'Stale owner update');
    expect(conflict).toBe('REVISION_CONFLICT');
    await expect(owner.locator('.card-open').filter({hasText: secondUpdate})).toBeVisible();

    await owner.evaluate(() => globalThis.__flowboardEmulatorTest.changeEditorRole('viewer'));
    await expect.poll(() => editor.evaluate(() => globalThis.FlowboardApp.getMode().kind)).toBe('cloud-preview');
    await expect(editor.locator('#announcer')).toContainText('role changed to viewer');
    const downgraded = await editor.evaluate(() => globalThis.__flowboardEmulatorTest.viewerWriteAttempt());
    expect(downgraded.result).toBe('permission-denied');

    await owner.evaluate(() => globalThis.__flowboardEmulatorTest.removeEditor());
    await expect.poll(() => editor.evaluate(() => globalThis.FlowboardApp.getMode().kind)).toBe('local');
    await expect(editor.getByText('Browser-local workspace · editable')).toBeVisible();

    await owner.evaluate(() => globalThis.__flowboardEmulatorTest.archiveWorkspace());
    await expect.poll(() => owner.evaluate(() => globalThis.FlowboardApp.getMode().kind)).toBe('local');
    await expect.poll(() => viewer.evaluate(() => globalThis.FlowboardApp.getMode().kind)).toBe('local');
    await owner.evaluate(() => globalThis.__flowboardEmulatorTest.restoreWorkspace());

    await owner.locator('#account-button').click();
    await owner.locator('#account-dialog').getByRole('button', {name: 'Cloud workspaces'}).click();
    const restoredRow = owner.locator('#cloud-workspaces-list .workspace-entry').filter({hasText: fixtureName});
    await expect(restoredRow).toContainText('Cloud workspace · owner · editable');
    await restoredRow.getByRole('button', {name: `Open ${fixtureName}`}).click();
    await expect(owner.locator('.card-open').filter({hasText: secondUpdate})).toBeVisible();
  } finally {
    await Promise.all([ownerContext.close(), editorContext.close(), viewerContext.close()]);
  }
});
