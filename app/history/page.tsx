'use client';

import { useState, useEffect } from 'react';

interface ArchivedList {
  id: string;
  archivedAt: string;
  items: { name: string; category?: string; addedBy?: string }[];
  totalItems: number;
}

export default function ShoppingHistory() {
  const [archivedLists, setArchivedLists] = useState<ArchivedList[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('archivedLists');
    if (saved) {
      setArchivedLists(JSON.parse(saved));
    }
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <a href="/" className="text-sm text-zinc-400 hover:text-white">← Späť na zoznam</a>
        <h1 className="text-4xl font-semibold tracking-tighter mt-4 mb-8">Archivované zoznamy</h1>

        {archivedLists.length === 0 ? (
          <p className="text-zinc-400">Zatiaľ nemáte žiadne archivované zoznamy. Archivujte svoj prvý zoznam na hlavnej stránke.</p>
        ) : (
          <div className="space-y-6">
            {archivedLists.map((list) => (
              <div key={list.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-sm text-zinc-400">
                      {new Date(list.archivedAt).toLocaleDateString('sk-SK', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long' 
                      })}
                    </div>
                    <div className="text-xl font-semibold">{list.totalItems} items</div>
                  </div>
                  <div className="text-xs px-3 py-1 rounded-full bg-zinc-800 text-zinc-400">
                    Archived
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                  {list.items.slice(0, 12).map((item, index) => (
                    <div key={index} className="flex justify-between py-1 border-b border-zinc-800 last:border-none">
                      <span>{item.name}</span>
                      {item.addedBy && <span className="text-zinc-500 text-xs">{item.addedBy}</span>}
                    </div>
                  ))}
                  {list.items.length > 12 && (
                    <div className="text-zinc-500 text-xs pt-2">+{list.items.length - 12} more items...</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
