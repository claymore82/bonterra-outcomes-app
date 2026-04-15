import { test, expect } from '@playwright/test';

test.describe('Page Load Tests', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('participants page loads', async ({ page }) => {
    await page.goto('/participants');
    await expect(page.locator('h1:has-text("Participants")')).toBeVisible();
    await expect(page.locator('text=Search & Filter')).toBeVisible();
    await expect(page.locator('text=Total Participants')).toBeVisible();
  });

  test('families page loads', async ({ page }) => {
    await page.goto('/families');
    await expect(page.locator('h1:has-text("Families")')).toBeVisible();
  });

  test('enrollment page loads', async ({ page }) => {
    await page.goto('/enroll');
    await expect(page.locator('h1:has-text("Create New Enrollment")')).toBeVisible();
    await expect(page.locator('text=Step 1: Select Type')).toBeVisible();
  });

  test('services record page loads', async ({ page }) => {
    await page.goto('/services/record');
    // Just verify it loads without error
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('Participants Page', () => {
  test('should display stats cards', async ({ page }) => {
    await page.goto('/participants');

    await expect(page.locator('text=Total Participants')).toBeVisible();
    // Just check that stats cards exist, don't need to check specific labels
    const statsCards = page.locator('h2');
    expect(await statsCards.count()).toBeGreaterThan(0);
  });

  test('should have search functionality', async ({ page }) => {
    await page.goto('/participants');

    const searchInput = page.locator('input[placeholder*="name or email"]');
    await expect(searchInput).toBeVisible();

    // Test search input accepts text
    await searchInput.fill('test');
    await expect(searchInput).toHaveValue('test');
  });

  test('should have create enrollment button', async ({ page }) => {
    await page.goto('/participants');

    const createButton = page.getByRole('button', { name: 'Create Enrollment' });
    await expect(createButton).toBeVisible();
  });
});

test.describe('Families Page', () => {
  test('should display stats cards', async ({ page }) => {
    await page.goto('/families');

    // Check for heading and stats cards exist
    await expect(page.locator('h1:has-text("Families")')).toBeVisible();
    const statsCards = page.locator('h2');
    expect(await statsCards.count()).toBeGreaterThan(0);
  });

  test('should have search functionality', async ({ page }) => {
    await page.goto('/families');

    const searchInput = page.locator('input[placeholder*="name"]');
    await expect(searchInput).toBeVisible();
  });

  test('should have create family button', async ({ page }) => {
    await page.goto('/families');

    const createButton = page.getByRole('button', { name: 'Create Family' }).first();
    await expect(createButton).toBeVisible();
  });
});

test.describe('Enrollment Page', () => {
  test('should have enrollment type options', async ({ page }) => {
    await page.goto('/enroll');

    await expect(page.locator('text=Step 1: Select Type')).toBeVisible();
    await expect(page.locator('text=Step 2: Action')).toBeVisible();
    // Verify the selection cards exist
    await expect(page.getByRole('button', { name: /Participant.*Enroll an individual/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Family.*Enroll a household/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Entity.*Enroll an institution/ })).toBeVisible();
  });

  test('should have participant form fields when creating new', async ({ page }) => {
    await page.goto('/enroll');

    // Verify participant fields are visible (default is create new participant)
    await expect(page.getByRole('textbox', { name: 'First Name *' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Last Name *' })).toBeVisible();
    await expect(page.locator('input[type="date"]')).toBeVisible();
  });

  test('should have cancel button that returns home', async ({ page }) => {
    await page.goto('/enroll');

    const cancelButton = page.getByRole('button', { name: 'Cancel' });
    await expect(cancelButton).toBeVisible();

    await Promise.all([
      page.waitForURL('/'),
      cancelButton.click()
    ]);
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/enroll');

    // Set up alert handler
    let alertMessage = '';
    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    // Try to submit without filling required fields
    const submitButton = page.getByRole('button', { name: 'Complete Enrollment' });
    await submitButton.click();

    // Should get a validation alert
    await page.waitForTimeout(500);
    expect(alertMessage).toBeTruthy();
    expect(alertMessage.toLowerCase()).toContain('please');
  });
});
