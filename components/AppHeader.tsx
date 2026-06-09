'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getCurrentUser, setCurrentUser } from '@/lib/api-client';
import type { HouseholdUserName } from '@/lib/household';
import { useState } from 'react';

export function AppHeader({
  badge = 'N',
  title = 'Nákupy Lux',
  subtitle = 'Rodinný nákupný zoznam',
}: {
  badge?: string;
  title?: string;
  subtitle?: string;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<HouseholdUserName>(() => {
    if (typeof window === 'undefined') return 'Jakub';
    return getCurrentUser();
  });

  const switchUser = (name: HouseholdUserName) => {
    setCurrentUser(name);
    setUser(name);
  };

  return (
    <div className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md sticky top-0 z-50 safe-top">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="min-h-14 py-2 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-cyan-300 via-emerald-300 to-yellow-300 flex items-center justify-center">
              <span className="text-zinc-950 font-black text-lg tracking-tighter">{badge}</span>
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-lg sm:text-xl tracking-tight truncate">{title}</div>
              <div className="text-[11px] text-zinc-500 -mt-0.5 truncate">{subtitle}</div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {pathname !== '/' && (
              <Link
                href="/"
                className="hidden sm:inline-flex px-3 py-1.5 text-sm rounded-xl border border-zinc-700 hover:bg-zinc-900 touch-manipulation"
              >
                Zoznam
              </Link>
            )}
            <Link
              href="/history"
              className="hidden sm:inline-flex px-3 py-1.5 text-sm rounded-xl border border-zinc-700 hover:bg-zinc-900 touch-manipulation"
            >
              História
            </Link>
            <div className="flex bg-zinc-900 border border-zinc-700 rounded-xl p-0.5 text-sm">
              {(['Jakub', 'Mirka'] as const).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => switchUser(name)}
                  className={`px-3 py-1.5 rounded-[10px] transition-colors touch-manipulation ${
                    user === name ? 'bg-white text-black' : 'hover:bg-zinc-800'
                  }`}
                  aria-pressed={user === name}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
