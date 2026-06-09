'use client';

import { useState } from 'react';
import { setStoredToken } from '@/lib/api-client';

export function AccessGate({
  children,
  onUnlock,
}: {
  children?: React.ReactNode;
  onUnlock: () => void;
}) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const unlock = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/v1/list/current', {
        headers: { Authorization: `Bearer ${pin.trim()}` },
      });
      if (!res.ok) {
        setError('Nesprávny prístupový kód. Skúste znova.');
        return;
      }
      setStoredToken(pin.trim());
      onUnlock();
    } catch {
      setError('Nepodarilo sa pripojiť. Skontrolujte internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
        <div className="w-12 h-12 rounded-2xl bg-white text-zinc-950 font-bold text-xl flex items-center justify-center mb-4">
          GA
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">GrocerAgent</h1>
        <p className="text-zinc-400 text-sm mt-2 mb-6">
          Zadajte domácnostný prístupový kód (zdieľaný s Mirkou). Uloží sa v telefóne.
        </p>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && unlock()}
          placeholder="Prístupový kód"
          className="w-full bg-zinc-950 border border-zinc-700 focus:border-white rounded-2xl px-4 py-3 outline-none mb-3"
          autoComplete="current-password"
        />
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <button
          type="button"
          onClick={unlock}
          disabled={!pin.trim() || loading}
          className="w-full py-3 bg-white text-black rounded-2xl font-semibold disabled:opacity-40 touch-manipulation"
        >
          {loading ? 'Pripájam…' : 'Otvoriť zoznam'}
        </button>
        {children}
      </div>
    </div>
  );
}