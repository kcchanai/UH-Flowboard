import {test,expect} from '@playwright/test';
import {createRequire} from 'node:module';
import {readdirSync} from 'node:fs';
import {basePath} from '../scripts/repository-path.mjs';

const require=createRequire(import.meta.url),axePath=require.resolve('axe-core/axe.min.js');
const builtCloudAsset=()=>`${basePath}assets/${readdirSync('dist/assets').find(file=>file.startsWith('cloud-ui-')&&file.endsWith('.js'))}`;
const sentinel={current:'board-row-actions-current-sentinel',legacy:'board-row-actions-legacy-sentinel'};
const openShell=async page=>{await page.goto(basePath);await page.waitForFunction(()=>globalThis.FlowboardApp&&globalThis.FlowboardState);};

function directoryFixture(role='owner',{longNames=false}={}){
  const activeTitle=longNames?'Synthetic active board with a deliberately long title that wraps without clipping':'Synthetic active board';
  const archivedTitle=longNames?'Synthetic archived board with a deliberately long title that wraps without clipping':'Synthetic archived board';
  return {id:'synthetic-board-directory',name:'Synthetic directory',ownerUid:'synthetic-owner',role,status:'ready',personal:true,migration:{state:'verified'},hasMore:false,boards:[
    {id:'synthetic-active-board',title:activeTitle,rank:0,archived:false,revision:0},
    {id:'synthetic-archived-board',title:archivedTitle,rank:1,archived:true,revision:0}
  ]};
}

async function installFixture(page,{role='owner',longNames=false}={}){
  await page.addInitScript(value=>{localStorage.setItem('board-row-actions-current',value.current);localStorage.setItem('board-row-actions-legacy',value.legacy);},sentinel);
  await openShell(page);
  await page.evaluate(async({asset,fixture})=>{
    const calls={preflight:0,mutations:0,archive:0};
    globalThis.__boardRowActionsFixture={calls,fixture};
    globalThis.FlowboardApp={
      getMode:()=>({kind:'cloud',id:fixture.id,personalWorkspaceId:fixture.id,role:fixture.role}),
      getActiveBoardId:()=>fixture.boards[0].id,
      openCloudWorkspace:()=>{},openCloudPreview:()=>{},selectBoard:()=>{},createBoard:()=>false,handleCloudAccessRemoved:()=>{}
    };
    const cloudAdapter={
      listBoardDirectory:async()=>[fixture],
      fetchWorkspace:async()=>({schemaVersion:5,activeBoardId:fixture.boards[0].id,boards:fixture.boards.map(board=>({...board,lists:[]}))}),
      preflightDeletion:async()=>{calls.preflight+=1;return{counts:{lists:2,cards:3,comments:1}};},
      deleteEntity:async()=>{calls.mutations+=1;},
      setBoardArchived:async({archived})=>{calls.archive+=1;return{archived,revision:calls.archive};}
    };
    const {initializeCloudWorkspaceUI}=await import(asset);
    initializeCloudWorkspaceUI({localAdapter:{inspectLegacyWorkspace:()=>({status:'none',counts:{boards:0}})},cloudAdapter}).setSession({uid:'synthetic-owner'});
    document.querySelector('#boards-button').disabled=false;
  },{asset:builtCloudAsset(),fixture:directoryFixture(role,{longNames})});
}

async function openBoards(page){
  await page.getByRole('button',{name:'Boards'}).click();
  const manager=page.getByRole('dialog',{name:'Your boards'});
  await expect(manager).toBeVisible();
  return manager;
}

const box=locator=>locator.evaluate(node=>{const rect=node.getBoundingClientRect(),style=getComputedStyle(node);return{left:rect.left,top:rect.top,right:rect.right,bottom:rect.bottom,width:rect.width,height:rect.height,background:style.backgroundColor,borderColor:style.borderColor,borderStyle:style.borderStyle};});
const localSentinels=page=>page.evaluate(()=>({current:localStorage.getItem('board-row-actions-current'),legacy:localStorage.getItem('board-row-actions-legacy')}));
const layoutEdgeTolerance=8;
const audit=async page=>page.evaluate(async()=>{const result=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return result.violations.map(item=>({id:item.id,nodes:item.nodes.length}));});

