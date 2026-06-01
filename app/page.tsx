'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface ShoppingItem {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  category: string;
  addedBy: 'Jakub' | 'Mirka' | 'agent' | string;
  addedAt: string;
  notes: string | null;
  isChecked: boolean;
}

interface CurrentListResponse {
  id: string;
  householdId: string;
  status: string;
  updatedAt: string;
  items: ShoppingItem[];
}

const CATEGORIES = [
  'Zelenina a ovocie',
  'Mliečne výrobky',
  'Mäso a údeniny',
  'Pekárenské výrobky',
  'Trvanlivé potraviny',
  'Nápoje',
  'Domácnosť',
  'Ostatné',
];

const categoryRank = (category: string) => {
  const index = CATEGORIES.indexOf(category);
  return index === -1 ? CATEGORIES.length : index;
};

export default function ShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Ostatné');
  const [currentUser, setCurrentUser] = useState<'Jakub' | 'Mirka'>('Jakub');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const loadCurrentList = useCallback(async () => {
    setError(null);

    try {
      const response = await fetch('/api/v1/list/current', { cache: 'no-store' });

      if (!response.ok) {
        throw new Error(`Nepodarilo sa načítať zoznam (${response.status})`);
      }

      const data = (await response.json()) as CurrentListResponse;
      setItems(data.items ?? []);
      setLastSyncedAt(new Date().toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodarilo sa načítať zoznam');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial data fetch is the intended external synchronization for this page.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCurrentList();
  }, [loadCurrentList]);

  const addItem = async () => {
    if (!newItem.trim() || isSaving) return;

    const itemName = newItem.trim();
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/list/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            {
              name: itemName,
              category: selectedCategory,
              addedBy: currentUser,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Nepodarilo sa pridať položku (${response.status})`);
      }

      setNewItem('');
      await loadCurrentList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodarilo sa pridať položku');
    } finally {
      setIsSaving(false);
    }
  };

  const removeItem = async (id: string) => {
    const previousItems = items;
    setItems((prev) => prev.filter((item) => item.id !== id));
    setError(null);

    try {
      const response = await fetch(`/api/v1/list/items/${id}`, { method: 'DELETE' });

      if (!response.ok) {
        throw new Error(`Nepodarilo sa odstrániť položku (${response.status})`);
      }

      setLastSyncedAt(new Date().toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      setItems(previousItems);
      setError(err instanceof Error ? err.message : 'Nepodarilo sa odstrániť položku');
    }
  };

  const archiveList = async () => {
    if (items.length === 0 || isSaving) return;

    const confirmed = window.confirm(
      `Archivovať aktuálny zoznam s ${items.length} položkami a začať nový prázdny zoznam?`,
    );

    if (!confirmed) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/list/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedFrom: null, notes: `Archived from web UI by ${currentUser}` }),
      });

      if (!response.ok) {
        throw new Error(`Nepodarilo sa archivovať zoznam (${response.status})`);
      }

      await loadCurrentList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodarilo sa archivovať zoznam');
    } finally {
      setIsSaving(false);
    }
  };

  const groupedItems = useMemo(
    () =>
      items.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
      }, {} as Record<string, ShoppingItem[]>),
    [items],
  );

  const sortedCategories = useMemo(
    () =>
      Object.keys(groupedItems).sort((a, b) => {
        const order = categoryRank(a) - categoryRank(b);
        return order === 0 ? a.localeCompare(b, 'sk') : order;
      }),
    [groupedItems],
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
              <span className="text-zinc-950 font-bold text-xl tracking-tighter">GA</span>
            </div>
            <div>
              <div className="font-semibold text-xl tracking-tight">GrocerAgent</div>
              <div className="text-[10px] text-zinc-500 -mt-1">Prievidza • Jakub &amp; Mirka</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-zinc-900 border border-zinc-700 rounded-xl p-0.5 text-sm">
              <button
                onClick={() => setCurrentUser('Jakub')}
                className={`px-3 py-1 rounded-[10px] transition-colors ${currentUser === 'Jakub' ? 'bg-white text-black' : 'hover:bg-zinc-800'}`}
              >
                Jakub
              </button>
              <button
                onClick={() => setCurrentUser('Mirka')}
                className={`px-3 py-1 rounded-[10px] transition-colors ${currentUser === 'Mirka' ? 'bg-white text-black' : 'hover:bg-zinc-800'}`}
              >
                Mirka
              </button>
            </div>

            <Link href="/chat" className="px-4 py-1.5 text-sm rounded-xl border border-zinc-700 hover:bg-zinc-900 transition-colors">
              Chat s GrocerBotom
            </Link>
            <Link href="/history" className="px-4 py-1.5 text-sm rounded-xl border border-zinc-700 hover:bg-zinc-900 transition-colors">
              História
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Title + Stats */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-4xl font-semibold tracking-tighter">Aktuálny zoznam</h1>
            <p className="text-zinc-400 mt-1">
              {items.length} položiek • Zdieľaný online zoznam {lastSyncedAt ? `• synchronizované ${lastSyncedAt}` : ''}
            </p>
          </div>
          <button
            onClick={archiveList}
            disabled={items.length === 0 || isSaving}
            className="px-6 py-3 bg-white text-black rounded-2xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-200 transition-colors"
          >
            Archivovať a objednať zoznam
          </button>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-900/60 bg-red-950/40 px-5 py-4 text-sm text-red-200">
            {error}{' '}
            <button onClick={loadCurrentList} className="underline underline-offset-4 hover:text-red-100">
              Skúsiť znova
            </button>
          </div>
        ) : null}

        {/* Add Item - Best UX */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-8">
          <div className="flex gap-3">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void addItem();
              }}
              placeholder="Pridať položku (napr. 2× Grécky jogurt, Banány, Toaletný papier...)"
              className="flex-1 bg-zinc-950 border border-zinc-700 focus:border-white rounded-2xl px-5 py-4 text-lg placeholder:text-zinc-500 outline-none"
              autoFocus
            />
            <button
              onClick={() => void addItem()}
              disabled={isSaving || !newItem.trim()}
              className="px-8 bg-white text-black rounded-2xl font-semibold text-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Ukladám…' : 'Pridať'}
            </button>
          </div>

          {/* Category selector */}
          <div className="flex flex-wrap gap-2 mt-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 text-sm rounded-2xl border transition-colors ${
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

        {/* Shopping List */}
        {isLoading ? (
          <div className="text-center py-16 text-zinc-500">
            <p className="text-lg">Načítavam zdieľaný zoznam…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <p className="text-lg">Váš zoznam je prázdny.</p>
            <p className="mt-1">Začnite pridávať položky vyššie — obaja môžete pridávať kedykoľvek.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedCategories.map((category) => (
              <div key={category}>
                <div className="text-sm font-medium text-zinc-400 mb-3 px-1">{category}</div>
                <div className="space-y-2">
                  {groupedItems[category].map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-lg">{item.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                          {item.addedBy}
                        </span>
                      </div>
                      <button
                        onClick={() => void removeItem(item.id)}
                        aria-label={`Odstrániť ${item.name}`}
                        className="text-zinc-500 hover:text-red-400 opacity-60 group-hover:opacity-100 transition-all text-xl leading-none"
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

        <div className="mt-12 text-center text-xs text-zinc-500">
          Zoznam je uložený v databáze, nie v prehliadači — Jakub aj Mirka vidia rovnaké položky.
        </div>
      </div>
    </div>
  );
}
