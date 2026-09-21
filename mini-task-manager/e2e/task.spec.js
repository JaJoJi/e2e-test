const { test, expect } = require('@playwright/test');

function uniqueTaskName(prefix) {
  const stamp = Date.now().toString(36);
  const rand = Math.floor(Math.random() * 1e6).toString(36);
  return `${prefix}-${stamp}-${rand}`;
}

test.describe('Task UI', () => {
  test('user can create a task and it appears in the list', async ({ page }) => {
    const taskName = uniqueTaskName('AddTask');

    await page.goto('/');
    await page.getByTestId('task-input').fill(taskName);
    await page.getByTestId('add-task').click();

    const item = page
      .getByTestId('task-item')
      .filter({ hasText: taskName });
    await expect(item).toBeVisible();
    await expect(item.getByTestId('complete-task')).toBeVisible();
    await expect(item.getByTestId('delete-task')).toBeVisible();
  });

  test('user can mark a task as completed', async ({ page }) => {
    const taskName = uniqueTaskName('CompleteTask');

    await page.goto('/');
    await page.getByTestId('task-input').fill(taskName);
    await page.getByTestId('add-task').click();

    const item = page
      .getByTestId('task-item')
      .filter({ hasText: taskName });
    await expect(item).toBeVisible();

    const checkbox = item.getByTestId('complete-task');
    await expect(checkbox).not.toBeChecked();
    await checkbox.check();
    await expect(checkbox).toBeChecked();
    await expect(item).toHaveClass(/completed/);
  });

  test('user can delete a task', async ({ page }) => {
    const taskName = uniqueTaskName('DeleteTask');

    await page.goto('/');
    await page.getByTestId('task-input').fill(taskName);
    await page.getByTestId('add-task').click();

    const item = page
      .getByTestId('task-item')
      .filter({ hasText: taskName });
    await expect(item).toBeVisible();

    await item.getByTestId('delete-task').click();
    await expect(item).toHaveCount(0);
  });

  test('empty title does not create a task', async ({ page }) => {
    await page.goto('/');
    const before = await page.getByTestId('task-item').count();
    await page.getByTestId('task-input').fill('   ');
    // The browser will block submission due to `required`, but send anyway.
    await page.getByTestId('add-task').click({ force: true });
    const after = await page.getByTestId('task-item').count();
    expect(after).toBe(before);
  });
});
