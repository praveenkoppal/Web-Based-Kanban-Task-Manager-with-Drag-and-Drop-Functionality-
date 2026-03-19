const DEFAULT_COLUMNS = [
  { id: 1, title: 'To Do', status: 'todo' },
  { id: 2, title: 'In Progress', status: 'in-progress' },
  { id: 3, title: 'Done', status: 'done' },
];

const DEFAULT_TASKS = [
  { id: 1, title: 'Design UI mockups', description: 'Create mockups for the dashboard', priority: 'Medium', column: 'To Do' },
  { id: 2, title: 'Setup database', description: 'Configure PostgreSQL database', priority: 'Low', column: 'To Do' },
  { id: 3, title: 'Implement authentication', description: 'Add login and signup features', priority: 'High', column: 'In Progress' },
  { id: 4, title: 'Build API endpoints', description: 'Create REST API endpoints', priority: 'High', column: 'In Progress' },
  { id: 5, title: 'Project setup', description: 'Initialize Angular project', priority: 'Low', column: 'Done' },
  { id: 6, title: 'Git repository', description: 'Setup GitHub repository', priority: 'Low', column: 'Done' },
];

let columns = [...DEFAULT_COLUMNS];
let tasks = [...DEFAULT_TASKS];

const getJson = async (request) => {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/api/columns') {
    return new Response(JSON.stringify(columns), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  if (path === '/api/tasks') {
    const column = url.searchParams.get('column');
    const result = column ? tasks.filter((t) => t.column === column) : tasks;
    return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  return null;
};

const postJson = async (request) => {
  const url = new URL(request.url);
  const path = url.pathname;
  const body = await request.json();

  if (path === '/api/columns') {
    const id = (columns.length > 0 ? Math.max(...columns.map((c) => c.id || 0)) : 0) + 1;
    const created = { ...body, id };
    columns.push(created);
    return new Response(JSON.stringify(created), { status: 201, headers: { 'Content-Type': 'application/json' } });
  }

  if (path === '/api/tasks') {
    const id = (tasks.length > 0 ? Math.max(...tasks.map((t) => t.id || 0)) : 0) + 1;
    const created = { ...body, id };
    tasks.push(created);
    return new Response(JSON.stringify(created), { status: 201, headers: { 'Content-Type': 'application/json' } });
  }

  return null;
};

const putJson = async (request) => {
  const url = new URL(request.url);
  const path = url.pathname;
  const body = await request.json();

  if (path === '/api/columns') {
    columns = Array.isArray(body) ? body : columns;
    return new Response(JSON.stringify(columns), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  if (path.startsWith('/api/tasks/')) {
    const id = Number(path.split('/').pop());
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx >= 0) {
      tasks[idx] = { ...tasks[idx], ...body };
      return new Response(JSON.stringify(tasks[idx]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(null, { status: 404 });
  }

  return null;
};

const deleteJson = async (request) => {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path.startsWith('/api/columns/')) {
    const id = Number(path.split('/').pop());
    const removed = columns.find((c) => c.id === id);
    columns = columns.filter((c) => c.id !== id);
    if (removed) {
      tasks = tasks.filter((t) => t.column !== removed.title);
    }
    return new Response(null, { status: 204 });
  }

  if (path.startsWith('/api/tasks/')) {
    const id = Number(path.split('/').pop());
    tasks = tasks.filter((t) => t.id !== id);
    return new Response(null, { status: 204 });
  }

  if (path === '/api/tasks') {
    const column = url.searchParams.get('column');
    if (column) {
      tasks = tasks.filter((t) => t.column !== column);
      return new Response(null, { status: 204 });
    }
  }

  return null;
};

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (!url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith((async () => {
    let response;
    switch (event.request.method) {
      case 'GET':
        response = await getJson(event.request);
        break;
      case 'POST':
        response = await postJson(event.request);
        break;
      case 'PUT':
        response = await putJson(event.request);
        break;
      case 'DELETE':
        response = await deleteJson(event.request);
        break;
      default:
        response = new Response(null, { status: 405 });
    }

    return response || new Response(null, { status: 404 });
  })());
});
