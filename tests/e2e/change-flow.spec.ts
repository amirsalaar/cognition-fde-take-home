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
  await page.waitForURL("**/");
}

async function logout(page: Page) {
  await page.click('button:has-text("sign out")');
  await page.waitForURL("**/login");
}

test("developer submits, a different approver approves, applies, then rolls back", async ({ page }) => {
  // Developer drafts and submits a change for dashboard_dark_mode in DEV.
  await login(page, DEVELOPER);
  await page.click('a:has-text("new request")');
  await page.selectOption("select >> nth=0", { label: "dashboard_dark_mode" });
  await page.selectOption("select >> nth=1", "DEV");
  await page.fill("textarea", "E2E: enable dark mode in dev for workflow proof.");
  await page.click('button:has-text("create draft")');
  await expect(page.locator("h1")).toContainText("dashboard_dark_mode");
  await expect(page.locator(".status-chip").first()).toHaveText("DRAFT");

  await page.click('button:has-text("SUBMIT")');
  await expect(page.locator(".status-chip").first()).toHaveText("PENDING_APPROVAL");

  // Developer sees no approve button on their own request.
  await expect(page.locator('button:has-text("APPROVE")')).toHaveCount(0);
  const requestUrl = page.url();
  await page.goto("/");
  await logout(page);

  // A different release approver approves and applies.
  await login(page, APPROVER);
  await page.goto(requestUrl);
  await page.fill('input[placeholder="decision rationale"]', "E2E approval, staging equivalent verified.");
  await page.click('button:has-text("APPROVE")');
  await expect(page.locator(".status-chip").first()).toHaveText("APPROVED");

  await page.click('button:has-text("APPLY")');
  await expect(page.locator(".status-chip").first()).toHaveText("APPLIED");
  await expect(page.locator("td", { hasText: "on @ 100%" }).first()).toBeVisible();

  // The approver rolls the change back; provider state is restored.
  await page.click('button:has-text("ROLLBACK")');
  await expect(page.locator(".status-chip").first()).toHaveText("ROLLED_BACK");

  // Audit trail shows the full decision path.
  const audit = page.locator("section", { hasText: "audit trail" });
  for (const action of ["CREATE", "SUBMIT", "APPROVE", "APPLY", "ROLLBACK"]) {
    await expect(audit.locator("td", { hasText: action }).first()).toBeVisible();
  }
});
