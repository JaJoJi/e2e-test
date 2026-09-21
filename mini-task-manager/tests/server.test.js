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
});
