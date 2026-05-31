'use client';

import { useState, useEffect } from 'react';

interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  addedBy: 'Jakub' | 'Mirka';
  addedAt: string;
}

const CATEGORIES = [
  'Zelenina a ovocie', 
  'Mliečne výrobky', 
  'Mäso a údeniny', 
  'Pekárenské výrobky', 
  'Trvanlivé potraviny', 
  'Nápoje', 
  'Domácnosť', 
  'Ostatné'
];

export default function ShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Other');
  const [currentUser, setCurrentUser] = useState<'Jakub' | 'Mirka'>('Jakub');

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('currentShoppingList');
    if (saved) {
      setItems(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('currentShoppingList', JSON.stringify(items));
  }, [items]);

  const addItem = () => {
    if (!newItem.trim()) return;

    const item: ShoppingItem = {
      id: Date.now().toString(36),
      name: newItem.trim(),
      category: selectedCategory,
      addedBy: currentUser,
      addedAt: new Date().toISOString(),
    };

    setItems(prev => [...prev, item]);
    setNewItem('');
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const archiveList = () => {
    if (items.length === 0) return;

    const archived = {
      id: Date.now().toString(36),
      archivedAt: new Date().toISOString(),
      items: [...items],
      totalItems: items.length,
    };

    // Save to history
    const history = JSON.parse(localStorage.getItem('archivedLists') || '[]');
    history.unshift(archived);
    localStorage.setItem('archivedLists', JSON.stringify(history.slice(0, 50))); // keep last 50

    // Clear current list
    setItems([]);
    alert(`List archived with ${items.length} items. Ready for next shopping cycle.`);
  };

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
    const order = CATEGORIES.indexOf(a) - CATEGORIES.indexOf(b);
    return order === 0 ? a.localeCompare(b) : order;
  });

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

            <a href="/chat" className="px-4 py-1.5 text-sm rounded-xl border border-zinc-700 hover:bg-zinc-900 transition-colors">
              Chat s GrocerBotom
            </a>
            <a href="/history" className="px-4 py-1.5 text-sm rounded-xl border border-zinc-700 hover:bg-zinc-900 transition-colors">
              História
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Title + Stats */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-4xl font-semibold tracking-tighter">Aktuálny zoznam</h1>
            <p className="text-zinc-400 mt-1">
              {items.length} položiek • Ďalšia objednávka: Utorok alebo Štvrtok
            </p>
          </div>
          <button
            onClick={archiveList}
            disabled={items.length === 0}
            className="px-6 py-3 bg-white text-black rounded-2xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-200 transition-colors"
          >
            Archivovať a objednať zoznam
          </button>
        </div>

        {/* Add Item - Best UX */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-8">
          <div className="flex gap-3">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addItem();
              }}
              placeholder="Pridať položku (napr. 2× Grécky jogurt, Banány, Toaletný papier...)"
              className="flex-1 bg-zinc-950 border border-zinc-700 focus:border-white rounded-2xl px-5 py-4 text-lg placeholder:text-zinc-500 outline-none"
              autoFocus
            />
            <button
              onClick={addItem}
              className="px-8 bg-white text-black rounded-2xl font-semibold text-lg hover:bg-zinc-200 transition-colors"
            >
              Pridať
            </button>
          </div>

          {/* Category selector */}
          <div className="flex flex-wrap gap-2 mt-4">
            {CATEGORIES.map(cat => (
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
        {items.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <p className="text-lg">Váš zoznam je prázdny.</p>
            <p className="mt-1">Začnite pridávať položky vyššie — obaja môžete pridávať kedykoľvek.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedCategories.map(category => (
              <div key={category}>
                <div className="text-sm font-medium text-zinc-400 mb-3 px-1">{category}</div>
                <div className="space-y-2">
                  {groupedItems[category].map(item => (
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
                        onClick={() => removeItem(item.id)}
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
          Každý utorok a štvrtok → Archivujte tento zoznam a objednajte všetko.
        </div>
      </div>
    </div>
  );
}
