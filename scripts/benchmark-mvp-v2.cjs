const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');

const url = process.env.MVP_BENCHMARK_URL || 'http://127.0.0.1:4191/UH-Flowboard/';
const output = path.resolve(process.env.MVP_BENCHMARK_OUTPUT || 'artifacts/mvp-v2/step-2/benchmark.json');
const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
fs.mkdirSync(path.dirname(output), {recursive: true});

(async () => {
  const browser = await chromium.launch({headless: true, executablePath});
  const context = await browser.newContext({serviceWorkers: 'block', viewport: {width: 1440, height: 900}});
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text().slice(0, 120)); });
  page.on('pageerror', error => pageErrors.push(error.name));
  await page.addInitScript(() => { globalThis.__mvpBenchmarkStart = performance.now(); });

  await page.goto(url, {waitUntil: 'networkidle'});
  await page.locator('.card-open').first().waitFor();
  const seeded = await page.evaluate(() => {
    const workspace = FlowboardState.makeWorkspace();
    const board = FlowboardState.makeBoard('blank');
    board.title = 'Synthetic benchmark board';
    board.lists = Array.from({length: 10}, (_, listIndex) => FlowboardState.makeList(`Benchmark list ${listIndex + 1}`, Array.from({length: 20}, (_, cardIndex) => FlowboardState.makeCard(`Benchmark card ${listIndex * 20 + cardIndex + 1}`))));
    workspace.boards = [board];
    workspace.activeBoardId = board.id;
    localStorage.setItem('flowboard-workspace', JSON.stringify(workspace));
    return {lists: board.lists.length, cards: board.lists.reduce((sum, list) => sum + list.cards.length, 0)};
  });
  const reloadStart = Date.now();
  await page.reload({waitUntil: 'networkidle'});
  await page.waitForFunction(() => document.querySelectorAll('.card-open').length === 200);
  const browserNavigationToUsableMs = Date.now() - reloadStart;
  const inPageRenderToUsableMs = await page.evaluate(() => performance.now() - globalThis.__mvpBenchmarkStart);
  const filterStart = await page.evaluate(() => performance.now());
  await page.locator('#search').fill('Benchmark card 199');
  await page.waitForFunction(() => document.querySelectorAll('.card-open').length === 1);
  const filterMs = await page.evaluate(startTime => performance.now() - startTime, filterStart);
  const afterFilter = await page.evaluate(() => ({cards: document.querySelectorAll('.card-open').length, documentWidth: document.documentElement.scrollWidth, boardScrollWidth: document.querySelector('#board').scrollWidth}));
  const report = {
    url,
    fixture: seeded,
    viewport: {width: 1440, height: 900},
    initialBoardRenderMs: Number(inPageRenderToUsableMs.toFixed(2)),
    browserNavigationToUsableMs,
    singleTermFilterMs: Number(filterMs.toFixed(2)),
    afterFilter,
    consoleErrorCount: consoleErrors.length,
    pageErrorCount: pageErrors.length,
    dataBoundary: 'Synthetic local benchmark only. No sign-in, cloud workspace, production fixture, raw storage, or credentials accessed.'
  };
  fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  await context.close();
  await browser.close();
})().catch(error => {
  console.error(`Benchmark failed: ${error.name}`);
  process.exitCode = 1;
});
