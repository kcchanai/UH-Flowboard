const fs=require('node:fs');
const path=require('node:path');
const {spawn,spawnSync}=require('node:child_process');
const {chromium}=require('playwright');
const root=process.cwd(),out=path.join(root,'artifacts/account-bootstrap-fix'),env={...process.env};
const chrome='C:/Program Files (x86)/Google/Chrome/Application/chrome.exe';
const base='http://127.0.0.1:4391',url=base+'/UH-Flowboard/';
function run(args,name){const r=spawnSync(process.execPath,args,{cwd:root,env,encoding:'utf8',timeout:180000});fs.writeFileSync(path.join(out,name+'.log'),(r.stdout||'')+(r.stderr||''));if(r.status!==0)throw Error(name+' failed; inspect its local log');return r.stdout;}
function budget(name){const value=JSON.parse(run(['scripts/measure-mvp-v2-budgets.mjs'],name));const summary={source:value.source.manifestBytes,cap:value.source.capBytes,initialShellGzip:value.dist.categories['initial shell'].gzipBytes,lazyGzip:value.dist.categories['first-party lazy'].gzipBytes};fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(summary,null,2));return summary;}
(async()=>{
 const unconfigured=budget('unconfigured-budget');
 Object.assign(env,{VITE_FIREBASE_API_KEY:'synthetic-api-key',VITE_FIREBASE_AUTH_DOMAIN:'demo-flowboard-browser.firebaseapp.com',VITE_FIREBASE_PROJECT_ID:'demo-flowboard-browser',VITE_FIREBASE_APP_ID:'1:000000000000:web:synthetic',PLAYWRIGHT_BASE_URL:base,PLAYWRIGHT_EXECUTABLE_PATH:chrome,CHROME_PATH:chrome});
 run(['node_modules/vite/bin/vite.js','build'],'configured-build');
 const configured=budget('configured-budget');
 const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4391','--strictPort'],{cwd:root,env,stdio:'pipe'});
 server.stdout.on('data',()=>{});server.stderr.on('data',()=>{});
 let browser;
 try{
   let ready=false;
   for(let i=0;i<40;i++){if(server.exitCode!==null)throw Error('Owned preview exited');try{if((await fetch(url)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}
   if(!ready)throw Error('Owned preview did not become ready');
   const output=run(['node_modules/@playwright/test/cli.js','test','tests/cloud-first-configured-session.spec.mjs','tests/cloud-first-a11y.spec.mjs','tests/browser-smoke.spec.mjs','tests/single-workspace-board-ux.spec.mjs','--grep=cloud-first board|Filters stays bounded|configured signed-out build|board manager|Data recovery route|New board is visible|archived owner board','--workers=1'],'ci-browser');
   const count=Number(output.match(/(\d+) passed/)?.[1]);if(!count)throw Error('Missing browser result count');
   browser=await chromium.launch({headless:true,executablePath:chrome});
   const page=await browser.newPage({viewport:{width:960,height:540}}),errors=[];
   page.on('pageerror',()=>errors.push('pageerror'));
   await page.goto(url);await page.waitForFunction(()=>globalThis.FlowboardApp?.getMode().kind==='signed-out');
   const asset='/UH-Flowboard/assets/'+fs.readdirSync('dist/assets').find(f=>/^cloud-ui-.*\.js$/.test(f));
   await page.evaluate(async asset=>{
     globalThis.FlowboardApp={getMode:()=>({kind:'error',message:'Account setup failed (permission-denied). Retry setup or open Data recovery.'}),getActiveBoardId:()=>''};
     const {initializeCloudWorkspaceUI}=await import(asset);
     initializeCloudWorkspaceUI({localAdapter:{inspectLegacyWorkspace:()=>({status:'none',counts:{boards:0}})},cloudAdapter:{listBoardDirectory:async()=>[]}}).setSession({uid:'synthetic-owner'});
     document.querySelector('#boards-button').disabled=false;
   },asset);
   await page.locator('#boards-button').click();await page.getByRole('dialog',{name:'Your boards'}).getByRole('button',{name:'Retry setup'}).waitFor();
   await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
   const violations=await page.evaluate(async()=>{const result=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return result.violations.map(x=>x.id);});
   if(violations.length||errors.length)throw Error('Failure-state accessibility/runtime check failed: '+JSON.stringify({violations,errors}));
   await page.screenshot({path:path.join(out,'built-error-short-desktop.png'),fullPage:true});
   await page.locator('#close-workspace-dialog').click();if(await page.locator('#workspace-dialog').isVisible())throw Error('Pointer close failed');
   await browser.close();browser=null;
   run(['node_modules/lighthouse/cli/index.js',url,'--only-categories=accessibility','--chrome-flags=--headless --no-sandbox','--output=json','--output-path='+path.join(out,'lighthouse-report.json')],'lighthouse');
   run(['scripts/assert-lighthouse.mjs',path.join(out,'lighthouse-report.json')],'lighthouse-assert');
   const result={unconfigured,configured,ciBrowserPassed:count,failureDialogAxeViolations:violations.length,pageErrors:errors.length,lighthouseAccessibility:1,lighthouseFailedAudits:0};
   fs.writeFileSync(path.join(out,'preview-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
 }finally{if(browser)await browser.close();if(server.exitCode===null){server.kill();await new Promise(r=>server.once('exit',r));}}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
