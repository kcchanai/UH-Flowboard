import {readFile, stat} from 'node:fs/promises';
import {collectReachableSources} from './source-graph.mjs';
import {PRODUCTION_SOURCE_FILES, SOURCE_CAP_BYTES, SOURCE_LIMITS, SOURCE_WARNING_BYTES} from './source-budget.mjs';

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
if (total > SOURCE_CAP_BYTES) throw new Error(`Initial source assets are ${total} bytes; cap is ${SOURCE_CAP_BYTES}.`);
if (total > SOURCE_WARNING_BYTES) console.warn(`Source maintainability warning: ${total} bytes exceeds ${SOURCE_WARNING_BYTES}.`);
const html = await readFile('index.html', 'utf8');
if (!html.includes('/src/main.js')) throw new Error('Vite module application entry is not loaded.');
console.log(`Performance budgets passed: ${total} bytes across ${files.length} source assets (cap ${SOURCE_CAP_BYTES}; warning ${SOURCE_WARNING_BYTES}). Reachable production sources: ${reachable.length}.`);
