import { chromium, type Page } from "@playwright/test";

// Captures product screenshots into docs/screenshots against a running stack
// (make up). Run: npx tsx scripts/capture-screenshots.ts
const BASE = process.env.APP_URL ?? "http://localhost:3000";
const OUT = "docs/screenshots";

async function login(page: Page, email: string) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "demo-password-123");
  await page.click('button:has-text("sign in")');
  await page.waitForURL((url) => url.pathname === "/");
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await context.newPage();

  await page.goto(`${BASE}/login`);
  await page.screenshot({ path: `${OUT}/login.png` });

  await login(page, "rae.approver@example.test");
  await page.screenshot({ path: `${OUT}/queue.png` });

  const applied = page.locator("tr", { hasText: "APPLIED" }).locator("a").first();
  await applied.click();
  await page.waitForURL((url) => url.pathname.startsWith("/requests/"));
  await page.screenshot({ path: `${OUT}/request-detail.png`, fullPage: true });

  await context.clearCookies();
  await login(page, "dana.dev@example.test");
  await page.goto(`${BASE}/requests/new`);
  await page.waitForSelector("select");
  await page.screenshot({ path: `${OUT}/new-request.png` });

  await browser.close();
  console.log("Screenshots written to", OUT);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
