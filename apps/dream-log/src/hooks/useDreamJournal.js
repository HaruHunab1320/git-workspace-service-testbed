import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { dreamStorage } from '../dreamStorage';

export function useDreamJournal() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    try {
      const data = await api.getDreamEntries();
      const sorted = data.sort((a, b) => b.id - a.id);
      setEntries(sorted);
      dreamStorage.save(sorted);
    } catch {
      // Fall back to localStorage if API is unavailable
      setEntries(dreamStorage.load());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const addEntry = useCallback(async ({ title, content, mood, tags }) => {
    try {
      const created = await api.addDreamEntry({ title, content, mood, tags });
      setEntries((prev) => {
        const next = [created, ...prev];
        dreamStorage.save(next);
        return next;
      });
      return created;
    } catch {
      // Offline fallback: create a local entry with a temporary id
      const localEntry = {
        id: Date.now(),
        title,
        content,
        mood,
        tags,
        day: 0,
        season: '',
        _local: true,
      };
      setEntries((prev) => {
        const next = [localEntry, ...prev];
        dreamStorage.save(next);
        return next;
      });
      return localEntry;
    }
  }, []);

  const updateEntry = useCallback(async (id, updates) => {
    try {
      const updated = await api.updateDreamEntry(id, updates);
      setEntries((prev) => {
        const next = prev.map((e) => (e.id === id ? updated : e));
        dreamStorage.save(next);
        return next;
      });
      return updated;
    } catch {
      // Offline fallback
      setEntries((prev) => {
        const next = prev.map((e) => (e.id === id ? { ...e, ...updates } : e));
        dreamStorage.save(next);
        return next;
      });
    }
  }, []);

  const deleteEntry = useCallback(async (id) => {
    try {
      await api.deleteDreamEntry(id);
    } catch {
      // Continue with local removal even if API fails
    }
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      dreamStorage.save(next);
      return next;
    });
  }, []);

  return { entries, loading, addEntry, updateEntry, deleteEntry, refresh: fetchEntries };
}
