'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AccessGate } from '@/components/AccessGate';
import { AppHeader } from '@/components/AppHeader';
import {
  approveTescoProposal,
  fetchTescoProposal,
  fetchTescoSession,
  prepareTescoProposal,
  updateTescoLine,
  type TescoProposal,
} from '@/lib/api-client';
import { getStoredToken } from '@/lib/api-client';
import { getCurrentUser } from '@/lib/api-client';
import { tescoSearchUrl } from '@/lib/tesco/constants';

export default function TescoReviewPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [proposal, setProposal] = useState<TescoProposal | null>(null);
  const [sessionOk, setSessionOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [p, s] = await Promise.all([fetchTescoProposal(), fetchTescoSession()]);
      setProposal(p.proposal);
      setSessionOk(s.connected);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chyba');
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

  const prepare = async () => {
    setBusy('prepare');
    setError('');
    try {
      const res = await prepareTescoProposal();
      setProposal(res.proposal);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Príprava zlyhala');
    } finally {
      setBusy('');
    }
  };

  const approve = async () => {
    setBusy('approve');
    setError('');
    try {
      const res = await approveTescoProposal(getCurrentUser());
      setProposal(res.proposal);
      if (res.mode === 'manual' && res.search_urls?.length) {
        for (const link of res.search_urls) {
          window.open(link.url, '_blank', 'noopener,noreferrer');
        }
        if (res.cart_url) {
          window.open(res.cart_url, '_blank', 'noopener,noreferrer');
        }
      } else if (res.cart_url) {
        window.open(res.cart_url, '_blank', 'noopener,noreferrer');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Schválenie zlyhala');
    } finally {
      setBusy('');
    }
  };

  const skipLine = async (lineId: string) => {
    await updateTescoLine(lineId, { status: 'skipped' });
    await load();
  };

  if (!unlocked) {
    return <AccessGate onUnlock={() => setUnlocked(true)} />;
  }

  const activeLines = proposal?.lines.filter((l) => l.status !== 'skipped') ?? [];
  const est = proposal?.estimated_total;

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-safe">
      <AppHeader badge="TE" title="Tesco objednávka" subtitle="Návrh košíka → schválenie" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <Link href="/" className="text-sm text-zinc-400 hover:text-white">
          ← Späť na zoznam
        </Link>

        {sessionOk === false && (
          <div className="bg-amber-950/50 border border-amber-800 rounded-2xl px-4 py-3 text-sm text-amber-200">
            Tesco nie je prihlásené. Na Macu raz spustite:{' '}
            <code className="text-amber-100">npm run tesco:login</code> (uloží sa do tej istej
            databázy).
          </div>
        )}

        {sessionOk && (
          <div className="text-sm text-emerald-400">✓ Tesco session pripravená</div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={prepare}
            disabled={!!busy}
            className="px-5 py-3 bg-white text-black rounded-2xl font-semibold disabled:opacity-40 touch-manipulation"
          >
            {busy === 'prepare' ? 'Pripravujem…' : '1. Preložiť zoznam do Tesco'}
          </button>
          {proposal && proposal.status !== 'cart_ready' && (
            <button
              type="button"
              onClick={approve}
              disabled={!!busy || activeLines.length === 0}
              className="px-5 py-3 bg-emerald-500 text-black rounded-2xl font-semibold disabled:opacity-40 touch-manipulation"
            >
              {busy === 'approve' ? 'Otváram Tesco…' : '2. Schváliť a otvoriť Tesco'}
            </button>
          )}
        </div>

        {error && (
          <div className="text-red-400 text-sm bg-red-950/40 border border-red-900 rounded-2xl px-4 py-3">
            {error}
          </div>
        )}

        {loading && <p className="text-zinc-500">Načítavam…</p>}

        {!loading && !proposal && (
          <p className="text-zinc-400">
            Zatiaľ žiadny návrh. Pridajte položky na zoznam a kliknite „Preložiť zoznam do Tesco“.
          </p>
        )}

        {proposal && (
          <>
            <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
              <span>
                Stav: <strong className="text-white">{proposal.status}</strong>
              </span>
              {est != null && (
                <span>
                  Odhad: <strong className="text-white">€{est.toFixed(2)}</strong>
                </span>
              )}
            </div>

            {proposal.status === 'cart_ready' && proposal.cart_url && (
              <a
                href={proposal.cart_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-white text-black rounded-2xl font-semibold"
              >
                Otvoriť košík Tesco a zaplatiť →
              </a>
            )}

            {proposal.error_message && (
              <p className="text-amber-400 text-sm">{proposal.error_message}</p>
            )}

            <div className="space-y-3">
              {proposal.lines.map((line) => (
                <div
                  key={line.id}
                  className={`rounded-2xl border px-4 py-4 ${
                    line.status === 'skipped'
                      ? 'border-zinc-800 opacity-50'
                      : line.status === 'failed'
                        ? 'border-red-900'
                        : 'border-zinc-700'
                  }`}
                >
                  <div className="flex justify-between gap-3 flex-wrap">
                    <div>
                      <div className="font-medium text-lg">{line.raw_name}</div>
                      <div className="text-sm text-zinc-400 mt-1">
                        Tesco: {line.tesco_product_name || line.search_query}
                        {line.quantity > 1 ? ` · ${line.quantity} ks` : ''}
                      </div>
                      {line.confidence != null && line.confidence < 0.6 && (
                        <div className="text-xs text-amber-400 mt-1">
                          Nízka istota — skontrolujte vyhľadávanie
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 items-start">
                      <a
                        href={tescoSearchUrl(line.search_query)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-3 py-1.5 border border-zinc-600 rounded-lg hover:bg-zinc-800"
                      >
                        Hľadať
                      </a>
                      {line.status !== 'skipped' && proposal.status !== 'cart_ready' && (
                        <button
                          type="button"
                          onClick={() => skipLine(line.id)}
                          className="text-xs px-3 py-1.5 border border-zinc-600 rounded-lg hover:bg-zinc-800"
                        >
                          Preskočiť
                        </button>
                      )}
                    </div>
                  </div>
                  {line.fail_reason && (
                    <p className="text-red-400 text-xs mt-2">{line.fail_reason}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        <p className="text-xs text-zinc-500 leading-relaxed">
          Po schválení sa otvoria vyhľadávania v Tesco — v každom pridajte prvý vhodný produkt do
          košíka, potom zaplaťte na Tesco. (Automatické plnenie na serveri nie je možné — Tesco
          blokuje robotov.)
        </p>
      </div>
    </div>
  );
}