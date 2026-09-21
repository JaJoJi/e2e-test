const { test, expect } = require('@playwright/test');

test.describe('Home page', () => {
  test('loads successfully with HTTP 200', async ({ page }) => {
    const response = await page.goto('/');
    expect(response, 'navigation response').not.toBeNull();
    expect(response.status()).toBe(200);
    await expect(page).toHaveURL(/\/$/);
  });

  test('shows the application title "Mini Task Manager"', async ({ page }) => {
    await page.goto('/');
    const title = page.getByTestId('app-title');
    await expect(title).toBeVisible();
    await expect(title).toHaveText('Mini Task Manager');
  });

  test('shows the task input and Add Task button', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('task-input')).toBeVisible();
    await expect(page.getByTestId('add-task')).toBeVisible();
  });
});
