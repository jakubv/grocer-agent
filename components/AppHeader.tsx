'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getCurrentUser, setCurrentUser } from '@/lib/api-client';
import type { HouseholdUserName } from '@/lib/household';
import { useState } from 'react';

const NAV = [
  { href: '/', label: 'Zoznam' },
  { href: '/chat', label: 'GrocerBot' },
  { href: '/history', label: 'História' },
] as const;

export function AppHeader({
  badge = 'GA',
  title = 'GrocerAgent',
  subtitle = 'Prievidza • Jakub & Mirka',
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="min-h-14 py-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-white flex items-center justify-center">
              <span className="text-zinc-950 font-bold text-lg tracking-tighter">{badge}</span>
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-lg sm:text-xl tracking-tight truncate">{title}</div>
              <div className="text-[10px] text-zinc-500 -mt-0.5 truncate">{subtitle}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex bg-zinc-900 border border-zinc-700 rounded-xl p-0.5 text-sm">
              {(['Jakub', 'Mirka'] as const).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => switchUser(name)}
                  className={`px-3 py-1.5 rounded-[10px] transition-colors touch-manipulation ${
                    user === name ? 'bg-white text-black' : 'hover:bg-zinc-800'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>

            <nav className="flex gap-1.5 overflow-x-auto">
              {NAV.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 text-sm whitespace-nowrap rounded-xl border transition-colors touch-manipulation ${
                    pathname === href
                      ? 'bg-white text-black border-white'
                      : 'border-zinc-700 hover:bg-zinc-900'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}