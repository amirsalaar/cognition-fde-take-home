import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60000,
  retries: 0,
  use: {
    baseURL: process.env.APP_URL ?? "http://localhost:3000",
    screenshot: "only-on-failure",
  },
  reporter: [["list"]],
});