test('board rows use concise Delete entry points while permanent confirmation stays explicit',async({page})=>{
  await installFixture(page);const manager=await openBoards(page);
  const active=manager.locator('#workspace-board-list .workspace-entry').filter({hasText:'Synthetic active board'}),archived=manager.locator('#archived-board-list .workspace-entry').filter({hasText:'Synthetic archived board'});
  const activeDetails=active.locator('.workspace-lifecycle-actions');
  await activeDetails.locator('summary').click();
  await expect(activeDetails.getByRole('button',{name:'Archive',exact:true})).toBeVisible();
  await expect(activeDetails.getByRole('button',{name:'Delete',exact:true})).toBeVisible();
  await expect(activeDetails.getByRole('button',{name:'Delete permanently',exact:true})).toHaveCount(0);
  await expect(archived.getByRole('button',{name:'Delete',exact:true})).toBeVisible();
  await expect(archived.getByRole('button',{name:'Delete permanently',exact:true})).toHaveCount(0);
});

test('archived Restore and Delete are one compact equal-size vertical action group',async({page})=>{
  await installFixture(page);const manager=await openBoards(page);const row=manager.locator('#archived-board-list .workspace-entry').filter({hasText:'Synthetic archived board'}),group=row.locator('.board-archived-actions');
  await expect(group).toHaveCount(1);
  const restore=group.getByRole('button',{name:'Restore',exact:true}),remove=group.getByRole('button',{name:'Delete',exact:true});
  await expect(restore).toBeVisible();await expect(remove).toBeVisible();
  const metrics=await Promise.all([box(restore),box(remove),box(group),box(row),box(row.locator('.cloud-workspace-card'))]);
  const [restoreBox,removeBox,groupBox,rowBox,cardBox]=metrics;
  expect(Math.abs(restoreBox.width-removeBox.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(restoreBox.height-removeBox.height)).toBeLessThanOrEqual(1);
  expect(restoreBox.top).toBeLessThan(removeBox.top);
  expect(Math.abs(restoreBox.left-removeBox.left)).toBeLessThanOrEqual(1);
  expect(groupBox.width).toBeLessThanOrEqual(180);
  expect(groupBox.right).toBeLessThanOrEqual(rowBox.right+layoutEdgeTolerance);
  expect(groupBox.bottom).toBeLessThanOrEqual(rowBox.bottom+1);
  expect(cardBox.right<=groupBox.left+1||cardBox.bottom<=groupBox.top+1).toBeTruthy();
});

test('active More keeps Archive as a painted button with balanced action height and no hidden leakage',async({page})=>{
  await installFixture(page);const manager=await openBoards(page);const row=manager.locator('#workspace-board-list .workspace-entry').filter({hasText:'Synthetic active board'}),details=row.locator('.workspace-lifecycle-actions'),summary=details.locator('summary');
  await expect(details.getByRole('button',{name:'Archive',exact:true})).toBeHidden();await expect(details.getByRole('button',{name:'Delete',exact:true})).toBeHidden();
  await summary.click();await expect(details.getByRole('button',{name:'Archive',exact:true})).toBeVisible();await expect(details.getByRole('button',{name:'Delete',exact:true})).toBeVisible();
  const archive=details.getByRole('button',{name:'Archive',exact:true}),remove=details.getByRole('button',{name:'Delete',exact:true}),[archiveBox,removeBox]=await Promise.all([box(archive),box(remove)]);
  const archiveStyle=await box(archive);expect(archiveStyle.background).not.toMatch(/^rgba\(255, 255, 255, 0\.16\)$/);expect(archiveStyle.borderColor).not.toMatch(/^rgba\(0, 0, 0, 0\)$/);expect(Math.abs(archiveBox.height-removeBox.height)).toBeLessThanOrEqual(1);expect(archiveBox.height).toBeGreaterThanOrEqual(38);
  await summary.click();await expect(archive).toBeHidden();await expect(remove).toBeHidden();
  await summary.focus();await page.keyboard.press('Enter');await expect(details.getByRole('button',{name:'Archive',exact:true})).toBeVisible();
  await page.keyboard.press('Enter');await expect(details.getByRole('button',{name:'Archive',exact:true})).toBeHidden();
});

test('row Delete opens and cancels the existing permanent-delete confirmation without mutation',async({page})=>{
  await installFixture(page);const manager=await openBoards(page);const row=manager.locator('#archived-board-list .workspace-entry').filter({hasText:'Synthetic archived board'}),before=await localSentinels(page);
  await row.locator('.button-danger').click();
  const confirmation=page.getByRole('dialog',{name:'Delete board permanently?'});await expect(confirmation).toBeVisible();
  await expect(confirmation).toContainText('Synthetic archived board');await expect(confirmation).toContainText('2 lists');await expect(confirmation).toContainText('3 cards');await expect(confirmation).toContainText('1 comments');await expect(confirmation).toContainText('This cannot be undone.');
  await expect(confirmation.locator('input')).toHaveCount(1);await expect(confirmation.getByRole('button',{name:'Delete permanently',exact:true})).toHaveCount(1);
  await confirmation.getByRole('button',{name:'Cancel',exact:true}).click();await expect(confirmation).toBeHidden();
  expect(await page.evaluate(()=>globalThis.__boardRowActionsFixture.calls)).toEqual({preflight:1,mutations:0,archive:0});expect(await localSentinels(page)).toEqual(before);
});

test('row actions stay bounded across desktop, short, narrow, theme, media, and long-name layouts',async({page})=>{
  await installFixture(page,{longNames:true});const manager=await openBoards(page);const active=manager.locator('#workspace-board-list .workspace-entry').filter({hasText:'Synthetic active board'}),details=active.locator('.workspace-lifecycle-actions');await details.locator('summary').click();
  const before=await localSentinels(page),viewports=[{name:'desktop',width:1280,height:720},{name:'office',width:1440,height:900},{name:'wide',width:1920,height:1080},{name:'resized',width:960,height:720},{name:'short',width:960,height:540},{name:'phone',width:390,height:844},{name:'narrow',width:320,height:740}],samples=[];
  await page.emulateMedia({reducedMotion:'reduce',forcedColors:'active'});expect(await page.evaluate(()=>matchMedia('(forced-colors: active)').matches)).toBe(true);
  for(const theme of ['light','dark']){
    await page.evaluate(value=>{if(value==='light')delete document.documentElement.dataset.theme;else document.documentElement.dataset.theme=value;},theme);
    for(const viewport of viewports){
      await page.setViewportSize({width:viewport.width,height:viewport.height});
      const row=manager.locator('#archived-board-list .workspace-entry').filter({hasText:'Synthetic archived board'}),group=row.locator('.board-archived-actions'),restore=group.getByRole('button',{name:'Restore',exact:true}),remove=group.getByRole('button',{name:'Delete',exact:true});
      const [rowBox,cardBox,groupBox,restoreBox,removeBox,activeRowBox,detailsBox]=await Promise.all([box(row),box(row.locator('.cloud-workspace-card')),box(group),box(restore),box(remove),box(active),box(details)]);
      const documentBox=await page.evaluate(()=>({width:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth}));
      expect(Math.abs(restoreBox.width-removeBox.width)).toBeLessThanOrEqual(1);expect(Math.abs(restoreBox.height-removeBox.height)).toBeLessThanOrEqual(1);expect(restoreBox.top).toBeLessThan(removeBox.top);expect(groupBox.right).toBeLessThanOrEqual(rowBox.right+layoutEdgeTolerance);expect(groupBox.bottom).toBeLessThanOrEqual(rowBox.bottom+1);expect(cardBox.right<=groupBox.left+1||cardBox.bottom<=groupBox.top+1).toBeTruthy();expect(detailsBox.right).toBeLessThanOrEqual(activeRowBox.right+layoutEdgeTolerance);expect(detailsBox.bottom).toBeLessThanOrEqual(activeRowBox.bottom+1);expect(documentBox.scrollWidth).toBeLessThanOrEqual(documentBox.width+1);samples.push({theme,viewport:viewport.name,groupWidth:groupBox.width,buttonWidth:restoreBox.width,buttonHeight:restoreBox.height,documentWidth:documentBox.width,documentScrollWidth:documentBox.scrollWidth});
    }
  }
  await page.setViewportSize({width:640,height:720});
  const zoomRow=manager.locator('#archived-board-list .workspace-entry').filter({hasText:'Synthetic archived board'}),zoomGroup=zoomRow.locator('.board-archived-actions'),zoomRestore=zoomGroup.getByRole('button',{name:'Restore',exact:true}),zoomDelete=zoomGroup.getByRole('button',{name:'Delete',exact:true}),[zoomRowBox,zoomGroupBox,zoomRestoreBox,zoomDeleteBox]=await Promise.all([box(zoomRow),box(zoomGroup),box(zoomRestore),box(zoomDelete)]);
  expect(Math.abs(zoomRestoreBox.width-zoomDeleteBox.width)).toBeLessThanOrEqual(1);expect(zoomGroupBox.right).toBeLessThanOrEqual(zoomRowBox.right+1);expect(zoomGroupBox.bottom).toBeLessThanOrEqual(zoomRowBox.bottom+1);await page.evaluate(()=>document.documentElement.removeAttribute('data-theme'));await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'none'});expect(await localSentinels(page)).toEqual(before);expect(samples).toHaveLength(14);
});

