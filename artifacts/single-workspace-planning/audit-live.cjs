/* Planning-only anonymous audit. No authentication or production writes. */
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const scratch = fs.mkdtempSync(path.join(root, '.anonymous-audit-'));
for (const key of ['TMP', 'TEMP', 'TMPDIR']) process.env[key] = scratch;
const {chromium} = require('playwright');
(async () => {
  let browser;
  try {
    browser = await chromium.launch({executablePath:'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', headless:true});
    const context = await browser.newContext({viewport:{width:1440,height:900}, serviceWorkers:'block'});
    const page = await context.newPage();
    let consoleErrors = 0, pageErrors = 0;
    page.on('console', message => { if (message.type() === 'error') consoleErrors++; });
    page.on('pageerror', () => { pageErrors++; });
    const response = await page.goto('https://kcchanai.github.io/UH-Flowboard/', {waitUntil:'networkidle'});
    await page.waitForFunction(() => document.body.innerText.includes('Sign in to access your boards'), {timeout:20000});
    const summary = await page.evaluate(() => {
      const visible = element => !!element && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden';
      const text = selector => document.querySelector(selector)?.textContent.trim() || '';
      return {
        title:document.title,
        heading:text('#board-page-heading'),
        status:text('#cloud-status'),
        boardNavigationVisible:visible(document.querySelector('#boards-button')),
        boardNavigationDisabled:document.querySelector('#boards-button')?.disabled,
        newBoardFormVisible:visible(document.querySelector('#new-board-form')),
        gateText:document.querySelector('.cloud-gate')?.innerText || '',
        viewportWidth:innerWidth,
        documentWidth:document.documentElement.scrollWidth
      };
    });
    const report = {scope:'Anonymous isolated browser only. No account or workspace accessed.',httpStatus:response.status(),...summary,consoleErrors,pageErrors};
    await page.screenshot({path:path.join(root,'live-anonymous.png'),fullPage:true});
    fs.writeFileSync(path.join(root,'live-audit.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify(report));
    await context.close();
  } catch (error) {
    console.error('Anonymous planning audit failed: '+error.name);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    fs.rmSync(scratch,{recursive:true,force:true});
  }
})();
