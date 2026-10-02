import {spawn,spawnSync} from 'node:child_process';
import {existsSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import net from 'node:net';

const ownedCache=path.resolve(process.env.FLOWBOARD_CURRENT_SUITE_CACHE||'node_modules/.cache/flowboard-current-suite');
mkdirSync(ownedCache,{recursive:true});
process.env.TEMP=process.env.TMP=ownedCache;
process.env.npm_config_cache=path.join(ownedCache,'npm');

const isWindows=process.platform==='win32';
const npx=isWindows?'npx.cmd':'npx';
const chrome=process.env.PLAYWRIGHT_EXECUTABLE_PATH||(isWindows?'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe':'');
const legacy=process.argv.includes('--legacy');
const port=Number(process.env.FLOWBOARD_CURRENT_SUITE_PORT||4203);
const baseURL=`http://127.0.0.1:${port}`;
const browserBuildEnv={VITE_FIREBASE_API_KEY:'demo-api-key',VITE_FIREBASE_AUTH_DOMAIN:'demo-flowboard-browser.firebaseapp.com',VITE_FIREBASE_PROJECT_ID:'demo-flowboard-browser',VITE_FIREBASE_APP_ID:'1:1234567890:web:demo'};
const unconfiguredBuildEnv={VITE_FIREBASE_API_KEY:'',VITE_FIREBASE_AUTH_DOMAIN:'',VITE_FIREBASE_PROJECT_ID:'',VITE_FIREBASE_APP_ID:''};
const optionalAuditSpecs=['tests/audit-access-and-entry.spec.mjs','tests/audit-visual.spec.mjs'];
const requiredCurrentSpecs=[
  'tests/board-creation-confirmation.spec.mjs',
  'tests/board-controls-simplification.spec.mjs',
  'tests/board-row-actions.spec.mjs',
  'tests/list-view-responsive.spec.mjs',
  'tests/visual-ux-polish.spec.mjs',
  'tests/two-row-toolbar.spec.mjs',
  'tests/card-details-edges-comments.spec.mjs',
  'tests/board-first-copy.spec.mjs',
  'tests/single-workspace-board-ux.spec.mjs',
  'tests/cloud-first-a11y.spec.mjs',
  'tests/cloud-first-configured-session.spec.mjs','tests/list-appearance.spec.mjs'
];

function parseCounts(output,kind){
  output=output.replace(/\x1b\[[0-9;?]*[ -/]*[@-~]/g,'').replace(/\r/g,'\n');
  if(kind==='node'){
    const value=name=>Number(output.match(new RegExp(`^# ${name} (\\d+)$`,'m'))?.[1]||0);
    return {pass:value('pass'),fail:value('fail'),skip:value('skipped')};
  }
  if(kind==='emulator-browser'){
    const matches=[...output.matchAll(/Emulator browser [^\r\n]* workflow passed: (\d+) test\(s\)\./g)];
    const failedJobs=[...output.matchAll(/Emulator browser [^\r\n]* workflow failed with exit \d+/g)];
    return {pass:matches.reduce((count,match)=>count+Number(match[1]),0),fail:failedJobs.length,skip:0};
  }
  const values=[...output.matchAll(/\b(\d+)\s+(passed|failed|skipped)\b/g)];
  const value=name=>Number(values.filter(match=>match[2]===name).at(-1)?.[1]||0);
  return {pass:value('passed'),fail:value('failed'),skip:value('skipped')};
}
function clean(line){return line.replace(/\x1b\[[0-9;]*m/g,'').replace(/(?:https?:\/\/)?127\.0\.0\.1:\d+/g,'[local-server]');}
function run(label,command,args,kind,env={}){
  return new Promise((resolve,reject)=>{
    const child=spawn(command,args,{cwd:process.cwd(),shell:isWindows,env:{...process.env,...env},stdio:['ignore','pipe','pipe']});
    let output='';
    child.stdout.on('data',chunk=>{output+=chunk;process.stdout.write(chunk);});
    child.stderr.on('data',chunk=>{output+=chunk;process.stderr.write(chunk);});
    child.on('error',reject);
    child.on('exit',code=>{const counts=parseCounts(output,kind),requiresCount=!/build|isolation/.test(label);resolve({label,code:code===0&&requiresCount&&counts.pass===0?1:(code??1),counts});});
  });
}
function startPreview(){
  return spawn(npx,['--no-install','vite','preview','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:process.cwd(),shell:isWindows,stdio:['ignore','pipe','pipe']});
}
async function waitForPreview(){
  for(let attempt=0;attempt<40;attempt+=1){
    try { const response=await fetch(`${baseURL}/UH-Flowboard/`); if(response.ok)return; } catch {}
    await new Promise(resolve=>setTimeout(resolve,250));
  }
  throw new Error(`Current-feature preview did not become ready at ${baseURL}.`);
}
function stop(child){
  if(!child?.pid)return;
  if(isWindows)spawnSync('taskkill.exe',['/PID',String(child.pid),'/T','/F'],{stdio:'ignore'});
  else child.kill('SIGTERM');
}
async function portIsOpen(){
  return new Promise(resolve=>{
    const socket=net.createConnection({host:'127.0.0.1',port},()=>{socket.destroy();resolve(true);});
    socket.on('error',()=>resolve(false));socket.setTimeout(300,()=>{socket.destroy();resolve(false)});
  });
}
async function waitForPortClosed(){
  for(let attempt=0;attempt<20;attempt+=1){if(!await portIsOpen())return;await new Promise(resolve=>setTimeout(resolve,250));}
  throw new Error(`Owned current-feature preview port ${port} did not close.`);
}
function printSummary(results){
  const total=results.reduce((sum,result)=>({pass:sum.pass+result.counts.pass,fail:sum.fail+result.counts.fail,skip:sum.skip+result.counts.skip}),{pass:0,fail:0,skip:0});
  console.log('\nSupported current-feature suite counts');
  for(const result of results)console.log(`  ${result.label}: ${result.counts.pass} passed, ${result.counts.fail} failed, ${result.counts.skip} skipped (exit ${result.code})`);
  console.log(`  total: ${total.pass} passed, ${total.fail} failed, ${total.skip} skipped`);
  return total;
}

async function runBrowserSelection(label,specs,env){
  if(await portIsOpen())throw new Error(`Current-feature port ${port} is already in use; leave its owner untouched.`);
  const preview=startPreview();
  try {
    await waitForPreview();
    return await run(label,npx,['--no-install','playwright','test',...specs,'--reporter=line','--workers=1'],'playwright',{...env,PLAYWRIGHT_BASE_URL:baseURL,PLAYWRIGHT_EXECUTABLE_PATH:chrome});
  } finally { stop(preview); await waitForPortClosed(); }
}

if(legacy){
  console.log('Legacy diagnostic only: browser-smoke remains runnable and is intentionally not a supported current-feature gate.');
  const build=await run('legacy diagnostic build','npm',['run','build'],'playwright',unconfiguredBuildEnv);
  if(build.code){ printSummary([build]); process.exitCode=build.code; }
  else {
    const result=await runBrowserSelection('historical local-first diagnostic',['tests/browser-smoke.spec.mjs'],unconfiguredBuildEnv);
    printSummary([result]);process.exitCode=result.code;
  }
} else {
  const results=[];
  results.push(await run('synthetic controller and preserved local-data safety contracts','node',['--test','tests/state-core.test.js','tests/local-workspace-adapter.test.mjs','tests/ui-preferences.test.mjs','tests/board-view-model.test.mjs','tests/granular-workspace.test.mjs','tests/cloud-sync-controller.test.mjs','tests/local-storage-lifecycle-acceptance.test.mjs','tests/repository-path.test.mjs','tests/adapter-contract.test.mjs','tests/person-badges.test.mjs','tests/cloud-first-regressions.test.mjs'],'node'));
  results.push(await run('demo Firestore Emulator Rules','npm',['run','test:rules'],'node'));
  results.push(await run('demo Auth and Firestore Emulator browser','npm',['run','test:emulator-browser'],'emulator-browser'));
  const auditSpecs=optionalAuditSpecs.filter(existsSync);
  const missingAuditSpecs=optionalAuditSpecs.filter(spec=>!existsSync(spec));
  if(missingAuditSpecs.length)throw new Error(`Current-feature audit specs are required: ${missingAuditSpecs.join(', ')}`);
  const unconfigured=await run('unconfigured production build','npm',['run','build'],'playwright',unconfiguredBuildEnv);
  results.push(unconfigured);
  if(!unconfigured.code){
    results.push(await run('production asset isolation','node',['scripts/validate-test-isolation.mjs'],'playwright'));
    results.push(await runBrowserSelection('unconfigured cloud-first browser',['tests/cloud-first-session.spec.mjs'],unconfiguredBuildEnv));
    const configured=await run('configured synthetic public-key build','npm',['run','build'],'playwright',browserBuildEnv);
    results.push(configured);
    if(!configured.code)results.push(await runBrowserSelection('configured synthetic production-controller browser',[...requiredCurrentSpecs,...auditSpecs],browserBuildEnv));
  }
  const total=printSummary(results);
  process.exitCode=total.fail||results.some(result=>result.code!==0)?1:0;
}
