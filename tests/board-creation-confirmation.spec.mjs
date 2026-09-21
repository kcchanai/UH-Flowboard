import {test,expect} from '@playwright/test';
import {readFileSync,readdirSync} from 'node:fs';
import {basePath} from '../scripts/repository-path.mjs';

const builtCloudAsset=()=>`${basePath}assets/${readdirSync('dist/assets').find(file=>file.startsWith('cloud-ui-')&&file.endsWith('.js'))}`;
const openShell=async page=>{await page.goto(basePath);await page.waitForFunction(()=>globalThis.FlowboardApp&&globalThis.FlowboardState);};

async function installFixture(page,{repairAfterDelete=false,pendingArchive=false,rejectArchiveOnce=false}={}){
  await page.evaluate(async({asset,repairAfterDelete,pendingArchive,rejectArchiveOnce})=>{
    const state={archived:false,deleted:false,mode:'cloud',archiveCalls:0,deleteCalls:0,repairCalls:0,createArgs:null,pendingResolve:null,archiveFailureUsed:false};
    const board=()=>({id:'confirm-board',title:'Confirm board',rank:0,archived:state.archived,revision:state.archiveCalls,lifecycleState:state.archived?'archived':'active'});
    const entry=()=>({id:'personal-source',name:'My workspace',ownerUid:'owner',role:'owner',status:'ready',personal:true,migration:{state:'verified'},hasMore:false,boards:state.deleted?[]:[board()]});
    const directory=()=>state.mode==='needs-recovery'?[{id:'invalid-source',name:'Invalid source',ownerUid:'owner',role:'owner',status:'ready',personal:false,migration:{state:'verified'},hasMore:false,boards:[]}]:[entry()];
    const workspace=()=>({schemaVersion:5,activeBoardId:state.deleted?'':board().id,boards:state.deleted?[]:[{...board(),lists:[]}]});
    globalThis.__blankConfirmationFixture=state;
    globalThis.FlowboardApp={
      getMode:()=>({kind:state.mode,id:'personal-source',personalWorkspaceId:'personal-source',role:'owner',message:'Account setup needs attention.'}),
      getActiveBoardId:()=>state.deleted?'':board().id,
      openCloudWorkspace:()=>{},openCloudPreview:()=>{},selectBoard:()=>{},
      createBoard:(title,template)=>{state.createArgs={title,template};return false;},
      retryAccountSetup:async()=>{state.repairCalls+=1;state.mode='cloud';}
    };
    const cloudAdapter={
      listBoardDirectory:async()=>directory(),
      fetchWorkspace:async()=>workspace(),
      setBoardArchived:async({archived})=>{
        if(rejectArchiveOnce&&!state.archiveFailureUsed){state.archiveFailureUsed=true;throw Error('Synthetic archive failure.');}
        if(pendingArchive){await new Promise(resolve=>{state.pendingResolve=()=>{state.archived=archived;state.archiveCalls+=1;resolve();};});}
        else{state.archived=archived;state.archiveCalls+=1;}
        return{revision:state.archiveCalls,archived};
      },
      preflightDeletion:async()=>({counts:{lists:0,cards:0,comments:0}}),
      deleteEntity:async()=>{state.deleted=true;state.deleteCalls+=1;if(repairAfterDelete)state.mode='needs-recovery';}
    };
    const{initializeCloudWorkspaceUI}=await import(asset);
    initializeCloudWorkspaceUI({localAdapter:{inspectLegacyWorkspace:()=>({status:'none',counts:{boards:0}})},cloudAdapter}).setSession({uid:'owner'});
    document.querySelector('#boards-button').disabled=false;
  },{asset:builtCloudAsset(),repairAfterDelete,pendingArchive,rejectArchiveOnce});
}

async function openBoards(page){
  await page.getByRole('button',{name:'Boards'}).click();
  const manager=page.getByRole('dialog',{name:'Your boards'});
  await expect(manager).toBeVisible();
  return manager;
}

