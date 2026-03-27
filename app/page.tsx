'use client';

import { useState } from 'react';
import type { AnalysisResult } from '@/lib/types';
import { AddressInput } from '@/components/AddressInput';
import { LoadingSteps } from '@/components/LoadingSteps';
import { ResultsDashboard } from '@/components/ResultsDashboard';
import { Sun } from 'lucide-react';

type AppState = 'idle' | 'loading' | 'results' | 'error';

export default function Home() {
  const [state, setState] = useState<AppState>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  async function handleAnalyze(address: string) {
    setState('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });

      const data = await res.json();

      if (!data.success) {
        setErrorMsg(data.error ?? 'Analysis failed. Please try again.');
        setState('error');
        return;
      }

      setResult(data.data as AnalysisResult);
      setState('results');
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.');
      setState('error');
    }
  }

  function handleReset() {
    setState('idle');
    setResult(null);
    setErrorMsg('');
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sun className="w-6 h-6 text-orange-500" />
            <div>
              <span className="font-bold text-zinc-900 text-sm">Solar Landscape</span>
              <span className="text-zinc-400 text-sm mx-1.5">·</span>
              <span className="text-zinc-600 text-sm">Edge vs Solar Analyzer</span>
            </div>
          </div>
          {state === 'results' && (
            <button
              onClick={handleReset}
              className="text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              New analysis
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero / Input */}
        {(state === 'idle' || state === 'error') && (
          <div className="flex flex-col items-center text-center mb-8 pt-8">
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 rounded-full px-3 py-1 text-xs font-semibold mb-4">
              <Sun className="w-3.5 h-3.5" />
              Commercial Property Analysis Tool
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-3 leading-tight">
              Edge Data Center vs.{' '}
              <span className="text-orange-500">Rooftop Solar</span>
            </h1>
            <p className="text-zinc-500 max-w-xl mb-8 text-sm md:text-base leading-relaxed">
              Enter any commercial address to get a data-driven assessment of edge data center
              feasibility — and see why rooftop solar is almost always the superior outcome.
            </p>

            <div className="w-full max-w-2xl">
              <AddressInput onAnalyze={handleAnalyze} isLoading={false} />
            </div>

            {state === 'error' && errorMsg && (
              <div className="mt-4 w-full max-w-2xl rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
                {errorMsg}
              </div>
            )}

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-2 mt-8">
              {[
                '8-factor weighted model',
                'Live FCC broadband data',
                'FEMA flood zone lookup',
                'Google Places ecosystem scan',
                '25 regional data centers mapped',
                'NJ utility rate database',
              ].map((f) => (
                <span
                  key={f}
                  className="text-xs bg-white border border-zinc-200 text-zinc-600 rounded-full px-3 py-1"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Loading state */}
        {state === 'loading' && (
          <div className="flex flex-col items-center py-12">
            <h2 className="text-xl font-semibold text-zinc-800 mb-2">Analyzing property…</h2>
            <p className="text-sm text-zinc-500 mb-8">
              Pulling live data from 6 sources. This takes about 10 seconds.
            </p>
            <LoadingSteps isVisible={true} />
          </div>
        )}

        {/* Results */}
        {state === 'results' && result && (
          <ResultsDashboard result={result} onReset={handleReset} />
        )}
      </main>

      <footer className="border-t border-zinc-200 mt-16 py-6 text-center text-xs text-zinc-400">
        Solar Landscape · Asbury Park, NJ · Built for the 2026 Hackathon
      </footer>
    </div>
  );
}
