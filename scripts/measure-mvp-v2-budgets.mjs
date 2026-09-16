import {readdir, readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
import {collectReachableSources} from './source-graph.mjs';
import {PRODUCTION_SOURCE_FILES, SOURCE_LIMITS} from './source-budget.mjs';

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
  const category = file === 'dist/index.html' || name.startsWith('index-') || name.startsWith('app-') || name.endsWith('.css') ? 'initial shell' : name.startsWith('index.esm-') ? 'vendor' : 'first-party lazy';
  return {file, category, bytes:buffer.length, gzipBytes:gzipSync(buffer).length};
}));
const grouped = Object.groupBy ? Object.groupBy(distAssets, item => item.category) : distAssets.reduce((groups, item) => ((groups[item.category] ||= []).push(item), groups), {});
const summary = {
  source: {
    manifestBytes: sourceFiles.reduce((sum, item) => sum + item.bytes, 0),
    capBytes: 210_000,
    headroomBytes: 210_000 - sourceFiles.reduce((sum, item) => sum + item.bytes, 0),
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
console.log(JSON.stringify(summary, null, 2));