async function openArchiveConfirmation(page,manager){
  const row=manager.locator('#workspace-board-list .workspace-entry').filter({hasText:'Confirm board'});
  await row.locator('.workspace-lifecycle-actions summary').click();
  await row.getByRole('button',{name:'Archive'}).click();
  return page.getByRole('dialog',{name:'Archive board?'});
}

test('blank creation removes Start from and keeps the blank command explicit',async({page})=>{
  const source=readFileSync('app.js','utf8'),start=source.indexOf('createBoard:'),end=source.indexOf('openCardById',start),createBlock=source.slice(start,end);
  expect(createBlock).toContain("makeBoard('blank')");
  expect(createBlock).not.toContain('makeBoard(template)');
  await openShell(page);
  await installFixture(page);
  const manager=await openBoards(page);
  await expect(manager.locator('#new-board-button')).toHaveCount(0);
  await expect(manager.locator('#new-board-form')).toBeVisible();
  await expect(manager.locator('#board-template')).toHaveCount(0);
  await expect(manager.getByText('Start from',{exact:true})).toHaveCount(0);
  await manager.locator('#new-board-title').fill('Blank-only board');
  await manager.getByRole('button',{name:'Create board',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>globalThis.__blankConfirmationFixture.createArgs)).toEqual({title:'Blank-only board',template:'blank'});
});

test('confirmation uses the available content width instead of the icon track',async({page})=>{
  await openShell(page);await installFixture(page);const manager=await openBoards(page),confirmation=await openArchiveConfirmation(page,manager);
  const metrics=await confirmation.locator('form.confirmation-dialog-card').evaluate(form=>{const content=form.firstElementChild,formBox=form.getBoundingClientRect(),contentBox=content.getBoundingClientRect(),input=form.querySelector('input');return{formWidth:formBox.width,contentWidth:contentBox.width,inputWidth:input?.getBoundingClientRect().width||0,columns:getComputedStyle(form).gridTemplateColumns};});
  expect(metrics.contentWidth).toBeGreaterThan(200);
  expect(metrics.inputWidth).toBe(0);
  expect(metrics.columns).not.toMatch(/^40px /);
});

test('archive and restore confirmations remain pointer-operable after same-page reuse',async({page})=>{
  await openShell(page);await installFixture(page);let manager=await openBoards(page);
  let confirmation=await openArchiveConfirmation(page,manager);await confirmation.getByRole('button',{name:'Archive board',exact:true}).click();await expect(confirmation).toBeHidden();
  let archived=manager.locator('#archived-board-list .workspace-entry').filter({hasText:'Confirm board'});await expect(archived).toBeVisible();
  await archived.getByRole('button',{name:'Restore'}).click();confirmation=page.getByRole('dialog',{name:'Restore board?'});await confirmation.getByRole('button',{name:'Restore board',exact:true}).click();await expect(confirmation).toBeHidden();
  manager=page.getByRole('dialog',{name:'Your boards'});const active=manager.locator('#workspace-board-list .workspace-entry').filter({hasText:'Confirm board'});await active.locator('.workspace-lifecycle-actions summary').click();await active.getByRole('button',{name:'Archive'}).click();confirmation=page.getByRole('dialog',{name:'Archive board?'});
  await expect(confirmation.getByRole('button',{name:'Cancel',exact:true})).toBeEnabled();
  await confirmation.getByRole('button',{name:'Cancel',exact:true}).click();
  await expect(confirmation).toBeHidden();
  await expect.poll(()=>page.evaluate(()=>globalThis.__blankConfirmationFixture.archiveCalls)).toBe(2);
});

