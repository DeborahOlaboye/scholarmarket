import { test, expect } from '@playwright/test';

test.describe('E2E Checkout Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    // Wait for app to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Marketplace Discovery to Checkout', () => {
    test('should display marketplace and discover materials', async ({ page }) => {
      // Look for materials/marketplace elements
      const materialsSection = page.locator('[data-testid="materials-grid"], .materials-container, [role="main"]').first();

      // Wait for content to load
      await materialsSection.waitFor({ state: 'visible', timeout: 10000 });

      // Verify materials are visible
      const materialItems = page.locator('[data-testid="material-card"], .material-item, article').first();
      await expect(materialItems).toBeVisible();
    });

    test('should navigate to material detail page', async ({ page }) => {
      // Find and click first material card
      const materialCard = page.locator('[data-testid="material-card"], .material-item, article').first();
      await materialCard.click();

      // Wait for navigation
      await page.waitForURL('**/materials/**', { waitUntil: 'networkidle' });

      // Verify detail page loaded
      const detailContent = page.locator('[data-testid="material-detail"], main').first();
      await expect(detailContent).toBeVisible();
    });

    test('should display material information and pricing', async ({ page }) => {
      // Navigate to a material
      const materialCard = page.locator('[data-testid="material-card"], .material-item, article').first();
      await materialCard.click();

      await page.waitForURL('**/materials/**', { waitUntil: 'networkidle' });

      // Check for price information
      const priceDisplay = page.locator('[data-testid="price"], .price, [data-price]').first();
      await expect(priceDisplay).toBeVisible();

      // Check for purchase button
      const purchaseButton = page.locator('button:has-text("Buy"), button:has-text("Purchase"), [data-testid="purchase-btn"]').first();
      await expect(purchaseButton).toBeVisible();
    });

    test('should initiate checkout when purchase button clicked', async ({ page }) => {
      // Navigate to material detail
      const materialCard = page.locator('[data-testid="material-card"], .material-item, article').first();
      await materialCard.click();

      await page.waitForURL('**/materials/**', { waitUntil: 'networkidle' });

      // Click purchase button
      const purchaseButton = page.locator('button:has-text("Buy"), button:has-text("Purchase"), [data-testid="purchase-btn"]').first();
      await purchaseButton.click();

      // Wait for checkout modal/page
      const checkoutModal = page.locator('[data-testid="checkout-modal"], .checkout-container, [role="dialog"]').first();
      await expect(checkoutModal).toBeVisible({ timeout: 10000 });
    });

    test('should display checkout form with payment options', async ({ page }) => {
      // Navigate to material and open checkout
      const materialCard = page.locator('[data-testid="material-card"], .material-item, article').first();
      await materialCard.click();

      await page.waitForURL('**/materials/**', { waitUntil: 'networkidle' });

      const purchaseButton = page.locator('button:has-text("Buy"), button:has-text("Purchase"), [data-testid="purchase-btn"]').first();
      await purchaseButton.click();

      // Wait for checkout to appear
      const checkoutForm = page.locator('[data-testid="checkout-form"], form, .checkout-container').first();
      await expect(checkoutForm).toBeVisible({ timeout: 10000 });

      // Verify wallet selection is present
      const walletOptions = page.locator('[data-testid="wallet-select"], .wallet-option, button:has-text("Connect")').first();
      await expect(walletOptions).toBeVisible();
    });

    test('should mock wallet connection in checkout', async ({ page }) => {
      // Set up mock wallet data in localStorage
      await page.evaluate(() => {
        const mockWallet = {
          address: 'GCAKLMMFVDQQPD3TVWKQJ7BPMH2XYY65RG6GR3XWFVWHG5P36V7VS77Q',
          network: 'testnet',
          connected: true,
        };
        localStorage.setItem('wallet_connected', JSON.stringify(mockWallet));
      });

      // Reload to apply mock
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Navigate to material and checkout
      const materialCard = page.locator('[data-testid="material-card"], .material-item, article').first();
      await materialCard.click();

      await page.waitForURL('**/materials/**', { waitUntil: 'networkidle' });

      const purchaseButton = page.locator('button:has-text("Buy"), button:has-text("Purchase"), [data-testid="purchase-btn"]').first();
      await purchaseButton.click();

      // Verify wallet is shown as connected
      const walletAddress = page.locator('text=GCAKLMMFVDQQPD3TVWKQJ7BPMH2XYY65RG6GR3XWFVWHG5P36V7VS77Q').first();
      await expect(walletAddress).toBeVisible({ timeout: 10000 });
    });

    test('should display checkout summary with pricing breakdown', async ({ page }) => {
      // Navigate to checkout
      const materialCard = page.locator('[data-testid="material-card"], .material-item, article').first();
      await materialCard.click();

      await page.waitForURL('**/materials/**', { waitUntil: 'networkidle' });

      const purchaseButton = page.locator('button:has-text("Buy"), button:has-text("Purchase"), [data-testid="purchase-btn"]').first();
      await purchaseButton.click();

      // Wait for checkout and verify summary
      const checkoutSummary = page.locator('[data-testid="checkout-summary"], .summary, .pricing-breakdown').first();
      await expect(checkoutSummary).toBeVisible({ timeout: 10000 });

      // Look for price breakdown items
      const subtotal = page.locator('text=Subtotal, text=Total, text=Price').first();
      await expect(subtotal).toBeVisible();
    });

    test('should capture screenshots on checkout flow stages', async ({ page }) => {
      // Screenshot 1: Marketplace
      await expect(page.locator('[data-testid="materials-grid"], .materials-container').first()).toBeVisible();
      await page.screenshot({ path: '/tmp/checkout-01-marketplace.png' });

      // Screenshot 2: Material detail
      const materialCard = page.locator('[data-testid="material-card"], .material-item, article').first();
      await materialCard.click();
      await page.waitForURL('**/materials/**', { waitUntil: 'networkidle' });
      await page.screenshot({ path: '/tmp/checkout-02-detail.png' });

      // Screenshot 3: Checkout modal
      const purchaseButton = page.locator('button:has-text("Buy"), button:has-text("Purchase"), [data-testid="purchase-btn"]').first();
      await purchaseButton.click();
      await expect(page.locator('[data-testid="checkout-modal"], .checkout-container').first()).toBeVisible({ timeout: 10000 });
      await page.screenshot({ path: '/tmp/checkout-03-modal.png' });
    });

    test('should generate test report with videos on failure', async ({ page }) => {
      // This test demonstrates failure capture - intentionally navigate to non-existent page
      // The playwright config is set to capture videos on failure
      const materialCard = page.locator('[data-testid="material-card"], .material-item, article').first();

      // Expect this element exists
      await expect(materialCard).toBeVisible();
    });
  });

  test.describe('Wallet Integration', () => {
    test('should require wallet connection for purchase', async ({ page }) => {
      // Clear any stored wallet data
      await page.evaluate(() => {
        localStorage.removeItem('wallet_connected');
        localStorage.removeItem('selectedWallet');
      });

      // Navigate to material
      const materialCard = page.locator('[data-testid="material-card"], .material-item, article').first();
      await materialCard.click();

      await page.waitForURL('**/materials/**', { waitUntil: 'networkidle' });

      // Click purchase
      const purchaseButton = page.locator('button:has-text("Buy"), button:has-text("Purchase"), [data-testid="purchase-btn"]').first();
      await purchaseButton.click();

      // Should show wallet connection prompt
      const walletPrompt = page.locator('text=Connect Wallet, text=Select Wallet, button:has-text("Connect")').first();
      await expect(walletPrompt).toBeVisible({ timeout: 10000 });
    });

    test('should display different payment methods when wallet connected', async ({ page }) => {
      // Set up mock wallet
      await page.evaluate(() => {
        localStorage.setItem('wallet_connected', JSON.stringify({
          address: 'GCAKLMMFVDQQPD3TVWKQJ7BPMH2XYY65RG6GR3XWFVWHG5P36V7VS77Q',
          network: 'testnet',
        }));
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Open checkout
      const materialCard = page.locator('[data-testid="material-card"], .material-item, article').first();
      await materialCard.click();
      await page.waitForURL('**/materials/**', { waitUntil: 'networkidle' });

      const purchaseButton = page.locator('button:has-text("Buy"), button:has-text("Purchase"), [data-testid="purchase-btn"]').first();
      await purchaseButton.click();

      // Verify payment method options appear
      const paymentMethods = page.locator('[data-testid="payment-methods"], .payment-options, button:has-text("XLM")').first();
      await expect(paymentMethods).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate offline mode
      await page.context().setOffline(true);

      // Try to navigate
      await page.goto('/', { waitUntil: 'domcontentloaded' }).catch(() => {});

      // Re-enable network
      await page.context().setOffline(false);

      // Should show error or recovery state
      const errorMessage = page.locator('text=Error, text=offline, text=connection').first();
      const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try Again")').first();

      const hasError = await errorMessage.isVisible().catch(() => false);
      const hasRetry = await retryButton.isVisible().catch(() => false);

      expect(hasError || hasRetry).toBeTruthy();
    });

    test('should validate required checkout fields', async ({ page }) => {
      // Navigate to checkout
      const materialCard = page.locator('[data-testid="material-card"], .material-item, article').first();
      await materialCard.click();
      await page.waitForURL('**/materials/**', { waitUntil: 'networkidle' });

      const purchaseButton = page.locator('button:has-text("Buy"), button:has-text("Purchase"), [data-testid="purchase-btn"]').first();
      await purchaseButton.click();

      // Try to submit without required fields
      const submitButton = page.locator('button:has-text("Confirm"), button:has-text("Complete"), button[type="submit"]').first();
      await submitButton.click({ force: true }).catch(() => {});

      // Check for validation messages
      const validationError = page.locator('[data-testid="error"], .error-message, [role="alert"]').first();
      const isVisible = await validationError.isVisible().catch(() => false);

      expect(isVisible).toBeTruthy();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display checkout properly on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Navigate to material and open checkout
      const materialCard = page.locator('[data-testid="material-card"], .material-item, article').first();
      await materialCard.click();
      await page.waitForURL('**/materials/**', { waitUntil: 'networkidle' });

      const purchaseButton = page.locator('button:has-text("Buy"), button:has-text("Purchase"), [data-testid="purchase-btn"]').first();
      await purchaseButton.click();

      // Verify checkout is usable
      const checkoutModal = page.locator('[data-testid="checkout-modal"], .checkout-container').first();
      await expect(checkoutModal).toBeVisible({ timeout: 10000 });

      // Take screenshot of mobile checkout
      await page.screenshot({ path: '/tmp/checkout-mobile.png' });
    });

    test('should display checkout properly on tablet', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      // Navigate to material and open checkout
      const materialCard = page.locator('[data-testid="material-card"], .material-item, article').first();
      await materialCard.click();
      await page.waitForURL('**/materials/**', { waitUntil: 'networkidle' });

      const purchaseButton = page.locator('button:has-text("Buy"), button:has-text("Purchase"), [data-testid="purchase-btn"]').first();
      await purchaseButton.click();

      // Verify checkout is visible
      const checkoutModal = page.locator('[data-testid="checkout-modal"], .checkout-container').first();
      await expect(checkoutModal).toBeVisible({ timeout: 10000 });

      // Take screenshot of tablet checkout
      await page.screenshot({ path: '/tmp/checkout-tablet.png' });
    });
  });
});
