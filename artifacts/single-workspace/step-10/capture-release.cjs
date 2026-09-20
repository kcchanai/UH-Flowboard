const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');

const base = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4298/UH-Flowboard/';
const out = path.resolve('artifacts/single-workspace/step-10');
fs.mkdirSync(out, {recursive:true});
const asset = `${new URL(base).pathname}assets/${fs.readdirSync('dist/assets').find(file => file.startsWith('cloud-ui-') && file.endsWith('.js'))}`;
const fixture = boards => ({id:'release-personal',name:'My workspace',ownerUid:'owner',role:'owner',status:'ready',personal:true,migration:{state:'verified'},boards,hasMore:false});
const active = {id:'release-active',title:'Release planning',rank:0,archived:false,revision:0};
const archived = {id:'release-archived',title:'Archived planning',rank:1,archived:true,revision:0};

async function prepare(page, entry) {
  await page.goto(base, {waitUntil:'networkidle'});
  await page.waitForFunction(() => globalThis.FlowboardApp && globalThis.FlowboardState);
  await page.evaluate(async ({asset, entry}) => {
    globalThis.FlowboardApp = {getMode:() => ({kind:'cloud',id:entry.id,role:'owner'}), getActiveBoardId:() => '', openCloudWorkspace:() => {}, openCloudPreview:() => {}, selectBoard:() => {}, createBoard:() => false};
    const {initializeCloudWorkspaceUI} = await import(asset);
    initializeCloudWorkspaceUI({
      localAdapter:{inspectLegacyWorkspace:() => ({status:'none',counts:{boards:0}})},
      cloudAdapter:{listBoardDirectory:async() => [entry]}
    }).setSession({uid:'owner'});
    document.querySelector('#boards-button').disabled = false;
  }, {asset, entry});
}

(async() => {
  const browser = await chromium.launch({executablePath:'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', headless:true});
  const report = {scope:'Synthetic local release evidence only',consoleErrors:0,pageErrors:0,screenshots:[]};
  try {
    const context = await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
    const page = await context.newPage();
    page.on('console', message => { if (message.type() === 'error') report.consoleErrors += 1; });
    page.on('pageerror', () => { report.pageErrors += 1; });

    await prepare(page, fixture([active, archived]));
    await page.getByRole('button', {name:'Boards'}).click();
    await page.getByRole('dialog', {name:'Your boards'}).waitFor();
    await page.screenshot({path:path.join(out,'boards-archived-actions.png'),fullPage:true});
    report.screenshots.push('boards-archived-actions.png');

    await prepare(page, fixture([]));
    await page.getByRole('button', {name:'Boards'}).click();
    await page.getByRole('button', {name:'+ New board'}).click();
    await page.screenshot({path:path.join(out,'new-board-empty-state.png'),fullPage:true});
    report.screenshots.push('new-board-empty-state.png');

    await prepare(page, fixture([active]));
    await page.locator('#account-dialog').evaluate(dialog => dialog.showModal());
    await page.locator('#open-cloud-recovery').evaluate(button => { button.hidden = false; });
    await page.locator('#open-cloud-recovery').click();
    await page.getByRole('dialog', {name:'Data recovery'}).waitFor();
    await page.screenshot({path:path.join(out,'data-recovery.png'),fullPage:true});
    report.screenshots.push('data-recovery.png');

    await context.close();
    fs.writeFileSync(path.join(out,'capture-report.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify(report));
    if (report.consoleErrors || report.pageErrors) process.exitCode = 1;
  } finally { await browser.close(); }
})();