test('delete and Repair confirmations keep usable width at a narrow viewport',async({page})=>{
  await openShell(page);await installFixture(page,{repairAfterDelete:true});await page.setViewportSize({width:320,height:720});const manager=await openBoards(page);const row=manager.locator('#workspace-board-list .workspace-entry').filter({hasText:'Confirm board'});await row.locator('.workspace-lifecycle-actions summary').click();await row.getByRole('button',{name:'Delete'}).click();
  const confirmation=page.getByRole('dialog',{name:'Delete board permanently?'});const metrics=await confirmation.locator('form.confirmation-dialog-card').evaluate(form=>{const body=form.firstElementChild.getBoundingClientRect(),input=form.querySelector('input').getBoundingClientRect();return{bodyWidth:body.width,inputWidth:input.width};});expect(metrics.bodyWidth).toBeGreaterThan(200);expect(metrics.inputWidth).toBeGreaterThan(180);
  await confirmation.locator('input').fill('Confirm board');await confirmation.getByRole('button',{name:'Delete permanently',exact:true}).click();await expect(confirmation).toBeHidden();const repair=manager.getByRole('button',{name:'Repair account setup',exact:true});await expect(repair).toBeVisible();await repair.click();const repairConfirmation=page.getByRole('dialog',{name:'Repair account setup?'});const repairWidth=await repairConfirmation.locator('form.confirmation-dialog-card > :first-child').evaluate(node=>node.getBoundingClientRect().width);expect(repairWidth).toBeGreaterThan(200);
});

test('pending confirmation owns Escape until the remote action settles',async({page})=>{
  await openShell(page);await installFixture(page,{pendingArchive:true});const manager=await openBoards(page),confirmation=await openArchiveConfirmation(page,manager);await confirmation.getByRole('button',{name:'Archive board',exact:true}).click();
  await expect(confirmation.getByRole('button',{name:'Cancel',exact:true})).toBeDisabled();
  await confirmation.locator('form').evaluate(form=>form.requestSubmit());
  await expect.poll(()=>page.evaluate(()=>globalThis.__blankConfirmationFixture.archiveCalls)).toBe(0);
  await page.keyboard.press('Escape');
  await expect(confirmation).toBeVisible();
  await page.evaluate(()=>globalThis.__blankConfirmationFixture.pendingResolve());
  await expect(confirmation).toBeHidden();
  await expect.poll(()=>page.evaluate(()=>globalThis.__blankConfirmationFixture.archiveCalls)).toBe(1);
});

test('confirmation failure restores controls and permits one safe retry',async({page})=>{
  await openShell(page);await installFixture(page,{rejectArchiveOnce:true});const manager=await openBoards(page),confirmation=await openArchiveConfirmation(page,manager);await confirmation.getByRole('button',{name:'Archive board',exact:true}).click();await expect(confirmation).toContainText('Synthetic archive failure.');await expect(confirmation.getByRole('button',{name:'Cancel',exact:true})).toBeEnabled();await expect(confirmation.getByRole('button',{name:'Archive board',exact:true})).toBeEnabled();await confirmation.getByRole('button',{name:'Archive board',exact:true}).click();await expect(confirmation).toBeHidden();await expect.poll(()=>page.evaluate(()=>globalThis.__blankConfirmationFixture.archiveCalls)).toBe(1);
});

test('delete keeps exact-name protection and permits retry after mismatch',async({page})=>{
  await openShell(page);await installFixture(page);const manager=await openBoards(page),row=manager.locator('#workspace-board-list .workspace-entry').filter({hasText:'Confirm board'});await row.locator('.workspace-lifecycle-actions summary').click();await row.getByRole('button',{name:'Delete'}).click();const confirmation=page.getByRole('dialog',{name:'Delete board permanently?'});await confirmation.locator('input').fill('Wrong name');await confirmation.getByRole('button',{name:'Delete permanently',exact:true}).click();await expect(confirmation).toContainText('Name mismatch.');await expect.poll(()=>page.evaluate(()=>globalThis.__blankConfirmationFixture.deleteCalls)).toBe(0);await confirmation.locator('input').fill('Confirm board');await confirmation.getByRole('button',{name:'Delete permanently',exact:true}).click();await expect(confirmation).toBeHidden();await expect.poll(()=>page.evaluate(()=>globalThis.__blankConfirmationFixture.deleteCalls)).toBe(1);
});

