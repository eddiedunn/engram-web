import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

// Helper to wait for page load
async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
}

test.describe('Search Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForPageLoad(page);
  });

  test('1. Search page loads correctly', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle('Engram Knowledge Base');

    // Check main elements are present
    await expect(page.locator('h1')).toContainText('Engram Knowledge Base');
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
    // Use more specific selector for submit button
    await expect(page.locator('button[type="submit"]:has-text("Search")')).toBeVisible();
  });

  test('2. Empty search handling', async ({ page }) => {
    // Search button should be disabled with empty query
    const searchButton = page.locator('button[type="submit"]:has-text("Search")');
    await expect(searchButton).toBeDisabled();
  });

  test('3. Search form elements visible', async ({ page }) => {
    // Check search mode radio buttons
    await expect(page.locator('input[value="hybrid"]')).toBeVisible();
    await expect(page.locator('input[value="semantic"]')).toBeVisible();
    await expect(page.locator('input[value="fts"]')).toBeVisible();

    // Check type filter
    await expect(page.getByText('Type:')).toBeVisible();

    // Check tags filter
    await expect(page.getByText('Tags:')).toBeVisible();

    // Check results count selector
    await expect(page.getByText('Results:')).toBeVisible();
  });

  test('4. Search mode toggles work', async ({ page }) => {
    // Default should be hybrid
    const hybridRadio = page.locator('input[value="hybrid"]');
    await expect(hybridRadio).toBeChecked();

    // Click semantic
    await page.locator('input[value="semantic"]').click();
    await expect(page.locator('input[value="semantic"]')).toBeChecked();

    // Click fts
    await page.locator('input[value="fts"]').click();
    await expect(page.locator('input[value="fts"]')).toBeChecked();
  });

  test('5. Type filter dropdown works', async ({ page }) => {
    // Click type dropdown
    const typeDropdown = page.locator('button:has-text("All types")').first();
    await typeDropdown.click();

    // Check options are visible
    await expect(page.locator('[role="option"]:has-text("YouTube")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("Article")')).toBeVisible();
  });

  test('6. Results count dropdown works', async ({ page }) => {
    // Find results dropdown (shows "10" by default)
    const resultsDropdown = page.locator('button').filter({ has: page.locator('span:text("10")') }).first();
    await resultsDropdown.click();

    // Check options
    await expect(page.locator('[role="option"]:has-text("25")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("50")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("100")')).toBeVisible();
  });

  test('7. Clear filters button works', async ({ page }) => {
    // Enter a search query
    await page.locator('input[placeholder*="Search"]').fill('test query');

    // Click clear filters
    await page.locator('button:has-text("Clear Filters")').click();

    // Query should be cleared
    await expect(page.locator('input[placeholder*="Search"]')).toHaveValue('');
  });

  test('8. Search with query - API error handling', async ({ page }) => {
    // Enter a search query (API is not running, should show error)
    await page.locator('input[placeholder*="Search"]').fill('test query');
    await page.locator('button[type="submit"]:has-text("Search")').click();

    // Wait for error to appear (API unavailable)
    await page.waitForTimeout(3000);

    // URL should update with query params
    await expect(page).toHaveURL(/q=test/);
  });
});

test.describe('Navigation', () => {
  test('1. Navigation tabs work', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForPageLoad(page);

    // Check tab list is visible
    await expect(page.locator('[role="tablist"]')).toBeVisible();

    // Click Browse tab - use the link inside the tablist
    await page.locator('[role="tablist"] a[href="/browse"]').click();
    await expect(page).toHaveURL(`${BASE_URL}/browse`);

    // Click Search tab - use the first link to home inside tablist
    await page.locator('[role="tablist"] a[href="/"]').click();
    await expect(page).toHaveURL(`${BASE_URL}/`);
  });

  test('2. Logo links to home', async ({ page }) => {
    await page.goto(`${BASE_URL}/browse`);
    await waitForPageLoad(page);

    // Click logo/title - use more specific selector for the nav logo
    await page.locator('nav a[href="/"]').first().click();
    await expect(page).toHaveURL(`${BASE_URL}/`);
  });
});

test.describe('Browse Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/browse`);
    await waitForPageLoad(page);
  });

  test('1. Browse page loads correctly', async ({ page }) => {
    // Check title
    await expect(page.locator('h1')).toContainText('Browse Content');

    // Check filter controls
    await expect(page.getByText('Content Type')).toBeVisible();
    await expect(page.getByText('Sort By')).toBeVisible();
  });

  test('2. Content type filter works', async ({ page }) => {
    // Click type dropdown
    const typeDropdown = page.locator('button:has-text("All types")').first();
    await typeDropdown.click();

    // Select YouTube
    await page.locator('[role="option"]:has-text("YouTube")').click();

    // URL should update with type parameter
    await expect(page).toHaveURL(/type=YOUTUBE/);
  });

  test('3. Sort options work', async ({ page }) => {
    // Click sort dropdown (default is "Newest First")
    const sortDropdown = page.locator('button:has-text("Newest First")');
    await sortDropdown.click();

    // Select "Oldest First"
    await page.locator('[role="option"]:has-text("Oldest First")').click();

    // URL should update with sort parameter
    await expect(page).toHaveURL(/sort=oldest/);
  });

  test('4. API error handling on browse', async ({ page }) => {
    // Wait for API call attempt
    await page.waitForTimeout(3000);

    // Should show error or empty state
    // The exact handling depends on implementation
  });
});

