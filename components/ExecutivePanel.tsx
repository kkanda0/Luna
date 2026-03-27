'use client';

import type { AnalysisResult, EdgeVerdict } from '@/lib/types';
import { ScoreGauge } from './ScoreGauge';
import { Badge } from '@/components/ui/badge';
import { Sun, AlertTriangle, TrendingDown, CheckCircle } from 'lucide-react';

interface ExecutivePanelProps {
  result: AnalysisResult;
}

const VERDICT_BG: Record<EdgeVerdict, string> = {
  poor:     'bg-emerald-50 border-emerald-200',
  marginal: 'bg-amber-50 border-amber-200',
  moderate: 'bg-orange-50 border-orange-200',
  strong:   'bg-red-50 border-red-200',
};

const VERDICT_HEADING_COLOR: Record<EdgeVerdict, string> = {
  poor:     'text-emerald-700',
  marginal: 'text-amber-700',
  moderate: 'text-orange-700',
  strong:   'text-red-700',
};

const VERDICT_BADGE: Record<EdgeVerdict, string> = {
  poor:     'bg-emerald-100 text-emerald-800 border-emerald-200',
  marginal: 'bg-amber-100 text-amber-800 border-amber-200',
  moderate: 'bg-orange-100 text-orange-800 border-orange-200',
  strong:   'bg-red-100 text-red-800 border-red-200',
};

const SOLAR_PITCH_CONFIG = {
  strong: {
    label: 'Strong Solar Opportunity',
    color: 'text-emerald-700',
    bg: 'bg-emerald-100',
    icon: Sun,
  },
  moderate: {
    label: 'Moderate Solar Opportunity',
    color: 'text-amber-700',
    bg: 'bg-amber-100',
    icon: Sun,
  },
  weak: {
    label: 'Limited Solar Advantage',
    color: 'text-zinc-600',
    bg: 'bg-zinc-100',
    icon: TrendingDown,
  },
};

export function ExecutivePanel({ result }: ExecutivePanelProps) {
  const { verdict, verdictLabel, finalScore, solarPitchStrength, executiveSummary, topReasons, address } = result;
  const solar = SOLAR_PITCH_CONFIG[solarPitchStrength];
  const SolarIcon = solar.icon;

  return (
    <div className={`rounded-xl border-2 p-6 md:p-8 ${VERDICT_BG[verdict]}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start gap-6 mb-6">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge className={`text-sm font-semibold border ${VERDICT_BADGE[verdict]}`}>
              {verdictLabel}
            </Badge>
            <Badge className={`text-sm font-medium border ${solar.bg} ${solar.color} border-transparent`}>
              <SolarIcon className="w-3.5 h-3.5 mr-1" />
              {solar.label}
            </Badge>
          </div>
          <h2 className={`text-xl md:text-2xl font-bold leading-tight ${VERDICT_HEADING_COLOR[verdict]}`}>
            {address.formattedAddress}
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            Score: {finalScore}/100 · Analyzed {new Date(result.analyzedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex-shrink-0 mx-auto md:mx-0">
          <ScoreGauge score={finalScore} verdict={verdict} size={160} />
        </div>
      </div>

      {/* Executive summary */}
      <p className="text-sm md:text-base text-zinc-700 leading-relaxed mb-6">
        {executiveSummary}
      </p>

      {/* Top 3 reasons */}
      {topReasons.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-zinc-600 uppercase tracking-wide mb-3">
            Key Findings
          </h3>
          <div className="space-y-2">
            {topReasons.map((reason, i) => (
              <div key={i} className="flex items-start gap-2">
                {verdict === 'poor' || verdict === 'marginal' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                )}
                <p className="text-sm text-zinc-700">{reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
