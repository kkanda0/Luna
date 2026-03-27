'use client';

import type { AnalysisResult, EdgeVerdict } from '@/lib/types';
import { ScoreGauge } from './ScoreGauge';
import { Sun, Database, CheckCircle2, AlertTriangle, TrendingDown, ArrowRight } from 'lucide-react';

interface ExecutivePanelProps {
  result: AnalysisResult;
}

function deriveSolarScore(edgeScore: number): number {
  return Math.round(Math.max(38, Math.min(91, 108 - edgeScore)));
}

function deriveConfidence(edgeScore: number, solarScore: number): number {
  const diff = Math.abs(edgeScore - solarScore);
  return Math.min(97, Math.round(58 + diff * 0.65));
}

type Recommendation = 'solar' | 'edge' | 'borderline';

function getRecommendation(verdict: EdgeVerdict): Recommendation {
  if (verdict === 'poor' || verdict === 'marginal') return 'solar';
  if (verdict === 'strong') return 'edge';
  return 'borderline';
}

const REC_CONFIG = {
  solar: {
    banner:      'bg-gradient-to-r from-emerald-50 to-amber-50 border-emerald-200',
    badge:       'bg-emerald-600 text-white',
    heading:     'text-emerald-800',
    label:       'Better Fit: Rooftop Solar',
    icon:        Sun,
    iconColor:   'text-emerald-600',
    edgeBg:      'bg-white border-zinc-200',
    solarBg:     'bg-gradient-to-b from-amber-50 to-white border-amber-200',
    edgeColor:   '#3B82F6',
    solarColor:  '#D97706',
    edgeTrack:   '#DBEAFE',
    solarTrack:  '#FDE68A',
    winnerRing:  'ring-2 ring-amber-300',
    loserRing:   '',
  },
  edge: {
    banner:      'bg-gradient-to-r from-blue-50 to-violet-50 border-blue-200',
    badge:       'bg-blue-600 text-white',
    heading:     'text-blue-800',
    label:       'Better Fit: Edge Data Center',
    icon:        Database,
    iconColor:   'text-blue-600',
    edgeBg:      'bg-gradient-to-b from-blue-50 to-white border-blue-200',
    solarBg:     'bg-white border-zinc-200',
    edgeColor:   '#2563EB',
    solarColor:  '#D97706',
    edgeTrack:   '#BFDBFE',
    solarTrack:  '#FDE68A',
    winnerRing:  'ring-2 ring-blue-300',
    loserRing:   '',
  },
  borderline: {
    banner:      'bg-gradient-to-r from-zinc-50 to-slate-50 border-zinc-200',
    badge:       'bg-zinc-700 text-white',
    heading:     'text-zinc-800',
    label:       'Borderline — Needs Review',
    icon:        TrendingDown,
    iconColor:   'text-zinc-500',
    edgeBg:      'bg-white border-zinc-200',
    solarBg:     'bg-white border-zinc-200',
    edgeColor:   '#3B82F6',
    solarColor:  '#D97706',
    edgeTrack:   '#DBEAFE',
    solarTrack:  '#FDE68A',
    winnerRing:  '',
    loserRing:   '',
  },
} as const;

