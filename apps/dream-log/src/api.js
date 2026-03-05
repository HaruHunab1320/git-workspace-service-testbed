const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

export const api = {
  getDreamEntries: () => request('/dream-journal'),

  addDreamEntry: (entry) =>
    request('/dream-journal', {
      method: 'POST',
      body: JSON.stringify(entry),
    }),

  updateDreamEntry: (id, entry) =>
    request(`/dream-journal/${id}`, {
      method: 'PUT',
      body: JSON.stringify(entry),
    }),

  deleteDreamEntry: (id) =>
    request(`/dream-journal/${id}`, { method: 'DELETE' }),
};
