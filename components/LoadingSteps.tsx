'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

const STEPS = [
  { label: 'Resolving coordinates',        src: 'Google Geocoding API' },
  { label: 'Scanning business ecosystem',   src: 'Google Places · 5mi radius' },
  { label: 'Measuring backhaul distance',   src: '25 regional data centers' },
  { label: 'Mapping market saturation',     src: 'Competitor proximity analysis' },
  { label: 'Evaluating building structure', src: 'Google Place types API' },
  { label: 'Checking fiber availability',   src: 'FCC Broadband Map' },
  { label: 'Analyzing zoning density',      src: 'Census ACS 2022' },
  { label: 'Assessing flood & climate',     src: 'FEMA ArcGIS NFHL' },
  { label: 'Computing weighted score',      src: '8-factor ML model' },
];

interface LoadingStepsProps {
  isVisible: boolean;
}

export function LoadingSteps({ isVisible }: LoadingStepsProps) {
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (!isVisible) { setDone(0); return; }
    let n = 0;
    const tick = () => { n++; setDone(n); if (n < STEPS.length) setTimeout(tick, 480); };
    const t = setTimeout(tick, 350);
    return () => clearTimeout(t);
  }, [isVisible]);

  if (!isVisible) return null;

  const progress = done / STEPS.length;

  return (
    <div className="w-full max-w-md animate-fade-in">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-900 mb-4">
          <span className="font-mono text-white text-sm font-bold animate-pulse">
            {Math.round(progress * 100)}%
          </span>
        </div>
        <h2 className="text-xl font-black tracking-tight text-zinc-900 mb-1">Analyzing property</h2>
        <p className="text-sm text-zinc-400">Querying 6 live data sources in parallel</p>
      </div>

      {/* Progress bar */}
      <div className="relative h-[2px] bg-zinc-100 rounded-full mb-6 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-zinc-900 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-0">
        {STEPS.map((step, i) => {
          const isDone   = i < done;
          const isActive = i === done;

          return (
            <div
              key={i}
              className={`flex items-center gap-3 py-2.5 border-b border-zinc-50 transition-opacity duration-300 ${
                i > done ? 'opacity-30' : 'opacity-100'
              }`}
            >
              {/* Status indicator */}
              <div className="w-5 flex-shrink-0 flex items-center justify-center">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" style={{ width: 15, height: 15 }} />
                ) : isActive ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 animate-pulse" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <span className={`text-sm ${isDone ? 'text-zinc-400' : isActive ? 'font-semibold text-zinc-900' : 'text-zinc-400'}`}>
                  {step.label}
                </span>
                {isActive && (
                  <span className="text-xs text-zinc-400 ml-2">{step.src}</span>
                )}
              </div>

              {/* Step number */}
              <span className="font-mono text-[10px] text-zinc-300 flex-shrink-0">
                {String(i + 1).padStart(2, '0')}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-zinc-400 font-mono mt-5">
        ~8–12 seconds · results persist in session cache
      </p>
    </div>
  );
}
