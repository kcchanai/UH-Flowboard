import {test,expect} from '@playwright/test';
import {readdirSync} from 'node:fs';
import {basePath} from '../scripts/repository-path.mjs';

const openReady=async page=>{await page.goto(basePath);await page.waitForFunction(()=>globalThis.FlowboardApp&&globalThis.FlowboardState&&['unavailable','signed-out','cloud','cloud-preview','ready-empty'].includes(FlowboardApp.getMode().kind));};
const rect=locator=>locator.evaluate(node=>{const r=node.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};});
async function syntheticBoard(page,{dense=false}={}){
  await page.evaluate(dense=>{const w=FlowboardState.makeEmptyWorkspace(),b=FlowboardState.makeBoard('blank'),rich=FlowboardState.makeCard('A long synthetic task title that has to wrap cleanly across multiple lines');rich.labels=[{id:'synthetic-label',name:'Design',color:'purple'}];rich.description='Synthetic notes';rich.checklist=[{id:'synthetic-item',text:'First step',done:true}];rich.dueDate='2026-10-04';const cards=Array.from({length:dense?30:1},(_,i)=>i?FlowboardState.makeCard(`Synthetic task ${i}`):rich);b.title='Synthetic project';b.lists=[FlowboardState.makeList('Backlog',cards),FlowboardState.makeList('Doing',[FlowboardState.makeCard('Another synthetic task')]),FlowboardState.makeList('Done',[FlowboardState.makeCard('Final synthetic task')])];w.boards=[b];w.activeBoardId=b.id;FlowboardApp.openCloudWorkspace(w,{id:'demo-visual-review',name:'Synthetic project',role:'owner'});},dense);
  await expect(page.locator('.card-open').first()).toBeVisible();
}

