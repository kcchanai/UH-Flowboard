import {test, expect} from '@playwright/test';
import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
import {doc,Timestamp,writeBatch} from 'firebase/firestore';
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
  await account.getByRole('button', {name: 'Boards'}).click();
  const picker = page.locator('#workspace-dialog');
  const row = picker.locator('#workspace-board-list .workspace-entry').filter({hasText: 'Emulator board'});
  await expect(row).toBeVisible();
  await row.getByRole('button', {name: /Open Emulator board/}).click();
  await expect.poll(()=>page.evaluate(()=>globalThis.FlowboardApp.getMode().kind)).toMatch(/cloud/);
  expect(await page.evaluate(()=>{const board=FlowboardApp.getActiveBoardSnapshot();return{hasBoard:Boolean(board),lists:board?.lists.length||0,cards:board?.lists.reduce((sum,list)=>sum+list.cards.length,0)||0};})).toEqual({hasBoard:true,lists:2,cards:1});
  expect(await page.evaluate(()=>{const root=document.querySelector('#board');return{cardButtons:root.querySelectorAll('.card-open').length,listView:root.classList.contains('list-view-active'),lists:root.querySelectorAll('.list').length,gate:root.classList.contains('is-gated')};})).toEqual({cardButtons:1,listView:false,lists:2,gate:false});
  await expect(page.locator('.card-open').filter({hasText: cardName})).toBeVisible();
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
      await expect.poll(()=>page.evaluate(()=>globalThis.FlowboardApp.getMode().kind),{timeout:15000}).toBe('cloud');
      await expect(page.locator('#board').getByRole('heading',{name:'Your workspace is ready'})).toBeVisible();
      expect(await page.evaluate(()=>localStorage.getItem('flowboard-workspace'))).toBe(legacy);
      expect(await page.evaluate(()=>globalThis.__flowboardEmulatorTest.personalSummary())).toEqual({signedIn:true,hasPointer:true,workspaceExists:true,role:'owner',boardCount:0});
    }
    expect(errors).toEqual([]);
  } finally { await Promise.all([firstContext.close(),secondContext.close()]); }
});

test('existing workspace hints bootstrap a separate personal home without a workspace choice', async ({page}) => {
  await page.goto(`${baseURL}/tests/emulator/index.html?personal=1`);
  await page.waitForFunction(() => globalThis.__flowboardEmulatorTest?.ready === true);
  const result = await page.evaluate(() => globalThis.__flowboardEmulatorTest.existingHintsContext());
  expect(result).toEqual({state:'created',hasPointer:true,hintPreserved:true,workspacePersonal:true,workspaceReady:true,role:'owner'});
  await expect.poll(() => page.evaluate(() => globalThis.FlowboardApp.getMode().kind), {timeout:15000}).toBe('cloud');
  await expect(page.locator('#board').getByRole('heading',{name:'Your workspace is ready'})).toBeVisible();
});

