import { defineConfig, devices } from "@playwright/test";

const PORT = 8000;

export default defineConfig({
  testDir: "./tests/ui",
  // The tests share one server and one database, so run them one at a time
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  // Starts the app with a database of its own
  webServer: {
    command: `python -m uvicorn app.main:app --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}/api/health`,
    reuseExistingServer: !process.env.CI,
    env: { DB_PATH: "data/ui-tests.db" },
  },
});