test('board header, card metadata, compact columns and scroll cue stay usable',async({page})=>{
  await openReady(page);await syntheticBoard(page);
  for(const width of [1280,1440,1920,960,390,320]){
    await page.setViewportSize({width,height:width===960?720:844});
    const heading=await rect(page.locator('.board-heading')),create=await rect(page.locator('#quick-add-card')),actions=await rect(page.locator('.board-actions')),search=await rect(page.locator('.board-search')),board=await rect(page.locator('#board'));
    expect(heading.bottom).toBeLessThanOrEqual(board.top);expect(create.bottom).toBeLessThanOrEqual(board.top);expect(actions.bottom).toBeLessThanOrEqual(board.top);expect(search.bottom).toBeLessThanOrEqual(board.top);
    if(width>700){expect(heading.right).toBeLessThanOrEqual(create.left+1);expect(create.right).toBeLessThanOrEqual(actions.left+1);}
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await page.setViewportSize({width:960,height:720});
  const short=await page.locator('.list').first().evaluate(node=>({height:node.getBoundingClientRect().height,boardHeight:document.querySelector('#board').getBoundingClientRect().height,addTop:node.querySelector('.add-card').getBoundingClientRect().top,lastCardBottom:node.querySelector('.card:last-of-type').getBoundingClientRect().bottom}));
  expect(short.height).toBeLessThan(short.boardHeight*.8);expect(short.addTop-short.lastCardBottom).toBeLessThan(90);
  const first=page.locator('.card').first();await expect(first.locator('.card-title')).toBeVisible();const title=await rect(first.locator('.card-title')),labels=await rect(first.locator('.labels')),meta=await rect(first.locator('.card-meta'));expect(title.bottom).toBeLessThanOrEqual(labels.top+1);expect(labels.bottom).toBeLessThanOrEqual(meta.top+1);await expect(first.locator('.card-meta')).toContainText('Due:');
  await expect(page.locator('#board-scroll-cue')).toBeVisible();await page.locator('#board').evaluate(node=>node.scrollLeft=node.scrollWidth);await expect(page.locator('#board-scroll-cue')).toBeHidden();
  await page.evaluate(()=>{const card=document.querySelector('.list .card'),destination=document.querySelectorAll('.list')[1].querySelector('.cards'),transfer=new DataTransfer();card.dispatchEvent(new DragEvent('dragstart',{bubbles:true,dataTransfer:transfer}));destination.dispatchEvent(new DragEvent('dragover',{bubbles:true,cancelable:true,dataTransfer:transfer}));});
  await expect(page.locator('.list').nth(1)).toHaveClass(/drop-target/);await page.locator('.list .card').first().evaluate(node=>node.dispatchEvent(new DragEvent('dragend',{bubbles:true})));
  await syntheticBoard(page,{dense:true});const long=page.locator('.list').first();await expect.poll(()=>long.locator('.cards').evaluate(node=>node.scrollHeight>node.clientHeight)).toBe(true);expect((await rect(long)).bottom).toBeLessThanOrEqual((await rect(page.locator('#board'))).bottom+1);
});

test('signed-out landing stays cohesive and Appearance reset announces preview',async({page})=>{
  await openReady(page);await expect(page.locator('.cloud-gate')).toBeVisible();await page.setViewportSize({width:390,height:844});
  const heading=await rect(page.locator('.board-heading')),gate=await rect(page.locator('.cloud-gate'));
  expect(Math.abs((heading.left+heading.right)/2-(gate.left+gate.right)/2)).toBeLessThan(16);expect(gate.top-heading.bottom).toBeLessThan(85);
  if((await page.evaluate(()=>FlowboardApp.getMode().kind))==='signed-out') await expect(page.locator('.cloud-gate-note')).toContainText('stays on this device');
  else await expect(page.locator('.cloud-gate p')).toBeVisible();
  await page.locator('#theme-toggle').click();await expect(page.locator('#appearance-dialog')).toBeVisible();await page.locator('#reset-appearance').click();await expect(page.locator('#appearance-status')).toHaveText('Default appearance previewed. Save appearance to keep it in this browser.');await page.locator('#cancel-appearance').click();await expect(page.locator('#appearance-dialog')).toBeHidden();
});

test('board directory groups each board with its actions and quiets routine status',async({page})=>{
  await openReady(page);
  const asset=`${basePath}assets/${readdirSync('dist/assets').find(f=>f.startsWith('cloud-ui-')&&f.endsWith('.js'))}`;
  await page.evaluate(async asset=>{const fixture={id:'demo-directory',ownerUid:'synthetic-owner',role:'owner',status:'ready',personal:true,migration:{state:'verified'},hasMore:false,boards:[...Array.from({length:10},(_,i)=>({id:`demo-active-${i}`,title:`Synthetic active board ${i+1}`,rank:i,archived:false,revision:0})),{id:'demo-archived',title:'Synthetic archived board',rank:10,archived:true,revision:0}]};globalThis.FlowboardApp={getMode:()=>({kind:'cloud',id:fixture.id,personalWorkspaceId:fixture.id,role:'owner'}),getActiveBoardId:()=>fixture.boards[0].id,openCloudWorkspace:()=>{},openCloudPreview:()=>{},selectBoard:()=>{},createBoard:()=>false,handleCloudAccessRemoved:()=>{}};const {initializeCloudWorkspaceUI}=await import(asset);initializeCloudWorkspaceUI({localAdapter:{inspectLegacyWorkspace:()=>({status:'none',counts:{boards:0}})},cloudAdapter:{listBoardDirectory:async()=>[fixture],fetchWorkspace:async()=>({schemaVersion:5,activeBoardId:fixture.boards[0].id,boards:[]})}}).setSession({uid:'synthetic-owner'});document.querySelector('#boards-button').disabled=false;},asset);
  await page.locator('#boards-button').click();const dialog=page.locator('#workspace-dialog');await expect(dialog).toBeVisible();await expect(dialog.locator('#cloud-workspaces-status')).toBeEmpty();await expect(dialog.locator('#cloud-workspaces-status')).toBeHidden();
  await expect(dialog.locator('#workspace-board-list .workspace-entry')).toHaveCount(10);
  for(const [width,height] of [[1280,720],[960,540],[390,844]]){await page.setViewportSize({width,height});for(const row of await dialog.locator('.workspace-entry').all()){const card=await rect(row.locator('.cloud-workspace-card')),actions=await rect(row.locator('.workspace-row-actions')),outer=await rect(row);expect(actions.right).toBeLessThanOrEqual(outer.right+1);expect(actions.bottom).toBeLessThanOrEqual(outer.bottom+1);expect(card.right<=actions.left+1||card.bottom<=actions.top+1).toBe(true);} }
  await dialog.locator('#workspace-search').fill('Synthetic active board 10');await expect(dialog.locator('#workspace-board-list .workspace-entry')).toHaveCount(1);await dialog.locator('#workspace-search').fill('');
  const active=dialog.locator('#workspace-board-list .workspace-entry').first();await active.locator('summary').click();await expect(active.getByRole('button',{name:'Archive'})).toBeVisible();await expect(active.getByRole('button',{name:'Delete',exact:true})).toBeVisible();await dialog.getByRole('button',{name:'Close boards'}).click();
});
