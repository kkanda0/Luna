'use client';

import { useState } from 'react';
import { ChevronDown, FlaskConical } from 'lucide-react';

const FACTORS = [
  { label: 'Edge Demand Signal',   weight: '20%', source: 'Google Places API (8km)', score: '15–65', note: 'High: hospitals, universities, financial. Low: restaurants, retail.' },
  { label: 'Backhaul Efficiency',  weight: '10%', source: 'Haversine to 25 regional DCs', score: '0–100', note: 'score = max(0, 100 − distMi/50 × 100)' },
  { label: 'Market Saturation',    weight: '12%', source: 'DC count within 15mi', score: '0–100', note: 'Inverted: more DCs → lower score. Penalty: −10 per DC.' },
  { label: 'Building Suitability', weight: '15%', source: 'Google Place Details', score: '5–68', note: 'Unsuitable (5–10): restaurants, salons. Suitable (65+): warehouses.' },
  { label: 'Fiber Connectivity',   weight: '15%', source: 'FCC Broadband Map', score: '10–85', note: '0 providers→10, 1→35, 2→55, 3→70, 4+→85. County fallback.' },
  { label: 'Zoning Friction',      weight: '10%', source: 'Census ACS 5-Year (2022)', score: '15–75', note: 'Dense urban >10k/sqmi → 15. Suburban 1–5k → 55. Rural → 75.' },
  { label: 'Climate Risk',         weight: '8%',  source: 'FEMA ArcGIS NFHL', score: '10–90', note: 'AE zone → −55pts flood penalty. Coastal proximity adds up to −40.' },
  { label: 'Power Grid Capacity',  weight: '10%', source: 'NJ/NY/PA utility database', score: '15–75', note: '<12¢/kWh → 75. >18¢ → 15. Combined with grid reliability score.' },
];

const VERDICTS = [
  { range: '0 – 34',  edge: 'Poor candidate',     solar: 'Strong opportunity',    freq: 'Majority of NJ commercial' },
  { range: '35 – 54', edge: 'Marginal candidate',  solar: 'Moderate opportunity',  freq: 'Some industrial/warehouse' },
  { range: '55 – 74', edge: 'Moderate potential',  solar: 'Limited advantage',     freq: 'Rare — well-positioned industrial' },
  { range: '75 – 100',edge: 'Strong candidate',    solar: 'Limited advantage',     freq: 'Very rare in NJ market' },
];

export function MethodologySection() {
  const [open, setOpen] = useState(false);

  return (
    <section className="bg-white rounded-2xl border border-zinc-200 overflow-hidden card-shadow">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-zinc-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
            <FlaskConical className="w-4.5 h-4.5 text-violet-600" style={{ width: '18px', height: '18px' }} />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-800">Decision Logic</h2>
            <p className="text-xs text-zinc-500">8-factor model · weights, thresholds, data sources</p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-zinc-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-zinc-100 divide-y divide-zinc-100">
          {/* Factor table */}
          <div className="px-6 py-5">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Scoring Factors</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-100">
                    <th className="text-left py-2 pr-4 font-semibold text-zinc-700 whitespace-nowrap">Factor</th>
                    <th className="text-left py-2 pr-4 font-semibold text-zinc-700 whitespace-nowrap">Weight</th>
                    <th className="text-left py-2 pr-4 font-semibold text-zinc-700 whitespace-nowrap">Data Source</th>
                    <th className="text-left py-2 pr-4 font-semibold text-zinc-700 whitespace-nowrap">Score Range</th>
                    <th className="text-left py-2 font-semibold text-zinc-700">Logic</th>
                  </tr>
                </thead>
                <tbody>
                  {FACTORS.map((f, i) => (
                    <tr key={i} className="border-b border-zinc-50 hover:bg-zinc-50">
                      <td className="py-2 pr-4 font-medium text-zinc-800 whitespace-nowrap">{f.label}</td>
                      <td className="py-2 pr-4">
                        <span className="bg-violet-100 text-violet-700 rounded px-1.5 py-0.5 font-semibold">{f.weight}</span>
                      </td>
                      <td className="py-2 pr-4 text-zinc-500">{f.source}</td>
                      <td className="py-2 pr-4 font-mono text-zinc-600">{f.score}</td>
                      <td className="py-2 text-zinc-400 max-w-xs">{f.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Verdict thresholds */}
          <div className="px-6 py-5">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Score Thresholds</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {VERDICTS.map((v, i) => (
                <div key={i} className={`rounded-xl border p-3 ${
                  i === 0 ? 'bg-emerald-50 border-emerald-200' :
                  i === 1 ? 'bg-amber-50 border-amber-200' :
                  i === 2 ? 'bg-orange-50 border-orange-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <p className="font-mono text-sm font-bold text-zinc-700 mb-1">{v.range}</p>
                  <p className="text-xs font-semibold text-zinc-700 mb-0.5">Edge: {v.edge}</p>
                  <p className="text-xs font-semibold text-zinc-700 mb-1.5">Solar: {v.solar}</p>
                  <p className="text-[10px] text-zinc-400">{v.freq}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Assumptions */}
          <div className="px-6 py-5 bg-zinc-50">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Assumptions & Limitations</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
              {[
                'Calibrated for NJ/NY/PA market. Fallback logic handles other addresses.',
                'Scores intentionally calibrated so typical NJ strip malls score ≤35.',
                'In-memory cache (100 entries) does not survive Vercel cold starts.',
                'FCC Broadband API requires registered username — county fallback activates otherwise.',
                'FEMA ArcGIS has 5s timeout — zip-code fallback activates if exceeded.',
                'Promise.allSettled() ensures all factors complete — failures fall back to 30/100.',
                'Solar score is derived from edge score: 108 − edgeScore (min 38, max 91).',
                'Confidence reflects score separation, not a probabilistic model output.',
              ].map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-zinc-600">
                  <span className="text-zinc-300 mt-0.5 flex-shrink-0">—</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
