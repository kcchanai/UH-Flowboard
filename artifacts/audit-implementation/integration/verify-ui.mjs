import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// This script tests a local built/served release, never the live production site.
const baseURL = process.env.FLOWBOARD_AUDIT_BASE_URL;
if (!baseURL || !/^http:\/\/127\.0\.0\.1:\d+\//.test(baseURL)) {
  throw new Error('Set FLOWBOARD_AUDIT_BASE_URL to an owned 127.0.0.1 server URL.');
}
const out = fileURLToPath(new URL('./', import.meta.url));
await mkdir(`${out}tmp`, { recursive: true });
process.env.TEMP = process.env.TMP = `${out}tmp`;
const require = createRequire(import.meta.url);
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe' });
const report = { url: baseURL, checks: [], violations: [], errors: [] };
const check = (name, condition, detail) => report.checks.push({ name, passed: !!condition, ...(detail ? { detail } : {}) });
const goto = async (page) => {
  const response = await page.goto(baseURL, { waitUntil: 'networkidle' });
  check('local HTTP 200', response?.status() === 200, response?.status());
  await page.waitForFunction(() => globalThis.FlowboardApp && ['signed-out', 'unavailable'].includes(FlowboardApp.getMode().kind));
};
try {
  for (const width of [320, 360, 375, 390, 412, 430, 700, 960, 1280, 1440, 1920]) {
    const context = await browser.newContext({ viewport: { width, height: width < 700 ? 720 : 900 }, hasTouch: width < 700, isMobile: width < 700 });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(`${width}: ${error.name}`));
    await goto(page);
    const geo = await page.evaluate(() => {
      const box = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, height:r.height }; };
      const brand = box('.brand'), text = box('.brand span:last-child'), mark = box('.brand-mark'), boards = box('#boards-button'), appearance = box('#theme-toggle'), account = box('#account-button');
      return { brand, text, mark, boards, appearance, account, overflow: document.documentElement.scrollWidth > innerWidth, coarse: matchMedia('(pointer:coarse)').matches };
    });
    check(`${width}px brand/Boards don't collide`, geo.text.right <= geo.boards.left + 1, geo);
    check(`${width}px mark remains recognizable`, geo.mark.width >= 20, geo.mark);
    check(`${width}px page has no horizontal overflow`, !geo.overflow);
    if (geo.coarse) {
      check(`${width}px Account target >=44px`, geo.account.height >= 44 && geo.account.width >= 44, geo.account);
      check(`${width}px Boards target >=44px`, geo.boards.height >= 44 && geo.boards.width >= 44, geo.boards);
      check(`${width}px Appearance target >=44px`, geo.appearance.height >= 44 && geo.appearance.width >= 44, geo.appearance);
    }
    if (width === 390 || width === 320 || width === 1280 || width === 1440 || width === 1920) {
      await page.screenshot({ path: `${out}signed-out-${width}.png` });
    }
    if (width === 320 || width === 390 || width === 960 || width === 1440) {
      await page.locator('#theme-toggle').click();
      const dlg = page.locator('#appearance-dialog');
      await dlg.waitFor({state:'visible'});
      const geometry = await page.evaluate(() => {
        const form = document.querySelector('#appearance-form').getBoundingClientRect(),
          save = document.querySelector('#appearance-form button[type="submit"]').getBoundingClientRect(),
          close = document.querySelector('#close-appearance-dialog').getBoundingClientRect();
        return { form: { top:form.top, bottom:form.bottom }, save: { top:save.top, bottom:save.bottom }, close:{top:close.top,bottom:close.bottom}, viewport: innerHeight };
      });
      check(`${width}px Appearance actions visible without scrolling`, geometry.save.top >= 0 && geometry.save.bottom <= geometry.viewport && geometry.close.top >= 0 && geometry.close.bottom <= geometry.viewport, geometry);
      await page.screenshot({ path: `${out}appearance-${width}.png` });
      await dlg.locator('#close-appearance-dialog').click();
      check(`${width}px Appearance visible close`, !(await dlg.isVisible()));
    }
    await context.close();
  }
  const landscapeContext = await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});
  const landscape = await landscapeContext.newPage();
  await goto(landscape);
  await landscape.locator('#theme-toggle').click();
  await landscape.locator('#appearance-dialog').waitFor({state:'visible'});
  const landscapeBounds = await landscape.evaluate(() => {
    const close = document.querySelector('#close-appearance-dialog').getBoundingClientRect();
    const save = document.querySelector('#appearance-form button[type="submit"]').getBoundingClientRect();
    const body = document.querySelector('#appearance-dialog .appearance-body');
    return {close: {top:close.top,bottom:close.bottom}, save:{top:save.top,bottom:save.bottom}, bodyHeight:body.clientHeight, viewportHeight:innerHeight};
  });
  check('landscape Appearance close and Save stay within viewport',landscapeBounds.close.top>=0 && landscapeBounds.close.bottom<=landscapeBounds.viewportHeight && landscapeBounds.save.top>=0 && landscapeBounds.save.bottom<=landscapeBounds.viewportHeight && landscapeBounds.bodyHeight>0,landscapeBounds);
  await landscape.screenshot({path:`${out}appearance-844x390.png`});
  await landscapeContext.close();
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(`appearance: ${error.name}`));
  await goto(page);
  const rawSentinel = '{"synthetic":"keep these exact raw bytes", "spaced" : [1,  2]}';
  await page.evaluate(value => localStorage.setItem('flowboard-workspace', value), rawSentinel);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => globalThis.FlowboardApp && ['signed-out', 'unavailable'].includes(FlowboardApp.getMode().kind));
  check('legacy raw sentinel remains byte-identical', await page.evaluate(() => localStorage.getItem('flowboard-workspace')) === rawSentinel);
  check('Filters controls its panel', await page.locator('#filter-toggle').getAttribute('aria-controls') === 'filter-panel');
  const entry = page.locator('#board button').filter({ hasText: 'Sign in with Google' });
  check('central sign-in entry exists', await entry.count() === 1);
  if (await entry.count() === 1) {
    await entry.click();
    check('central sign-in opens Account dialog', await page.locator('#account-dialog').isVisible());
    await page.locator('#close-account-dialog').click();
    check('central sign-in returns focus to opener', await entry.evaluate(e => e === document.activeElement));
  }
  await page.locator('#theme-toggle').click();
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const canvases = await page.locator('input[name="appearance-canvas"]').evaluateAll(inputs => inputs.map(input => input.value));
  for (const mode of ['light', 'dark']) {
    await page.locator(`input[name="appearance-mode"][value="${mode}"]`).check();
    for (const canvas of canvases) {
      await page.locator(`input[name="appearance-canvas"][value="${canvas}"]`).check();
      await page.waitForTimeout(350);
      const findings = await page.evaluate(async () => {
        const result = await axe.run(document.querySelector('#appearance-dialog'), { runOnly: ['color-contrast'] });
        return result.violations.map(violation => ({ id: violation.id, nodes: violation.nodes.map(node => node.target) }));
      });
      report.violations.push({ mode, canvas, findings });
      check(`${mode}/${canvas} Appearance text contrast`, findings.length === 0, findings);
    }
  }
  await page.locator('#close-appearance-dialog').click();
  await page.evaluate(() => {
    const workspace = FlowboardState.makeEmptyWorkspace();
    const board = FlowboardState.makeBoard('blank');
    board.title = 'Synthetic contrast audit';
    board.lists = [FlowboardState.makeList('Audit list', [FlowboardState.makeCard('Synthetic card')])];
    workspace.boards = [board]; workspace.activeBoardId = board.id;
    FlowboardApp.openCloudWorkspace(workspace, {id:'synthetic-audit', name:'Synthetic audit', role:'owner'});
  });
  await page.locator('.card-open').waitFor();
  const boardFindings = await page.evaluate(async () => {
    const result = await axe.run(document, {runOnly:['color-contrast']});
    return result.violations.map(item => ({id:item.id, nodes:item.nodes.map(node => node.target)}));
  });
  check('dark board text contrast', boardFindings.length === 0, boardFindings);
  await page.screenshot({path:`${out}dark-board.png`});
  await page.locator('.card-open').click();
  const cardFindings = await page.evaluate(async () => {
    const result = await axe.run(document.querySelector('#card-dialog'), {runOnly:['color-contrast']});
    return result.violations.map(item => ({id:item.id, nodes:item.nodes.map(node => node.target)}));
  });
  check('dark card-details text contrast', cardFindings.length === 0, cardFindings);
  await page.screenshot({path:`${out}dark-card.png`});
  await page.locator('#close-card-dialog').click();
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await page.locator('#theme-toggle').click();
  await page.locator('#appearance-dialog').waitFor({state:'visible'});
  check('forced-colors Appearance visible close', await page.locator('#close-appearance-dialog').isVisible());
  await page.locator('#close-appearance-dialog').click();
  await context.close();
} finally {
  await browser.close();
  await writeFile(`${out}verify-ui.json`, JSON.stringify(report, null, 2));
}
const failed = report.checks.filter(item => !item.passed);
console.log(`Integration UI: ${report.checks.length - failed.length}/${report.checks.length} checks; ${report.errors.length} page errors; ${report.violations.length} theme/palette states`);
if (failed.length) console.log(JSON.stringify(failed, null, 2));
if (failed.length || report.errors.length) process.exitCode = 1;
