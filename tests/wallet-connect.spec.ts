import { test, expect } from "@playwright/test";

const MOCK_ADDRESS = "GBM6Y7T5X5L5Z5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5";

test.describe("Wallet Connect Flow", () => {
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
      if (url.includes("/api/stats")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            totalGroups: 3,
            totalMembers: 42,
            totalContributions: 12500000,
            totalLoansActive: 5,
            totalLoansValue: 7500000,
          }),
        });
      } else if (url.includes("/api/notifications")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
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

  test("should display Connect Wallet button and open modal", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const connectBtn = page.locator(
      'button[data-testid="connect-wallet-btn"]',
    );
    await expect(connectBtn).toBeVisible();
    await connectBtn.click();

    await expect(
      page
        .locator("text=Freighter")
        .or(page.locator("text=FREIGHTER"))
        .first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test("should connect wallet via Freighter and show address in sidebar", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    await page.locator('button[data-testid="connect-wallet-btn"]').click();

    const freighterOption = page
      .locator("text=Freighter")
      .or(page.locator("text=FREIGHTER"))
      .first();
    await expect(freighterOption).toBeVisible({ timeout: 5000 });
    await freighterOption.click();

    const addressDisplay = page.locator('[data-testid="wallet-address"]');
    await expect(addressDisplay).toBeVisible({ timeout: 5000 });
    await expect(addressDisplay).toHaveText("GBM6Y7...5X5X5");
  });

  test("should disconnect wallet and clear address", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    await page.locator('button[data-testid="connect-wallet-btn"]').click();

    const freighterOption = page
      .locator("text=Freighter")
      .or(page.locator("text=FREIGHTER"))
      .first();
    await expect(freighterOption).toBeVisible({ timeout: 5000 });
    await freighterOption.click();

    await page.waitForTimeout(500);

    const disconnectBtn = page.locator('[data-testid="disconnect-btn"]');
    await expect(disconnectBtn).toBeVisible({ timeout: 5000 });
    await disconnectBtn.click();

    await expect(
      page.locator('button[data-testid="connect-wallet-btn"]'),
    ).toBeVisible({ timeout: 5000 });
  });
});
