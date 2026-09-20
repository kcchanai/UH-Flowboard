import {test,expect} from '@playwright/test';
import {readdirSync} from 'node:fs';
import {basePath} from '../scripts/repository-path.mjs';

const builtCloudUIAsset=()=>`${basePath}assets/${readdirSync('dist/assets').find(file=>file.startsWith('cloud-ui-')&&file.endsWith('.js'))}`;
const openReady=async page=>{await page.goto(basePath);await page.waitForFunction(()=>globalThis.FlowboardApp&&globalThis.FlowboardState);await page.waitForFunction(()=>['unavailable','signed-out','cloud','cloud-preview','ready-empty'].includes(globalThis.FlowboardApp.getMode().kind));};

async function installDirectoryFixture(page){
  await page.evaluate(async asset=>{
    await new Promise(resolve=>setTimeout(resolve,50));
    const personal={id:'personal-source',name:'My workspace',ownerUid:'owner',role:'owner',status:'ready',personal:true,migration:{state:'verified'},boards:[{id:'personal-board',title:'Repeated board',rank:0,archived:false}]};
    const editor={id:'shared-editor-source',name:'Project circle',ownerUid:'editor-owner',role:'editor',status:'ready',personal:false,migration:{state:'verified'},boards:[{id:'editor-board',title:'Repeated board',rank:0,archived:false}]};
    const viewer={id:'shared-viewer-source',name:'Project circle',ownerUid:'viewer-owner',role:'viewer',status:'ready',personal:false,migration:{state:'verified'},boards:[{id:'viewer-board',title:'Repeated board',rank:0,archived:false}]};
    globalThis.FlowboardApp={getMode:()=>({kind:'cloud',id:'personal-source',role:'owner',personalWorkspaceId:'personal-source'}),getActiveBoardId:()=>'',openCloudWorkspace:()=>{},openCloudPreview:()=>{},selectBoard:()=>{},createBoard:()=>false};
    const cloudAdapter={listBoardDirectory:async()=>[personal,editor,viewer]};
    const {initializeCloudWorkspaceUI}=await import(asset);
    initializeCloudWorkspaceUI({localAdapter:{inspectLegacyWorkspace:()=>({status:'none',counts:{boards:0}})},cloudAdapter}).setSession({uid:'owner'});
    document.querySelector('#boards-button').disabled=false;
  },builtCloudUIAsset());
}

test('account presents boards without a redundant personal-workspace block',async({page})=>{
  await openReady(page);
  await expect(page.locator('#account-workspace-section')).toHaveCount(0);
  await expect(page.locator('#workspace-profile-section')).toContainText('Profile photo');
  await expect(page.locator('#workspace-profile-status')).toContainText('people who can access your boards');
  await expect(page.locator('#account-safety')).toContainText('authorized boards');
  await expect(page.locator('#open-cloud-workspaces')).toHaveText('Boards');
});

test('Boards manager exposes board choices and preserves shared-scope distinctions',async({page})=>{
  await openReady(page);
  await installDirectoryFixture(page);
  await page.locator('#boards-button').click();
  const manager=page.locator('#workspace-dialog');
  await expect(manager).toBeVisible();
  await expect(manager.getByText('Your boards')).toBeVisible();
  await expect(manager.locator('.eyebrow')).not.toContainText('MY WORKSPACE');
  await expect(manager.locator('#cloud-workspaces-safety')).not.toContainText('Data recovery');
  await expect(manager.getByText('Older data and recovery')).toHaveCount(0);
  await expect(manager.locator('#new-board-title').locator('xpath=..')).toContainText('New board');
  const rows=manager.locator('#workspace-board-list .workspace-entry').filter({hasText:'Repeated board'});
  await expect(rows).toHaveCount(3);
  const details=await rows.locator('span').allTextContents();
  expect(details.some(text=>text.includes('My workspace')||text.includes('owner'))).toBe(false);
  expect(details.filter(text=>text.includes('Source 1 of 3')).length).toBe(1);
  expect(details.filter(text=>text.includes('Source 2 of 3')).length).toBe(1);
  expect(details.filter(text=>text.includes('Source 3 of 3')).length).toBe(1);
  await expect(rows.filter({hasText:'Shared · editor'})).toHaveCount(1);
  await expect(rows.filter({hasText:'Shared · read-only'})).toHaveCount(1);
  await expect(manager.getByRole('button',{name:/Close boards/})).toBeVisible();
  await expect(manager.locator('[aria-label*="workspace"]:visible')).toHaveCount(0);
});