test('unified My workspace creates the first cloud board and opens it across contexts',async({browser})=>{
  const firstContext=await browser.newContext(),secondContext=await browser.newContext(),first=await firstContext.newPage(),second=await secondContext.newPage();
  try{
    await first.goto(`${baseURL}/tests/emulator/index.html?personal=1`);await first.waitForFunction(()=>globalThis.__flowboardEmulatorTest?.ready===true);await first.evaluate(()=>globalThis.__flowboardEmulatorTest.signInFreshPersonal());await expect.poll(()=>first.evaluate(()=>globalThis.FlowboardApp.getMode().kind),{timeout:15000}).toBe('cloud');
    await first.locator('#boards-button').click();const manager=first.locator('#workspace-dialog');await expect(manager).toBeVisible();await expect(manager.locator('#workspace-search')).toBeFocused();await expect(first.locator('#cloud-workspaces-dialog')).toHaveCount(0);await manager.locator('#new-board-title').fill('Cross context board');await manager.locator('#board-template').selectOption('blank');await manager.getByRole('button',{name:'Create board'}).click();await expect.poll(()=>first.evaluate(async()=>({title:globalThis.FlowboardApp.getActiveBoardSnapshot()?.title||'',status:document.querySelector('#cloud-workspaces-status').textContent,directory:(await globalThis.FlowboardRuntime.cloudAdapter.listBoardDirectory()).map(space=>({name:space.name,status:space.status,migration:space.migration?.state,unavailable:Boolean(space.unavailable),boards:space.boards.map(board=>board.title)}))})),{timeout:15000}).toEqual({title:'Cross context board',status:'All board metadata is synchronized.',directory:[{name:'My workspace',status:'ready',migration:'verified',unavailable:false,boards:['Cross context board']}]});await expect(manager.locator('#workspace-board-list')).toContainText('Cross context board',{timeout:15000});expect(await first.evaluate(async()=>{const command=globalThis.FlowboardApp.getLastCommand();return{started:command.started,status:command.status,completion:(await command.completion).status};})).toEqual({started:true,status:'pending',completion:'committed'});await manager.getByRole('button',{name:'Close My workspace'}).click();await expect(first.locator('#boards-button')).toBeFocused();
    await second.goto(`${baseURL}/tests/emulator/index.html?personal=1`);await second.waitForFunction(()=>globalThis.__flowboardEmulatorTest?.ready===true);await second.evaluate(()=>globalThis.__flowboardEmulatorTest.signInExistingPersonal());await expect.poll(()=>second.evaluate(()=>globalThis.FlowboardApp.getMode().kind),{timeout:15000}).toBe('cloud');await second.locator('#boards-button').click();const row=second.locator('#workspace-board-list .workspace-entry').filter({hasText:'Cross context board'});await expect(row).toBeVisible();await row.getByRole('button',{name:/Open Cross context board/}).click();await expect(second.locator('#board-title')).toHaveValue('Cross context board');
  }finally{await Promise.all([firstContext.close(),secondContext.close()]);}
});

test('same-named boards across same-named scopes stay distinct when a stale scope is missing',async({browser})=>{
  const context=await browser.newContext(),page=await context.newPage(),secondId='same-name-scope',missingId='missing-scope';
  try{
    await page.goto(`${baseURL}/tests/emulator/index.html?personal=1`);await page.waitForFunction(()=>globalThis.__flowboardEmulatorTest?.ready===true);const personal=await page.evaluate(()=>globalThis.__flowboardEmulatorTest.personalContext());await expect.poll(()=>page.evaluate(()=>globalThis.FlowboardApp.getMode().kind),{timeout:15000}).toBe('cloud');const[host,port]=process.env.FIRESTORE_EMULATOR_HOST.split(':'),admin=await initializeTestEnvironment({projectId:'demo-flowboard-browser',firestore:{host,port:Number(port)}});try{await admin.withSecurityRulesDisabled(async adminContext=>{const db=adminContext.firestore(),now=Timestamp.now(),batch=writeBatch(db),personalRoot=doc(db,'workspaces',personal.workspaceId),secondRoot=doc(db,'workspaces',secondId);batch.set(doc(personalRoot,'boards','same-title-personal'),{id:'same-title-personal',title:'Same-named board',rank:20,archived:false,lifecycleState:'active',revision:0,clientMutationId:'same-title-personal-create',updatedAt:now});batch.set(secondRoot,{name:'My workspace',ownerUid:personal.uid,schemaVersion:5,status:'ready',personal:false,lifecycleRevision:0,activeBoardId:'same-title-shared',migration:{version:1,state:'verified',counts:{boards:1,lists:0,cards:0}},updatedAt:now});batch.set(doc(secondRoot,'members',personal.uid),{uid:personal.uid,role:'owner',emailLower:'owner@example.test'});batch.set(doc(secondRoot,'boards','same-title-shared'),{id:'same-title-shared',title:'Same-named board',rank:0,archived:false,lifecycleState:'active',revision:0,clientMutationId:'same-title-shared-create',updatedAt:now});batch.update(doc(db,'users',personal.uid),{workspaceIds:[personal.workspaceId,secondId,missingId]});await batch.commit();});}finally{await admin.cleanup();}await page.evaluate(async workspaceId=>{const adapter=FlowboardRuntime.cloudAdapter,workspace=await adapter.fetchWorkspace(workspaceId);FlowboardApp.openCloudWorkspace(workspace,{id:workspaceId,name:'My workspace',ownerUid:(await adapter.getSession()).uid,role:'owner',status:'ready',personal:true,migration:{state:'verified'}});},personal.workspaceId);await page.waitForTimeout(500);await page.evaluate(async workspaceId=>{const adapter=FlowboardRuntime.cloudAdapter,workspace=await adapter.fetchWorkspace(workspaceId);FlowboardApp.openCloudWorkspace(workspace,{id:workspaceId,name:'My workspace',ownerUid:(await adapter.getSession()).uid,role:'owner',status:'ready',personal:true,migration:{state:'verified'}});},personal.workspaceId);
    await expect.poll(()=>page.evaluate(()=>globalThis.FlowboardApp.getMode().kind),{timeout:15000}).toBe('cloud');await page.locator('#boards-button').click();const rows=page.locator('#workspace-board-list .workspace-entry').filter({hasText:'Same-named board'});await expect(rows).toHaveCount(2);await expect(rows.filter({hasText:'Scope 1 of 2'})).toHaveCount(1);await expect(rows.filter({hasText:'Scope 2 of 2'})).toHaveCount(1);await rows.filter({hasText:'Scope 2 of 2'}).getByRole('button',{name:/Open Same-named board/}).click();await expect.poll(()=>page.evaluate(expected=>globalThis.FlowboardApp.getMode().id===expected,secondId)).toBe(true);await page.locator('#boards-button').click();const manager=page.locator('#workspace-dialog');await manager.locator('#new-board-title').fill('Personal destination board');await manager.getByRole('button',{name:'Create board'}).click();await expect.poll(()=>page.evaluate(expected=>globalThis.FlowboardApp.getMode().id===expected,personal.workspaceId),{timeout:15000}).toBe(true);await expect(page.locator('#board-title')).toHaveValue('Personal destination board');
  }finally{await context.close();}
});

