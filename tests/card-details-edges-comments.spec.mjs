import {test,expect} from '@playwright/test';
import {readdirSync} from 'node:fs';
import {basePath} from '../scripts/repository-path.mjs';

const builtCloudUIAsset=()=>`${basePath}assets/${readdirSync('dist/assets').find(file=>file.startsWith('cloud-ui-')&&file.endsWith('.js'))}`;
const viewports=[
  {name:'desktop-light',width:1440,height:900,theme:'light'},
  {name:'short-dark',width:960,height:540,theme:'dark'},
  {name:'phone-light',width:390,height:844,theme:'light'}
];

const openShell=async page=>{await page.goto(basePath);await page.waitForFunction(()=>globalThis.FlowboardApp&&globalThis.FlowboardState);await page.waitForFunction(()=>['unavailable','signed-out','cloud','cloud-preview','ready-empty'].includes(globalThis.FlowboardApp.getMode().kind));};

async function installSyntheticCard(page,{commentCount=12,defer=false}={}){
  await page.evaluate(async({asset,commentCount,defer})=>{
    const S=FlowboardState,workspace=S.makeEmptyWorkspace(),board=S.makeBoard('blank'),first=S.makeCard('Synthetic edge audit'),second=S.makeCard('Synthetic second card');
    first.description='Synthetic long-form card details content for edge coverage.';
    first.labels=Array.from({length:10},(_,index)=>({id:`label-${index}`,color:'orange',name:`Synthetic label ${index+1}`}));
    first.checklist=Array.from({length:8},(_,index)=>({id:`check-${index}`,text:`Synthetic checklist item ${index+1}`,done:false}));
    first.activity=Array.from({length:10},(_,index)=>({id:`activity-${index}`,text:`Synthetic activity ${index+1}`,at:'2026-01-01T12:00:00Z'}));
    board.lists=[S.makeList('Synthetic list',[first,second])];workspace.boards=[board];workspace.activeBoardId=board.id;
    FlowboardApp.openCloudWorkspace(workspace,{id:'synthetic-card-details',name:'Synthetic card details',role:'owner'});
    const entries=Array.from({length:commentCount},(_,index)=>({id:`comment-${index}`,authorUid:'synthetic-owner',body:`Synthetic comment ${index+1}: edge coverage sentinel.`,createdAt:new Date('2026-01-01T12:00:00Z'),revision:0}));
    const fixture={entries,subscribeOptions:null,subscribeCount:0,unsubscribed:0};globalThis.__cardDetailsFixture=fixture;
    const adapter={
      listMembers:async()=>[{uid:'synthetic-owner',displayName:'Synthetic Owner',role:'owner'}],
      subscribeComments:async options=>{fixture.subscribeOptions=options;fixture.subscribeCount+=1;if(!defer)options.onComments({entries:fixture.entries,cursor:null,hasMore:false});return()=>{fixture.unsubscribed+=1;};},
      listOlderComments:async()=>({entries:[],cursor:null,hasMore:false}),
      createComment:async()=>{throw Error('Synthetic comment writes are disabled in this UI fixture.');},
      updateComment:async()=>{throw Error('Synthetic comment writes are disabled in this UI fixture.');},
      removeComment:async()=>{throw Error('Synthetic comment writes are disabled in this UI fixture.');}
    };
    const {initializeCommentsUI}=await import(asset);const controller=initializeCommentsUI(adapter);fixture.controller=controller;controller.setSession({uid:'synthetic-owner',displayName:'Synthetic Owner'});
  },{asset:builtCloudUIAsset(),commentCount,defer});
}

const openCard=async(page,index=0)=>{const card=page.locator('.card-open').nth(index);await card.click();await expect(page.locator('#card-dialog')).toBeVisible();return card;};

async function edgeMetrics(page,position){
  return page.evaluate(async position=>{
    const form=document.querySelector('#card-form'),header=document.querySelector('#card-dialog .card-dialog-header'),footer=document.querySelector('#card-dialog .card-dialog-footer'),body=document.querySelector('#card-dialog-body');
    const scroll=body||form;const max=Math.max(0,scroll.scrollHeight-scroll.clientHeight);scroll.scrollTop=position==='top'?0:position==='middle'?Math.round(max*.45):Math.max(0,max-2);await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const rect=element=>{const value=element.getBoundingClientRect();return{x:value.x,y:value.y,width:value.width,height:value.height,right:value.right,bottom:value.bottom};};
    const point=(x,y)=>{const nodes=document.elementsFromPoint(x,y),node=nodes[0];return{tag:node?.tagName||'',id:node?.id||'',className:node?.className||'',inHeader:nodes.some(item=>header.contains(item)),inFooter:nodes.some(item=>footer.contains(item))};};
    const formRect=rect(form),headerRect=rect(header),footerRect=rect(footer),bodyRect=body?rect(body):null,footerButton=footer.querySelector('button'),footerButtonRect=footerButton?.getBoundingClientRect();
    return{position,bodyPresent:Boolean(body),scrollTop:scroll.scrollTop,maxScroll:max,form:formRect,header:headerRect,footer:footerRect,body:bodyRect,topGap:headerRect.y-formRect.y,bottomGap:formRect.bottom-footerRect.bottom,topCovered:point(formRect.x+formRect.width/2,formRect.y+1),bottomCovered:footerButtonRect?point(footerButtonRect.x+footerButtonRect.width/2,footerButtonRect.y+footerButtonRect.height/2):point(formRect.x+formRect.width/2,formRect.bottom-2),bodyOverflow:body?getComputedStyle(body).overflowY:'missing'};
  },position);
}

