import {readFile, stat} from 'node:fs/promises';
import {collectReachableSources} from './source-graph.mjs';
import {PRODUCTION_SOURCE_FILES, SOURCE_LIMITS} from './source-budget.mjs';

const files = PRODUCTION_SOURCE_FILES;
const limits = SOURCE_LIMITS;
let total = 0;
for (const file of files) {
  const bytes = (await stat(file)).size;
  total += bytes;
  if (bytes > limits[file]) throw new Error(`${file} is ${bytes} bytes; budget is ${limits[file]}.`);
}
const reachable = await collectReachableSources();
const budgeted = new Set(files);
const missing = reachable.filter(file => /\.(?:html|css|js|mjs)$/.test(file) && !budgeted.has(file));
if (missing.length) throw new Error(`Reachable production sources are missing from the budget manifest: ${missing.join(', ')}`);
if (total > 210_000) throw new Error(`Initial source assets are ${total} bytes; budget is 210000.`);
const html = await readFile('index.html', 'utf8');
if (!html.includes('/src/main.js')) throw new Error('Vite module application entry is not loaded.');
console.log(`Performance budgets passed: ${total} bytes across ${files.length} source assets (budget 210000). Reachable production sources: ${reachable.length}.`);
