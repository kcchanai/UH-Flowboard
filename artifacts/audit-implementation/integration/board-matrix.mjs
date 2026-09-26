import {spawn} from 'node:child_process';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import net from 'node:net';
import {fileURLToPath} from 'node:url';
const root=process.env.FLOWBOARD_BOARD_MATRIX_ROOT||fileURLToPath(new URL('../../../',import.meta.url));
const out=process.env.FLOWBOARD_BOARD_MATRIX_OUT||fileURLToPath(new URL('./',import.meta.url));
const port=Number(process.env.FLOWBOARD_BOARD_MATRIX_PORT||4205),base=`http://127.0.0.1:${port}/UH-Flowboard/`;
await mkdir(`${out}tmp`,{recursive:true});
process.env.TEMP=process.env.TMP=`${out}tmp`;
const free=()=>new Promise(resolve=>{const s=net.createServer();s.once('error',()=>resolve(false));s.once('listening',()=>s.close(()=>resolve(true)));s.listen(port,'127.0.0.1')});
if(!await free())throw Error('Owned synthetic board port is busy.');
const fixture=await readFile(new URL('../../comprehensive-audit/exploratory/fixture-main.mjs',import.meta.url),'utf8');
const viteBin=fileURLToPath(new URL('../../../node_modules/vite/bin/vite.js',import.meta.url));
const server=spawn(process.execPath,[viteBin,'--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:root,env:{...process.env,VITE_FIREBASE_API_KEY:'audit-key',VITE_FIREBASE_AUTH_DOMAIN:'audit.invalid',VITE_FIREBASE_PROJECT_ID:'audit-flowboard',VITE_FIREBASE_APP_ID:'1:123:web:audit'},stdio:['ignore','pipe','pipe']});
const report={checks:[],errors:[],screenshots:[],port};
const check=(name,pass,detail)=>report.checks.push({name,pass,...(detail?{detail}:{})});
let browser;
try{
  let ready=false;
  for(let i=0;i<60;i++){
    try{const response=await fetch(base);if(response.ok){ready=true;break}}catch{}
    await new Promise(resolve=>setTimeout(resolve,150));
  }
  if(!ready)throw Error('Synthetic Vite server did not become ready.');
  browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'});
  for(const {width,height} of [{width:320,height:720},{width:390,height:844},{width:960,height:720},{width:960,height:400},{width:1280,height:720},{width:1440,height:900},{width:1920,height:1080}]){
    for(const theme of ['light','dark']){
      const context=await browser.newContext({viewport:{width,height},colorScheme:theme,hasTouch:width<=390,isMobile:width<=390});
      const page=await context.newPage();
      page.on('pageerror',error=>report.errors.push(error.name));
      await page.route('**/src/main.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:fixture}));
      await page.route(/^https?:\/\//,route=>{
        const url=new URL(route.request().url());
        return url.hostname==='127.0.0.1'&&Number(url.port)===port?route.fallback():route.abort();
      });
      await page.goto(base);
      await page.waitForFunction(()=>globalThis.FlowboardApp?.getMode().kind==='cloud');
      if(theme==='dark'){
        await page.locator('#theme-toggle').click();
        await page.locator('input[name="appearance-mode"][value="dark"]').check();
        await page.locator('#appearance-form button[type="submit"]').click();
      }
      const data=await page.evaluate(()=>{
        const box=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
        return {header:box('.board-header'),heading:box('.board-heading'),search:box('.board-search'),summary:box('#search-count'),actions:box('.board-actions'),board:box('#board'),overflow:document.documentElement.scrollWidth>innerWidth,listCount:document.querySelectorAll('#board .list').length};
      });
      check(`${width}x${height} ${theme} board bounded`,!data.overflow&&data.listCount===3,data);
      check(`${width}x${height} ${theme} header summary stays within board heading`,data.summary.right<=width+1&&data.search.right<=width+1,data);
      const file=`board-${width}x${height}-${theme}.png`;
      await page.screenshot({path:`${out}${file}`});report.screenshots.push(file);
      await context.close();
    }
  }
}finally{
  await browser?.close();server.kill();
  await writeFile(`${out}board-matrix.json`,JSON.stringify(report,null,2));
}
const failures=report.checks.filter(item=>!item.pass);
console.log(`Synthetic board matrix: ${report.checks.length-failures.length}/${report.checks.length}; ${report.errors.length} page errors; ${report.screenshots.length} screenshots`);
if(failures.length)console.log(JSON.stringify(failures,null,2));
if(failures.length||report.errors.length)process.exitCode=1;
