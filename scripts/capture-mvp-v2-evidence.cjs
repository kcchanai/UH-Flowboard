const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');

const baseUrl = (process.env.MVP_AUDIT_BASE_URL || 'http://127.0.0.1:4190/UH-Flowboard/').replace(/\/$/, '/') ;
const outputDir = path.resolve(process.env.MVP_AUDIT_OUTPUT || 'artifacts/mvp-v2/baseline');
const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

fs.mkdirSync(outputDir, {recursive: true});

(async () => {
  const browser = await chromium.launch({headless: true, executablePath});
  const context = await browser.newContext({serviceWorkers: 'block', viewport: {width: 1440, height: 900}});
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text().slice(0, 240)); });
  page.on('pageerror', error => pageErrors.push(error.name));
  const response = await page.goto(baseUrl, {waitUntil: 'networkidle'});
  await page.locator('.card-open').first().waitFor();

  const states = [];
  const capture = async (name, width, height, action) => {
    await page.setViewportSize({width, height});
    await action?.();
    const snapshot = await page.evaluate(name => {
      const board = document.querySelector('#board');
      return {
        name,
        viewport: {width: innerWidth, height: innerHeight},
        documentWidth: document.documentElement.scrollWidth,
        documentHeight: document.documentElement.scrollHeight,
        boardWidth: board?.clientWidth || 0,
        boardScrollWidth: board?.scrollWidth || 0,
        listCount: document.querySelectorAll('.list').length,
        cardCount: document.querySelectorAll('.card').length,
        visibleBoardSwitcher: Boolean(document.querySelector('#boards-button')?.getClientRects().length),
        visibleSearchWidth: Math.round(document.querySelector('#search')?.getBoundingClientRect().width || 0),
        visibleCardDialog: Boolean(document.querySelector('#card-dialog[open]')),
        theme: document.documentElement.dataset.theme || 'unset'
      };
    }, name);
    await page.screenshot({path: path.join(outputDir, `${name}.png`), fullPage: true});
    states.push(snapshot);
  };

  await capture('desktop-light', 1440, 900);
  await page.locator('#theme-toggle').click();
  await capture('desktop-dark', 1440, 900);
  await page.locator('#theme-toggle').click();
  await page.locator('.card-open').first().click();
  await capture('desktop-card', 1440, 900);
  await page.locator('#close-card-dialog').click();
  await capture('tablet-light', 1024, 768);
  await capture('mobile-light', 390, 844);
  await capture('narrow-light', 320, 740);

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    httpStatus: response.status(),
    browser: 'isolated anonymous Playwright context using configured system browser',
    dataBoundary: 'Synthetic seeded local data only. No sign-in, cloud workspace, production fixture, raw storage, or credentials accessed.',
    consoleErrorCount: consoleErrors.length,
    pageErrorCount: pageErrors.length,
    states,
    consoleErrorClasses: consoleErrors.map(value => value.split(':')[0]).slice(0, 10),
    pageErrorClasses: pageErrors.slice(0, 10)
  };
  fs.writeFileSync(path.join(outputDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({httpStatus: report.httpStatus, consoleErrorCount: report.consoleErrorCount, pageErrorCount: report.pageErrorCount, states: report.states}, null, 2));
  await context.close();
  await browser.close();
})().catch(error => {
  console.error(`Baseline capture failed: ${error.name}`);
  process.exitCode = 1;
});
