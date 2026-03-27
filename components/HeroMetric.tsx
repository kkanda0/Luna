'use client';

import { useEffect, useRef, useState } from 'react';
import type { AnalysisResult, EdgeVerdict } from '@/lib/types';
import { Sun, Database, TrendingDown } from 'lucide-react';

interface HeroMetricProps {
  result: AnalysisResult;
  liveScore: number;
}

type Winner = 'solar' | 'edge' | 'borderline';

function getWinner(verdict: EdgeVerdict): Winner {
  if (verdict === 'poor' || verdict === 'marginal') return 'solar';
  if (verdict === 'strong') return 'edge';
  return 'borderline';
}

function deriveSolarScore(edge: number) {
  return Math.round(Math.max(38, Math.min(91, 108 - edge)));
}

function deriveConfidence(edge: number, solar: number) {
  return Math.min(97, Math.round(58 + Math.abs(edge - solar) * 0.65));
}

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const from = display;
    const to = value;
    const dur = 900;
    const animate = (now: number) => {
      const t = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * ease));
      if (t < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span className={className}>{display}</span>;
}

const CFG = {
  solar: {
    winner:   'Rooftop Solar',
    sub:      'Recommended Infrastructure Investment',
    icon:     Sun,
    color:    '#16A34A',
    bg:       '#F0FDF4',
    border:   '#BBF7D0',
    textDim:  '#4ADE80',
    badge:    'bg-emerald-600 text-white',
    glow:     'glow-green',
    edgeBadge:'text-zinc-400',
  },
  edge: {
    winner:   'Edge Data Center',
    sub:      'Recommended Infrastructure Investment',
    icon:     Database,
    color:    '#7C3AED',
    bg:       '#F5F3FF',
    border:   '#DDD6FE',
    textDim:  '#A78BFA',
    badge:    'bg-violet-600 text-white',
    glow:     'glow-violet',
    edgeBadge:'text-violet-600',
  },
  borderline: {
    winner:   'Inconclusive',
    sub:      'Manual Review Recommended',
    icon:     TrendingDown,
    color:    '#6B7280',
    bg:       '#F9FAFB',
    border:   '#E5E7EB',
    textDim:  '#9CA3AF',
    badge:    'bg-zinc-700 text-white',
    glow:     '',
    edgeBadge:'text-zinc-500',
  },
} as const;

export function HeroMetric({ result, liveScore }: HeroMetricProps) {
  const winner = getWinner(result.verdict);
  const cfg = CFG[winner];
  const Icon = cfg.icon;
  const solarScore = deriveSolarScore(liveScore);
  const confidence = deriveConfidence(liveScore, solarScore);
  const scoreChanged = Math.abs(liveScore - result.finalScore) >= 1;

  return (
    <div
      className={`relative overflow-hidden ${cfg.glow}`}
      style={{ background: cfg.bg, borderBottom: `1px solid ${cfg.border}` }}
    >
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />

      <div className="relative px-6 pt-6 pb-5">
        {/* Label */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold rounded-full px-3 py-1 ${cfg.badge}`}>
            <Icon className="w-3 h-3" />
            Better fit
          </span>
          <span className="text-xs text-zinc-400 font-mono">
            {confidence}% confidence
          </span>
        </div>

        {/* Winner name — massive typography */}
        <h2
          className="font-black tracking-tight leading-none mb-2 uppercase"
          style={{ fontSize: 'clamp(28px, 5vw, 40px)', color: cfg.color, letterSpacing: '-0.03em' }}
        >
          {cfg.winner}
        </h2>
        <p className="text-xs text-zinc-500 mb-5">{cfg.sub}</p>

        {/* Score pair */}
        <div className="grid grid-cols-2 gap-3">
          {/* Edge score */}
          <div className={`rounded-xl border p-3.5 bg-white ${winner === 'edge' ? 'border-violet-200' : 'border-zinc-100'}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <Database className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Edge DC</span>
            </div>
            <div className="flex items-end gap-1">
              <span className={`font-mono font-bold leading-none ${winner === 'edge' ? 'text-violet-600' : 'text-zinc-800'}`}
                style={{ fontSize: 36 }}>
                <AnimatedNumber value={liveScore} />
              </span>
              <span className="font-mono text-sm text-zinc-400 pb-1">/100</span>
            </div>
            {scoreChanged && (
              <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                orig. {result.finalScore}
              </p>
            )}
          </div>

          {/* Solar score */}
          <div className={`rounded-xl border p-3.5 bg-white ${winner === 'solar' ? 'border-emerald-200' : 'border-zinc-100'}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <Sun className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Solar</span>
            </div>
            <div className="flex items-end gap-1">
              <span className={`font-mono font-bold leading-none ${winner === 'solar' ? 'text-emerald-600' : 'text-zinc-800'}`}
                style={{ fontSize: 36 }}>
                <AnimatedNumber value={solarScore} />
              </span>
              <span className="font-mono text-sm text-zinc-400 pb-1">/100</span>
            </div>
            <p className="text-[10px] text-zinc-400 mt-0.5">opportunity score</p>
          </div>
        </div>

        {/* Key findings */}
        {result.topReasons.length > 0 && (
          <div className="mt-4 space-y-2">
            {result.topReasons.map((r, i) => (
              <div key={i} className="flex items-start gap-2 animate-fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
                <span className="font-mono text-[10px] text-zinc-300 mt-0.5 flex-shrink-0">
                  0{i + 1}
                </span>
                <p className="text-xs text-zinc-600 leading-snug">{r}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
