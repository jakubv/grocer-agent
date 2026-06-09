'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccessGate } from '@/components/AccessGate';
import { AppHeader } from '@/components/AppHeader';
import {
  addItems,
  archiveList,
  deleteItem,
  fetchCurrentList,
  getCurrentUser,
  getStoredToken,
  updateItem,
  type ListItem,
} from '@/lib/api-client';
import { DEFAULT_CATEGORY } from '@/lib/categories';

type ListFilter = 'active' | 'checked' | 'all';

function splitInput(value: string): string[] {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatTime(value: string) {
  try {
    return new Intl.DateTimeFormat('sk-SK', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return '';
  }
}

export default function ShoppingList() {
  const [unlocked, setUnlocked] = useState(() => Boolean(getStoredToken()));
  const [items, setItems] = useState<ListItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<ListFilter>('active');
  const [confirmArchive, setConfirmArchive] = useState(false);

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
    if (!unlocked) return;
    const timeout = setTimeout(() => {
      void loadList();
    }, 0);
    const interval = setInterval(loadList, 3500);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [unlocked, loadList]);

  const activeItems = useMemo(() => items.filter((item) => !item.is_checked), [items]);
  const checkedItems = useMemo(() => items.filter((item) => item.is_checked), [items]);
  const visibleItems = useMemo(() => {
    if (filter === 'checked') return checkedItems;
    if (filter === 'all') return items;
    return activeItems;
  }, [activeItems, checkedItems, filter, items]);

  const addNewItems = async () => {
    const names = splitInput(newItem);
    if (names.length === 0 || saving) return;

    setSaving(true);
    setError('');
    try {
      await addItems(
        names.map((name) => ({ name, category: DEFAULT_CATEGORY })),
        getCurrentUser()
      );
      setNewItem('');
      setFilter('active');
      await loadList();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nepodarilo sa pridať');
    } finally {
      setSaving(false);
    }
  };

  const toggleItem = async (item: ListItem) => {
    setItems((current) =>
      current.map((existing) =>
        existing.id === item.id ? { ...existing, is_checked: !existing.is_checked } : existing
      )
    );
    try {
      await updateItem(item.id, { is_checked: !item.is_checked });
      await loadList();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nepodarilo sa uložiť zmenu');
      await loadList();
    }
  };

  const removeItem = async (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
    try {
      await deleteItem(id);
      await loadList();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nepodarilo sa odstrániť');
      await loadList();
    }
  };

  const clearChecked = async () => {
    if (checkedItems.length === 0 || saving) return;
    setSaving(true);
    setError('');
    try {
      for (const item of checkedItems) {
        await deleteItem(item.id);
      }
      await loadList();
      setFilter('active');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nepodarilo sa vyčistiť kúpené položky');
    } finally {
      setSaving(false);
    }
  };

  const finishShopping = async () => {
    if (items.length === 0 || saving) return;
    setSaving(true);
    setError('');
    try {
      await archiveList({
        ordered_from: undefined,
        notes: 'Ukončené zo základného zoznamu na nakup.voskar.sk',
        archived_by: getCurrentUser(),
      });
      setConfirmArchive(false);
      setFilter('active');
      await loadList();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nepodarilo sa ukončiť nákup');
    } finally {
      setSaving(false);
    }
  };

  if (!unlocked) {
    return <AccessGate onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-safe">
      <AppHeader />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <section className="mb-5 sm:mb-7">
          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900/70 p-4 sm:p-5 shadow-2xl shadow-black/20">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tighter">
                  Nákupný zoznam
                </h1>
                <p className="text-zinc-400 text-sm mt-1">
                  {activeItems.length} treba kúpiť • {checkedItems.length} kúpené • sync každých pár sekúnd
                </p>
              </div>
              <div className="rounded-2xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-right shrink-0">
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">Pridáva</div>
                <div className="font-semibold">{getCurrentUser()}</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <textarea
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void addNewItems();
                  }
                }}
                placeholder="Napíš položku… napr. mlieko\nViac položiek môžeš oddeliť enterom alebo čiarkou."
                className="min-h-24 sm:min-h-14 flex-1 bg-zinc-950 border border-zinc-700 focus:border-emerald-300 rounded-2xl px-4 py-3.5 text-base placeholder:text-zinc-500 outline-none resize-none"
                autoFocus
              />
              <button
                type="button"
                onClick={addNewItems}
                disabled={!newItem.trim() || saving}
                className="sm:w-36 px-6 py-3.5 bg-gradient-to-r from-cyan-300 via-emerald-300 to-yellow-300 text-black rounded-2xl font-black text-lg disabled:opacity-40 touch-manipulation"
              >
                {saving ? 'Ukladám…' : 'Pridať'}
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-4 text-sm text-red-200 bg-red-950/50 border border-red-900 rounded-2xl px-4 py-3">
            {error}
          </div>
        )}

        <section className="flex flex-wrap gap-2 mb-4">
          {([
            ['active', `Treba kúpiť (${activeItems.length})`],
            ['checked', `Kúpené (${checkedItems.length})`],
            ['all', `Všetko (${items.length})`],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`px-4 py-2 rounded-2xl border text-sm font-semibold touch-manipulation ${
                filter === value
                  ? 'bg-white text-black border-white'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-300'
              }`}
            >
              {label}
            </button>
          ))}
        </section>

        {loading && items.length === 0 ? (
          <p className="text-center text-zinc-500 py-14">Načítavam zoznam…</p>
        ) : visibleItems.length === 0 ? (
          <div className="text-center py-14 border border-dashed border-zinc-800 rounded-[2rem] text-zinc-500">
            <p className="text-lg text-zinc-300">
              {items.length === 0 ? 'Zoznam je prázdny.' : 'V tejto časti nič nie je.'}
            </p>
            <p className="mt-1 text-sm">Pridaj prvú položku hore. Jakub aj Mirka ju uvidia hneď.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 rounded-2xl border px-3.5 py-3 sm:px-4 sm:py-3.5 transition-colors ${
                  item.is_checked
                    ? 'bg-zinc-900/50 border-zinc-900 text-zinc-500'
                    : 'bg-zinc-900 border-zinc-800 text-white'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item)}
                  className={`w-8 h-8 shrink-0 rounded-xl border flex items-center justify-center text-lg font-black touch-manipulation ${
                    item.is_checked
                      ? 'bg-emerald-300 border-emerald-300 text-black'
                      : 'border-zinc-600 hover:border-emerald-300'
                  }`}
                  aria-label={item.is_checked ? 'Označiť ako nekúpené' : 'Označiť ako kúpené'}
                >
                  {item.is_checked ? '✓' : ''}
                </button>

                <button
                  type="button"
                  onClick={() => toggleItem(item)}
                  className="flex-1 min-w-0 text-left touch-manipulation"
                >
                  <div className={`text-lg font-semibold truncate ${item.is_checked ? 'line-through' : ''}`}>
                    {item.name}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {item.added_by} • {formatTime(item.added_at)}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="w-9 h-9 rounded-xl text-zinc-500 hover:text-red-300 hover:bg-red-950/40 text-2xl leading-none touch-manipulation"
                  aria-label="Odstrániť"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={clearChecked}
            disabled={checkedItems.length === 0 || saving}
            className="px-5 py-3 rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-200 font-semibold disabled:opacity-40 touch-manipulation"
          >
            Vymazať kúpené
          </button>
          <button
            type="button"
            onClick={() => setConfirmArchive(true)}
            disabled={items.length === 0 || saving}
            className="px-5 py-3 rounded-2xl border border-zinc-800 text-zinc-400 font-semibold disabled:opacity-40 touch-manipulation"
          >
            Ukončiť celý nákup
          </button>
        </section>
      </main>

      {confirmArchive && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-3xl p-6">
            <h2 className="text-xl font-semibold mb-2">Ukončiť celý nákup?</h2>
            <p className="text-sm text-zinc-400 mb-5">
              Všetkých {items.length} položiek sa presunie do histórie a začne sa nový prázdny zoznam.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmArchive(false)}
                className="flex-1 py-3 rounded-2xl border border-zinc-700 touch-manipulation"
              >
                Späť
              </button>
              <button
                type="button"
                onClick={finishShopping}
                disabled={saving}
                className="flex-1 py-3 rounded-2xl bg-white text-black font-semibold disabled:opacity-40 touch-manipulation"
              >
                Ukončiť
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
