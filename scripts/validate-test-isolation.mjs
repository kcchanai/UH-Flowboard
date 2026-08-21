import {readdir, readFile} from 'node:fs/promises';
import {join} from 'node:path';

const forbidden = ['127.0.0.1:9099', 'demo-flowboard-browser', '__flowboardEmulatorTest', '/tests/emulator/'];
const files = [];
async function collect(directory) {
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await collect(path);
    else files.push(path);
  }
}
await collect('dist');
for (const file of files) {
  const text = await readFile(file, 'utf8');
  for (const marker of forbidden) if (text.includes(marker)) throw new Error(`Production asset isolation failed: ${marker} found in ${file}.`);
}
console.log(`Production asset isolation passed: ${files.length} assets contain no emulator-only markers.`);
