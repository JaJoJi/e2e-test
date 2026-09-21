(function () {
  'use strict';

  const taskForm = document.getElementById('task-form');
  const taskInput = document.getElementById('task-input');
  const taskList = document.getElementById('task-list');
  const emptyState = document.getElementById('empty-state');

  async function fetchTasks() {
    const res = await fetch('/api/tasks', { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  }

  async function createTask(title) {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  }

  async function updateTask(id, patch) {
    const res = await fetch('/api/tasks/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  }

  async function deleteTask(id) {
    const res = await fetch('/api/tasks/' + id, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete task');
    return res.json();
  }

  function renderTask(task) {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.dataset.testid = 'task-item';
    li.dataset.taskId = String(task.id);
    if (task.completed) li.classList.add('completed');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.dataset.testid = 'complete-task';
    checkbox.checked = !!task.completed;
    checkbox.setAttribute('aria-label', 'Mark task as completed');
    checkbox.addEventListener('change', async () => {
      try {
        await updateTask(task.id, { completed: checkbox.checked });
        li.classList.toggle('completed', checkbox.checked);
      } catch (err) {
        checkbox.checked = !checkbox.checked;
        alert('Could not update task: ' + err.message);
      }
    });

    const span = document.createElement('span');
    span.className = 'task-title';
    span.textContent = task.title;

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-btn';
    deleteBtn.dataset.testid = 'delete-task';
    deleteBtn.textContent = 'Delete';
    deleteBtn.setAttribute('aria-label', 'Delete task');
    deleteBtn.addEventListener('click', async () => {
      try {
        await deleteTask(task.id);
        li.remove();
        toggleEmptyState();
      } catch (err) {
        alert('Could not delete task: ' + err.message);
      }
    });

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(deleteBtn);
    return li;
  }

  function toggleEmptyState() {
    if (!emptyState) return;
    emptyState.hidden = taskList.children.length > 0;
  }

  async function refreshTasks() {
    try {
      const tasks = await fetchTasks();
      taskList.innerHTML = '';
      for (const task of tasks) {
        taskList.appendChild(renderTask(task));
      }
      toggleEmptyState();
    } catch (err) {
      console.error(err);
    }
  }

  taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = taskInput.value.trim();
    if (!title) return;
    try {
      const task = await createTask(title);
      taskList.appendChild(renderTask(task));
      taskInput.value = '';
      toggleEmptyState();
    } catch (err) {
      alert('Could not create task: ' + err.message);
    }
  });

  refreshTasks();
})();
