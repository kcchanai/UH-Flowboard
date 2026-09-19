// Planning-only anonymous audit. Does not sign in or mutate cloud data.
const {spawn}=require('node:child_process');
const fs=require('node:fs/promises');
const path=require('node:path');
const root=__dirname, profile=path.join(root,'temporary-chrome-profile');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
let browser, socket, seq=0; const pending=new Map(), events=[];
async function send(method,params={}) { const id=++seq; return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));}); }
async function evaluate(expression) { const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true}); if(r.exceptionDetails) throw Error('Diagnostic evaluation failed'); return r.result.value; }
(async()=>{
  await fs.mkdir(root,{recursive:true});
  browser=spawn('C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--disable-background-networking','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore'});
  let port;
  for(let i=0;i<100;i++){try{port=(await fs.readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0];if(port)break;}catch{} await pause(100);}
  if(!port) throw Error('Isolated Chrome did not become ready');
  const tabs=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const target=tabs.find(t=>t.type==='page'); socket=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
  socket.addEventListener('message',({data})=>{const m=JSON.parse(data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}}else{if(m.method==='Runtime.exceptionThrown')events.push({type:'page-error'});if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')events.push({type:'console-error'});}});
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:'https://kcchanai.github.io/UH-Flowboard/?planning=cloud-first'});
  let loaded=false;
  for(let i=0;i<150;i++){loaded=await evaluate("document.readyState==='complete' && !!document.querySelector('.list')");if(loaded)break;await pause(100);}
  if(!loaded)throw Error('Anonymous board did not initialize');
  await pause(1200);
  const metrics=()=>evaluate(`(()=>{const b=document.querySelector('#board'),r=b.getBoundingClientRect(),s=getComputedStyle(b);return {viewport:{width:innerWidth,height:innerHeight},page:{height:document.documentElement.scrollHeight,width:document.documentElement.scrollWidth},board:{top:r.top,bottom:r.bottom,height:r.height,clientWidth:b.clientWidth,scrollWidth:b.scrollWidth,clientHeight:b.clientHeight,scrollHeight:b.scrollHeight,overflowX:s.overflowX,overflowY:s.overflowY},startHereCount:[...document.querySelectorAll('summary,button')].filter(e=>/start here/i.test(e.textContent)).length}})()`);
  const capture=async name=>{const s=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await fs.writeFile(path.join(root,name),Buffer.from(s.data,'base64'));};
  const result={scope:'Anonymous disposable browser. No sign-in; no workspace/card/list writes; no local data reads.',desktop:await metrics()};
  await capture('anonymous-board-1440.png');
  await evaluate("document.querySelector('#filter-toggle').click()");
  result.filtersOpened=await evaluate("!document.querySelector('#filter-panel').hidden");
  await evaluate("document.querySelector('h1').click()");
  result.filtersRemainOpenAfterOutsideClick=await evaluate("!document.querySelector('#filter-panel').hidden");
  result.filterBounds=await evaluate("(()=>{const r=document.querySelector('#filter-panel').getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width}})()");
  await capture('anonymous-filters-outside-click.png');
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape'});
  result.filtersClosedWithEscape=await evaluate("document.querySelector('#filter-panel').hidden");
  await evaluate("document.querySelector('#boards-button').click()");await pause(100);
  await capture('anonymous-my-workspace.png');
  await evaluate("document.querySelector('#close-workspace-dialog').click()");
  await evaluate("document.documentElement.dataset.theme='dark';globalThis.FlowboardRuntime.applyCanvasPalette('classic-flow','gradient','dark')");
  await capture('anonymous-board-dark.png');
  await evaluate("document.documentElement.dataset.theme='light';globalThis.FlowboardRuntime.applyCanvasPalette('classic-flow','gradient','light')");
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false});await pause(150);
  result.shortDesktop=await metrics();await capture('anonymous-board-1280.png');
  result.errors={console:events.filter(e=>e.type==='console-error').length,page:events.filter(e=>e.type==='page-error').length};
  await fs.writeFile(path.join(root,'public-audit.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(async()=>{if(socket&&socket.readyState===WebSocket.OPEN){try{await send('Browser.close');}catch{}socket.close();}if(browser){for(let i=0;i<30&&browser.exitCode===null;i++)await pause(100);if(browser.exitCode===null)browser.kill();}try{await fs.rm(profile,{recursive:true,force:true,maxRetries:10,retryDelay:200});}catch{console.error('Temporary profile cleanup needs retry');process.exitCode=1;}});
