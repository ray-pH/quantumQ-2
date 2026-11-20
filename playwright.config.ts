import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:1420",
    launchOptions: {
      executablePath: process.env.QUANTUMQ_CHROMIUM,
    },
  },
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 1420 --strictPort",
    url: "http://127.0.0.1:1420",
  },
});
