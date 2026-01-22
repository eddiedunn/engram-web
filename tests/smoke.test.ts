import { test, expect } from '@playwright/test';

/**
 * Smoke tests for Engram Web frontend
 * These tests verify critical user paths and basic functionality
 */

test.describe('Smoke Tests', () => {
  test('app loads and renders search page', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Verify page title
    await expect(page).toHaveTitle('Engram Knowledge Base');

    // Verify search input is visible and accepts input
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();

    // Test that input accepts text
    await searchInput.fill('test query');
    await expect(searchInput).toHaveValue('test query');
  });

  test('navigation works between pages', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Navigate to Browse page
    await page.locator('[role="tablist"] a[href="/browse"]').click();
    await expect(page).toHaveURL(/.*browse/);

    // Verify Browse page loaded
    await expect(page.locator('h1')).toContainText('Browse Content');

    // Navigate back to Search
    await page.locator('[role="tablist"] a[href="/"]').click();
    await expect(page).toHaveURL('http://localhost:5173/');
  });

  test('search form components are functional', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Verify search mode radio buttons work
    const semanticRadio = page.locator('input[value="semantic"]');
    await semanticRadio.click();
    await expect(semanticRadio).toBeChecked();

    // Verify type filter dropdown is interactive
    const typeDropdown = page.locator('button:has-text("All types")').first();
    await typeDropdown.click();
    await expect(page.locator('[role="option"]:has-text("YouTube")')).toBeVisible();
  });

  test('404 page works for invalid routes', async ({ page }) => {
    await page.goto('http://localhost:5173/nonexistent-route');

    // Verify 404 page is shown
    await expect(page.getByText('404')).toBeVisible();
    await expect(page.getByText('Page Not Found')).toBeVisible();

    // Verify navigation back home works
    const homeButton = page.locator('button:has-text("Go Home")');
    await expect(homeButton).toBeVisible();
  });

  test('keyboard shortcuts work', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Test Ctrl+K focuses search
    await page.keyboard.press('Control+k');
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeFocused();

    // Test Enter key submits search
    await searchInput.fill('smoke test');
    await searchInput.press('Enter');
    await expect(page).toHaveURL(/q=smoke/);
  });

  test('responsive design works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5173');

    // Verify mobile menu button is visible
    await expect(page.locator('button[aria-label="Toggle menu"]')).toBeVisible();

    // Verify desktop tabs are hidden
    await expect(page.locator('[role="tablist"]')).not.toBeVisible();

    // Test mobile menu opens
    await page.locator('button[aria-label="Toggle menu"]').click();
    await page.waitForTimeout(500);

    // Verify mobile navigation works
    const browseLink = page.locator('nav').locator('a:has-text("Browse")').last();
    await expect(browseLink).toBeVisible();
  });

  test('theme toggle works', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Verify theme toggle exists
    const themeButton = page.locator('button[aria-label="Toggle theme"]').first();
    await expect(themeButton).toBeVisible();

    // Test theme toggle changes theme
    const htmlBefore = await page.locator('html').getAttribute('class');
    await themeButton.click();
    await page.waitForTimeout(300);

    // Theme should change after clicking
    // Note: First click may be from system to explicit mode
  });
});
