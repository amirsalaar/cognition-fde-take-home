import { expect, test, type Page } from "@playwright/test";

// Synthetic demo accounts from prisma/seed.ts. No real systems involved.
const PASSWORD = "demo-password-123";
const DEVELOPER = "dana.dev@example.test";
const APPROVER = "rae.approver@example.test";

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', PASSWORD);
  await page.click('button:has-text("sign in")');
  await page.waitForURL((url) => url.pathname === "/");
}

test("developer submits, a different approver approves, applies, then rolls back", async ({ browser }) => {
  // Developer session and approver session in separate browser contexts.
  const developerContext = await browser.newContext();
  const approverContext = await browser.newContext();
  const dev = await developerContext.newPage();
  const approver = await approverContext.newPage();

  // Developer drafts and submits a change for dashboard_dark_mode in DEV.
  await login(dev, DEVELOPER);
  await dev.click('a:has-text("new request")');
  await dev.selectOption("select >> nth=0", { label: "dashboard_dark_mode" });
  await dev.selectOption("select >> nth=1", "DEV");
  await dev.fill("textarea", "E2E: enable dark mode in dev for workflow proof.");
  await dev.click('button:has-text("create draft")');
  await expect(dev.locator("h1")).toContainText("dashboard_dark_mode");
  await expect(dev.locator(".status-chip").first()).toHaveText("DRAFT");

  await dev.click('button:has-text("SUBMIT")');
  await expect(dev.locator(".status-chip").first()).toHaveText("PENDING_APPROVAL");

  // Developer sees no approve action on their own request.
  await expect(dev.locator('button:has-text("APPROVE")')).toHaveCount(0);
  const requestUrl = dev.url();

  // A different release approver approves and applies.
  await login(approver, APPROVER);
  await approver.goto(requestUrl);
  await approver.fill('input[placeholder="decision rationale"]', "E2E approval, staging equivalent verified.");
  await approver.click('button:has-text("APPROVE")');
  await expect(approver.locator(".status-chip").first()).toHaveText("APPROVED");

  await approver.click('button:has-text("APPLY")');
  await expect(approver.locator(".status-chip").first()).toHaveText("APPLIED");
  await expect(approver.locator("td", { hasText: "on @ 100%" }).first()).toBeVisible();

  // The approver rolls the change back; provider state is restored.
  await approver.click('button:has-text("ROLLBACK")');
  await expect(approver.locator(".status-chip").first()).toHaveText("ROLLED_BACK");

  // Audit trail shows the full decision path.
  const audit = approver.locator("section", { hasText: "audit trail" });
  for (const action of ["CREATE", "SUBMIT", "APPROVE", "APPLY", "ROLLBACK"]) {
    await expect(audit.locator("td", { hasText: action }).first()).toBeVisible();
  }

  await developerContext.close();
  await approverContext.close();
});
