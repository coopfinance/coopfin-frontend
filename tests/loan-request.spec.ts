import { test, expect } from "@playwright/test";

const MOCK_ADDRESS = "GBM6Y7T5X5L5Z5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5";

test.describe("Loan Request Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "freighter", {
        value: {
          isConnected: async () => ({ isConnected: true }),
          getAddress: async () => ({ address: MOCK_ADDRESS }),
          signTransaction: async (xdr: string) => ({ signedTxXdr: xdr }),
          signBlob: async (blob: string) => ({ signedBlob: blob }),
          signAuthEntry: async (entry: string) => ({ signedAuthEntry: entry }),
        },
        writable: true,
        configurable: true,
      });
    });

    await page.route("**/api/**", async (route) => {
      const url = route.request().url();
      if (url.includes("/api/loans")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: 1,
              borrower: MOCK_ADDRESS,
              amount: 50000000,
              status: "Approved",
              purpose: "Business expansion",
              requestedAt: new Date().toISOString(),
            },
          ]),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: "[]",
        });
      }
    });
  });

  test("should display Request Loan button on Loans page", async ({
    page,
  }) => {
    await page.goto("/loans");
    await page.waitForLoadState("networkidle");

    await expect(
      page.locator("button", { hasText: "Request Loan" }),
    ).toBeVisible();
  });

  test("should open loan request modal and display form fields", async ({
    page,
  }) => {
    await page.goto("/loans");
    await page.waitForLoadState("networkidle");

    await page.locator("button", { hasText: "Request Loan" }).click();

    const modal = page.locator("div.fixed.inset-0");
    await expect(modal).toBeVisible({ timeout: 5000 });

    await expect(
      modal.locator("h2", { hasText: "Request Loan" }),
    ).toBeVisible();

    await expect(modal.locator('input[type="number"]')).toBeVisible();
    await expect(modal.locator("textarea")).toBeVisible();

    await expect(
      modal.locator("button", { hasText: "Connect Wallet" }),
    ).toBeVisible();
  });

  test("should connect wallet and submit a loan request", async ({
    page,
  }) => {
    await page.goto("/loans");
    await page.waitForLoadState("networkidle");

    await page.locator("button", { hasText: "Request Loan" }).click();
    await page.waitForTimeout(500);

    const modal = page.locator("div.fixed.inset-0");

    await modal.locator('input[type="number"]').fill("500");
    await modal.locator("textarea").fill("Test loan for business");
    await modal.locator("select").selectOption("60");

    await modal.locator("button", { hasText: "Connect Wallet" }).click();

    const freighterOption = page
      .locator("text=Freighter")
      .or(page.locator("text=FREIGHTER"))
      .first();
    await expect(freighterOption).toBeVisible({ timeout: 5000 });
    await freighterOption.click();

    await page.waitForTimeout(500);

    const submitBtn = modal.locator("button", { hasText: "Submit Request" });
    await expect(submitBtn).toBeVisible({ timeout: 5000 });
    await submitBtn.click();

    await expect(modal).not.toBeVisible({ timeout: 5000 });
  });

  test("should disable submit when form fields are empty", async ({
    page,
  }) => {
    await page.goto("/loans");
    await page.waitForLoadState("networkidle");

    await page.locator("button", { hasText: "Request Loan" }).click();
    await page.waitForTimeout(500);

    const modal = page.locator("div.fixed.inset-0");
    const submitBtn = modal.locator("button").last();

    await expect(submitBtn).toBeDisabled();

    await modal.locator('input[type="number"]').fill("500");
    await expect(submitBtn).toBeDisabled();

    await modal.locator("textarea").fill("Test purpose");
    await expect(submitBtn).not.toBeDisabled();
  });
});
