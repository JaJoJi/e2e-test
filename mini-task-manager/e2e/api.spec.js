const { test, expect } = require('@playwright/test');

function uniqueTaskName(prefix) {
  const stamp = Date.now().toString(36);
  const rand = Math.floor(Math.random() * 1e6).toString(36);
  return `${prefix}-${stamp}-${rand}`;
}

test.describe('API endpoints', () => {
  test('GET /api/health returns HTTP 200 and status ok', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ status: 'ok' });
    expect(typeof body.uptime).toBe('number');
  });

  test('GET /api/tasks returns HTTP 200 and an array', async ({ request }) => {
    const res = await request.get('/api/tasks');
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('POST /api/tasks creates a task and returns it with an id', async ({ request }) => {
    const title = uniqueTaskName('ApiTask');

    const res = await request.post('/api/tasks', {
      data: { title },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({ title, completed: false });
    expect(typeof body.id).toBe('number');

    // Confirm the created task is now retrievable.
    const listRes = await request.get('/api/tasks');
    expect(listRes.status()).toBe(200);
    const list = await listRes.json();
    const found = list.find((t) => t.id === body.id);
    expect(found, 'created task should appear in the list').toBeDefined();
    expect(found.title).toBe(title);

    // Cleanup so we do not pollute the in-memory state for other tests.
    const delRes = await request.delete(`/api/tasks/${body.id}`);
    expect(delRes.status()).toBe(200);
  });

  test('POST /api/tasks rejects empty title with HTTP 400', async ({ request }) => {
    const res = await request.post('/api/tasks', {
      data: { title: '   ' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(400);
  });
});
