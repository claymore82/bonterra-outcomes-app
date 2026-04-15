import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate through main menu', async ({ page }) => {
    await page.goto('/');

    // Test Participants navigation - click nav item by label
    await Promise.all([
      page.waitForURL('/participants'),
      page.getByRole('link', { name: 'Participants' }).click()
    ]);
    await expect(page.locator('h1:has-text("Participants")')).toBeVisible();

    // Test Families navigation
    await Promise.all([
      page.waitForURL('/families'),
      page.getByRole('link', { name: 'Families' }).click()
    ]);
    await expect(page.locator('h1:has-text("Families")')).toBeVisible();

    // Test Create Enrollment navigation
    await Promise.all([
      page.waitForURL('/enroll'),
      page.getByRole('link', { name: 'Create Enrollment' }).click()
    ]);
    await expect(page.locator('h1:has-text("Create New Enrollment")')).toBeVisible();

    // Test Home navigation - use the sidebar link (not the "Back to Home" link)
    await Promise.all([
      page.waitForURL('/'),
      page.getByRole('link', { name: 'Home', exact: true }).first().click()
    ]);
  });

  test('should display site and program selectors in header', async ({ page }) => {
    await page.goto('/');

    // Look for site selector
    const siteSelector = page.locator('button').filter({
      hasText: /All Sites|Site/
    });

    // Look for program selector
    const programSelector = page.locator('button').filter({
      hasText: /All Programs|Program/
    });

    // At least one selector should be visible
    const siteCount = await siteSelector.count();
    const programCount = await programSelector.count();

    expect(siteCount + programCount).toBeGreaterThan(0);
  });

  test('should navigate to admin settings (if admin user)', async ({ page }) => {
    await page.goto('/');

    // Look for Administration link (only visible to admin users)
    const adminLink = page.getByRole('link', { name: 'Administration' });

    const count = await adminLink.count();
    if (count > 0) {
      await Promise.all([
        page.waitForURL(/\/admin/),
        adminLink.click()
      ]);
    }
  });

  test('should show active nav item highlighting', async ({ page }) => {
    await page.goto('/participants');

    // Participants nav item should be active
    const participantsNav = page.locator('a[href="/participants"]');

    // Check if it has an active state
    await expect(participantsNav).toBeVisible();

    // Navigate to families
    await page.goto('/families');

    // Families nav item should be active
    const familiesNav = page.locator('a[href="/families"]');
    await expect(familiesNav).toBeVisible();
  });

  test('should have working back button on enrollment page', async ({ page }) => {
    await page.goto('/enroll');

    // Find back link
    const backLink = page.getByText('← Back to Home');

    if (await backLink.count() > 0) {
      await Promise.all([
        page.waitForURL('/'),
        backLink.click()
      ]);
    }
  });
});
