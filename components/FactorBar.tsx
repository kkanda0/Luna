'use client';

import { useState } from 'react';
import type { FactorScore, ImpactDirection } from '@/lib/types';
import {
  Activity, GitBranch, Building2, Warehouse,
  Globe, FileText, Waves, Zap, ChevronDown,
} from 'lucide-react';

const ICONS: Record<string, React.ElementType> = {
  demand:      Activity,
  backhaul:    GitBranch,
  saturation:  Building2,
  suitability: Warehouse,
  fiber:       Globe,
  zoning:      FileText,
  climate:     Waves,
  power:       Zap,
};

const IMPACT_COLORS: Record<ImpactDirection, string> = {
  boosts_edge:  '#7C3AED',
  boosts_solar: '#16A34A',
  adds_risk:    '#DC2626',
  neutral:      '#9CA3AF',
};

const IMPACT_LABELS: Record<ImpactDirection, string> = {
  boosts_edge:  'Edge ↑',
  boosts_solar: 'Solar ↑',
  adds_risk:    'Risk ↑',
  neutral:      'Neutral',
};

function barColor(score: number) {
  if (score >= 65) return '#EF4444';  // bad for solar pitch
  if (score >= 40) return '#F59E0B';
  return '#16A34A';                   // low edge score = good for solar
}

interface FactorBarProps {
  factor: FactorScore;
  weight: number; // current (possibly adjusted) weight
  index: number;
}

export function FactorBar({ factor, weight, index }: FactorBarProps) {
  const [expanded, setExpanded] = useState(false);
  const Icon = ICONS[factor.factorId] ?? Activity;
  const color = barColor(factor.rawScore);
  const impactColor = IMPACT_COLORS[factor.impact];

  return (
    <div
      className="group animate-fade-up"
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-left hover:bg-zinc-50 rounded-lg px-3 py-2.5 transition-colors duration-150"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2.5 mb-2">
          {/* Icon */}
          <div className="w-6 h-6 rounded-md bg-zinc-100 flex items-center justify-center flex-shrink-0">
            <Icon className="w-3.5 h-3.5 text-zinc-500" style={{ width: 13, height: 13 }} />
          </div>

          {/* Label */}
          <span className="text-xs font-semibold text-zinc-700 flex-1 truncate">{factor.label}</span>

          {/* Impact badge */}
          <span className="text-[9px] font-bold rounded px-1.5 py-0.5 flex-shrink-0"
            style={{ background: `${impactColor}18`, color: impactColor }}>
            {IMPACT_LABELS[factor.impact]}
          </span>

          {/* Score */}
          <span className="font-mono text-sm font-bold tabular-nums flex-shrink-0"
            style={{ color }}>
            {factor.rawScore}
          </span>

          {/* Chevron */}
          <ChevronDown
            className="w-3.5 h-3.5 text-zinc-300 transition-transform duration-200 flex-shrink-0"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none', width: 13, height: 13 }}
          />
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-[3px] bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${factor.rawScore}%`, background: color }}
            />
          </div>
          <span className="font-mono text-[9px] text-zinc-400 flex-shrink-0 tabular-nums">
            ×{(weight * 100).toFixed(0)}%
          </span>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="mx-3 mb-2 rounded-lg bg-zinc-50 border border-zinc-100 p-3 animate-fade-in">
          <p className="text-xs text-zinc-600 leading-relaxed mb-2">{factor.detail}</p>
          <div className="bg-white rounded-md border border-zinc-100 p-2.5 mb-2">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Assessment</p>
            <p className="text-xs text-zinc-800">{factor.recommendation}</p>
          </div>
          <div className="flex items-center gap-3 text-[9px] text-zinc-400 font-mono">
            <span>weight: {(weight * 100).toFixed(0)}%</span>
            <span>·</span>
            <span>score: {factor.rawScore}/100</span>
            <span>·</span>
            <span className={factor.status === 'live' ? 'text-emerald-600' : 'text-amber-600'}>
              {factor.status === 'live' ? '● live' : '◐ fallback'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
