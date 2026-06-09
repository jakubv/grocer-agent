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
  type TescoSearchLink,
} from '@/lib/api-client';
import { getStoredToken } from '@/lib/api-client';
import { getCurrentUser } from '@/lib/api-client';
import { tescoSearchUrl } from '@/lib/tesco/constants';

function openTescoTabs(links: TescoSearchLink[], cartUrl?: string) {
  for (const link of links) {
    window.open(link.url, '_blank', 'noopener,noreferrer');
  }
  if (cartUrl) {
    window.open(cartUrl, '_blank', 'noopener,noreferrer');
  }
}

export default function TescoReviewPage() {
  const [unlocked, setUnlocked] = useState(() => Boolean(getStoredToken()));
  const [proposal, setProposal] = useState<TescoProposal | null>(null);
  const [lastSearchUrls, setLastSearchUrls] = useState<TescoSearchLink[]>([]);
  const [sessionOk, setSessionOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    if (!unlocked) return;
    const timeout = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timeout);
  }, [unlocked, load]);

  const prepare = async () => {
    setBusy('prepare');
    setError('');
    setSuccess('');
    try {
      const res = await prepareTescoProposal();
      setProposal(res.proposal);
      setSuccess('Zoznam preložený — skontrolujte položky a potom schváľte.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Príprava zlyhala');
    } finally {
      setBusy('');
    }
  };

  const approve = async () => {
    setBusy('approve');
    setError('');
    setSuccess('');
    try {
      const res = await approveTescoProposal(getCurrentUser());
      setProposal(res.proposal);
      const links =
        res.search_urls ??
        res.proposal.lines
          .filter((l) => l.status !== 'skipped')
          .map((l) => ({
            line_id: l.id,
            raw_name: l.raw_name,
            search_query: l.search_query,
            url: tescoSearchUrl(l.search_query),
          }));
      setLastSearchUrls(links);
      if (links.length) {
        openTescoTabs(links, res.cart_url ?? res.proposal.cart_url ?? undefined);
      }
      setSuccess(
        res.message ??
          'Otvorené vyhľadávania v Tesco. V každom tabe pridajte produkt do košíka, potom zaplaťte.'
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Schválenie zlyhala');
    } finally {
      setBusy('');
    }
  };

  const openLinksAgain = () => {
    const links =
      lastSearchUrls.length > 0
        ? lastSearchUrls
        : (proposal?.lines
            .filter((l) => l.status !== 'skipped')
            .map((l) => ({
              line_id: l.id,
              raw_name: l.raw_name,
              search_query: l.search_query,
              url: tescoSearchUrl(l.search_query),
            })) ?? []);
    openTescoTabs(links, proposal?.cart_url ?? undefined);
    setSuccess('Odkazy znova otvorené (povoľte vyskakovacie okná).');
    setError('');
  };

  const skipLine = async (lineId: string) => {
    try {
      await updateTescoLine(lineId, { status: 'skipped' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chyba');
    }
  };

  if (!unlocked) {
    return <AccessGate onUnlock={() => setUnlocked(true)} />;
  }

  const activeLines = proposal?.lines.filter((l) => l.status !== 'skipped') ?? [];
  const est = proposal?.estimated_total;
  const isCartReady = proposal?.status === 'cart_ready';
  const showFailed = !isCartReady;

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-safe">
      <AppHeader badge="TE" title="Tesco objednávka" subtitle="Návrh košíka → schválenie" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <Link href="/" className="text-sm text-zinc-400 hover:text-white">
          ← Späť na zoznam
        </Link>

        {sessionOk === false && (
          <div className="bg-amber-950/50 border border-amber-800 rounded-2xl px-4 py-3 text-sm text-amber-200">
            Tesco session v databáze chýba (voliteľné). Na Macu:{' '}
            <code className="text-amber-100">npm run tesco:login</code> — na objednávku stačí
            prihlásenie v bežnom prehliadači pri odkazoch nižšie.
          </div>
        )}

        {sessionOk && (
          <div className="text-sm text-emerald-400">✓ Tesco session v databáze (Mac login)</div>
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
          {proposal && !isCartReady && (
            <button
              type="button"
              onClick={approve}
              disabled={!!busy || activeLines.length === 0}
              className="px-5 py-3 bg-emerald-500 text-black rounded-2xl font-semibold disabled:opacity-40 touch-manipulation"
            >
              {busy === 'approve' ? 'Otváram Tesco…' : '2. Schváliť a otvoriť Tesco'}
            </button>
          )}
          {proposal && isCartReady && (
            <button
              type="button"
              onClick={openLinksAgain}
              className="px-5 py-3 bg-emerald-500 text-black rounded-2xl font-semibold touch-manipulation"
            >
              Znova otvoriť Tesco odkazy
            </button>
          )}
        </div>

        {error && (
          <div className="text-red-400 text-sm bg-red-950/40 border border-red-900 rounded-2xl px-4 py-3">
            {error}
          </div>
        )}

        {success && (
          <div className="text-emerald-300 text-sm bg-emerald-950/40 border border-emerald-800 rounded-2xl px-4 py-3">
            {success}
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
                Stav:{' '}
                <strong className="text-white">
                  {isCartReady ? 'pripravené na Tesco' : proposal.status}
                </strong>
              </span>
              {est != null && (
                <span>
                  Odhad: <strong className="text-white">€{est.toFixed(2)}</strong>
                </span>
              )}
            </div>

            {isCartReady && proposal.cart_url && (
              <a
                href={proposal.cart_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-white text-black rounded-2xl font-semibold"
              >
                Otvoriť košík Tesco a zaplatiť →
              </a>
            )}

            {proposal.status === 'failed' && proposal.error_message && (
              <p className="text-amber-400 text-sm">{proposal.error_message}</p>
            )}

            <div className="space-y-3">
              {proposal.lines.map((line) => (
                <div
                  key={line.id}
                  className={`rounded-2xl border px-4 py-4 ${
                    line.status === 'skipped'
                      ? 'border-zinc-800 opacity-50'
                      : showFailed && line.status === 'failed'
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
                      {line.confidence != null && line.confidence < 0.6 && !isCartReady && (
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
                      {line.status !== 'skipped' && !isCartReady && (
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
                  {showFailed && line.fail_reason && (
                    <p className="text-red-400 text-xs mt-2">{line.fail_reason}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        <p className="text-xs text-zinc-500 leading-relaxed">
          Po schválení sa otvoria vyhľadávania v Tesco (povoľte popup). V každom pridajte vhodný
          produkt, potom košík a platba na stránke Tesco. Ak sa nič neotvorí, použite tlačidlo
          „Hľadať“ pri položkách.
        </p>
      </div>
    </div>
  );
}