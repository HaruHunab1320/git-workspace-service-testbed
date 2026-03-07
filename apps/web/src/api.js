import { ApiError, NetworkError, NotFoundError, ValidationError } from './errors';

const BASE = '/api';

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new NetworkError();
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    const detail = body.detail || 'Request failed';
    if (res.status === 404) throw new NotFoundError(detail);
    if (res.status === 400) throw new ValidationError(detail);
    throw new ApiError(detail, res.status, detail);
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
  giveGift: (id, gift) =>
    request(`/villagers/${id}/gift`, {
      method: 'POST',
      body: JSON.stringify(gift),
    }),

  getGarden: () => request('/garden'),
  getAvailableCrops: () => request('/garden/crops'),
  plantCrop: (row, col, cropName) =>
    request('/garden/plant', {
      method: 'POST',
      body: JSON.stringify({ row, col, crop_name: cropName }),
    }),

  getPets: () => request('/pets'),
  getAdoptable: () => request('/pets/adoptable'),
  adoptPet: (name, species, personality) =>
    request('/pets/adopt', {
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
  buyItem: (itemKey, quantity = 1) =>
    request('/economy/buy', {
      method: 'POST',
      body: JSON.stringify({ item_key: itemKey, quantity }),
    }),
  sellItem: (itemKey, quantity = 1) =>
    request('/economy/sell', {
      method: 'POST',
      body: JSON.stringify({ item_key: itemKey, quantity }),
    }),

  getZenGarden: () => request('/zen-garden'),
  getAvailableSucculents: () => request('/zen-garden/succulents'),
  getAvailableRocks: () => request('/zen-garden/rocks'),
  placeSucculent: (row, col, succulentName) =>
    request('/zen-garden/place-succulent', {
      method: 'POST',
      body: JSON.stringify({ row, col, succulent_name: succulentName }),
    }),
  placeRock: (row, col, rockName) =>
    request('/zen-garden/place-rock', {
      method: 'POST',
      body: JSON.stringify({ row, col, rock_name: rockName }),
    }),
  rakeZenTile: (row, col, pattern) =>
    request('/zen-garden/rake', {
      method: 'POST',
      body: JSON.stringify({ row, col, pattern }),
    }),
  removeZenItem: (row, col) =>
    request('/zen-garden/remove', {
      method: 'POST',
      body: JSON.stringify({ row, col }),
    }),

  getCrafting: () => request('/crafting'),
  getRecipes: () => request('/crafting/recipes'),
  getMaterials: () => request('/crafting/materials'),
  gatherMaterial: (materialName, quantity = 1) =>
    request('/crafting/gather', {
      method: 'POST',
      body: JSON.stringify({ material_name: materialName, quantity }),
    }),
  craftItem: (recipeName, workstation = 'hand-crafted') =>
    request('/crafting/craft', {
      method: 'POST',
      body: JSON.stringify({ recipe_name: recipeName, workstation }),
    }),
  learnRecipe: (recipeName) =>
    request('/crafting/learn', {
      method: 'POST',
      body: JSON.stringify({ recipe_name: recipeName }),
    }),
  equipTool: (toolIndex = 0) =>
    request(`/crafting/equip?tool_index=${toolIndex}`, {
      method: 'POST',
    }),

  getJournal: () => request('/journal'),
  addJournalEntry: (text, mood = '') =>
    request('/journal', {
      method: 'POST',
      body: JSON.stringify({ text, mood }),
    }),
  deleteJournalEntry: (id) => request(`/journal/${id}`, { method: 'DELETE' }),
};