test('delete then Repair account setup uses a fresh confirmation state',async({page})=>{
  await openShell(page);await installFixture(page,{repairAfterDelete:true});const manager=await openBoards(page);const row=manager.locator('#workspace-board-list .workspace-entry').filter({hasText:'Confirm board'});await row.locator('.workspace-lifecycle-actions summary').click();await row.getByRole('button',{name:'Delete'}).click();
  const confirmation=page.getByRole('dialog',{name:'Delete board permanently?'});await confirmation.locator('input').fill('Confirm board');await confirmation.getByRole('button',{name:'Delete permanently',exact:true}).click();await expect(confirmation).toBeHidden();await expect(manager.locator('#workspace-search')).toBeFocused();const repair=manager.getByRole('button',{name:'Repair account setup',exact:true});
  await expect(repair).toBeVisible();await repair.click();const repairConfirmation=page.getByRole('dialog',{name:'Repair account setup?'});await expect(repairConfirmation.getByRole('button',{name:'Cancel',exact:true})).toBeEnabled();await repairConfirmation.getByRole('button',{name:'Cancel',exact:true}).click();await expect(repairConfirmation).toBeHidden();await expect.poll(()=>page.evaluate(()=>globalThis.__blankConfirmationFixture.deleteCalls)).toBe(1);await expect.poll(()=>page.evaluate(()=>globalThis.__blankConfirmationFixture.repairCalls)).toBe(0);
});

test('final synthetic screenshots cover blank and lifecycle confirmations',async({page})=>{
  await openShell(page);await installFixture(page,{repairAfterDelete:true});let manager=await openBoards(page);await expect(manager.locator('#new-board-button')).toHaveCount(0);await expect(manager.locator('#new-board-form')).toBeVisible();await page.screenshot({path:'artifacts/blank-boards-confirmation-implementation/screenshots/final-blank-board.png',fullPage:false});await manager.getByRole('button',{name:'Close boards'}).click();manager=await openBoards(page);
  let confirmation=await openArchiveConfirmation(page,manager);await page.screenshot({path:'artifacts/blank-boards-confirmation-implementation/screenshots/final-archive.png',fullPage:false});await confirmation.getByRole('button',{name:'Archive board',exact:true}).click();await expect(confirmation).toBeHidden();
  const archived=manager.locator('#archived-board-list .workspace-entry').filter({hasText:'Confirm board'});await archived.getByRole('button',{name:'Restore'}).click();confirmation=page.getByRole('dialog',{name:'Restore board?'});await page.screenshot({path:'artifacts/blank-boards-confirmation-implementation/screenshots/final-restore.png',fullPage:false});await confirmation.getByRole('button',{name:'Restore board',exact:true}).click();await expect(confirmation).toBeHidden();
  manager=page.getByRole('dialog',{name:'Your boards'});const active=manager.locator('#workspace-board-list .workspace-entry').filter({hasText:'Confirm board'});await active.locator('.workspace-lifecycle-actions summary').click();await active.getByRole('button',{name:'Delete'}).click();confirmation=page.getByRole('dialog',{name:'Delete board permanently?'});await confirmation.locator('input').fill('Confirm board');await page.screenshot({path:'artifacts/blank-boards-confirmation-implementation/screenshots/final-delete.png',fullPage:false});await confirmation.getByRole('button',{name:'Delete permanently',exact:true}).click();await expect(confirmation).toBeHidden();const repair=manager.getByRole('button',{name:'Repair account setup',exact:true});await expect(repair).toBeVisible();await repair.click();const repairConfirmation=page.getByRole('dialog',{name:'Repair account setup?'});await page.screenshot({path:'artifacts/blank-boards-confirmation-implementation/screenshots/final-repair.png',fullPage:false});await repairConfirmation.getByRole('button',{name:'Cancel',exact:true}).click();await expect(repairConfirmation).toBeHidden();
});
