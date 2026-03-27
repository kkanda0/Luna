'use client';

import { useState } from 'react';
import type { FactorScore, ImpactDirection } from '@/lib/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  ChevronDown,
  Activity, GitBranch, Building2, Warehouse, Globe,
  FileText, Waves, Zap, Wifi, WifiOff,
} from 'lucide-react';

// ── Icon map by factorId ────────────────────────────────────
const FACTOR_ICONS: Record<string, React.ElementType> = {
  demand:      Activity,
  backhaul:    GitBranch,
  saturation:  Building2,
  suitability: Warehouse,
  fiber:       Globe,
  zoning:      FileText,
  climate:     Waves,
  power:       Zap,
};

// ── Impact badge config ──────────────────────────────────────
const IMPACT_CONFIG: Record<ImpactDirection, { label: string; classes: string }> = {
  boosts_edge:  { label: 'Boosts Edge',  classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  boosts_solar: { label: 'Boosts Solar', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  adds_risk:    { label: 'Adds Risk',    classes: 'bg-red-50 text-red-700 border-red-200' },
  neutral:      { label: 'Neutral',      classes: 'bg-zinc-50 text-zinc-600 border-zinc-200' },
};

// ── Score tier helpers ───────────────────────────────────────
function scoreTier(s: number) {
  if (s >= 65) return { bar: 'bg-red-400', text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' };
  if (s >= 40) return { bar: 'bg-amber-400', text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' };
  return { bar: 'bg-emerald-400', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' };
}

interface FactorCardProps {
  factor: FactorScore;
  index: number;
}

export function FactorCard({ factor, index }: FactorCardProps) {
  const [open, setOpen] = useState(false);
  const Icon = FACTOR_ICONS[factor.factorId] ?? Activity;
  const tier = scoreTier(factor.rawScore);
  const impact = IMPACT_CONFIG[factor.impact];

  const dataEntries = Object.entries(factor.dataPoints).filter(
    ([k, v]) => typeof v !== 'object' && !['error'].includes(k),
  );

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={`factor-card bg-white rounded-xl border ${open ? 'border-zinc-300' : 'border-zinc-200'} overflow-hidden animate-fade-up`}
        style={{ animationDelay: `${index * 0.04}s` }}
      >
        <CollapsibleTrigger asChild>
          <button className="w-full text-left p-4 group">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className={`w-9 h-9 rounded-lg ${tier.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <Icon className={`w-4.5 h-4.5 ${tier.text}`} style={{ width: '18px', height: '18px' }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-sm font-semibold text-zinc-800">{factor.label}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Data status */}
                    {factor.status === 'live'
                      ? <Wifi className="w-3 h-3 text-emerald-500" />
                      : <WifiOff className="w-3 h-3 text-zinc-400" />}
                    {/* Score */}
                    <span className={`text-sm font-bold tabular-nums ${tier.text}`}>
                      {factor.rawScore}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1 bg-zinc-100 rounded-full mb-2">
                  <div
                    className={`h-1 rounded-full ${tier.bar}`}
                    style={{ width: `${factor.rawScore}%`, transition: 'width 0.6s ease' }}
                  />
                </div>

                {/* Headline + impact badge */}
                <div className="flex items-start gap-2 flex-wrap">
                  <p className="text-xs text-zinc-500 leading-snug flex-1">{factor.headline}</p>
                  <span className={`flex-shrink-0 text-[10px] font-semibold border rounded-full px-2 py-0.5 ${impact.classes}`}>
                    {impact.label}
                  </span>
                </div>
              </div>
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3 border-t border-zinc-100 pt-3">
            {/* Detail */}
            <p className="text-sm text-zinc-600 leading-relaxed">{factor.detail}</p>

            {/* Assessment */}
            <div className={`rounded-lg ${tier.bg} border ${tier.border} p-3`}>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Assessment</p>
              <p className="text-sm text-zinc-800 font-medium">{factor.recommendation}</p>
            </div>

            {/* Data points */}
            {dataEntries.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {dataEntries.map(([key, val]) => (
                  <span key={key} className="text-[10px] font-medium bg-zinc-50 border border-zinc-200 text-zinc-600 rounded-md px-2 py-1">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}: <span className="text-zinc-800">{String(val)}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Meta */}
            <div className="flex items-center gap-3 text-[10px] text-zinc-400 pt-1 border-t border-zinc-100">
              <span>Weight {(factor.weight * 100).toFixed(0)}%</span>
              <span>·</span>
              <span>Weighted {factor.weightedScore.toFixed(1)} pts</span>
              <span>·</span>
              <span className={factor.status === 'live' ? 'text-emerald-600' : 'text-amber-600'}>
                {factor.status === 'live' ? '● Live data' : factor.status === 'fallback' ? '◐ Fallback' : '○ Unavailable'}
              </span>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
