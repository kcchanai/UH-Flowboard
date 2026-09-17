import {chromium} from 'playwright';

const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH;
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173/UH-Flowboard';
const outputDir = 'artifacts/polish/step-01';
const targetURL = baseURL.endsWith('/') ? baseURL : `${baseURL}/`;
const browser = await chromium.launch({headless: true, ...(executablePath ? {executablePath} : {})});
try {
  for (const viewport of [
    {name: 'desktop-1280x720', width: 1280, height: 720},
    {name: 'desktop-1440x900', width: 1440, height: 900},
    {name: 'desktop-1920x1080', width: 1920, height: 1080},
    {name: 'resized-960x720', width: 960, height: 720},
    {name: 'secondary-390x844', width: 390, height: 844}
  ]) {
    const context = await browser.newContext({viewport: {width: viewport.width, height: viewport.height}});
    const page = await context.newPage();
    await page.goto(targetURL, {waitUntil: 'networkidle'});
    await page.waitForFunction(() => globalThis.FlowboardApp && globalThis.FlowboardState);
    await page.screenshot({path: `${outputDir}/${viewport.name}.png`, fullPage: true});
    await context.close();
  }
} finally {
  await browser.close();
}
console.log('baseline_screenshots=5');
