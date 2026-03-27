'use client';

import { useState } from 'react';
import type { AnalysisResult } from '@/lib/types';
import type { FactorId } from '@/lib/types';
import { HeroMetric } from './HeroMetric';
import { FactorBar } from './FactorBar';
import { WeightSliders } from './WeightSliders';
import {
  ChevronDown, Sun, DollarSign, Clock, ShieldCheck,
  FlaskConical, SlidersHorizontal, BarChart3, Building2,
} from 'lucide-react';

interface IntelligencePanelProps {
  result: AnalysisResult;
  weights: Record<string, number>;
  liveScore: number;
  onWeightChange: (id: FactorId, val: number) => void;
  onWeightReset: () => void;
}

function Section({ title, icon: Icon, children, defaultOpen = true }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-zinc-100">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-5 py-3.5 hover:bg-zinc-50 transition-colors duration-150 text-left"
      >
        <Icon className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" style={{ width: 14, height: 14 }} />
        <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex-1">{title}</span>
        <ChevronDown
          className="w-3.5 h-3.5 text-zinc-300 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'none', width: 14, height: 14 }}
        />
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
}

const METHODOLOGY_FACTORS = [
  { l: 'Edge Demand Signal',   w: '20%', src: 'Google Places (8km)' },
  { l: 'Backhaul Efficiency',  w: '10%', src: 'Haversine to 25 DCs' },
  { l: 'Market Saturation',    w: '12%', src: 'DC count within 15mi' },
  { l: 'Building Suitability', w: '15%', src: 'Google Place types' },
  { l: 'Fiber Connectivity',   w: '15%', src: 'FCC Broadband Map' },
  { l: 'Zoning Friction',      w: '10%', src: 'Census ACS 2022' },
  { l: 'Climate Risk',         w: '8%',  src: 'FEMA ArcGIS NFHL' },
  { l: 'Power Grid',           w: '10%', src: 'NJ/NY/PA utility DB' },
];

export function IntelligencePanel({
  result, weights, liveScore, onWeightChange, onWeightReset,
}: IntelligencePanelProps) {
  return (
    <div className="flex flex-col min-h-full">
      {/* Hero metric — pinned at top, no section wrapper */}
      <HeroMetric result={result} liveScore={liveScore} />

      {/* Scrollable sections */}
      <div className="flex-1">
        {/* Factor breakdown */}
        <Section title="Factor Breakdown" icon={BarChart3}>
          <div className="px-2 pt-1 space-y-0.5">
            {result.factors.map((f, i) => (
              <FactorBar
                key={f.factorId}
                factor={f}
                weight={weights[f.factorId] ?? f.weight}
                index={i}
              />
            ))}
          </div>
        </Section>

        {/* Weight sliders */}
        <Section title="Adjust Weights" icon={SlidersHorizontal} defaultOpen={false}>
          <div className="px-5 pt-1">
            <WeightSliders
              factors={result.factors}
              weights={weights}
              liveScore={liveScore}
              originalScore={result.finalScore}
              onWeightChange={onWeightChange}
              onReset={onWeightReset}
            />
          </div>
        </Section>

        {/* Nearby DCs */}
        {result.nearbyDataCenters.length > 0 && (
          <Section title="Nearby Data Centers" icon={Building2} defaultOpen={false}>
            <div className="px-5 pt-1 space-y-2">
              {result.nearbyDataCenters.slice(0, 8).map(dc => (
                <div key={dc.id} className="flex items-center justify-between py-1.5 border-b border-zinc-50">
                  <div>
                    <p className="text-xs font-semibold text-zinc-800">{dc.name}</p>
                    <p className="text-[10px] text-zinc-400">{dc.operator} · Tier {dc.tier}</p>
                  </div>
                  <span className="font-mono text-xs text-zinc-500 flex-shrink-0 ml-2">
                    {dc.distanceMi?.toFixed(1)} mi
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Solar opportunity */}
        <Section title="Solar Opportunity" icon={Sun} defaultOpen={false}>
          <div className="px-5 pt-1">
            <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-4 mb-3">
              <p className="text-xs text-zinc-600 leading-relaxed mb-3">{result.executiveSummary}</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: DollarSign, val: '$0', sub: 'owner capex' },
                  { icon: Clock,      val: '6–12mo', sub: 'to revenue' },
                  { icon: ShieldCheck, val: 'Zero', sub: 'DC risk' },
                ].map(({ icon: Icon, val, sub }) => (
                  <div key={sub} className="bg-white rounded-lg border border-amber-100 p-2.5 text-center">
                    <Icon className="w-3.5 h-3.5 text-amber-500 mx-auto mb-1" style={{ width: 14, height: 14 }} />
                    <p className="font-mono text-sm font-bold text-zinc-900">{val}</p>
                    <p className="text-[9px] text-zinc-400">{sub}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-zinc-900 text-zinc-100 px-4 py-3 text-center">
              <p className="text-xs font-semibold">Solar Landscape · Asbury Park, NJ</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Commercial rooftop solar developer</p>
            </div>
          </div>
        </Section>

        {/* Decision logic */}
        <Section title="Decision Logic" icon={FlaskConical} defaultOpen={false}>
          <div className="px-5 pt-1">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left py-1.5 font-semibold text-zinc-500">Factor</th>
                  <th className="text-left py-1.5 font-semibold text-zinc-500">Weight</th>
                  <th className="text-left py-1.5 font-semibold text-zinc-500">Source</th>
                </tr>
              </thead>
              <tbody>
                {METHODOLOGY_FACTORS.map(f => (
                  <tr key={f.l} className="border-b border-zinc-50">
                    <td className="py-1.5 text-zinc-700 font-medium">{f.l}</td>
                    <td className="py-1.5 font-mono text-zinc-500">{f.w}</td>
                    <td className="py-1.5 text-zinc-400">{f.src}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
              {[
                ['0–34', 'Poor edge → Solar ✓'],
                ['35–54', 'Marginal → Solar likely'],
                ['55–74', 'Moderate edge potential'],
                ['75–100', 'Strong edge candidate'],
              ].map(([range, label]) => (
                <div key={range} className="bg-zinc-50 rounded-md px-2.5 py-2 border border-zinc-100">
                  <p className="font-mono font-bold text-zinc-700">{range}</p>
                  <p className="text-zinc-500">{label}</p>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-zinc-400 mt-3 leading-relaxed">
              Scores calibrated for NJ/NY/PA market. FCC county fallback activates when
              broadband API is unavailable. FEMA calls timeout at 5s with zip-code fallback.
              Solar score = 108 − edgeScore (clamped 38–91). Confidence = f(score separation).
            </p>
          </div>
        </Section>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-zinc-100 px-5 py-3 bg-zinc-50">
        <p className="text-[10px] text-zinc-400 text-center font-mono">
          {result.cached ? 'cached · ' : 'live · '}
          {new Date(result.analyzedAt).toLocaleTimeString()} · id:{result.requestId.slice(0,8)}
        </p>
      </div>
    </div>
  );
}
