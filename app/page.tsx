'use client';

import { useState, useCallback, useMemo } from 'react';
import type { AnalysisResult } from '@/lib/types';
import type { FactorId } from '@/lib/types';
import { FACTOR_WEIGHTS } from '@/lib/scoring';
import { AddressInput } from '@/components/AddressInput';
import { LoadingSteps } from '@/components/LoadingSteps';
import { IntelligencePanel } from '@/components/IntelligencePanel';
import { MapPanel } from '@/components/MapPanel';
import { Sun, Zap } from 'lucide-react';

type AppState = 'idle' | 'loading' | 'results' | 'error';

const EXAMPLES = [
  { label: 'Strip mall — Woodbridge', address: '500 Route 9 North, Woodbridge, NJ 07095' },
  { label: 'Warehouse — South Plainfield', address: '200 Kimball Ave, South Plainfield, NJ 07080' },
  { label: 'Coastal — Asbury Park', address: '1 Ocean Ave, Asbury Park, NJ 07712' },
];

function recomputeScore(
  factors: AnalysisResult['factors'],
  weights: Record<string, number>,
): number {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  return Math.round(
    Math.max(0, Math.min(100,
      factors.reduce((sum, f) => sum + f.rawScore * ((weights[f.factorId] ?? 0.1) / total), 0)
    ))
  );
}

export default function Home() {
  const [state, setState] = useState<AppState>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [weights, setWeights] = useState<Record<string, number>>({ ...FACTOR_WEIGHTS });

  const liveScore = useMemo(
    () => result ? recomputeScore(result.factors, weights) : 0,
    [result, weights],
  );

  const handleWeightChange = useCallback((id: FactorId, val: number) => {
    setWeights(prev => ({ ...prev, [id]: val }));
  }, []);

  const handleWeightReset = useCallback(() => {
    setWeights({ ...FACTOR_WEIGHTS });
  }, []);

  async function handleAnalyze(address: string) {
    setState('loading');
    setError('');
    setWeights({ ...FACTOR_WEIGHTS });
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error ?? 'Analysis failed'); setState('error'); return; }
      setResult(data.data);
      setState('results');
    } catch {
      setError('Network error. Please try again.');
      setState('error');
    }
  }

  function handleReset() {
    setState('idle');
    setResult(null);
    setError('');
  }

  /* ── Results: full-screen split layout ─────────────── */
  if (state === 'results' && result) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Slim header */}
        <header className="flex-shrink-0 h-12 bg-white border-b border-zinc-200 flex items-center justify-between px-4 z-50"
          style={{ boxShadow: '0 1px 0 #E5E7EB' }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Sun className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-zinc-900 tracking-tight">Solar Landscape</span>
            <span className="text-zinc-300 mx-1">·</span>
            <span className="text-sm text-zinc-500 truncate max-w-xs">{result.address.formattedAddress}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1 text-xs text-violet-700 bg-violet-50 border border-violet-200 rounded-full px-2.5 py-0.5 font-medium">
              <Zap className="w-3 h-3" /> ML-Assisted
            </span>
            <button onClick={handleReset}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors duration-150 px-3 py-1.5 rounded-lg hover:bg-zinc-100">
              ← New analysis
            </button>
          </div>
        </header>

        {/* Split canvas */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Map */}
          <div className="flex-1 relative">
            <MapPanel result={result} />
          </div>

          {/* Right: Intelligence panel */}
          <div className="w-[420px] flex-shrink-0 h-full border-l border-zinc-200 bg-white panel-scroll overflow-y-auto">
            <IntelligencePanel
              result={result}
              weights={weights}
              liveScore={liveScore}
              onWeightChange={handleWeightChange}
              onWeightReset={handleWeightReset}
            />
          </div>
        </div>
      </div>
    );
  }

  /* ── Idle / Loading / Error: centered hero ─────────── */
  return (
    <div className="h-screen flex flex-col overflow-auto">
      {/* Header */}
      <header className="flex-shrink-0 h-12 bg-white/80 backdrop-blur-sm border-b border-zinc-200 flex items-center px-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Sun className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-zinc-900">Solar Landscape</span>
          <span className="text-zinc-300 mx-1">/</span>
          <span className="text-sm text-zinc-500">Edge vs Solar Analyzer</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-1 text-xs text-violet-700 bg-violet-50 border border-violet-200 rounded-full px-2.5 py-0.5 font-medium">
            <Zap className="w-3 h-3" /> ML-Assisted Site Evaluation
          </span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {state === 'loading' ? (
          <LoadingSteps isVisible={true} />
        ) : (
          <div className="w-full max-w-2xl animate-fade-up">
            {/* Wordmark */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 border border-zinc-200 rounded-full px-3 py-1 mb-6 bg-white">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Commercial infrastructure decision tool
              </div>
              <h1 className="text-5xl md:text-6xl font-black tracking-tight text-zinc-900 leading-none mb-4">
                Edge Data Center
                <br />
                <span className="text-zinc-300">or</span>{' '}
                <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                  Rooftop Solar?
                </span>
              </h1>
              <p className="text-zinc-500 text-lg leading-relaxed max-w-xl mx-auto">
                Enter any commercial address. Get a data-driven infrastructure suitability assessment in seconds.
              </p>
            </div>

            {/* Search */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-1.5"
              style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)' }}>
              <AddressInput onAnalyze={handleAnalyze} isLoading={false} />
            </div>

            {state === 'error' && error && (
              <div className="mt-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
                {error}
              </div>
            )}

            {/* Examples */}
            <div className="mt-4 flex items-center gap-2 flex-wrap justify-center">
              <span className="text-xs text-zinc-400">Try:</span>
              {EXAMPLES.map(ex => (
                <button key={ex.label} onClick={() => handleAnalyze(ex.address)}
                  className="text-xs font-medium text-zinc-600 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 transition-colors duration-150">
                  {ex.label}
                </button>
              ))}
            </div>

            {/* Trust signals */}
            <div className="mt-10 grid grid-cols-3 gap-4 text-center">
              {[
                { v: '8',  l: 'scoring factors' },
                { v: '6',  l: 'live data sources' },
                { v: '25', l: 'data centers mapped' },
              ].map(({ v, l }) => (
                <div key={l} className="bg-white rounded-xl border border-zinc-100 py-4">
                  <p className="font-mono text-2xl font-bold text-zinc-900">{v}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{l}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