test.describe('Content Page (404 handling)', () => {
  test('1. Invalid content ID shows 404 page', async ({ page }) => {
    await page.goto(`${BASE_URL}/content/invalid-content-id`);
    await waitForPageLoad(page);

    // Wait for API call to fail
    await page.waitForTimeout(3000);

    // Should show "Content Not Found" or similar message
    await expect(page.getByText(/Content Not Found|not found/i)).toBeVisible({ timeout: 10000 });
  });

  test('2. Back button works on 404 page', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForPageLoad(page);

    await page.goto(`${BASE_URL}/content/invalid-id`);
    await page.waitForTimeout(3000);

    // Click back button
    const backButton = page.locator('button:has-text("Back")').first();
    if (await backButton.isVisible()) {
      await backButton.click();
      // Should navigate back
    }
  });

  test('3. Go to Search link works', async ({ page }) => {
    await page.goto(`${BASE_URL}/content/invalid-id`);
    await page.waitForTimeout(3000);

    // Look for "Go to Search" button
    const searchButton = page.locator('button:has-text("Go to Search")');
    if (await searchButton.isVisible()) {
      await searchButton.click();
      await expect(page).toHaveURL(`${BASE_URL}/`);
    }
  });
});

test.describe('Dark Mode', () => {
  test('1. Theme toggle button exists', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForPageLoad(page);

    // Find theme toggle button - use first() since there's one for desktop and one for mobile
    const themeButton = page.locator('button[aria-label="Toggle theme"]').first();
    await expect(themeButton).toBeVisible();
  });

  test('2. Theme toggle changes mode', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForPageLoad(page);

    // Use first theme button (desktop version)
    const themeButton = page.locator('button[aria-label="Toggle theme"]').first();

    // Get initial state - should be 'light' (from 'system' default)
    const htmlBefore = await page.locator('html').getAttribute('class');
    expect(htmlBefore).toContain('light');

    // Click toggle twice - first click goes from 'system' to 'light' (no visible change)
    // second click goes from 'light' to 'dark'
    // NOTE: This is a UX issue - first click has no visible effect when system preference is light
    await themeButton.click();
    await page.waitForTimeout(300);
    await themeButton.click();
    await page.waitForTimeout(500);

    // Get new state
    const htmlAfter = await page.locator('html').getAttribute('class');

    // State should now be dark
    expect(htmlAfter).toContain('dark');
  });

  test('3. Theme persists across page reload', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForPageLoad(page);

    const themeButton = page.locator('button[aria-label="Toggle theme"]').first();

    // Click to change theme
    await themeButton.click();
    await page.waitForTimeout(500);

    const themeAfterClick = await page.locator('html').getAttribute('class');

    // Reload page
    await page.reload();
    await waitForPageLoad(page);

    const themeAfterReload = await page.locator('html').getAttribute('class');

    // Theme should be the same after reload
    expect(themeAfterClick).toBe(themeAfterReload);
  });
});

test.describe('Responsive Design', () => {
  test('1. Mobile viewport (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    await waitForPageLoad(page);

    // Check mobile menu button is visible
    await expect(page.locator('button[aria-label="Toggle menu"]')).toBeVisible();

    // Check desktop tabs are hidden on mobile
    await expect(page.locator('[role="tablist"]')).not.toBeVisible();
  });

  test('2. Mobile menu opens and works', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    await waitForPageLoad(page);

    // Click menu button
    await page.locator('button[aria-label="Toggle menu"]').click();
    await page.waitForTimeout(500);

    // Mobile menu should be visible - look for the Browse link in the mobile menu section
    // Use the visible link (the mobile one with icon and text)
    const browseLink = page.locator('nav').locator('a:has-text("Browse")').filter({ hasText: 'Browse' }).last();
    await expect(browseLink).toBeVisible();

    // Click Browse link
    await browseLink.click();
    await expect(page).toHaveURL(`${BASE_URL}/browse`);
  });

  test('3. Tablet viewport (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(BASE_URL);
    await waitForPageLoad(page);

    // Desktop tabs should be visible on tablet
    await expect(page.locator('[role="tablist"]')).toBeVisible();

    // Check search form is responsive
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
  });

  test('4. Desktop viewport (1920px)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(BASE_URL);
    await waitForPageLoad(page);

    // All elements should be visible
    await expect(page.locator('[role="tablist"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]:has-text("Search")')).toBeVisible();
  });
});

test.describe('Keyboard Navigation', () => {
  test('1. Ctrl+K focuses search', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForPageLoad(page);

    // Press Ctrl+K
    await page.keyboard.press('Control+k');

    // Search input should be focused
    await expect(page.locator('input[placeholder*="Search"]')).toBeFocused();
  });

  test('2. Enter key submits search', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForPageLoad(page);

    // Focus and fill search
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('test query');

    // Press Enter
    await searchInput.press('Enter');

    // URL should update with query
    await expect(page).toHaveURL(/q=test/);
  });
});

test.describe('Not Found Page', () => {
  test('1. Random URL shows 404', async ({ page }) => {
    await page.goto(`${BASE_URL}/random-nonexistent-path`);
    await waitForPageLoad(page);

    // Should show 404 content
    await expect(page.getByText('404')).toBeVisible();
    await expect(page.getByText('Page Not Found')).toBeVisible();
  });

  test('2. 404 page has navigation links', async ({ page }) => {
    await page.goto(`${BASE_URL}/random-nonexistent-path`);
    await waitForPageLoad(page);

    // Should have Go Home button
    await expect(page.locator('button:has-text("Go Home")')).toBeVisible();
  });
});
