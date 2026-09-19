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
  await expect.poll(()=>page.evaluate(()=>globalThis.FlowboardApp.getMode().kind)).toMatch(/cloud/);
  expect(await page.evaluate(()=>{const board=FlowboardApp.getActiveBoardSnapshot();return{hasBoard:Boolean(board),lists:board?.lists.length||0,cards:board?.lists.reduce((sum,list)=>sum+list.cards.length,0)||0};})).toEqual({hasBoard:true,lists:2,cards:1});
  expect(await page.evaluate(()=>{const root=document.querySelector('#board');return{cardButtons:root.querySelectorAll('.card-open').length,listView:root.classList.contains('list-view-active'),lists:root.querySelectorAll('.list').length,gate:root.classList.contains('is-gated')};})).toEqual({cardButtons:1,listView:false,lists:2,gate:false});
  await expect(page.locator('.card-open').filter({hasText: cardName})).toBeVisible();
  await page.locator('#close-cloud-workspaces').click();
}

test('fresh account bootstraps one empty personal cloud workspace across contexts without touching legacy bytes', async ({browser}) => {
  const firstContext=await browser.newContext(), secondContext=await browser.newContext();
  const legacy='{"legacy":"unchanged"}';
  await Promise.all([firstContext,secondContext].map(async context=>{await context.addInitScript(value=>localStorage.setItem('flowboard-workspace',value),legacy);await context.route('**/favicon.ico',route=>route.fulfill({status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg"/>'}));}));
  const first=await firstContext.newPage(), second=await secondContext.newPage(), errors=[];
  for(const page of [first,second]){page.on('pageerror',()=>errors.push('page'));page.on('console',message=>{if(message.type()==='error'){const text=message.text();errors.push(text.includes('Flowboard cloud session')?'flowboard-session':text.includes('@firebase/firestore')?'firestore-sdk':text.includes('Failed to load resource')?`resource:${new URL(message.location().url||baseURL).pathname}`:'other-console');}});}
  try{
    for(const [index,page] of [first,second].entries()){
      await page.goto(`${baseURL}/tests/emulator/index.html?personal=1`);
      await page.waitForFunction(()=>globalThis.__flowboardEmulatorTest?.ready===true);
      await page.evaluate(method=>globalThis.__flowboardEmulatorTest[method](),index===0?'signInFreshPersonal':'signInExistingPersonal');
      await expect.poll(()=>page.evaluate(()=>globalThis.FlowboardApp.getMode().kind)).toBe('cloud');
      await expect(page.locator('#board').getByRole('heading',{name:'Your workspace is ready'})).toBeVisible();
      expect(await page.evaluate(()=>localStorage.getItem('flowboard-workspace'))).toBe(legacy);
      expect(await page.evaluate(()=>globalThis.__flowboardEmulatorTest.personalSummary())).toEqual({signedIn:true,hasPointer:true,workspaceExists:true,role:'owner',boardCount:0});
    }
    expect(errors).toEqual([]);
  } finally { await Promise.all([firstContext.close(),secondContext.close()]); }
});

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
    expect(await owner.evaluate(()=>globalThis.__flowboardEmulatorTest.fixtureSummary())).toEqual({boards:1,lists:2,cards:1,currentRole:'owner',adapterRole:'owner',entryRole:'owner'});

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
    await expect.poll(() => editor.evaluate(() => globalThis.FlowboardApp.getMode().kind)).toBe('access-lost');
    await expect(editor.locator('#board').getByRole('heading',{name:'Workspace access ended'})).toBeVisible();

    await owner.evaluate(() => globalThis.__flowboardEmulatorTest.archiveWorkspace());
    await expect.poll(() => owner.evaluate(() => globalThis.FlowboardApp.getMode().kind)).toBe('access-lost');
    await expect.poll(() => viewer.evaluate(() => globalThis.FlowboardApp.getMode().kind)).toBe('access-lost');
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
