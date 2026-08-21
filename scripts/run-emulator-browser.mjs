import {spawn} from 'node:child_process';

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const port = 4180;
const baseURL = `http://127.0.0.1:${port}/UH-Trello`;
const spawnOptions = {stdio: 'inherit', shell: process.platform === 'win32'};
const server = spawn(command, ['--yes', 'vite', '--host', '127.0.0.1', '--port', String(port)], spawnOptions);

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
  return new Promise((resolve, reject) => {
    const child = spawn(command, ['--yes', 'firebase-tools@15.25.1', 'emulators:exec', '--only', 'auth,firestore', '--project', 'demo-flowboard-browser', browserCommand], {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: {...process.env, PLAYWRIGHT_EMULATOR_BASE_URL: baseURL}
    });
    child.on('error', reject);
    child.on('exit', (code, signal) => resolve(code ?? (signal ? 1 : 0)));
  });
}

try {
  await waitForServer();
  process.exitCode = await runEmulators();
} finally {
  server.kill();
}