test('My workspace loads every board page without duplicates and restores focus',async({browser})=>{
  const context=await browser.newContext(),page=await context.newPage();
  try{
    await page.goto(`${baseURL}/tests/emulator/index.html?personal=1`);await page.waitForFunction(()=>globalThis.__flowboardEmulatorTest?.ready===true);await page.evaluate(()=>globalThis.__flowboardEmulatorTest.seedDirectoryPages());await expect.poll(()=>page.evaluate(()=>globalThis.FlowboardApp.getMode().kind),{timeout:15000}).toBe('cloud');
    await page.locator('#boards-button').click();const manager=page.locator('#workspace-dialog'),paged=manager.locator('#workspace-board-list .workspace-entry').filter({hasText:'Paged board'});await expect(manager.locator('#cloud-workspaces-status')).toHaveText('More boards are available.');const firstCount=await paged.count();expect(firstCount).toBeGreaterThan(0);expect(firstCount).toBeLessThan(30);await expect(manager.getByRole('button',{name:/Load more boards from My workspace/})).toBeVisible();await manager.getByRole('button',{name:/Load more boards/}).click();await expect(paged).toHaveCount(30);await expect(manager.getByRole('button',{name:/Load more boards from My workspace/})).toHaveCount(0);const labels=await paged.locator('strong').allTextContents();expect(new Set(labels).size).toBe(30);await manager.getByRole('button',{name:'Close My workspace'}).click();await expect(page.locator('#boards-button')).toBeFocused();
  }finally{await context.close();}
});

test('a stale board open cannot replace the later selection',async({page})=>{
  await page.goto(`${baseURL}/tests/emulator/directory-race.html`);await page.waitForFunction(()=>globalThis.__directoryRace?.ready===true);await page.locator('#boards-button').click();const manager=page.locator('#workspace-dialog');await expect(manager).toBeVisible();const rows=manager.locator('#workspace-board-list .workspace-entry');await rows.filter({hasText:'Board A'}).getByRole('button',{name:/Open Board A/}).click();await rows.filter({hasText:'Board B'}).getByRole('button',{name:/Open Board B/}).click();await expect.poll(()=>page.evaluate(()=>globalThis.__directoryRace.active()),{timeout:1000}).toBe('board-b');await page.waitForTimeout(150);expect(await page.evaluate(()=>globalThis.__directoryRace.active())).toBe('board-b');
});