test('access activity invitation assignment and recovery surfaces use board-first copy',async({page})=>{
  await openReady(page);
  await expect(page.locator('#cloud-assignees-field')).toContainText('People with board access');
  await expect(page.locator('#cloud-activity-heading')).toHaveText('All board activity');
  await expect(page.locator('#close-cloud-activity')).toHaveAttribute('aria-label','Close board activity');
  await expect(page.locator('#workspace-members-heading')).toHaveText('People and invitations');
  await expect(page.locator('#workspace-members-dialog .eyebrow')).toHaveText('Board access');
  await expect(page.locator('#invite-heading')).toHaveText('Access shared boards');
  await expect(page.locator('#invite-dialog .eyebrow')).toHaveText('Board invitation');
  await expect(page.locator('#cloud-migration-safety')).toHaveCount(0);
  await expect(page.locator('#create-cloud-workspace')).toHaveCount(0);
});

test('retired recovery controls are absent from Account and Boards',async({page})=>{
  await page.addInitScript(()=>{localStorage.setItem('flowboard-workspace','{"sentinel":"unchanged"}');localStorage.setItem('flowboard-data','legacy-sentinel');localStorage.setItem('flowboard-legacy-migration-v1','receipt-sentinel');});
  await openReady(page);
  const selectors=['#open-cloud-recovery','#open-cloud-migration','#cloud-migration-dialog','#legacy-spaces-section','#legacy-spaces-list','#migrate-cloud-workspace','#export-cloud-workspace'];
  for(const selector of selectors)await expect(page.locator(selector)).toHaveCount(0);
  const before=await page.evaluate(()=>({current:localStorage.getItem('flowboard-workspace'),legacy:localStorage.getItem('flowboard-data'),receipt:localStorage.getItem('flowboard-legacy-migration-v1')}));
  await page.locator('#account-button').click();
  const account=page.getByRole('dialog',{name:/Account|Sign in/});
  await expect(account).toBeVisible();
  await expect(account.getByRole('button',{name:'Data recovery',exact:true})).toHaveCount(0);
  await expect(account.getByRole('button',{name:'Review legacy browser data',exact:true})).toHaveCount(0);
  await expect(page.locator('#open-cloud-workspaces')).toHaveCount(1);
  await account.getByRole('button',{name:/Close account/}).click();
  expect(await page.evaluate(()=>({current:localStorage.getItem('flowboard-workspace'),legacy:localStorage.getItem('flowboard-data'),receipt:localStorage.getItem('flowboard-legacy-migration-v1')}))).toEqual(before);
});

test('account repair remains explicit and separate from Retry',async({page})=>{
  await openReady(page);
  await page.evaluate(async asset=>{globalThis.FlowboardApp={getMode:()=>({kind:'needs-recovery',id:'invalid-source',personalWorkspaceId:'invalid-source',role:'owner',message:'Account setup needs attention.'}),getActiveBoardId:()=>'',openCloudWorkspace:()=>{},openCloudPreview:()=>{},selectBoard:()=>{},createBoard:()=>false,retryAccountSetup:()=>{globalThis.repaired=true;},setSession:()=>{}};const {initializeCloudWorkspaceUI}=await import(asset);initializeCloudWorkspaceUI({localAdapter:{inspectLegacyWorkspace:()=>({status:'none',counts:{boards:0}})},cloudAdapter:{listBoardDirectory:async()=>[{id:'invalid-source',name:'Invalid source',ownerUid:'owner',role:'owner',status:'ready',personal:false,migration:{state:'verified'},boards:[],hasMore:false}]}}).setSession({uid:'owner'});document.querySelector('#boards-button').disabled=false;},builtCloudUIAsset());
  await page.getByRole('button',{name:'Boards'}).click();
  const manager=page.getByRole('dialog',{name:'Your boards'}),repair=manager.getByRole('button',{name:'Repair account setup',exact:true});
  await expect(repair).toBeVisible();
  await expect(manager.getByRole('button',{name:'Data recovery',exact:true})).toHaveCount(0);
  await repair.click();
  const confirmation=page.getByRole('dialog',{name:'Repair account setup?'});
  await expect(confirmation).toContainText('new empty destination');
  await page.keyboard.press('Escape');
  await expect(confirmation).toBeHidden();
  await expect(repair).toBeFocused();
  await repair.click();
  await confirmation.getByRole('button',{name:'Repair account setup',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>globalThis.repaired)).toBe(true);
});