export function ExecutivePanel({ result }: ExecutivePanelProps) {
  const { verdict, finalScore, topReasons, executiveSummary, address } = result;
  const solarScore = deriveSolarScore(finalScore);
  const confidence = deriveConfidence(finalScore, solarScore);
  const rec = getRecommendation(verdict);
  const cfg = REC_CONFIG[rec];
  const RecommendationIcon = cfg.icon;

  const solarWins = rec === 'solar';
  const edgeWins = rec === 'edge';

  return (
    <div className={`rounded-2xl border-2 ${cfg.banner} card-shadow-lg overflow-hidden animate-fade-up`}>
      {/* ── Verdict banner ── */}
      <div className="px-6 pt-6 pb-5">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold ${cfg.badge}`}>
            <RecommendationIcon className="w-4 h-4" />
            {cfg.label}
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white border border-zinc-200 rounded-full px-3 py-1.5 text-xs font-medium text-zinc-600">
            <span className={`w-1.5 h-1.5 rounded-full ${confidence >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {confidence}% confidence
          </span>
        </div>
        <h2 className={`text-xl font-bold leading-snug mb-1 ${cfg.heading}`}>
          {address.formattedAddress}
        </h2>
        <p className="text-sm text-zinc-500">
          Analysis completed · Score: {finalScore}/100 edge · {solarScore}/100 solar
        </p>
      </div>

      {/* ── Dual score cards ── */}
      <div className="grid grid-cols-2 gap-4 px-6 pb-6">
        {/* Edge score card */}
        <div className={`rounded-xl border-2 p-5 ${edgeWins ? `${cfg.edgeBg} ${cfg.winnerRing}` : `bg-white border-zinc-200`} card-shadow relative`}>
          {edgeWins && (
            <div className="absolute top-3 right-3">
              <span className="text-[10px] font-bold bg-blue-600 text-white rounded-full px-2 py-0.5 uppercase tracking-wide">
                Winner
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Database className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-800">Edge Data Center</p>
              <p className="text-xs text-zinc-400">Suitability score</p>
            </div>
          </div>
          <div className="flex justify-center mb-3">
            <ScoreGauge
              score={finalScore}
              color={cfg.edgeColor}
              trackColor={cfg.edgeTrack}
              size={130}
            />
          </div>
          <div className={`text-center text-xs font-medium px-2 py-1 rounded-md ${
            finalScore < 35 ? 'bg-red-50 text-red-700' :
            finalScore < 55 ? 'bg-amber-50 text-amber-700' :
            'bg-blue-50 text-blue-700'
          }`}>
            {finalScore < 35 ? 'Poor candidate' : finalScore < 55 ? 'Marginal candidate' : finalScore < 75 ? 'Moderate potential' : 'Strong candidate'}
          </div>
        </div>

        {/* Solar score card */}
        <div className={`rounded-xl border-2 p-5 ${solarWins ? `${cfg.solarBg} ${cfg.winnerRing}` : `bg-white border-zinc-200`} card-shadow relative`}>
          {solarWins && (
            <div className="absolute top-3 right-3">
              <span className="text-[10px] font-bold bg-amber-500 text-white rounded-full px-2 py-0.5 uppercase tracking-wide">
                Winner
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Sun className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-800">Rooftop Solar</p>
              <p className="text-xs text-zinc-400">Opportunity score</p>
            </div>
          </div>
          <div className="flex justify-center mb-3">
            <ScoreGauge
              score={solarScore}
              color={cfg.solarColor}
              trackColor={cfg.solarTrack}
              size={130}
            />
          </div>
          <div className={`text-center text-xs font-medium px-2 py-1 rounded-md ${
            solarScore >= 70 ? 'bg-emerald-50 text-emerald-700' :
            solarScore >= 55 ? 'bg-amber-50 text-amber-700' :
            'bg-zinc-50 text-zinc-600'
          }`}>
            {solarScore >= 70 ? 'Strong opportunity' : solarScore >= 55 ? 'Moderate opportunity' : 'Limited advantage'}
          </div>
        </div>
      </div>

      {/* ── Executive summary + reasons ── */}
      <div className="px-6 pb-6 border-t border-white/60 pt-5 space-y-4">
        <p className="text-sm text-zinc-700 leading-relaxed">{executiveSummary}</p>

        {topReasons.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Key findings</p>
            {topReasons.map((reason, i) => (
              <div key={i} className="flex items-start gap-2.5 animate-fade-up" style={{ animationDelay: `${0.05 * i + 0.2}s` }}>
                {rec === 'solar' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                ) : rec === 'edge' ? (
                  <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
                )}
                <p className="text-sm text-zinc-700">{reason}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
