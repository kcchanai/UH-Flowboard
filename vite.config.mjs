import {defineConfig} from 'vite';
import {basePath} from './scripts/repository-path.mjs';

export default defineConfig({
  base: basePath,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    target: 'es2022'
  }
});
