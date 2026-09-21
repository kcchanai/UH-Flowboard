import {test,expect} from '@playwright/test';
import {readdirSync} from 'node:fs';
import {basePath} from '../scripts/repository-path.mjs';

const builtCloudUIAsset=()=>`${basePath}assets/${readdirSync('dist/assets').find(file=>file.startsWith('cloud-ui-')&&file.endsWith('.js'))}`;
const openShell=async page=>{await page.goto(basePath);await page.waitForFunction(()=>globalThis.FlowboardApp&&globalThis.FlowboardState);};
const openReady=async page=>{await openShell(page);await page.waitForFunction(()=>['unavailable','signed-out','cloud','cloud-preview','ready-empty'].includes(globalThis.FlowboardApp.getMode().kind));};
const openSyntheticBoard=async page=>{await page.evaluate(()=>{globalThis.FlowboardApp.openCloudWorkspace(globalThis.FlowboardState.makeWorkspace(),{id:'synthetic-board',name:'Synthetic board',role:'owner'});});await expect(page.locator('#board .list').first()).toBeVisible();};

async function installDirectoryFixture(page,{personal=true,boards=[]}={}){
  await page.evaluate(async({asset,personal,boards})=>{
    const state={createArgs:null};
    globalThis.__boardControlsFixture=state;
    globalThis.FlowboardApp={
      getMode:()=>({kind:'cloud',id:personal?'personal-synthetic':'shared-synthetic',personalWorkspaceId:personal?'personal-synthetic':'',role:'owner'}),
      getActiveBoardId:()=>boards[0]?.id||'',openCloudWorkspace:()=>{},openCloudPreview:()=>{},selectBoard:()=>{},
      createBoard:(title,template)=>{state.createArgs={title,template};return false;}
    };
    const entry={id:personal?'personal-synthetic':'shared-synthetic',name:personal?'My workspace':'Shared workspace',ownerUid:'synthetic-owner',role:'owner',status:'ready',personal,migration:{state:'verified'},hasMore:false,boards};
    const {initializeCloudWorkspaceUI}=await import(asset);
    initializeCloudWorkspaceUI({localAdapter:{inspectLegacyWorkspace:()=>({status:'none',counts:{boards:0}})},cloudAdapter:{listBoardDirectory:async()=>[entry],fetchWorkspace:async()=>({schemaVersion:5,activeBoardId:'',boards:[]})}}).setSession({uid:'synthetic-owner'});
    document.querySelector('#boards-button').disabled=false;
  },{asset:builtCloudUIAsset(),personal,boards});
}

async function installMembersController(page,{role='owner',uid='owner'}={}){
  await page.evaluate(async({asset,role,uid})=>{
    const calls={listMembers:0,listInvites:0,mutations:0};
    globalThis.__membersLayoutFixture={calls};
    globalThis.FlowboardApp={getMode:()=>({kind:role==='viewer'?'cloud-preview':'cloud',id:'members-synthetic',role})};
    const adapter={
      listMembers:async()=>{calls.listMembers+=1;return role==='viewer'?[{uid,displayName:'Synthetic Viewer',role:'viewer'}]:[{uid:'owner',displayName:'Synthetic Owner',role:'owner'},{uid:'editor',displayName:'Synthetic Editor',role:'editor'}];},
      listInvites:async()=>{calls.listInvites+=1;if(role==='viewer')throw Error('viewer must not list invites');return[];},
      createInvite:async()=>{calls.mutations+=1;return{url:'https://example.test/invite'};},
      revokeInvite:async()=>{calls.mutations+=1;},changeMemberRole:async()=>{calls.mutations+=1;},removeMember:async()=>{calls.mutations+=1;},leaveWorkspace:async()=>{calls.mutations+=1;},transferOwnership:async()=>{calls.mutations+=1;}
    };
    const {initializeMembersUI}=await import(asset);initializeMembersUI(adapter).setSession({uid,displayName:role==='viewer'?'Synthetic Viewer':'Synthetic Owner',email:role==='viewer'?'viewer@example.test':'owner@example.test'});
    document.querySelector('#open-workspace-members').hidden=false;
    document.querySelector('#workspace-dialog').showModal();
  },{asset:builtCloudUIAsset(),role,uid});
}

function labelLineCount(page,id){return page.locator(`#${id}`).evaluate(field=>{const label=field.closest('label').querySelector('span'),range=document.createRange();range.selectNodeContents(label);return new Set([...range.getClientRects()].filter(rect=>rect.width>0&&rect.height>0).map(rect=>Math.round(rect.top))).size;});}


