'use client';

import Link from 'next/link';
import { useState } from 'react';

type ProposalItem = {
  id: number;
  name: string;
  quantity: number;
  store: 'lunys' | 'tesco';
  estimatedPrice: number;
};

export default function ProposalReview() {
  const [items, setItems] = useState<ProposalItem[]>([
    { id: 1, name: "Mlieko 1l", quantity: 6, store: "tesco", estimatedPrice: 1.19 },
    { id: 2, name: "Banány", quantity: 2, store: "lunys", estimatedPrice: 2.49 },
    { id: 3, name: "Vajcia M 10ks", quantity: 2, store: "tesco", estimatedPrice: 2.89 },
    { id: 4, name: "Avokádo", quantity: 4, store: "lunys", estimatedPrice: 1.29 },
    { id: 5, name: "Toaletný papier 8ks", quantity: 1, store: "tesco", estimatedPrice: 4.99 },
    { id: 6, name: "Grécky jogurt 150g", quantity: 8, store: "lunys", estimatedPrice: 0.99 },
    { id: 7, name: "Káva zrnková 500g", quantity: 1, store: "tesco", estimatedPrice: 6.49 },
  ]);

  const [notes, setNotes] = useState("");

  const lunysItems = items.filter(i => i.store === 'lunys');
  const tescoItems = items.filter(i => i.store === 'tesco');

  const lunysTotal = lunysItems.reduce((sum, i) => sum + i.estimatedPrice * i.quantity, 0);
  const tescoTotal = tescoItems.reduce((sum, i) => sum + i.estimatedPrice * i.quantity, 0);

  const moveItem = (id: number, newStore: 'lunys' | 'tesco') => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, store: newStore } : item
    ));
  };

  const updateQuantity = (id: number, newQty: number) => {
    if (newQty < 1) return;
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, quantity: newQty } : item
    ));
  };

  const removeItem = (id: number) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleApprove = () => {
    alert(`Proposal approved!\n\nLunys: €${lunysTotal.toFixed(2)}\nTesco: €${tescoTotal.toFixed(2)}\n\n(In real version this would notify the agent to proceed or create orders.)`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/" className="text-sm text-zinc-400 hover:text-white">← Back</Link>
            <h1 className="text-4xl font-semibold tracking-tighter mt-2">Agent Proposal</h1>
            <p className="text-zinc-400 mt-1">Sunday 25. 5. 2026 • Weekly shop</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-zinc-400">Estimated total</div>
            <div className="text-4xl font-semibold tracking-tighter">€{(lunysTotal + tescoTotal).toFixed(2)}</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Lunys */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold text-lg">Lunys</div>
              <div className="font-mono text-xl">€{lunysTotal.toFixed(2)}</div>
            </div>
            <div className="space-y-3">
              {lunysItems.length === 0 && <div className="text-zinc-500 text-sm py-4">No items assigned to Lunys</div>}
              {lunysItems.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-zinc-950 rounded-2xl px-4 py-3 text-sm">
                  <div className="flex-1">{item.name}</div>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                      className="w-14 bg-zinc-900 text-center rounded-lg py-1"
                    />
                    <button onClick={() => moveItem(item.id, 'tesco')} className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">→ Tesco</button>
                    <button onClick={() => removeItem(item.id)} className="text-zinc-500 hover:text-red-400">×</button>
                    <div className="w-16 text-right font-mono">€{(item.estimatedPrice * item.quantity).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tesco */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold text-lg">Tesco</div>
              <div className="font-mono text-xl">€{tescoTotal.toFixed(2)}</div>
            </div>
            <div className="space-y-3">
              {tescoItems.length === 0 && <div className="text-zinc-500 text-sm py-4">No items assigned to Tesco</div>}
              {tescoItems.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-zinc-950 rounded-2xl px-4 py-3 text-sm">
                  <div className="flex-1">{item.name}</div>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                      className="w-14 bg-zinc-900 text-center rounded-lg py-1"
                    />
                    <button onClick={() => moveItem(item.id, 'lunys')} className="text-xs px-2 py-1 rounded bg-orange-500/10 text-orange-400 hover:bg-orange-500/20">→ Lunys</button>
                    <button onClick={() => removeItem(item.id)} className="text-zinc-500 hover:text-red-400">×</button>
                    <div className="w-16 text-right font-mono">€{(item.estimatedPrice * item.quantity).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notes + Actions */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <div className="mb-3 text-sm font-medium text-zinc-400">Notes for the agent (optional)</div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="E.g. We need more snacks this week, try to find good strawberries..."
            className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm resize-y"
          />

          <div className="flex gap-4 mt-6">
            <button 
              onClick={handleApprove}
              className="flex-1 bg-white hover:bg-zinc-200 transition-colors text-black font-semibold py-4 rounded-2xl"
            >
              Approve &amp; Let Agent Place Orders
            </button>
            <button className="flex-1 border border-zinc-700 hover:bg-zinc-900 transition-colors py-4 rounded-2xl">
              Ask Agent to Revise
            </button>
          </div>
          <p className="text-center text-xs text-zinc-500 mt-4">
            After approval, the agent will prepare the orders. You will receive confirmation emails from Lunys and Tesco.
          </p>
        </div>
      </div>
    </div>
  );
}
