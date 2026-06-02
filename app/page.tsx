'use client';

import { useCallback, useEffect, useState } from 'react';
import { AccessGate } from '@/components/AccessGate';
import { AppHeader } from '@/components/AppHeader';
import {
  addItems,
  archiveList,
  deleteItem,
  fetchCurrentList,
  getCurrentUser,
  getStoredToken,
  type ListItem,
} from '@/lib/api-client';
import { CATEGORIES, DEFAULT_CATEGORY, sortCategories } from '@/lib/categories';

type OrderSource = 'Lunys' | 'Tesco' | 'Both';

export default function ShoppingList() {
  const [unlocked, setUnlocked] = useState(false);
  const [items, setItems] = useState<ListItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_CATEGORY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showArchive, setShowArchive] = useState(false);
  const [orderFrom, setOrderFrom] = useState<OrderSource>('Lunys');
  const [archiveNotes, setArchiveNotes] = useState('');
  const [archiving, setArchiving] = useState(false);

  const loadList = useCallback(async () => {
    try {
      const data = await fetchCurrentList();
      setItems(data.items);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chyba načítania');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (getStoredToken()) setUnlocked(true);
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    loadList();
    const interval = setInterval(loadList, 4000);
    return () => clearInterval(interval);
  }, [unlocked, loadList]);

  const addItem = async () => {
    if (!newItem.trim()) return;
    setError('');
    try {
      await addItems(
        [{ name: newItem.trim(), category: selectedCategory }],
        getCurrentUser()
      );
      setNewItem('');
      await loadList();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nepodarilo sa pridať');
    }
  };

  const removeItem = async (id: string) => {
    try {
      await deleteItem(id);
      await loadList();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nepodarilo sa odstrániť');
    }
  };

  const doArchive = async () => {
    setArchiving(true);
    try {
      await archiveList({
        ordered_from: orderFrom,
        notes: archiveNotes || undefined,
        archived_by: getCurrentUser(),
      });
      setShowArchive(false);
      setArchiveNotes('');
      await loadList();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Archivácia zlyhala');
    } finally {
      setArchiving(false);
    }
  };

  if (!unlocked) {
    return <AccessGate onUnlock={() => setUnlocked(true)} />;
  }

  const grouped = items.reduce(
    (acc, item) => {
      const cat = item.category || DEFAULT_CATEGORY;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {} as Record<string, ListItem[]>
  );

  const sortedCategories = sortCategories(Object.keys(grouped));

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-safe">
      <AppHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tighter">
              Aktuálny zoznam
            </h1>
            <p className="text-zinc-400 mt-1 text-sm sm:text-base">
              {items.length} položiek • synchronizácia každé 4 s • Utorok / Štvrtok
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowArchive(true)}
            disabled={items.length === 0}
            className="w-full sm:w-auto px-6 py-3.5 bg-white text-black rounded-2xl font-semibold disabled:opacity-40 touch-manipulation"
          >
            Archivovať a objednať
          </button>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-2xl px-4 py-3">
            {error}
          </div>
        )}

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
              placeholder="Pridať položku…"
              className="flex-1 bg-zinc-950 border border-zinc-700 focus:border-white rounded-2xl px-4 py-3.5 text-base placeholder:text-zinc-500 outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={addItem}
              className="px-8 py-3.5 bg-white text-black rounded-2xl font-semibold text-lg touch-manipulation"
            >
              Pridať
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs sm:text-sm rounded-2xl border touch-manipulation ${
                  selectedCategory === cat
                    ? 'bg-white text-black border-white'
                    : 'border-zinc-700 hover:bg-zinc-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading && items.length === 0 ? (
          <p className="text-center text-zinc-500 py-12">Načítavam zoznam…</p>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <p className="text-lg">Váš zoznam je prázdny.</p>
            <p className="mt-1 text-sm">Jakub aj Mirka môžu pridávať — zmeny sa zobrazia obom.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedCategories.map((category) => (
              <div key={category}>
                <div className="text-sm font-medium text-zinc-400 mb-3 px-1">{category}</div>
                <div className="space-y-2">
                  {grouped[category].map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-base sm:text-lg truncate">
                          {item.name}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 shrink-0">
                          {item.added_by}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-zinc-500 hover:text-red-400 text-2xl leading-none px-2 touch-manipulation"
                        aria-label="Odstrániť"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showArchive && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-3xl p-6">
            <h2 className="text-xl font-semibold mb-4">Archivovať zoznam</h2>
            <p className="text-sm text-zinc-400 mb-4">
              {items.length} položiek pôjde do histórie. Nový prázdny zoznam sa vytvorí automaticky.
            </p>
            <div className="flex gap-2 mb-4">
              {(['Lunys', 'Tesco', 'Both'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setOrderFrom(s)}
                  className={`flex-1 py-2 rounded-xl border text-sm touch-manipulation ${
                    orderFrom === s ? 'bg-white text-black border-white' : 'border-zinc-700'
                  }`}
                >
                  {s === 'Both' ? 'Oboje' : s}
                </button>
              ))}
            </div>
            <input
              value={archiveNotes}
              onChange={(e) => setArchiveNotes(e.target.value)}
              placeholder="Poznámka (voliteľné)"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 mb-4 outline-none"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowArchive(false)}
                className="flex-1 py-3 border border-zinc-700 rounded-2xl touch-manipulation"
              >
                Zrušiť
              </button>
              <button
                type="button"
                onClick={doArchive}
                disabled={archiving}
                className="flex-1 py-3 bg-white text-black rounded-2xl font-semibold touch-manipulation"
              >
                {archiving ? 'Archivujem…' : 'Potvrdiť'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}