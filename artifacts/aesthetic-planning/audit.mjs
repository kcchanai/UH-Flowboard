import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const dir='artifacts/aesthetic-planning';
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'});
const summary=[];
try {
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',()=>errors.push('pageerror'));
  page.on('console',message=>{if(message.type()==='error')errors.push('console-error');});
  await page.goto('https://kcchanai.github.io/UH-Flowboard/',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>globalThis.FlowboardApp && document.querySelectorAll('.card-open').length);
  for(const theme of ['light','dark']) {
    await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;},theme);
    await page.screenshot({path:`${dir}/live-${theme}-1440.png`,fullPage:true});
    summary.push(await page.evaluate(()=>({theme:document.documentElement.dataset.theme,lists:document.querySelectorAll('.list').length,cards:document.querySelectorAll('.card-open').length,canvas:getComputedStyle(document.body).backgroundImage,documentWidth:document.documentElement.scrollWidth,viewport:innerWidth})));
  }
  await page.evaluate(()=>{document.documentElement.dataset.theme='light';});
  await page.locator('.card-open').first().click();
  await page.screenshot({path:`${dir}/live-card-editor.png`,fullPage:true});
  await writeFile(`${dir}/audit.json`,JSON.stringify({scope:'Isolated anonymous public-site visual inspection. No login or cloud writes. Theme previews changed DOM only.',views:summary,pageErrorCount:errors.filter(x=>x==='pageerror').length,consoleErrorCount:errors.filter(x=>x==='console-error').length},null,2));
  console.log(JSON.stringify({views:summary.length,pageErrorCount:errors.filter(x=>x==='pageerror').length,consoleErrorCount:errors.filter(x=>x==='console-error').length}));
  await context.close();
} finally {await browser.close();}
