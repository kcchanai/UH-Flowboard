import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'});
try {
  for (const view of [{name:'card-editor-1440x900',width:1440,height:900},{name:'card-editor-960x720',width:960,height:720}]) {
    const context=await browser.newContext({viewport:{width:view.width,height:view.height}});
    const page=await context.newPage();
    await page.goto('http://127.0.0.1:4173/UH-Flowboard/',{waitUntil:'networkidle'});
    await page.waitForFunction(()=>globalThis.FlowboardApp&&globalThis.FlowboardState);
    await page.locator('.card-open').first().click();
    await page.screenshot({path:`artifacts/polish/step-07/${view.name}.png`,fullPage:true});
    await context.close();
  }
} finally { await browser.close(); }
console.log('card_editor_screenshots=2');
