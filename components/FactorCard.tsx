'use client';

import { useState } from 'react';
import type { FactorScore } from '@/lib/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Wifi, WifiOff } from 'lucide-react';

interface FactorCardProps {
  factor: FactorScore;
}

function scoreColor(score: number): string {
  if (score >= 65) return 'text-red-600';
  if (score >= 45) return 'text-amber-600';
  return 'text-emerald-600';
}

function scoreBg(score: number): string {
  if (score >= 65) return 'bg-red-50 border-red-200';
  if (score >= 45) return 'bg-amber-50 border-amber-200';
  return 'bg-emerald-50 border-emerald-200';
}

function scoreBarColor(score: number): string {
  if (score >= 65) return 'bg-red-400';
  if (score >= 45) return 'bg-amber-400';
  return 'bg-emerald-400';
}

export function FactorCard({ factor }: FactorCardProps) {
  const [open, setOpen] = useState(false);

  const dataEntries = Object.entries(factor.dataPoints).filter(
    ([k]) => !['error'].includes(k),
  );

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className={`rounded-lg border ${scoreBg(factor.rawScore)} overflow-hidden`}>
        <CollapsibleTrigger asChild>
          <button className="w-full text-left p-4 hover:opacity-90 transition-opacity">
            <div className="flex items-start gap-3">
              <span className="text-xl leading-none mt-0.5">{factor.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-semibold text-zinc-800">{factor.label}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {factor.status !== 'live' && (
                      <span title={factor.status === 'fallback' ? 'Using fallback data' : 'Data unavailable'}>
                        {factor.status === 'fallback'
                          ? <WifiOff className="w-3.5 h-3.5 text-zinc-400" />
                          : <WifiOff className="w-3.5 h-3.5 text-red-400" />}
                      </span>
                    )}
                    {factor.status === 'live' && <Wifi className="w-3.5 h-3.5 text-emerald-500" />}
                    <span className={`text-base font-bold ${scoreColor(factor.rawScore)}`}>
                      {factor.rawScore}
                    </span>
                    {open ? (
                      <ChevronUp className="w-4 h-4 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-400" />
                    )}
                  </div>
                </div>
                {/* Score bar */}
                <div className="w-full h-1.5 bg-white/60 rounded-full mb-2">
                  <div
                    className={`h-1.5 rounded-full ${scoreBarColor(factor.rawScore)} transition-all duration-700`}
                    style={{ width: `${factor.rawScore}%` }}
                  />
                </div>
                <p className="text-xs text-zinc-600 leading-snug">{factor.headline}</p>
              </div>
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 pt-1 border-t border-white/50 space-y-3">
            {/* Detail text */}
            <p className="text-sm text-zinc-700 leading-relaxed">{factor.detail}</p>

            {/* Recommendation */}
            <div className="rounded-md bg-white/70 p-3 border border-white/80">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">
                Assessment
              </p>
              <p className="text-sm text-zinc-800">{factor.recommendation}</p>
            </div>

            {/* Data points */}
            {dataEntries.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                  Data Points
                </p>
                <div className="flex flex-wrap gap-2">
                  {dataEntries.map(([key, val]) => {
                    if (typeof val === 'object') return null;
                    return (
                      <Badge
                        key={key}
                        variant="secondary"
                        className="text-xs bg-white/60 text-zinc-600"
                      >
                        {key.replace(/([A-Z])/g, ' $1').trim()}: {String(val)}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Weight and status */}
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <span>Weight: {(factor.weight * 100).toFixed(0)}%</span>
              <span>·</span>
              <span>Weighted score: {factor.weightedScore.toFixed(1)}</span>
              <span>·</span>
              <span className={factor.status === 'live' ? 'text-emerald-600' : 'text-amber-600'}>
                {factor.status === 'live' ? 'Live data' : factor.status === 'fallback' ? 'Fallback data' : 'Unavailable'}
              </span>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
