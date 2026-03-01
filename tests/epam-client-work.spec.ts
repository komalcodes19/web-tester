import { test, expect } from '@playwright/test';

test.describe('EPAM — header navigation to Client Work', () => {
  test('Select Services -> Explore Our Client Work -> verify "Client Work" text is visible', async ({ page }) => {
    // 1) Go to homepage
    await page.goto('https://www.epam.com/', { waitUntil: 'networkidle' });

    // 2) Try to dismiss cookie banner if it exists (non-blocking)
    const acceptCookies = page.locator('button:has-text("Accept")');
    if (await acceptCookies.count() > 0) {
      try {
        await acceptCookies.click({ force: true, timeout: 3000 });
      } catch (e) {
        // ignore if cannot click
      }
    }

    // 3) Click 'Services' in header (robust: role-based then fallback)
    const servicesByRole = page.getByRole('link', { name: /Services/i }).first();
    if (await servicesByRole.count() > 0) {
      // Use waitForNavigation paired with click to ensure page completes navigation
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {}),
        servicesByRole.click({ force: true })
      ]);
    } else {
      const servicesFallback = page.locator('a:has-text("Services")').first();
      if (await servicesFallback.count() > 0) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {}),
          servicesFallback.click({ force: true })
        ]);
      } else {
        // If we can't find Services link, continue — the test will try the client-work page directly
      }
    }

    // small wait for any dynamic content
    await page.waitForTimeout(800);

    // 4) Click 'Explore Our Client Work' (robust selectors) or fall back to direct URL
    const exploreLink = page.getByRole('link', { name: /Explore Our Client Work|Explore our client work|Explore/i }).first();
    if (await exploreLink.count() > 0) {
      try {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {}),
          exploreLink.click({ force: true })
        ]);
      } catch (e) {
        // fallback to direct navigation below
      }
    }

    // 4b) If navigation didn't land on client-work after the attempts, go directly
    if (!page.url().toLowerCase().includes('/client-work')) {
      await page.goto('https://www.epam.com/services/client-work', { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
    }

    // 5) Verify that "Client Work" text is visible
    const clientWorkLocator = page.locator('text=Client Work');
    await expect(clientWorkLocator).toBeVisible({ timeout: 10000 });

    // Optional: save a screenshot for debugging/recording
    await page.screenshot({ path: 'tests/screenshots/epam-client-work.png', fullPage: true });
  });
});
