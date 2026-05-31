'use client';

import { useState } from 'react';

interface RecurringItem {
  id: number;
  name: string;
  preferredStore: 'lunys' | 'tesco' | 'either';
  quantity: number;
  frequency: string;
}

export default function RecurringItems() {
  const [items, setItems] = useState<RecurringItem[]>([
    { id: 1, name: "Mlieko 1l", preferredStore: "tesco", quantity: 6, frequency: "weekly" },
    { id: 2, name: "Banány", preferredStore: "lunys", quantity: 2, frequency: "weekly" },
    { id: 3, name: "Vajcia M 10ks", preferredStore: "either", quantity: 2, frequency: "biweekly" },
    { id: 4, name: "Toaletný papier 8ks", preferredStore: "tesco", quantity: 1, frequency: "weekly" },
    { id: 5, name: "Avokádo", preferredStore: "lunys", quantity: 4, frequency: "weekly" },
  ]);

  const [newItem, setNewItem] = useState({ name: '', preferredStore: 'either' as const, quantity: 1 });

  const addItem = () => {
    if (!newItem.name) return;
    setItems([...items, {
      id: Date.now(),
      name: newItem.name,
      preferredStore: newItem.preferredStore,
      quantity: newItem.quantity,
      frequency: 'weekly'
    }]);
    setNewItem({ name: '', preferredStore: 'either', quantity: 1 });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <a href="/" className="text-sm text-zinc-400 hover:text-white">← Dashboard</a>
        
        <h1 className="text-4xl font-semibold tracking-tighter mt-4 mb-2">Recurring Items</h1>
        <p className="text-zinc-400 mb-8">These items are automatically considered every time the agent runs.</p>

        {/* Add new */}
        <div className="flex gap-3 mb-8">
          <input
            type="text"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            placeholder="Item name (e.g. Greek yogurt 150g)"
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-zinc-600"
          />
          <select 
            value={newItem.preferredStore}
            onChange={(e) => setNewItem({ ...newItem, preferredStore: e.target.value as any })}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 text-sm"
          >
            <option value="lunys">Lunys</option>
            <option value="tesco">Tesco</option>
            <option value="either">Either</option>
          </select>
          <button 
            onClick={addItem}
            className="px-8 rounded-2xl bg-white text-black font-medium"
          >
            Add
          </button>
        </div>

        {/* List */}
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="font-medium">{item.name}</div>
                <div className="text-xs px-2.5 py-px rounded bg-zinc-800 text-zinc-400">{item.quantity}×</div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className={`px-3 py-1 rounded-full text-xs ${
                  item.preferredStore === 'lunys' ? 'bg-orange-500/10 text-orange-400' :
                  item.preferredStore === 'tesco' ? 'bg-blue-500/10 text-blue-400' : 'bg-zinc-700'
                }`}>
                  {item.preferredStore}
                </div>
                <div className="text-zinc-500 text-xs">{item.frequency}</div>
                <button className="text-zinc-500 hover:text-red-400 text-xs">Remove</button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-xs text-zinc-500">
          The agent will try to respect your preferred store when possible while staying under spending limits.
        </div>
      </div>
    </div>
  );
}
