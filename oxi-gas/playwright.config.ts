import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  workers: 2,
  use: {
    baseURL: 'http://127.0.0.1:4173/OxigasWeb/',
    channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
    headless: true,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --port 4173',
    url: 'http://127.0.0.1:4173/OxigasWeb/',
    reuseExistingServer: false,
    env: {
      BASE_PATH: '/OxigasWeb/',
      VITE_SUPABASE_URL: 'https://fixture.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'fixture-public-key',
    },
  },
});
