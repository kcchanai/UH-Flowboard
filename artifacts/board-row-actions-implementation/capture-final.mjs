import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {readdirSync} from 'node:fs';
import path from 'node:path';
import {basePath} from '../../scripts/repository-path.mjs';

const root=process.cwd(),origin=(process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4176').replace(/\/$/,''),assetName=readdirSync(path.join(root,'dist/assets')).find(file=>file.startsWith('cloud-ui-')&&file.endsWith('.js'));
if(!assetName)throw new Error('Built cloud UI asset is missing.');
const asset=`${basePath}assets/${assetName}`,outDir=path.join(root,'artifacts/board-row-actions-implementation/screenshots');
const executablePath=process.env.PLAYWRIGHT_EXECUTABLE_PATH||'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe';
const fixture={id:'synthetic-board-directory',name:'Synthetic directory',ownerUid:'synthetic-owner',role:'owner',status:'ready',personal:true,migration:{state:'verified'},hasMore:false,boards:[{id:'synthetic-active-board',title:'Synthetic active board',rank:0,archived:false,revision:0},{id:'synthetic-archived-board',title:'Synthetic archived board',rank:1,archived:true,revision:0}]};
const box=locator=>locator.evaluate(node=>{const rect=node.getBoundingClientRect(),style=getComputedStyle(node);return{left:rect.left,top:rect.top,right:rect.right,bottom:rect.bottom,width:rect.width,height:rect.height,background:style.backgroundColor,borderColor:style.borderColor};});
const openFixture=async page=>{const response=await page.goto(basePath);await page.waitForFunction(()=>globalThis.FlowboardApp&&globalThis.FlowboardState);await page.evaluate(async({asset,fixture})=>{globalThis.FlowboardApp={getMode:()=>({kind:'cloud',id:fixture.id,personalWorkspaceId:fixture.id,role:fixture.role}),getActiveBoardId:()=>fixture.boards[0].id,openCloudWorkspace:()=>{},openCloudPreview:()=>{},selectBoard:()=>{},createBoard:()=>false,handleCloudAccessRemoved:()=>{}};const cloudAdapter={listBoardDirectory:async()=>[fixture],fetchWorkspace:async()=>({schemaVersion:5,activeBoardId:fixture.boards[0].id,boards:fixture.boards.map(board=>({...board,lists:[]}))}),preflightDeletion:async()=>({counts:{lists:2,cards:3,comments:1}}),deleteEntity:async()=>{},setBoardArchived:async({archived})=>({archived,revision:1})};const{initializeCloudWorkspaceUI}=await import(asset);initializeCloudWorkspaceUI({localAdapter:{inspectLegacyWorkspace:()=>({status:'none',counts:{boards:0}})},cloudAdapter}).setSession({uid:'synthetic-owner'});document.querySelector('#boards-button').disabled=false;},{asset,fixture});await page.getByRole('button',{name:'Boards'}).click();const manager=page.getByRole('dialog',{name:'Your boards'});await manager.waitFor({state:'visible'});return{manager,httpStatus:response?.status()||0};};
const scenarios=[
  {name:'desktop-light-active',file:'final-desktop-light-active.png',theme:'light',viewport:{width:1440,height:900},surface:'active'},
  {name:'desktop-dark-active',file:'final-desktop-dark-active.png',theme:'dark',viewport:{width:1440,height:900},surface:'active'},
  {name:'short-dark-archived',file:'final-short-dark-archived.png',theme:'dark',viewport:{width:960,height:540},surface:'archived',scrollArchived:true},
  {name:'phone-light-archived',file:'final-phone-light-archived.png',theme:'light',viewport:{width:390,height:844},surface:'archived'},
  {name:'desktop-light-confirmation',file:'final-desktop-light-confirmation.png',theme:'light',viewport:{width:1440,height:900},surface:'confirmation'}
];
await mkdir(outDir,{recursive:true});const browser=await chromium.launch({headless:true,executablePath});const captures=[];
try{
  for(const scenario of scenarios){
    const context=await browser.newContext({baseURL:origin,viewport:scenario.viewport});const page=await context.newPage();const errors={console:[],page:[],requests:[]};page.on('console',message=>{if(message.type()==='error')errors.console.push(message.text());});page.on('pageerror',error=>errors.page.push(`${error.name}:${error.message}`));page.on('requestfailed',request=>errors.requests.push(request.url()));
    try{
      const opened=await openFixture(page);await page.evaluate(theme=>{if(theme==='dark')document.documentElement.dataset.theme='dark';else delete document.documentElement.dataset.theme;},scenario.theme);const manager=opened.manager;
      if(scenario.surface==='active'){
        const row=manager.locator('#workspace-board-list .workspace-entry').filter({hasText:'Synthetic active board'}),details=row.locator('.workspace-lifecycle-actions');await details.locator('summary').click();await page.screenshot({path:path.join(outDir,scenario.file),fullPage:false});const archive=details.getByRole('button',{name:'Archive',exact:true}),remove=details.getByRole('button',{name:'Delete',exact:true});captures.push({scenario:scenario.name,file:scenario.file,httpStatus:opened.httpStatus,viewport:scenario.viewport,theme:scenario.theme,surface:'active',labels:await details.locator('button').allTextContents(),geometry:{row:await box(row),details:await box(details),archive:await box(archive),delete:await box(remove)},errors});
      }else if(scenario.surface==='archived'){
        const row=manager.locator('#archived-board-list .workspace-entry').filter({hasText:'Synthetic archived board'}),group=row.locator('.board-archived-actions'),restore=group.getByRole('button',{name:'Restore',exact:true}),remove=group.getByRole('button',{name:'Delete',exact:true});if(scenario.scrollArchived)await row.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(outDir,scenario.file),fullPage:false});captures.push({scenario:scenario.name,file:scenario.file,httpStatus:opened.httpStatus,viewport:scenario.viewport,theme:scenario.theme,surface:'archived',labels:await group.locator('button').allTextContents(),geometry:{row:await box(row),card:await box(row.locator('.cloud-workspace-card')),group:await box(group),restore:await box(restore),delete:await box(remove)},errors});
      }else{
        const row=manager.locator('#workspace-board-list .workspace-entry').filter({hasText:'Synthetic active board'}),details=row.locator('.workspace-lifecycle-actions');await details.locator('summary').click();await details.getByRole('button',{name:'Delete',exact:true}).click();const confirmation=page.getByRole('dialog',{name:'Delete board permanently?'});await confirmation.waitFor({state:'visible'});await page.screenshot({path:path.join(outDir,scenario.file),fullPage:false});captures.push({scenario:scenario.name,file:scenario.file,httpStatus:opened.httpStatus,viewport:scenario.viewport,theme:scenario.theme,surface:'confirmation',labels:await confirmation.locator('button').allTextContents(),copy:await confirmation.textContent(),geometry:{confirmation:await box(confirmation)},errors});await confirmation.getByRole('button',{name:'Cancel',exact:true}).click();
      }
    }finally{await context.close();}
  }
}finally{await browser.close();}
const report={generatedFrom:{origin,basePath,asset:assetName,syntheticFixture:true,productionData:false},captures};await writeFile(path.join(root,'artifacts/board-row-actions-implementation/final-captures.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({captures:captures.map(item=>({scenario:item.scenario,file:item.file,httpStatus:item.httpStatus,errors:item.errors,labels:item.labels})),output:outDir},null,2));
