const STORAGE_KEY = 'dream-log-storage';

export const dreamStorage = {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  save(entries) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Storage full or unavailable — silently degrade
    }
  },

  addEntry(entry) {
    const entries = this.load();
    entries.unshift(entry);
    this.save(entries);
    return entries;
  },

  updateEntry(id, updates) {
    const entries = this.load().map((e) =>
      e.id === id ? { ...e, ...updates } : e
    );
    this.save(entries);
    return entries;
  },

  removeEntry(id) {
    const entries = this.load().filter((e) => e.id !== id);
    this.save(entries);
    return entries;
  },

  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Silently degrade
    }
  },
};
