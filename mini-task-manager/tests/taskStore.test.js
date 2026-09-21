'use strict';

const { createTaskStore } = require('../src/taskStore');

describe('TaskStore', () => {
  let store;

  beforeEach(() => {
    store = createTaskStore();
  });

  describe('getHealth()', () => {
    test('returns status ok', () => {
      expect(store.getHealth()).toEqual({ status: 'ok' });
    });
  });

  describe('listTasks()', () => {
    test('returns an empty array when nothing was created', () => {
      expect(store.listTasks()).toEqual([]);
    });

    test('returns a copy so external mutation does not affect the store', () => {
      store.createTask('first');
      const snapshot = store.listTasks();
      snapshot.push({ id: 999, title: 'rogue', completed: true });
      expect(store.listTasks()).toHaveLength(1);
    });
  });

  describe('createTask()', () => {
    test('creates a task with a numeric id, trimmed title, completed=false', () => {
      const result = store.createTask('  Buy milk  ');
      expect(result.error).toBeUndefined();
      expect(result.task).toEqual({
        id: expect.any(Number),
        title: 'Buy milk',
        completed: false,
      });
      expect(Number.isInteger(result.task.id)).toBe(true);
    });

    test('assigns monotonically increasing ids', () => {
      const a = store.createTask('one').task.id;
      const b = store.createTask('two').task.id;
      const c = store.createTask('three').task.id;
      expect(b).toBeGreaterThan(a);
      expect(c).toBeGreaterThan(b);
    });

    test('returns { error } and does not create a task for an empty title', () => {
      expect(store.createTask('')).toEqual({ error: 'Title is required' });
      expect(store.listTasks()).toHaveLength(0);
    });

    test('returns { error } for whitespace-only titles', () => {
      expect(store.createTask('   ')).toEqual({ error: 'Title is required' });
      expect(store.listTasks()).toHaveLength(0);
    });

    test('returns { error } for null / undefined / non-string input', () => {
      expect(store.createTask(null).error).toBe('Title is required');
      expect(store.createTask(undefined).error).toBe('Title is required');
      expect(store.listTasks()).toHaveLength(0);
    });
  });

  describe('updateTask()', () => {
    test('flips completed boolean on an existing task', () => {
      const { task } = store.createTask('do it');
      const result = store.updateTask(task.id, { completed: true });
      expect(result.error).toBeUndefined();
      expect(result.task.completed).toBe(true);
      expect(store.listTasks().find((t) => t.id === task.id).completed).toBe(true);
    });

    test('renames the task when a non-empty title is provided', () => {
      const { task } = store.createTask('old');
      const result = store.updateTask(task.id, { title: '   new   ' });
      expect(result.task.title).toBe('new');
    });

    test('ignores non-string / empty titles instead of clearing the title', () => {
      const { task } = store.createTask('keep me');
      const result = store.updateTask(task.id, { title: '   ' });
      expect(result.task.title).toBe('keep me');
    });

    test('returns { error } for unknown ids', () => {
      expect(store.updateTask(9999, { completed: true })).toEqual({
        error: 'Task not found',
      });
    });

    test('tolerates a missing or non-object patch', () => {
      const { task } = store.createTask('stable');
      expect(store.updateTask(task.id, null).task).toMatchObject({
        title: 'stable',
        completed: false,
      });
      expect(store.updateTask(task.id).task).toMatchObject({
        title: 'stable',
        completed: false,
      });
    });

    test('coerces string ids from query params into numbers', () => {
      const { task } = store.createTask('numeric id');
      const result = store.updateTask(String(task.id), { completed: true });
      expect(result.task.id).toBe(task.id);
      expect(result.task.completed).toBe(true);
    });
  });

  describe('deleteTask()', () => {
    test('removes the task and returns it', () => {
      const { task } = store.createTask('gone');
      const result = store.deleteTask(task.id);
      expect(result.task).toEqual(task);
      expect(store.listTasks()).toHaveLength(0);
    });

    test('returns { error } when the id is unknown', () => {
      expect(store.deleteTask(424242)).toEqual({ error: 'Task not found' });
    });

    test('coerces string ids from query params into numbers', () => {
      const { task } = store.createTask('numeric delete');
      const result = store.deleteTask(String(task.id));
      expect(result.task.id).toBe(task.id);
    });
  });

  describe('isolation', () => {
    test('two independent stores do not share state', () => {
      const a = createTaskStore();
      const b = createTaskStore();
      a.createTask('only in a');
      expect(a.listTasks()).toHaveLength(1);
      expect(b.listTasks()).toHaveLength(0);
    });
  });
});