test('board archive confirmation remains after recovery UI retirement',async({page})=>{
  await openReady(page);
  await page.evaluate(async asset=>{let archived=false;const entry=()=>({id:'board-scope',name:'Board scope',ownerUid:'owner',role:'owner',status:'ready',personal:true,migration:{state:'verified'},hasMore:false,boards:[{id:'confirm-board',title:'Confirm board',rank:0,archived}]});globalThis.FlowboardApp={getMode:()=>({kind:'cloud',id:'board-scope',personalWorkspaceId:'board-scope',role:'owner'}),getActiveBoardId:()=>'',openCloudWorkspace:()=>{},openCloudPreview:()=>{},selectBoard:()=>{},createBoard:()=>false};const {initializeCloudWorkspaceUI}=await import(asset);initializeCloudWorkspaceUI({localAdapter:{inspectLegacyWorkspace:()=>({status:'none',counts:{boards:0}})},cloudAdapter:{listBoardDirectory:async()=>[entry()],setBoardArchived:async()=>{archived=true;return{revision:1,archived:true}},fetchWorkspace:async()=>({schemaVersion:5,activeBoardId:'confirm-board',boards:[]}),preflightDeletion:async()=>({counts:{lists:0,cards:0,comments:0}}),deleteEntity:async()=>{}}}).setSession({uid:'owner'});document.querySelector('#boards-button').disabled=false;},builtCloudUIAsset());
  await page.getByRole('button',{name:'Boards'}).click();
  const manager=page.getByRole('dialog',{name:'Your boards'}),row=manager.locator('.workspace-entry').filter({hasText:'Confirm board'});
  await row.locator('.workspace-lifecycle-actions summary').click();
  const archive=row.getByRole('button',{name:'Archive'});
  await archive.click();
  const confirmation=page.getByRole('dialog',{name:'Archive board?'});
  await expect(confirmation).toContainText('Board content will be retained.');
  await page.keyboard.press('Escape');
  await expect(confirmation).toBeHidden();
  await expect(archive).toBeFocused();
  await archive.click();
  await confirmation.getByRole('button',{name:'Archive board'}).click();
  await expect.poll(()=>page.evaluate(()=>globalThis.FlowboardApp.getMode().kind)).toBe('cloud');
});

test('board manager keeps board-first copy and close control at required widths',async({page})=>{
  await openReady(page);
  await installDirectoryFixture(page);
  const sizes=[{width:1440,height:900},{width:1900,height:700},{width:960,height:720},{width:390,height:720},{width:320,height:720}];
  for(const size of sizes){
    await page.setViewportSize(size);
    const opener=page.locator('#boards-button');
    await opener.click();
    const manager=page.getByRole('dialog',{name:'Your boards'});
    await expect(manager).toBeVisible();
    await expect(manager.getByRole('button',{name:'Close boards'})).toBeVisible();
    await expect(manager.locator('[aria-label*="workspace"]:visible')).toHaveCount(0);
    const metrics=await manager.evaluate(dialog=>{const box=dialog.getBoundingClientRect(),close=dialog.querySelector('.dialog-close').getBoundingClientRect();return {top:box.top,bottom:box.bottom,right:box.right,closeBottom:close.bottom,closeRight:close.right,width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth};});
    expect(metrics.top).toBeGreaterThanOrEqual(0);
    expect(metrics.bottom).toBeLessThanOrEqual(metrics.height);
    expect(metrics.right).toBeLessThanOrEqual(metrics.width);
    expect(metrics.closeBottom).toBeLessThanOrEqual(metrics.height);
    expect(metrics.closeRight).toBeLessThanOrEqual(metrics.width);
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.width);
    await manager.getByRole('button',{name:'Close boards'}).click();
    await expect(opener).toBeFocused();
  }
});
