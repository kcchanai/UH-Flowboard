import {spawn, spawnSync} from 'node:child_process';
import {previewUrl} from './repository-path.mjs';

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const port = 4180;
const baseURL = (process.env.PLAYWRIGHT_EMULATOR_BASE_URL || previewUrl(port)).replace(/\/$/, '');
const spawnOptions = {stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32'};
const server = spawn(command, ['--yes', 'vite', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], spawnOptions);
server.stdout.on('data', () => {});
server.stderr.on('data', () => {});

async function waitForServer() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${baseURL}/tests/emulator/index.html`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('The Emulator browser Vite server did not become ready.');
}

function runEmulators() {
  const browserCommand = `${command} playwright test tests/emulator/emulator-browser.spec.mjs --reporter=line`;
  const childOptions = {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
    env: {...process.env, PLAYWRIGHT_EMULATOR_BASE_URL: baseURL,
      PLAYWRIGHT_EXECUTABLE_PATH:process.env.PLAYWRIGHT_EXECUTABLE_PATH || (process.platform === 'win32' ? 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe' : '')}
  };
  const child = process.platform === 'win32'
    ? spawn(`${command} --yes firebase-tools@15.25.1 emulators:exec --only auth,firestore --project demo-flowboard-browser "${browserCommand}"`, [], childOptions)
    : spawn(command, ['--yes', 'firebase-tools@15.25.1', 'emulators:exec', '--only', 'auth,firestore', '--project', 'demo-flowboard-browser', browserCommand], childOptions);
  return new Promise((resolve, reject) => {
    let output = '';
    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.on('data', chunk => { output += chunk; });
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code === 0) {
        const passed = output.match(/(\d+) passed/);
        console.log(`Emulator browser workflow passed: ${passed?.[1] || 'all'} test(s).`);
      } else {
        const safe=output.split(/[\r\n]+/).map(line=>line.replace(/\x1b\[[0-9;]*m/g,'')).filter(line=>line.includes('›')||/^\s*(?:Error: (?:expect|locator|page\.)|Locator:|Expected:|Received:|Timeout:)/.test(line)).join('\n');
        console.error(`Emulator browser workflow failed with exit ${code ?? `signal ${signal}`}. Raw fixture diagnostics were suppressed.${safe?`\n${safe}`:''}`);
      }
      resolve(code ?? (signal ? 1 : 0));
    });
  });
}

function stopServer() {
  if (!server.pid) return;
  if (process.platform === 'win32') spawnSync('taskkill.exe', ['/PID', String(server.pid), '/T', '/F'], {stdio: 'ignore'});
  else server.kill('SIGTERM');
}

try {
  await waitForServer();
  process.exitCode = await runEmulators();
} finally {
  stopServer();
}
