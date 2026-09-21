import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {readdirSync} from 'node:fs';
import path from 'node:path';
import {basePath} from '../../scripts/repository-path.mjs';

const dir=path.dirname(new URL(import.meta.url).pathname).replace(/^\//,'').replace(/\//g,'/');
const root=path.resolve(dir);
const origin=(process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4192').replace(/\/$/,'');
const asset=()=>`${basePath}assets/${readdirSync('dist/assets').find(file=>file.startsWith('cloud-ui-')&&file.endsWith('.js'))}`;
const scenarios=[
  {name:'desktop-light-top',width:1440,height:900,theme:'light',position:'top'},
  {name:'desktop-light-end',width:1440,height:900,theme:'light',position:'end'},
  {name:'short-dark-middle',width:960,height:540,theme:'dark',position:'middle'},
  {name:'phone-light-middle',width:390,height:844,theme:'light',position:'middle'},
  {name:'desktop-light-failure',width:1440,height:900,theme:'light',position:'middle',failure:true}
];
const result={source:'local unconfigured production preview with synthetic in-memory card/comments',count:0,captures:[]};
await mkdir(root,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'});
try{
  for(const scenario of scenarios){
    const context=await browser.newContext({viewport:{width:scenario.width,height:scenario.height}}),page=await context.newPage(),errors={console:[],page:[],requests:[]};
    page.on('console',message=>{if(message.type()==='error')errors.console.push(message.text());});
    page.on('pageerror',error=>errors.page.push(error.message));
    page.on('requestfailed',request=>errors.requests.push({url:new URL(request.url()).host,error:request.failure()?.errorText||'failed'}));
    await page.goto(`${origin}${basePath}`,{waitUntil:'networkidle'});await page.waitForFunction(()=>globalThis.FlowboardApp&&globalThis.FlowboardState);await page.waitForFunction(()=>['signed-out','unavailable','cloud','cloud-preview','ready-empty'].includes(globalThis.FlowboardApp.getMode().kind));
    await page.evaluate(async({asset,theme})=>{
      document.documentElement.dataset.theme=theme;const S=FlowboardState,w=S.makeEmptyWorkspace(),b=S.makeBoard('blank'),c=S.makeCard('Synthetic final edge card');c.description='Synthetic final capture content.';c.labels=Array.from({length:8},(_,i)=>({id:`label-${i}`,color:'orange',name:`Synthetic label ${i+1}`}));c.checklist=Array.from({length:8},(_,i)=>({id:`check-${i}`,text:`Synthetic checklist item ${i+1}`,done:false}));c.activity=Array.from({length:12},(_,i)=>({id:`activity-${i}`,text:`Synthetic activity ${i+1}`,at:'2026-01-01T12:00:00Z'}));b.lists=[S.makeList('Synthetic list',[c])];w.boards=[b];w.activeBoardId=b.id;FlowboardApp.openCloudWorkspace(w,{id:'synthetic-final-capture',name:'Synthetic final capture',role:'owner'});
      const entries=Array.from({length:10},(_,i)=>({id:`comment-${i}`,authorUid:'synthetic-owner',body:`Synthetic final comment ${i+1}`,createdAt:new Date('2026-01-01T12:00:00Z'),revision:0}));const state={options:null};globalThis.__finalCapture=state;const adapter={listMembers:async()=>[{uid:'synthetic-owner',displayName:'Synthetic Owner',role:'owner'}],subscribeComments:async options=>{state.options=options;options.onComments({entries,cursor:null,hasMore:false});return()=>{};},listOlderComments:async()=>({entries:[],cursor:null,hasMore:false}),createComment:async()=>{},updateComment:async()=>{},removeComment:async()=>{}};const {initializeCommentsUI}=await import(asset);initializeCommentsUI(adapter).setSession({uid:'synthetic-owner'});
    },{asset:asset(),theme:scenario.theme});
    const card=page.locator('.card-open');await card.click();await page.waitForFunction(()=>document.querySelectorAll('#cloud-comments-list .comment-item').length===10);await page.waitForFunction(()=>document.querySelector('#cloud-comments-section')&&!document.querySelector('#cloud-comments-section').hidden);
    const metrics=await page.evaluate(async position=>{const form=document.querySelector('#card-form'),body=document.querySelector('#card-dialog-body'),header=document.querySelector('.card-dialog-header'),footer=document.querySelector('.card-dialog-footer');const max=body.scrollHeight-body.clientHeight;body.scrollTop=position==='top'?0:position==='middle'?Math.round(max*.45):max;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom};};return{dialog:rect(document.querySelector('#card-dialog')),form:rect(form),header:rect(header),body:rect(body),footer:rect(footer),topGap:header.getBoundingClientRect().y-form.getBoundingClientRect().y,bottomGap:form.getBoundingClientRect().bottom-footer.getBoundingClientRect().bottom,scrollTop:body.scrollTop,maxScroll:max,documentWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth,documentHeight:document.documentElement.scrollHeight,viewportHeight:innerHeight,status:document.querySelector('#cloud-comments-status').textContent,retiredCopy:document.querySelector('#cloud-comments-section').textContent.includes('Authenticated cloud comments are separate from older card-local activity.')||document.querySelector('#cloud-comments-section').textContent.includes('Comments are current.')};},scenario.position);
    if(scenario.failure){await page.evaluate(()=>globalThis.__finalCapture.options.onError(new Error('Synthetic comments failure')));await page.waitForFunction(()=>document.querySelector('#cloud-comments-status').textContent.includes('Synthetic comments failure'));metrics.failureStatus=await page.locator('#cloud-comments-status').textContent();}
    const shot=`final-${scenario.name}.png`;await page.screenshot({path:path.join(root,shot),fullPage:false});const expectedConsole=scenario.failure?errors.console.filter(text=>text.includes('Cloud comments stopped updating.')):[];result.captures.push({scenario,shot,metrics,errors,expectedConsoleErrors:expectedConsole});await context.close();
  }
  result.count=result.captures.length;await writeFile(path.join(root,'final-captures.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({count:result.count,captures:result.captures.map(item=>({scenario:item.scenario.name,shot:item.shot,metrics:item.metrics,consoleErrors:item.errors.console.length,pageErrors:item.errors.page.length,failedRequests:item.errors.requests.length,expectedConsoleErrors:item.expectedConsoleErrors.length}))},null,2));
}finally{await browser.close();}
