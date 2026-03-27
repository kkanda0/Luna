'use client';

import type { FactorScore } from '@/lib/types';
import type { FactorId } from '@/lib/types';
import { RotateCcw } from 'lucide-react';

interface WeightSlidersProps {
  factors: FactorScore[];
  weights: Record<string, number>;
  liveScore: number;
  originalScore: number;
  onWeightChange: (id: FactorId, val: number) => void;
  onReset: () => void;
}

const FACTOR_SHORT: Record<string, string> = {
  demand:      'Demand Signal',
  backhaul:    'Backhaul',
  saturation:  'Saturation',
  suitability: 'Building Fit',
  fiber:       'Fiber',
  zoning:      'Zoning',
  climate:     'Climate Risk',
  power:       'Power Cost',
};

export function WeightSliders({ factors, weights, liveScore, originalScore, onWeightChange, onReset }: WeightSlidersProps) {
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const delta = liveScore - originalScore;
  const scoreChanged = Math.abs(delta) >= 1;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-bold text-zinc-800">Adjust Factor Weights</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">Drag to explore how weights change the outcome</p>
        </div>
        {scoreChanged && (
          <button onClick={onReset}
            className="flex items-center gap-1 text-[10px] font-medium text-zinc-500 hover:text-zinc-800 transition-colors border border-zinc-200 rounded-md px-2 py-1 hover:bg-zinc-50">
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      {/* Live score readout */}
      <div className={`rounded-xl border p-3 mb-4 ${scoreChanged
        ? delta > 0
          ? 'bg-red-50 border-red-100'
          : 'bg-emerald-50 border-emerald-100'
        : 'bg-zinc-50 border-zinc-100'}`}>
        <div className="flex items-end gap-2">
          <span className="font-mono text-2xl font-bold text-zinc-900">{liveScore}</span>
          <span className="font-mono text-sm text-zinc-400 pb-0.5">/100 edge score</span>
          {scoreChanged && (
            <span className={`font-mono text-xs font-bold pb-0.5 ml-auto ${delta > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {delta > 0 ? '+' : ''}{delta} vs original
            </span>
          )}
        </div>
        <div className="w-full h-1 bg-zinc-200 rounded-full mt-2 overflow-hidden">
          <div
            className="h-1 rounded-full transition-all duration-500"
            style={{
              width: `${liveScore}%`,
              background: liveScore < 35 ? '#16A34A' : liveScore < 55 ? '#F59E0B' : '#EF4444',
            }}
          />
        </div>
        <p className="text-[10px] text-zinc-400 mt-1.5 font-mono">
          weights sum: {(totalWeight * 100).toFixed(0)}% (normalized at compute)
        </p>
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        {factors.map((f) => {
          const w = weights[f.factorId] ?? 0.1;
          const pct = Math.round(w * 100);

          return (
            <div key={f.factorId}>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor={`slider-${f.factorId}`}
                  className="text-xs font-medium text-zinc-600"
                >
                  {FACTOR_SHORT[f.factorId] ?? f.label}
                </label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-zinc-400 tabular-nums w-8 text-right">{pct}%</span>
                  <span className="font-mono text-[10px] text-zinc-300">score: {f.rawScore}</span>
                </div>
              </div>
              <input
                id={`slider-${f.factorId}`}
                type="range"
                min={2}
                max={35}
                step={1}
                value={pct}
                onChange={e => onWeightChange(f.factorId as FactorId, Number(e.target.value) / 100)}
                className="weight-slider"
                aria-label={`Weight for ${f.label}: ${pct}%`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
