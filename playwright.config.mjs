import {defineConfig} from '@playwright/test';
const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH;
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173';
export default defineConfig({
  testDir:'./tests',
  outputDir:process.env.PLAYWRIGHT_OUTPUT_DIR || './test-results',
  timeout:30_000,
  use:{
    baseURL,
    browserName:'chromium',
    headless:true,
    launchOptions:executablePath ? {executablePath} : {}
  },
  reporter:'line'
});