test('card-details header and footer cover the inner window at every scroll position',async({page})=>{
  await openShell(page);await installSyntheticCard(page,{commentCount:18});
  for(const viewport of viewports){
    await page.setViewportSize({width:viewport.width,height:viewport.height});
    await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;},viewport.theme);
    const card=await openCard(page);await expect(page.locator('#cloud-comments-list .comment-item')).toHaveCount(18);
    for(const position of ['top','middle','end']){
      const metrics=await edgeMetrics(page,position);console.log(`Card edge metrics ${JSON.stringify({viewport:viewport.name,...metrics})}`);
      expect(Math.abs(metrics.topGap)).toBeLessThanOrEqual(1);expect(Math.abs(metrics.bottomGap)).toBeLessThanOrEqual(1);expect(metrics.topCovered.inHeader).toBe(true);expect(metrics.bottomCovered.inFooter).toBe(true);
      expect(metrics.bodyPresent).toBe(true);expect(metrics.bodyOverflow).toMatch(/auto|scroll/);expect(metrics.body.y).toBeGreaterThanOrEqual(metrics.header.bottom-1);expect(metrics.body.bottom).toBeLessThanOrEqual(metrics.footer.y+1);
    }
    await page.locator('#close-card-dialog').click();await expect(page.locator('#card-dialog')).toBeHidden();await expect(card).toBeFocused();
  }
});

test('comments remove retired explanatory and idle copy but retain operational status',async({page})=>{
  const consoleErrors=[];page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});await openShell(page);await installSyntheticCard(page,{commentCount:2});await openCard(page);const section=page.locator('#cloud-comments-section'),status=page.locator('#cloud-comments-status');
  await expect(section).not.toContainText('Authenticated cloud comments are separate from older card-local activity.');await expect(status).toHaveText('');await expect(section).toContainText('Synthetic comment 1');
  await page.evaluate(()=>globalThis.__cardDetailsFixture.subscribeOptions.onError(new Error('Synthetic comments failure')));await expect(status).toContainText('Synthetic comments failure');
  await page.evaluate(()=>globalThis.__cardDetailsFixture.subscribeOptions.onComments({entries:globalThis.__cardDetailsFixture.entries,cursor:null,hasMore:false}));await expect(status).toHaveText('');
  await page.locator('#close-card-dialog').click();await openCard(page);await expect(status).toHaveText('');await expect(section).not.toContainText('Comments are current.');
  expect(consoleErrors.length).toBe(1);
});

test('delayed comment results are discarded after close and local sentinel bytes stay unchanged',async({page})=>{
  const current='{"syntheticLegacy":"keep-current"}',older='[{"syntheticLegacy":"keep-older"}]';await page.addInitScript(({current,older})=>{localStorage.setItem('flowboard-workspace',current);localStorage.setItem('flowboard-data',older);},{current,older});await openShell(page);await installSyntheticCard(page,{commentCount:1,defer:true});const card=await openCard(page);await page.waitForFunction(()=>Boolean(globalThis.__cardDetailsFixture.subscribeOptions));await page.locator('#close-card-dialog').click();await expect(page.locator('#card-dialog')).toBeHidden();await page.evaluate(()=>globalThis.__cardDetailsFixture.subscribeOptions.onComments({entries:[{id:'stale-comment',authorUid:'synthetic-owner',body:'Stale delayed comment',createdAt:new Date('2026-01-01T12:00:00Z'),revision:0}],cursor:null,hasMore:false}));await expect(page.locator('#cloud-comments-section')).toBeHidden();await expect(page.locator('#cloud-comments-list')).not.toContainText('Stale delayed comment');await expect(card).toBeFocused();expect(await page.evaluate(()=>({current:localStorage.getItem('flowboard-workspace'),older:localStorage.getItem('flowboard-data')}))).toEqual({current,older});
});
