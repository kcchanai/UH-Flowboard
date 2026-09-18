import {chromium} from 'playwright';
import {mkdir, writeFile, stat} from 'node:fs/promises';
import {SOURCE_CAP_BYTES, PRODUCTION_SOURCE_FILES} from '../../scripts/source-budget.mjs';
const out = new URL('./', import.meta.url);
await mkdir(new URL('browser-temp/', out), {recursive:true});
process.env.TEMP = new URL('browser-temp/', out).pathname.replace(/^\/(\w:)/, '$1');
process.env.TMP = process.env.TEMP;
const browser = await chromium.launch({headless:true, executablePath:'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'});
const context = await browser.newContext({viewport:{width:1440,height:900}});
const page = await context.newPage();
const consoleErrors=[], pageErrors=[];
page.on('console', m => {if(m.type()==='error') consoleErrors.push(m.text().replace(/https?:\/\/\S+/g,'[URL]'));});
page.on('pageerror', e => pageErrors.push(e.message));
try {
 await page.goto('https://kcchanai.github.io/UH-Flowboard/?audit=ux-planning', {waitUntil:'networkidle'});
 await page.locator('#board .list').first().waitFor();
 const initial = await page.evaluate(() => ({title:document.title, toolbar:document.querySelector('.topbar').innerText, controls:[...document.querySelectorAll('.topbar button')].map(b=>({id:b.id,text:b.innerText,label:b.getAttribute('aria-label')})), headings:[...document.querySelectorAll('dialog h2')].map(e=>e.textContent)}));
 await page.screenshot({path:new URL('live-board.png',out).pathname.replace(/^\/(\w:)/,'$1')});
 await page.locator('#account-button').click();
 const account = await page.locator('#account-dialog').innerText();
 await page.screenshot({path:new URL('live-account.png',out).pathname.replace(/^\/(\w:)/,'$1')});
 await page.locator('#close-account-dialog').click();
 await page.locator('#theme-toggle').click();
 const appearance = await page.locator('dialog[open]').innerText();
 await page.screenshot({path:new URL('live-appearance.png',out).pathname.replace(/^\/(\w:)/,'$1')});
 const radios = await page.locator('dialog[open] input[type=radio]').evaluateAll(es=>es.map(e=>({name:e.name,value:e.value})));
 const dark=page.locator('dialog[open] input[value="dark"]');
 if(await dark.count()) {await dark.check(); await page.getByRole('button',{name:'Save appearance',exact:true}).click(); await page.screenshot({path:new URL('live-dark.png',out).pathname.replace(/^\/(\w:)/,'$1')});}
 const rawBytes=(await Promise.all(PRODUCTION_SOURCE_FILES.map(async f=>(await stat(new URL('../../'+f,import.meta.url))).size))).reduce((a,b)=>a+b,0);
 const result={scope:'Isolated anonymous production UI; no sign-in or cloud workspace opened. Appearance changes affect this disposable context only.',initial,account,appearance,radios,consoleErrors,pageErrors,rawBytes,cap:SOURCE_CAP_BYTES,headroom:SOURCE_CAP_BYTES-rawBytes};
 await writeFile(new URL('audit.json',out),JSON.stringify(result,null,2));
 console.log(JSON.stringify(result,null,2));
} finally {await context.close();await browser.close();}
