const express = require('express');
const path = require('path');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;

let nextId = 1;
const tasks = [];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/tasks', (req, res) => {
  res.status(200).json(tasks);
});

app.post('/api/tasks', (req, res) => {
  const title = (req.body && req.body.title || '').toString().trim();
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  const task = { id: nextId++, title, completed: false };
  tasks.push(task);
  return res.status(201).json(task);
});

app.patch('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const task = tasks.find((t) => t.id === id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  if (typeof req.body.completed === 'boolean') {
    task.completed = req.body.completed;
  }
  if (typeof req.body.title === 'string' && req.body.title.trim()) {
    task.title = req.body.title.trim();
  }
  return res.status(200).json(task);
});

app.delete('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  const [deleted] = tasks.splice(idx, 1);
  return res.status(200).json(deleted);
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

const server = app.listen(PORT, () => {
  console.log(`Mini Task Manager listening on port ${PORT}`);
});

const shutdown = (signal) => {
  console.log(`Received ${signal}, shutting down...`);
  server.close(() => process.exit(0));
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;
