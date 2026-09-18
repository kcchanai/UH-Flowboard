const { chromium } = require('playwright');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const out=__dirname, temp=path.join(out,'browser-temp'); fs.mkdirSync(temp,{recursive:true}); process.env.TEMP=temp;process.env.TMP=temp;
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',headless:true});
 try {
 const context=await browser.newContext({viewport:{width:1440,height:900},colorScheme:'light'}); const page=await context.newPage();
 const errors={console:0,page:0};page.on('console',m=>{if(m.type()==='error')errors.console++});page.on('pageerror',()=>errors.page++);
 await page.goto('https://kcchanai.github.io/UH-Flowboard/?review=product-polish-plan',{waitUntil:'networkidle'});
 await page.locator('.card-open').first().waitFor();
 await page.screenshot({path:path.join(out,'live-light.png')});
 const audit={url:'https://kcchanai.github.io/UH-Flowboard/',viewport:{width:1440,height:900},cards:await page.locator('.card').count(),theme:await page.locator('html').getAttribute('data-theme')};
 await page.locator('.card-open').first().click();await page.locator('#card-dialog').waitFor({state:'visible'});
 audit.cardDialog=await page.locator('#card-dialog').innerText();
 await page.screenshot({path:path.join(out,'live-card.png')});await page.keyboard.press('Escape');
 await page.emulateMedia({colorScheme:'dark'}); await page.screenshot({path:path.join(out,'live-dark.png')});
 audit.darkTheme=await page.locator('html').getAttribute('data-theme');audit.errors=errors;
 fs.writeFileSync(path.join(out,'live-audit.json'),JSON.stringify(audit,null,2));
 console.log(JSON.stringify({cards:audit.cards,light:audit.theme,dark:audit.darkTheme,errors}));
 } finally {await browser.close();fs.rmSync(temp,{recursive:true,force:true});}
})().catch(()=>{console.error('Anonymous UI audit failed; no page or account data printed.');process.exit(1)});
