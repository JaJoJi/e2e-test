'use strict';

const request = require('supertest');
const app = require('../src/server');

describe('Express app routes', () => {
  describe('GET /api/health', () => {
    test('returns HTTP 200 with status ok and a numeric uptime', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(typeof res.body.uptime).toBe('number');
    });
  });

  describe('GET /api/tasks', () => {
    test('returns HTTP 200 and an array', async () => {
      const res = await request(app).get('/api/tasks');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /api/tasks', () => {
    test('creates a task and returns 201 with the new task body', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Integration task' });
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ title: 'Integration task', completed: false });
      expect(typeof res.body.id).toBe('number');
    });

    test('returns 400 when title is missing or empty', async () => {
      const empty = await request(app).post('/api/tasks').send({ title: '' });
      expect(empty.status).toBe(400);
      expect(empty.body.error).toBe('Title is required');

      const whitespace = await request(app).post('/api/tasks').send({ title: '   ' });
      expect(whitespace.status).toBe(400);
    });
  });

  describe('PATCH /api/tasks/:id', () => {
    test('flips completed on an existing task and returns 200', async () => {
      const created = await request(app)
        .post('/api/tasks')
        .send({ title: 'Patch me' });
      const id = created.body.id;

      const res = await request(app)
        .patch(`/api/tasks/${id}`)
        .send({ completed: true });
      expect(res.status).toBe(200);
      expect(res.body.completed).toBe(true);
    });

    test('returns 404 when the task does not exist', async () => {
      const res = await request(app)
        .patch('/api/tasks/999999')
        .send({ completed: true });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    test('removes a task and returns 200 with the deleted task', async () => {
      const created = await request(app)
        .post('/api/tasks')
        .send({ title: 'Delete me' });
      const id = created.body.id;

      const res = await request(app).delete(`/api/tasks/${id}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(id);

      const list = await request(app).get('/api/tasks');
      expect(list.body.find((t) => t.id === id)).toBeUndefined();
    });

    test('returns 404 when the task does not exist', async () => {
      const res = await request(app).delete('/api/tasks/999999');
      expect(res.status).toBe(404);
    });
  });

  describe('Unknown routes', () => {
    test('returns 404 JSON for non-API paths', async () => {
      const res = await request(app).get('/this-does-not-exist');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Not Found');
    });
  });

  describe('Missing request bodies', () => {
    test('POST without a body is treated as an empty object and returns 400', async () => {
      const res = await request(app).post('/api/tasks');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Title is required');
    });

    test('PATCH without a body leaves the task unchanged and returns 200', async () => {
      const created = await request(app)
        .post('/api/tasks')
        .send({ title: 'No-body patch' });
      const res = await request(app).patch(`/api/tasks/${created.body.id}`);
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('No-body patch');
    });
  });

  describe('Standalone mode (require.main === module)', () => {
    const { spawn } = require('node:child_process');

    async function bootServer() {
      const child = spawn(process.execPath, ['src/server.js'], {
        cwd: __dirname + '/..',
        env: { ...process.env, PORT: '0' },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let output = '';
      const port = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('server did not start')), 10000);
        child.stdout.on('data', (chunk) => {
          output += chunk.toString();
          const m = output.match(/listening on port (\d+)/);
          if (m) {
            clearTimeout(timer);
            resolve(Number(m[1]));
          }
        });
        child.on('error', reject);
      });
      return { child, port };
    }

    function stopServer(child, signal) {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          child.kill('SIGKILL');
          reject(new Error(`server did not exit on ${signal}`));
        }, 10000);
        child.on('exit', (code) => {
          clearTimeout(timer);
          resolve(code);
        });
        child.kill(signal);
      });
    }

    test('boots, serves /api/health, and shuts down cleanly on SIGTERM', async () => {
      const { child, port } = await bootServer();
      try {
        const res = await fetch(`http://127.0.0.1:${port}/api/health`);
        expect(res.status).toBe(200);
        expect((await res.json()).status).toBe('ok');
      } finally {
        await expect(stopServer(child, 'SIGTERM')).resolves.toBe(0);
      }
    }, 15000);

    test('shuts down cleanly on SIGINT', async () => {
      const { child } = await bootServer();
      await expect(stopServer(child, 'SIGINT')).resolves.toBe(0);
    }, 15000);
  });

  describe('BREAK_AFTER_SEC demo hook (dormant unless set)', () => {
    test('flips /api/health to 500 after the configured delay', async () => {
      jest.useFakeTimers();
      try {
        process.env.BREAK_AFTER_SEC = '30';
        let bombApp;
        jest.isolateModules(() => {
          bombApp = require('../src/server');
        });
        delete process.env.BREAK_AFTER_SEC;
        await request(bombApp).get('/api/health').expect(200);
        jest.advanceTimersByTime(31000);
        const res = await request(bombApp).get('/api/health');
        expect(res.status).toBe(500);
        expect(res.body.status).toBe('broken');
      } finally {
        jest.useRealTimers();
      }
    });
  });
});
