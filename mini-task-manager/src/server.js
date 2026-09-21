const express = require('express');
const path = require('path');
const { createTaskStore } = require('./taskStore');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;
const store = createTaskStore();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/tasks', (req, res) => {
  res.status(200).json(store.listTasks());
});

app.post('/api/tasks', (req, res) => {
  const body = req.body || {};
  const result = store.createTask(body.title);
  if (result.error) {
    return res.status(400).json(result);
  }
  return res.status(201).json(result.task);
});

app.patch('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const body = req.body || {};
  const result = store.updateTask(id, body);
  if (result.error) {
    return res.status(404).json(result);
  }
  return res.status(200).json(result.task);
});

app.delete('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const result = store.deleteTask(id);
  if (result.error) {
    return res.status(404).json(result);
  }
  return res.status(200).json(result.task);
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Only start listening when run directly (e.g. `node src/server.js` or the
// Playwright `webServer` command). When the module is required by tests
// (Jest/supertest), we export the app without binding a port.
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`Mini Task Manager listening on port ${PORT}`);
  });

  const shutdown = (signal) => {
    console.log(`Received ${signal}, shutting down...`);
    server.close(() => process.exit(0));
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = app;
