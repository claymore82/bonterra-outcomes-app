# E2E Tests

Functional tests for Bonterra Outcomes pages using Playwright.

## Purpose

These tests help us track what's working and what isn't as we build new pages. Each page should have tests covering:
- Page loads successfully
- Key UI elements are visible
- Basic interactions work (buttons, forms, navigation)

## Running Tests

### Install Playwright browsers (first time only)
```bash
npx playwright install
```

### Run all tests
```bash
npm run test:e2e
```

### Run tests in UI mode (interactive, recommended for debugging)
```bash
npm run test:e2e:ui
```

### Run specific test file
```bash
npx playwright test e2e/pages.spec.ts
```

### Run in headed mode (see browser)
```bash
npm run test:e2e:headed
```

## Test Organization

### navigation.spec.ts
Tests for navigation flows and sidebar menu interactions.
- ✅ Main menu navigation
- ✅ Site/program selectors in header
- ✅ Admin navigation (when applicable)
- ✅ Back buttons

### pages.spec.ts
Basic page load and functionality tests for all pages.

**Page Load Tests** - Verify each page renders:
- ✅ Home page
- ✅ Participants page
- ✅ Families page
- ✅ Enrollment page
- ✅ Services record page

**Feature Tests** - Test key features per page:
- **Participants**: Stats cards, search, create button
- **Families**: Stats cards, search, create button
- **Enrollment**: Form fields, validation, cancel

## Adding Tests for New Pages

When you add a new page, add tests in `pages.spec.ts`:

```typescript
test.describe('New Page Name', () => {
  test('should load page', async ({ page }) => {
    await page.goto('/your-new-page');
    await expect(page.locator('h1:has-text("Page Title")')).toBeVisible();
  });

  test('should display key elements', async ({ page }) => {
    await page.goto('/your-new-page');

    // Test for important UI elements
    await expect(page.locator('text=Some Important Text')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Action Button' })).toBeVisible();
  });

  test('should handle basic interaction', async ({ page }) => {
    await page.goto('/your-new-page');

    // Test a simple interaction like clicking a button
    const button = page.getByRole('button', { name: 'Do Something' });
    await button.click();

    // Verify something happened
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

## Known Limitations

### Stitch Select Components
The Stitch `<Select>` component (React Aria based) is difficult to interact with in Playwright:
- Dropdown doesn't reliably open with `.click()`
- Options aren't easily selectable
- Keyboard navigation doesn't work consistently

**Workaround**: Skip testing dropdown selection for now. Test other aspects of forms instead.

### What to Test
Focus on:
- ✅ Page loads without errors
- ✅ Key text/headings are visible
- ✅ Buttons exist and are clickable
- ✅ Simple form inputs accept text
- ✅ Navigation works

Avoid (for now):
- ⚠️ Selecting from Stitch dropdowns
- ⚠️ Complex form submissions requiring dropdowns
- ⚠️ Testing exact success flows that need dropdown interaction

## Test Philosophy

**Goal**: Track what's working, not 100% coverage.

- Simple smoke tests > No tests
- Test what's easy to test
- Add more tests as pages stabilize
- Keep tests fast and reliable

## Continuous Integration

When running in CI:
- Tests retry up to 2 times on failure
- Only uses 1 worker (no parallelization)
- Generates HTML report
- Fails build if tests fail

## Debugging Failed Tests

1. **Use UI mode** (best for debugging):
   ```bash
   npm run test:e2e:ui
   ```

2. **Run in headed mode** (see what's happening):
   ```bash
   npm run test:e2e:headed
   ```

3. **View test trace** (after failure):
   ```bash
   npx playwright show-trace test-results/trace.zip
   ```

4. **Check screenshots** (auto-captured on failure):
   Look in `test-results/` directory

## Test Status

Current coverage:

| Page | Load Test | Feature Tests |
|------|-----------|---------------|
| Home | ✅ | - |
| Participants | ✅ | ✅ (stats, search, buttons) |
| Families | ✅ | ✅ (stats, search, buttons) |
| Enrollment | ✅ | ✅ (fields, validation, cancel) |
| Services | ✅ | 🔜 |

Navigation: ✅ All flows working
