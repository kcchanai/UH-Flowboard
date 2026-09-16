import {readFile} from 'node:fs/promises';
import path from 'node:path';

const importPatterns = [
  /\bimport\s*(?:\(\s*)?["']([^"']+)["']\s*\)?/g,
  /\b(?:import|export)\s+(?:[^"']*?\sfrom\s*)?["']([^"']+)["']/g
];
const htmlScriptPattern = /<script\b[^>]*\bsrc=["']([^"']+)["']/gi;

function sourcePath(root, from, specifier) {
  const raw = specifier.startsWith('/') ? specifier.slice(1) : path.join(path.dirname(from), specifier);
  const candidate = path.normalize(raw);
  if (!candidate || candidate.startsWith('..') || path.isAbsolute(candidate) && !candidate.startsWith(root)) return null;
  return candidate;
}

async function resolveSource(root, from, specifier) {
  if (!specifier.startsWith('.') && !specifier.startsWith('/')) return null;
  const candidate = sourcePath(root, from, specifier);
  if (!candidate) throw new Error(`Unsafe local import from ${from}: ${specifier}`);
  const possibilities = path.extname(candidate) ? [candidate] : [candidate, `${candidate}.js`, `${candidate}.mjs`, `${candidate}.css`, path.join(candidate, 'index.js')];
  for (const relative of possibilities) {
    try { await readFile(path.join(root, relative)); return relative.split(path.sep).join('/'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  throw new Error(`Unresolved local import from ${from}: ${specifier}`);
}

export async function collectReachableSources(root = process.cwd()) {
  const queue = ['index.html', 'styles.css', 'src/main.js'];
  const seen = new Set();
  while (queue.length) {
    const relative = queue.shift();
    if (seen.has(relative)) continue;
    seen.add(relative);
    const text = await readFile(path.join(root, relative), 'utf8');
    const specifiers = [];
    if (relative.endsWith('.html')) {
      for (const match of text.matchAll(htmlScriptPattern)) specifiers.push(match[1]);
    } else if (/\.(?:js|mjs|cjs)$/.test(relative)) {
      for (const pattern of importPatterns) for (const match of text.matchAll(pattern)) specifiers.push(match[1]);
    }
    for (const specifier of specifiers) {
      const resolved = await resolveSource(root, relative, specifier);
      if (resolved && /\.(?:html|css|js|mjs)$/.test(resolved)) queue.push(resolved);
    }
  }
  return [...seen].sort();
}
