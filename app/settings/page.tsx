'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [limits, setLimits] = useState({
    lunysMaxPerOrder: 95,
    tescoMaxPerOrder: 85,
    maxPerDay: 140,
    maxPerWeek: 380,
    dedicatedCardDailyLimit: 120,
    dedicatedCardWeeklyLimit: 350,
  });

  const [dedicatedCardLast4, setDedicatedCardLast4] = useState('4821');

  const updateLimit = (key: keyof typeof limits, value: number) => {
    setLimits(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <a href="/" className="text-sm text-zinc-400 hover:text-white">← Back to dashboard</a>
          <h1 className="text-4xl font-semibold tracking-tighter mt-3">Agent Settings</h1>
          <p className="text-zinc-400 mt-2">These limits are hard. The agent cannot exceed them under any circumstances.</p>
        </div>

        {/* Dedicated Card Section */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-semibold">Dedicated Payment Card</div>
              <div className="text-sm text-zinc-400">This is the only card the agent is allowed to use.</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-lg">•••• {dedicatedCardLast4}</div>
              <div className="text-xs text-emerald-400">Virtual card • Active</div>
            </div>
          </div>

          <div className="text-xs bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-400">
            Recommended: Create a Revolut or bank virtual card with low limits and give the agent only those credentials.
            Top it up manually when needed.
          </div>
        </div>

        {/* Spending Limits */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <div className="font-semibold mb-6">Hard Spending Limits</div>

          <div className="space-y-8">
            {/* Per Store Limits */}
            <div>
              <div className="text-sm font-medium text-zinc-400 mb-3">PER ORDER LIMITS</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm block mb-1.5">Lunys — max per order</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="40"
                      max="150"
                      step="5"
                      value={limits.lunysMaxPerOrder}
                      onChange={(e) => updateLimit('lunysMaxPerOrder', parseInt(e.target.value))}
                      className="flex-1 accent-white"
                    />
                    <div className="w-16 text-right font-mono text-lg">€{limits.lunysMaxPerOrder}</div>
                  </div>
                </div>
                <div>
                  <label className="text-sm block mb-1.5">Tesco — max per order</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="40"
                      max="150"
                      step="5"
                      value={limits.tescoMaxPerOrder}
                      onChange={(e) => updateLimit('tescoMaxPerOrder', parseInt(e.target.value))}
                      className="flex-1 accent-white"
                    />
                    <div className="w-16 text-right font-mono text-lg">€{limits.tescoMaxPerOrder}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily / Weekly */}
            <div>
              <div className="text-sm font-medium text-zinc-400 mb-3">OVERALL LIMITS</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm block mb-1.5">Maximum per day (both stores combined)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="60"
                      max="250"
                      step="10"
                      value={limits.maxPerDay}
                      onChange={(e) => updateLimit('maxPerDay', parseInt(e.target.value))}
                      className="flex-1 accent-white"
                    />
                    <div className="w-16 text-right font-mono text-lg">€{limits.maxPerDay}</div>
                  </div>
                </div>
                <div>
                  <label className="text-sm block mb-1.5">Maximum per week</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="200"
                      max="600"
                      step="10"
                      value={limits.maxPerWeek}
                      onChange={(e) => updateLimit('maxPerWeek', parseInt(e.target.value))}
                      className="flex-1 accent-white"
                    />
                    <div className="w-16 text-right font-mono text-lg">€{limits.maxPerWeek}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dedicated Card Limits */}
            <div className="pt-4 border-t border-zinc-800">
              <div className="text-sm font-medium text-orange-400 mb-3">DEDICATED CARD LIMITS (Extra Safety)</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm block mb-1.5">Dedicated card — daily limit</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="50"
                      max="180"
                      step="5"
                      value={limits.dedicatedCardDailyLimit}
                      onChange={(e) => updateLimit('dedicatedCardDailyLimit', parseInt(e.target.value))}
                      className="flex-1 accent-orange-400"
                    />
                    <div className="w-16 text-right font-mono text-lg">€{limits.dedicatedCardDailyLimit}</div>
                  </div>
                </div>
                <div>
                  <label className="text-sm block mb-1.5">Dedicated card — weekly limit</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="150"
                      max="450"
                      step="10"
                      value={limits.dedicatedCardWeeklyLimit}
                      onChange={(e) => updateLimit('dedicatedCardWeeklyLimit', parseInt(e.target.value))}
                      className="flex-1 accent-orange-400"
                    />
                    <div className="w-16 text-right font-mono text-lg">€{limits.dedicatedCardWeeklyLimit}</div>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 mt-2">
                These limits are enforced both in the app and (ideally) directly on the card itself.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button 
            onClick={() => alert('Limits saved (demo)')}
            className="px-8 py-3 bg-white text-black rounded-2xl font-medium"
          >
            Save Limits
          </button>
        </div>
      </div>
    </div>
  );
}