test('a late cloud command result cannot replace a newer workspace context',async({page})=>{
  await page.goto(`${baseURL}/tests/emulator/index.html?personal=1&commandRace=1`);await page.waitForFunction(()=>globalThis.__flowboardEmulatorTest?.ready===true);await page.evaluate(()=>globalThis.__flowboardEmulatorTest.signInFreshPersonal());await expect.poll(()=>page.evaluate(()=>globalThis.FlowboardApp.getMode().kind),{timeout:15000}).toBe('cloud');const result=await page.evaluate(async()=>{const command=globalThis.FlowboardApp.createBoard('Late command board','blank');globalThis.FlowboardApp.openCloudWorkspace(globalThis.FlowboardState.makeEmptyWorkspace(),{id:'replacement-context',name:'Replacement context',role:'owner'});const completion=await command.completion;return{status:completion.status,replacement:globalThis.FlowboardApp.getMode().id==='replacement-context',boards:globalThis.FlowboardApp.getActiveBoardSnapshot()===null};});expect(result).toEqual({status:'stale',replacement:true,boards:true});
});

test('account switching immediately clears and closes the prior directory',async({page})=>{
  await page.goto(`${baseURL}/tests/emulator/index.html?personal=1`);await page.waitForFunction(()=>globalThis.__flowboardEmulatorTest?.ready===true);await page.evaluate(()=>globalThis.__flowboardEmulatorTest.signInFreshPersonal());await expect.poll(()=>page.evaluate(()=>globalThis.FlowboardApp.getMode().kind),{timeout:15000}).toBe('cloud');const prior=await page.evaluate(()=>globalThis.FlowboardApp.getMode().id);await page.locator('#boards-button').click();const manager=page.locator('#workspace-dialog');await expect(manager).toBeVisible();await expect(manager.locator('.workspace-entry').first()).toBeVisible();await page.evaluate(()=>globalThis.__flowboardEmulatorTest.signInRole('owner'));await expect(manager).toBeHidden();await expect(manager.locator('.workspace-entry')).toHaveCount(0);await expect.poll(()=>page.evaluate(id=>globalThis.FlowboardApp.getMode().id!==id,prior),{timeout:15000}).toBe(true);
});

test('commit readback ambiguity stays optimistic and reports verification pending',async({page})=>{
  await page.goto(`${baseURL}/tests/emulator/index.html?personal=1&verificationPending=1`);await page.waitForFunction(()=>globalThis.__flowboardEmulatorTest?.ready===true);await page.evaluate(()=>globalThis.__flowboardEmulatorTest.signInFreshPersonal());await expect.poll(()=>page.evaluate(()=>globalThis.FlowboardApp.getMode().kind),{timeout:15000}).toBe('cloud');const result=await page.evaluate(async()=>{const command=globalThis.FlowboardApp.createBoard('Pending verification board','blank'),completion=await command.completion;return{status:completion.status,title:globalThis.FlowboardApp.getActiveBoardSnapshot()?.title,sync:globalThis.FlowboardApp.getMode().syncStatus};});expect(result).toEqual({status:'verification-pending',title:'Pending verification board',sync:'Verification pending'});
});

test('stale verification retry cannot discard a later committed command',async({page})=>{
  await page.goto(`${baseURL}/tests/emulator/index.html?personal=1&staleRetry=1`);await page.waitForFunction(()=>globalThis.__flowboardEmulatorTest?.ready===true);await page.evaluate(()=>globalThis.__flowboardEmulatorTest.signInFreshPersonal());await expect.poll(()=>page.evaluate(()=>globalThis.FlowboardApp.getMode().kind),{timeout:15000}).toBe('cloud');const result=await page.evaluate(async()=>{const first=globalThis.FlowboardApp.createBoard('First board','blank');await first.completion;const second=globalThis.FlowboardApp.createBoard('Later board','blank');const committed=await second.completion,beforeRetry=globalThis.FlowboardApp.getActiveBoardSnapshot()?.title,retry=await first.retry();return{committed:committed.status,retry:retry.status,beforeRetry,afterRetry:globalThis.FlowboardApp.getActiveBoardSnapshot()?.title};});expect(result.committed).toBe('committed');expect(result.retry).toBe('stale');expect(result.afterRetry).toBe(result.beforeRetry);
});