test('Your boards uses the lower form as its only New board entry point',async({page})=>{
  await openShell(page);await installDirectoryFixture(page,{personal:true,boards:[]});
  await page.getByRole('button',{name:'Boards'}).click();
  const dialog=page.getByRole('dialog',{name:'Your boards'});await expect(dialog).toBeVisible();
  await expect(dialog.locator('#new-board-button')).toHaveCount(0);
  await expect(dialog.locator('#new-board-form')).toBeVisible();
  await expect(dialog.getByText('No active boards yet. Create a board using the form below.',{exact:true})).toBeVisible();
  await dialog.locator('#new-board-title').fill('Synthetic blank board');
  await dialog.getByRole('button',{name:'Create board',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>globalThis.__boardControlsFixture.createArgs)).toEqual({title:'Synthetic blank board',template:'blank'});
});

test('Archived cards replaces Board actions and returns focus after close',async({page})=>{
  await openReady(page);await openSyntheticBoard(page);
  await expect(page.locator('#board-menu')).toHaveCount(0);
  const button=page.locator('#archived-cards-button');await expect(button).toBeVisible();
  await expect(button).toHaveAttribute('type','button');await expect(button).toHaveAttribute('aria-haspopup','dialog');await expect(button).toHaveAttribute('aria-controls','archive-dialog');
  await button.click();const archive=page.getByRole('dialog',{name:'Archived cards'});await expect(archive).toBeVisible();await expect(archive).toContainText('No archived cards.');
  await page.keyboard.press('Escape');await expect(archive).toBeHidden();await expect(button).toBeFocused();
});

test('Archived cards opens from List view without a menu',async({page})=>{
  await openReady(page);await openSyntheticBoard(page);await page.locator('#view-toggle').click();await expect(page.locator('#list-view-table')).toBeVisible();
  await expect(page.locator('#board-menu')).toHaveCount(0);await page.locator('#archived-cards-button').click();await expect(page.getByRole('dialog',{name:'Archived cards'})).toBeVisible();
});

test('trailing Add another list remains available as the list creation control',async({page})=>{
  await openReady(page);await openSyntheticBoard(page);const addList=page.locator('#add-list');await expect(addList).toBeVisible();await expect(addList).toBeEnabled();
});

test('Board access is at least as wide as Your boards and keeps owner fields readable',async({page})=>{
  await page.setViewportSize({width:960,height:720});await openShell(page);await installMembersController(page);
  const boardsWidth=await page.locator('#workspace-dialog').evaluate(dialog=>dialog.getBoundingClientRect().width);
  await page.getByRole('button',{name:'Manage members'}).click();const members=page.getByRole('dialog',{name:'People and invitations'});await expect(members).toBeVisible();
  const metrics=await members.evaluate(dialog=>({width:dialog.getBoundingClientRect().width,scrollWidth:dialog.scrollWidth,clientWidth:dialog.clientWidth}));
  expect(metrics.width).toBeGreaterThanOrEqual(boardsWidth-1);expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
  await expect.poll(()=>labelLineCount(page,'invite-email')).toBe(1);await expect.poll(()=>labelLineCount(page,'ownership-successor')).toBe(1);await expect(page.locator('#invite-email')).toHaveJSProperty('offsetWidth',expect.any(Number));
  expect(await page.locator('#invite-email').evaluate(input=>input.getBoundingClientRect().width)).toBeGreaterThanOrEqual(320);expect(await page.locator('#ownership-successor').evaluate(input=>input.getBoundingClientRect().width)).toBeGreaterThanOrEqual(240);expect(await page.evaluate(()=>globalThis.__membersLayoutFixture.calls.mutations)).toBe(0);
});

test('Board access remains inspectable for a viewer without mutation controls',async({page})=>{
  await openShell(page);await installMembersController(page,{role:'viewer',uid:'viewer'});
  await page.getByRole('button',{name:'Manage members'}).click();const dialog=page.getByRole('dialog',{name:'People and invitations'});await expect(dialog).toBeVisible();await expect(dialog.locator('#create-invite-form')).toBeHidden();await expect(dialog.locator('#transfer-ownership-form')).toBeHidden();await dialog.getByRole('button',{name:'Close members'}).click();await expect(dialog).toBeHidden();
});
