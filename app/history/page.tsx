'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AccessGate } from '@/components/AccessGate';
import { AppHeader } from '@/components/AppHeader';
import {
  fetchHistory,
  fetchHistoryDetail,
  getStoredToken,
  type HistorySummary,
} from '@/lib/api-client';

export default function ShoppingHistory() {
  const [unlocked, setUnlocked] = useState(false);
  const [lists, setLists] = useState<HistorySummary[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailItems, setDetailItems] = useState<
    { name: string; added_by: string; category: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetchHistory(30);
      setLists(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (getStoredToken()) setUnlocked(true);
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    load();
  }, [unlocked, load]);

  const toggleDetail = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    const detail = await fetchHistoryDetail(id);
    setDetailItems(detail.items);
  };

  if (!unlocked) {
    return <AccessGate onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-safe">
      <AppHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tighter mb-8">
          Archivované zoznamy
        </h1>

        {loading ? (
          <p className="text-zinc-400">Načítavam…</p>
        ) : lists.length === 0 ? (
          <p className="text-zinc-400">
            Zatiaľ žiadna história.{' '}
            <Link href="/" className="text-white underline">
              Archivujte zoznam
            </Link>{' '}
            na hlavnej stránke.
          </p>
        ) : (
          <div className="space-y-4">
            {lists.map((list) => (
              <div
                key={list.id}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6"
              >
                <button
                  type="button"
                  onClick={() => toggleDetail(list.id)}
                  className="w-full text-left touch-manipulation"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="text-sm text-zinc-400">
                        {new Date(list.archived_at).toLocaleDateString('sk-SK', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-xl font-semibold mt-1">
                        {list.total_items} položiek
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">
                        {list.archived_by}
                        {list.ordered_from ? ` • ${list.ordered_from}` : ''}
                      </div>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-zinc-800 text-zinc-400 shrink-0">
                      {expandedId === list.id ? 'Skryť' : 'Detail'}
                    </span>
                  </div>
                </button>

                {expandedId === list.id && (
                  <div className="mt-4 pt-4 border-t border-zinc-800 grid gap-1 text-sm">
                    {detailItems.map((item, i) => (
                      <div
                        key={i}
                        className="flex justify-between py-1 border-b border-zinc-800/80 last:border-none"
                      >
                        <span>{item.name}</span>
                        <span className="text-zinc-500 text-xs">{item.added_by}</span>
                      </div>
                    ))}
                    {list.notes && (
                      <p className="text-zinc-500 text-xs mt-2 italic">{list.notes}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}