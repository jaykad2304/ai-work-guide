import { defineConfig } from '@playwright/test';
import 'dotenv/config';

export default defineConfig({
  testDir: './tests',

  /* Maximum time one test can run for */
  timeout: parseInt(process.env.TIMEOUT || (process.env.CI ? '60000' : '30000')),

  /* Test execution settings */
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: parseInt(process.env.WORKERS || '1'),
  
  /* Reporter configuration */
  reporter: [
    ['html'],
    ['list'],
    ['allure-playwright', {
      detail: true,
      outputFolder: 'allure-results',
      suiteTitle: false,
    }],
  ],
  
  /* Shared settings for all projects */
  use: {
    /* Base URL for tests */
    baseURL: process.env.BASE_URL,

    /* headed locally, headless on CI — control via .env HEADLESS=false */
    headless: process.env.HEADLESS !== 'false',

    /* Screenshot on failure */
    screenshot: process.env.SCREENSHOT_ON_FAILURE !== 'false' ? 'only-on-failure' : 'off',

    /* Video recording */
    video: process.env.VIDEO_ON_FAILURE !== 'false' ? 'retain-on-failure' : 'off',

    /* Collect trace for debugging */
    trace: 'retain-on-failure',

    /* Maximize window — null lets --start-maximized take effect in headed mode */
    viewport: process.env.HEADLESS !== 'false' ? { width: 1920, height: 1080 } : null,

    /* Action timeout */
    actionTimeout: 15 * 1000,
  },

  /* One browser, one worker */
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        launchOptions: {
          args: process.env.HEADLESS !== 'false' ? [] : ['--start-maximized'],
        },
      },
    },
  ],

  /* Web Server for local development */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
