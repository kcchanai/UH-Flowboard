import {readdir, readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
import {collectReachableSources} from './source-graph.mjs';
import {DIST_GZIP_LIMITS, PRODUCTION_SOURCE_FILES, SOURCE_CAP_BYTES, SOURCE_LIMITS, SOURCE_WARNING_BYTES} from './source-budget.mjs';

const root = process.cwd();
const bytes = async relative => (await stat(path.join(root, relative))).size;
const filesUnder = async directory => {
  const entries = await readdir(path.join(root, directory), {withFileTypes: true});
  const result = [];
  for (const entry of entries) {
    const relative = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await filesUnder(relative));
    else result.push(relative);
  }
  return result;
};
const reachable = await collectReachableSources(root);
const manifest = new Set(PRODUCTION_SOURCE_FILES);
const sourceFiles = await Promise.all(PRODUCTION_SOURCE_FILES.map(async file => ({file, bytes:await bytes(file), limit:SOURCE_LIMITS[file]})));
const distFiles = (await filesUnder('dist')).filter(file => !file.endsWith('.map'));
const distAssets = await Promise.all(distFiles.map(async file => {
  const buffer = await readFile(path.join(root, file));
  const name = path.basename(file);
  const category = name === 'index.html' ? 'document' : name.startsWith('index-') || name.startsWith('app-') || name.endsWith('.css') ? 'initial shell' : name.startsWith('index.esm-') ? 'vendor' : 'first-party lazy';
  return {file, category, bytes:buffer.length, gzipBytes:gzipSync(buffer).length};
}));
const grouped = Object.groupBy ? Object.groupBy(distAssets, item => item.category) : distAssets.reduce((groups, item) => ((groups[item.category] ||= []).push(item), groups), {});
const sourceBytes = sourceFiles.reduce((sum, item) => sum + item.bytes, 0);
const summary = {
  source: {
    manifestBytes: sourceBytes,
    warningBytes: SOURCE_WARNING_BYTES,
    warningExceeded: sourceBytes > SOURCE_WARNING_BYTES,
    capBytes: SOURCE_CAP_BYTES,
    headroomBytes: SOURCE_CAP_BYTES - sourceBytes,
    reachableFiles: reachable,
    unbudgetedReachableFiles: reachable.filter(file => !manifest.has(file)),
    manifestFiles: sourceFiles
  },
  dist: {
    files: distAssets,
    categories: Object.fromEntries(Object.entries(grouped).map(([category, items]) => [category, {files:items.length, bytes:items.reduce((sum, item) => sum + item.bytes, 0), gzipBytes:items.reduce((sum, item) => sum + item.gzipBytes, 0)}]))
  }
};
if (summary.source.unbudgetedReachableFiles.length) throw new Error(`Reachable production sources are missing from the budget manifest: ${summary.source.unbudgetedReachableFiles.join(', ')}`);
if (summary.source.manifestBytes > SOURCE_CAP_BYTES) throw new Error(`Initial source assets are ${summary.source.manifestBytes} bytes; cap is ${SOURCE_CAP_BYTES}.`);
for (const [category, limit] of Object.entries(DIST_GZIP_LIMITS)) { const actual = summary.dist.categories[category]?.gzipBytes || 0; if (actual > limit) throw new Error(`${category} gzip assets are ${actual} bytes; budget is ${limit}.`); }
if (summary.source.warningExceeded) console.warn(`Source maintainability warning: ${summary.source.manifestBytes} bytes exceeds ${SOURCE_WARNING_BYTES}.`);
console.log(JSON.stringify(summary, null, 2));
