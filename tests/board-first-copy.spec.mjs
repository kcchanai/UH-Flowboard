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
  await expect(manager.locator('#cloud-workspaces-safety')).toContainText('Older data is available in Data recovery.');
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
  await expect(page.locator('#cloud-migration-safety')).not.toContainText('My workspace');
  await expect(page.locator('#create-cloud-workspace')).toHaveText('2. Import boards');
});
