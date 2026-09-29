import {defineConfig} from 'vite';
import {basePath} from './scripts/repository-path.mjs';

const buildOutput = process.env.FLOWBOARD_BUILD_OUT_DIR || 'dist';

const emulatorInviteShell = {
  name: 'flowboard-emulator-invite-shell',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use((request, response, next) => {
      if (!request.url) return next();
      const url = new URL(request.url, 'http://flowboard.test');
      if (![basePath, basePath.slice(0, -1)].includes(url.pathname) || !url.searchParams.has('workspace') || !url.searchParams.has('invite')) return next();
      request.url = `${basePath}tests/emulator/index.html${url.search}`;
      next();
    });
  }
};

export default defineConfig({
  base: basePath,
  plugins: process.env.FLOWBOARD_EMULATOR_INVITE_HARNESS === '1' ? [emulatorInviteShell] : [],
  build: {
    outDir: buildOutput,
    emptyOutDir: true,
    sourcemap: false,
    target: 'es2022'
  }
});