test('coarse-pointer actions keep at least 44px hit targets',async({browser})=>{
  const context=await browser.newContext({baseURL:process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4173',viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  try{const page=await context.newPage();await installFixture(page);const manager=await openBoards(page),archived=manager.locator('#archived-board-list .workspace-entry').filter({hasText:'Synthetic archived board'}),group=archived.locator('.board-archived-actions'),active=manager.locator('#workspace-board-list .workspace-entry').filter({hasText:'Synthetic active board'}),details=active.locator('.workspace-lifecycle-actions');await details.locator('summary').click();const buttons=await Promise.all([box(group.getByRole('button',{name:'Restore',exact:true})),box(group.getByRole('button',{name:'Delete',exact:true})),box(details.getByRole('button',{name:'Archive',exact:true})),box(details.getByRole('button',{name:'Delete',exact:true}))]);expect(await page.evaluate(()=>matchMedia('(pointer: coarse)').matches)).toBe(true);for(const button of buttons)expect(button.height).toBeGreaterThanOrEqual(44);}finally{await context.close();}
});

test('editor and viewer rows do not expose owner lifecycle actions',async({browser})=>{
  for(const role of ['editor','viewer']){const context=await browser.newContext({baseURL:process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4173',viewport:{width:960,height:720}});try{const page=await context.newPage();await installFixture(page,{role});const manager=await openBoards(page),active=manager.locator('#workspace-board-list .workspace-entry').filter({hasText:'Synthetic active board'}),archived=manager.locator('#archived-board-list .workspace-entry').filter({hasText:'Synthetic archived board'});await expect(active.locator('.workspace-lifecycle-actions')).toHaveCount(0);await expect(archived.locator('.board-archived-actions')).toHaveCount(0);await expect(active.getByRole('button',{name:/^Open/})).toBeVisible();await expect(active.getByRole('button',{name:'Delete',exact:true})).toHaveCount(0);await expect(archived.getByRole('button',{name:'Restore',exact:true})).toHaveCount(0);expect(await page.evaluate(()=>globalThis.__boardRowActionsFixture.calls)).toEqual({preflight:0,mutations:0,archive:0});}finally{await context.close();}}
});

test('Your boards actions and permanent confirmation remain axe-clean',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(`${error.name}:${error.message}`));page.on('console',message=>{if(message.type()==='error')errors.push(`console:${message.text()}`);});await installFixture(page);const manager=await openBoards(page);await page.addScriptTag({path:axePath});expect(await audit(page)).toEqual([]);
  const active=manager.locator('#workspace-board-list .workspace-entry').filter({hasText:'Synthetic active board'});await active.locator('.workspace-lifecycle-actions summary').click();expect(await audit(page)).toEqual([]);
  const archived=manager.locator('#archived-board-list .workspace-entry').filter({hasText:'Synthetic archived board'});await archived.locator('.button-danger').click();await expect(page.getByRole('dialog',{name:'Delete board permanently?'})).toBeVisible();expect(await audit(page)).toEqual([]);await page.getByRole('dialog',{name:'Delete board permanently?'}).getByRole('button',{name:'Cancel',exact:true}).click();expect(errors).toEqual([]);
});