test('legacy browser import is explicit, account-bound, idempotent, and byte-preserving', async ({browser}) => {
  const context=await browser.newContext(),page=await context.newPage();
  try{
    await page.goto(`${baseURL}/tests/emulator/index.html?personal=1`);
    await page.waitForFunction(()=>globalThis.__flowboardEmulatorTest?.ready===true);
    expect(await page.evaluate(()=>globalThis.__flowboardEmulatorTest.importLegacyFixture())).toEqual({
      oversized:'WORKSPACE_TOO_LARGE',firstImported:true,secondIdempotent:true,sameOperation:true,activeVisible:true,boards:4,activeBoards:3,lists:4,cards:4,archivedBoards:1,
      legacyLabelsOnly:true,receiptVerified:true,rawPreserved:true,crossAccount:'permission-denied'
    });
    await expect.poll(()=>page.evaluate(()=>globalThis.FlowboardApp.getMode().kind),{timeout:15000}).toBe('cloud');await page.locator('#boards-button').click();const duplicates=page.locator('#workspace-dialog .workspace-entry').filter({hasText:'Repeated board'});await expect(duplicates).toHaveCount(4);await expect(duplicates.filter({hasText:'Position 1'})).toHaveCount(1);await expect(duplicates.filter({hasText:'Position 4'})).toHaveCount(1);await page.getByRole('button',{name:'Close My workspace'}).click();
  }finally{await context.close();}
});

test('legacy import UI requires exact backup before verified import', async ({browser}) => {
  const context=await browser.newContext(),page=await context.newPage(),raw=JSON.stringify({schemaVersion:5,activeBoardId:'ui-board',preferences:{theme:'system'},boards:[{id:'ui-board',title:'UI legacy board',createdAt:'2025-02-01T00:00:00.000Z',updatedAt:'2025-02-02T00:00:00.000Z',archived:false,lists:[{id:'ui-list',title:'UI list',createdAt:'2025-02-01T00:00:00.000Z',updatedAt:'2025-02-02T00:00:00.000Z',archived:false,cards:[{id:'ui-card',title:'UI card',labels:[],checklist:[],activity:[],assignees:[],createdAt:'2025-02-01T00:00:00.000Z',updatedAt:'2025-02-02T00:00:00.000Z',archived:false}]}]}]}),older='legacy-secondary-unchanged';
  await context.addInitScript(({raw,older})=>{localStorage.setItem('flowboard-workspace',raw);localStorage.setItem('flowboard-data',older);const original=URL.createObjectURL.bind(URL);URL.createObjectURL=blob=>{blob.text().then(text=>{globalThis.__legacyDownload=text;});return original(blob);};},{raw,older});
  try{
    await page.goto(`${baseURL}/tests/emulator/index.html?personal=1`);await page.waitForFunction(()=>globalThis.__flowboardEmulatorTest?.ready===true);await page.evaluate(()=>globalThis.__flowboardEmulatorTest.signInFreshPersonal());await expect.poll(()=>page.evaluate(()=>globalThis.FlowboardApp.getMode().kind),{timeout:15000}).toBe('cloud');
    await page.locator('#account-button').click();await page.getByRole('button',{name:'Review legacy browser data'}).click();const dialog=page.locator('#cloud-migration-dialog'),summary=dialog.locator('#cloud-migration-summary');await expect(dialog).toBeVisible();await expect(summary.locator('dt').first()).toHaveText('Boards');await expect(summary.locator('dd').first()).toHaveText('1');await expect(dialog.getByRole('button',{name:'2. Import into My workspace'})).toBeDisabled();
    await dialog.getByRole('button',{name:'1. Download original backup'}).click();await expect.poll(()=>page.evaluate(()=>globalThis.__legacyDownload)).toBe(raw);await expect(dialog.getByRole('button',{name:'2. Import into My workspace'})).toBeEnabled();await dialog.getByRole('button',{name:'2. Import into My workspace'}).click();await expect(dialog.locator('#cloud-migration-status')).toContainText('verified',{timeout:15000});
    expect(await page.evaluate(()=>({current:localStorage.getItem('flowboard-workspace'),older:localStorage.getItem('flowboard-data'),receipt:Boolean(localStorage.getItem('flowboard-legacy-migration-v1'))}))).toEqual({current:raw,older,receipt:true});
  }finally{await context.close();}
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
    expect(await owner.evaluate(()=>globalThis.__flowboardEmulatorTest.mutationRetryFixture())).toEqual({firstCount:1,secondCount:1,activity:true});
    expect(await owner.evaluate(()=>globalThis.__flowboardEmulatorTest.fixtureSummary())).toEqual({boards:2,lists:2,cards:1,currentRole:'owner',adapterRole:'owner',entryRole:'owner'});

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
    await owner.locator('#account-dialog').getByRole('button', {name: 'Boards'}).click();
    const restoredRow = owner.locator('#workspace-board-list .workspace-entry').filter({hasText:'Emulator board'});
    await expect(restoredRow).toContainText('owner');
    await restoredRow.getByRole('button', {name:/Open Emulator board/}).click();
    await expect(owner.locator('.card-open').filter({hasText: secondUpdate})).toBeVisible();
  } finally {
    await Promise.all([ownerContext.close(), editorContext.close(), viewerContext.close()]);
  }
});

