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
};
