import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "e2e/reports/html" }]],
  use: {
    baseURL: "http://localhost:8080",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium-android-375",
      use: { ...devices["Pixel 5"], viewport: { width: 375, height: 812 } },
    },
    {
      name: "webkit-iphone-390",
      use: { ...devices["iPhone 13"] }, // 390x844, safari webkit
    },
    {
      name: "webkit-iphone-plus-414",
      use: { ...devices["iPhone 11 Pro Max"], viewport: { width: 414, height: 896 } },
    },
  ],
});
