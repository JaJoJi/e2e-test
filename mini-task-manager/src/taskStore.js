'use strict';

function createTaskStore() {
  let nextId = 1;
  const tasks = [];

  function normalizeTitle(input) {
    if (typeof input === 'string') return input.trim();
    if (input == null) return '';
    return String(input).trim();
  }

  function getHealth() {
    return { status: 'ok' };
  }

  function listTasks() {
    return tasks.slice();
  }

  function createTask(input) {
    const title = normalizeTitle(input);
    if (!title) {
      return { error: 'Title is required' };
    }
    const task = { id: nextId++, title, completed: false };
    tasks.push(task);
    return { task };
  }

  function updateTask(id, patch) {
    const numericId = Number(id);
    const task = tasks.find((t) => t.id === numericId);
    if (!task) {
      return { error: 'Task not found' };
    }
    const safePatch = patch && typeof patch === 'object' ? patch : {};
    if (typeof safePatch.completed === 'boolean') {
      task.completed = safePatch.completed;
    }
    if (typeof safePatch.title === 'string' && safePatch.title.trim()) {
      task.title = safePatch.title.trim();
    }
    return { task };
  }

  function deleteTask(id) {
    const numericId = Number(id);
    const idx = tasks.findIndex((t) => t.id === numericId);
    if (idx === -1) {
      return { error: 'Task not found' };
    }
    const [task] = tasks.splice(idx, 1);
    return { task };
  }

  return {
    getHealth,
    listTasks,
    createTask,
    updateTask,
    deleteTask,
  };
}

module.exports = { createTaskStore };