test('cloud backup pages comments and snapshot upgrade scrubs duplicates idempotently', async ({browser}) => {
  const context=await browser.newContext(),page=await context.newPage();
  try{
    await openRole(page,'owner');const owner=await page.evaluate(()=>globalThis.__flowboardEmulatorTest.signInRole('owner')),fixture=await page.evaluate(()=>globalThis.__flowboardEmulatorTest.fixture),[host,port]=process.env.FIRESTORE_EMULATOR_HOST.split(':'),admin=await initializeTestEnvironment({projectId:'demo-flowboard-browser',firestore:{host,port:Number(port)}});try{await admin.withSecurityRulesDisabled(async context=>{const db=context.firestore(),root=doc(db,'workspaces',fixture.workspaceId),board=doc(root,'boards',fixture.boardId),batch=writeBatch(db),now=Timestamp.now();batch.set(root,{name:'Emulator fixture',ownerUid:owner.uid,schemaVersion:5,activeBoardId:fixture.boardId,status:'ready',lifecycleRevision:0,migration:{version:1,state:'verified',counts:{boards:2,lists:3,cards:8}},updatedAt:now});batch.set(doc(root,'members',owner.uid),{uid:owner.uid,role:'owner',emailLower:'owner@example.test'});batch.set(board,{id:fixture.boardId,title:'Emulator board',rank:0,archived:false,lifecycleState:'active',revision:0,clientMutationId:'seed-board-mutation-0001',updatedAt:now});batch.set(doc(board,'lists',fixture.listId),{id:fixture.listId,title:'Doing',rank:0,lifecycleState:'active',revision:0,clientMutationId:'seed-list-mutation-0001',updatedAt:now});batch.set(doc(board,'lists',fixture.secondListId),{id:fixture.secondListId,title:'Review',rank:1,lifecycleState:'active',revision:0,clientMutationId:'seed-list-mutation-0002',updatedAt:now});batch.set(doc(board,'cards',fixture.cardId),{id:fixture.cardId,listId:fixture.listId,title:'Synthetic shared card',rank:0,assigneeUids:[],labels:[],dueDate:'',checklist:[],archived:false,lifecycleState:'active',revision:0,clientMutationId:'seed-card-mutation-0001',updatedAt:now});batch.set(doc(root,'boards','snapshot-upgrade-board'),{id:'snapshot-upgrade-board',title:'Snapshot upgrade',rank:2,archived:false,lifecycleState:'active',snapshot:{id:'snapshot-upgrade-board',title:'Snapshot upgrade',archived:false,lists:[{id:'snapshot-list',title:'Snapshot list',archived:false,cards:Array.from({length:7},(_,index)=>({id:`snapshot-card-${index}`,title:`Snapshot card ${index}`,description:'Rich field',labels:[],checklist:[],activity:[],assigneeUids:[],archived:false}))}]},revision:0,clientMutationId:'snapshot-upgrade-seed-0001',updatedAt:now});await batch.commit();});}finally{await admin.cleanup();}
    expect(await page.evaluate(()=>globalThis.__flowboardEmulatorTest.backupAndUpgradeSnapshot())).toEqual({
      backupFormat:'flowboard-cloud-backup',commentCount:27,snapshotBackedUp:true,firstMigrated:true,
      secondIdempotent:true,sameOperation:true,snapshotScrubbed:true,lists:1,cards:7
    });
  }finally{await context.close();}
});
