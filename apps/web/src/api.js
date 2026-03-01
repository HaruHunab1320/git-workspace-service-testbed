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
  getStatus: () => request('/status'),
  advanceDay: () => request('/advance-day', { method: 'POST' }),
  newGame: (seed = 42) => request(`/new-game?seed=${seed}`, { method: 'POST' }),

  getWeather: () => request('/weather'),
  getForecast: (days = 5) => request(`/weather/forecast?days=${days}`),

  getVillagers: () => request('/villagers'),
  getVillager: (id) => request(`/villagers/${id}`),
  giveGift: (id, gift) => request(`/villagers/${id}/gift`, {
    method: 'POST',
    body: JSON.stringify(gift),
  }),

  getGarden: () => request('/garden'),
  getAvailableCrops: () => request('/garden/crops'),
  plantCrop: (row, col, cropName) => request('/garden/plant', {
    method: 'POST',
    body: JSON.stringify({ row, col, crop_name: cropName }),
  }),

  getPets: () => request('/pets'),
  getAdoptable: () => request('/pets/adoptable'),
  adoptPet: (name, species, personality) => request('/pets/adopt', {
    method: 'POST',
    body: JSON.stringify({ name, species, personality }),
  }),
  petInteraction: (name) => request(`/pets/${name}/pet`, { method: 'POST' }),
  feedPet: (name) => request(`/pets/${name}/feed`, { method: 'POST' }),
  playWithPet: (name) => request(`/pets/${name}/play`, { method: 'POST' }),

  getPrices: () => request('/economy/prices'),
  getEconomySummary: () => request('/economy/summary'),
  getWallet: () => request('/economy/wallet'),
  getInventory: () => request('/inventory'),
  buyItem: (itemKey, quantity = 1) => request('/economy/buy', {
    method: 'POST',
    body: JSON.stringify({ item_key: itemKey, quantity }),
  }),
  sellItem: (itemKey, quantity = 1) => request('/economy/sell', {
    method: 'POST',
    body: JSON.stringify({ item_key: itemKey, quantity }),
  }),

  getZenGarden: () => request('/zen-garden'),
  getAvailableSucculents: () => request('/zen-garden/succulents'),
  getAvailableRocks: () => request('/zen-garden/rocks'),
  placeSucculent: (row, col, succulentName) => request('/zen-garden/place-succulent', {
    method: 'POST',
    body: JSON.stringify({ row, col, succulent_name: succulentName }),
  }),
  placeRock: (row, col, rockName) => request('/zen-garden/place-rock', {
    method: 'POST',
    body: JSON.stringify({ row, col, rock_name: rockName }),
  }),
  rakeZenTile: (row, col, pattern) => request('/zen-garden/rake', {
    method: 'POST',
    body: JSON.stringify({ row, col, pattern }),
  }),
  removeZenItem: (row, col) => request('/zen-garden/remove', {
    method: 'POST',
    body: JSON.stringify({ row, col }),
  }),

  getJournal: () => request('/journal'),
  addJournalEntry: (text) => request('/journal', {
    method: 'POST',
    body: JSON.stringify({ text }),
  }),
  deleteJournalEntry: (id) => request(`/journal/${id}`, { method: 'DELETE' }),
};
