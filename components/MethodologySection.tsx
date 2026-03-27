'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

const FACTORS = [
  { id: 'demand',      label: 'Edge Demand Signal',   weight: '20%', source: 'Google Places Nearby Search (8km radius)', notes: 'High: hospitals, universities, financial. Medium: offices, hotels. Low: restaurants, retail.' },
  { id: 'backhaul',    label: 'Backhaul Efficiency',  weight: '10%', source: 'Haversine distance to 25 hardcoded NJ/NY/PA DCs', notes: 'score = max(0, 100 − (distMi / 50) × 100)' },
  { id: 'saturation',  label: 'Market Saturation',    weight: '12%', source: 'DC count within 15mi (hardcoded + Google Places)', notes: 'INVERTED: more DCs = lower score. Penalty: −10 per DC.' },
  { id: 'suitability', label: 'Building Suitability', weight: '15%', source: 'Google Place Details types[] field', notes: 'Unsuitable (5–10): restaurants, salons. Difficult (15–30): offices, hotels. Possible (40–55): storage. Suitable (65+): warehouses.' },
  { id: 'fiber',       label: 'Fiber Connectivity',   weight: '15%', source: 'FCC Broadband Map (geo.fcc.gov + broadbandmap.fcc.gov)', notes: '0 providers → 10; 1 → 35; 2 → 55; 3 → 70; 4+ → 85. County fallback if FCC API unavailable.' },
  { id: 'zoning',      label: 'Zoning Friction',      weight: '10%', source: 'Census Geocoder + ACS 5-Year Estimates (2022)', notes: 'Dense urban (>10k/sqmi) → 15; Urban (5–10k) → 30; Suburban (1–5k) → 55; Rural → 75.' },
  { id: 'climate',     label: 'Climate Risk',         weight: '8%',  source: 'FEMA ArcGIS NFHL (5s timeout) + coastal haversine', notes: 'AE zone → −55pts; X500 + coastal → moderate penalty; X zone → minimal penalty.' },
  { id: 'power',       label: 'Power Grid Capacity',  weight: '10%', source: 'Hardcoded NJ/NY/PA utility zones (zip prefix match)', notes: '<12¢/kWh → 75; 12–14¢ → 60; 14–16¢ → 45; 16–18¢ → 30; >18¢ → 15. Combined with grid reliability score.' },
];

const VERDICT_TABLE = [
  { range: '0–34',   verdict: 'Poor Edge Candidate',     solar: 'Strong Solar Opportunity',    description: 'Majority of NJ commercial properties' },
  { range: '35–54',  verdict: 'Marginal Edge Candidate', solar: 'Moderate Solar Opportunity',  description: 'Some industrial or warehouse sites' },
  { range: '55–74',  verdict: 'Moderate Edge Potential', solar: 'Limited Solar Advantage',     description: 'Rare — well-positioned industrial' },
  { range: '75–100', verdict: 'Strong Edge Candidate',   solar: 'Limited Solar Advantage',     description: 'Very rare in this market' },
];

export function MethodologySection() {
  const [open, setOpen] = useState(false);

  return (
    <section className="border border-zinc-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-5 text-left bg-zinc-50 hover:bg-zinc-100 transition-colors"
      >
        <div>
          <h2 className="text-base font-bold text-zinc-800">Methodology & Data Sources</h2>
          <p className="text-sm text-zinc-500">For judges: weights, thresholds, and data provenance</p>
        </div>
        {open ? (
          <ChevronUp className="w-5 h-5 text-zinc-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-zinc-400 flex-shrink-0" />
        )}
      </button>

      {open && (
        <div className="p-5 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-zinc-700 mb-3">Scoring Factors & Weights</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Factor</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Data Source</TableHead>
                    <TableHead>Scoring Logic</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {FACTORS.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.label}</TableCell>
                      <TableCell>{f.weight}</TableCell>
                      <TableCell className="text-xs">{f.source}</TableCell>
                      <TableCell className="text-xs text-zinc-500">{f.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold text-zinc-700 mb-3">Score Thresholds & Verdicts</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Score Range</TableHead>
                    <TableHead>Edge Verdict</TableHead>
                    <TableHead>Solar Pitch</TableHead>
                    <TableHead>Expected Frequency</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {VERDICT_TABLE.map((v) => (
                    <TableRow key={v.range}>
                      <TableCell className="font-mono">{v.range}</TableCell>
                      <TableCell>{v.verdict}</TableCell>
                      <TableCell>{v.solar}</TableCell>
                      <TableCell className="text-zinc-500 text-xs">{v.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold text-zinc-700 mb-2">Design Assumptions</h3>
            <ul className="text-sm text-zinc-600 space-y-1.5 list-disc list-inside">
              <li>Analysis is calibrated for NJ/NY/PA market. Fallback logic handles addresses outside this region.</li>
              <li>Scores are intentionally calibrated so typical NJ strip malls score ≤35 (poor edge candidate).</li>
              <li>In-memory result cache (LRU, 100 entries) does not survive Vercel cold starts.</li>
              <li>FCC Broadband API requires a registered username. County-level fallback activates if unavailable.</li>
              <li>FEMA ArcGIS calls have a 5-second timeout; zip-code-based fallback activates if exceeded.</li>
              <li>All factor functions have internal try/catch with AbortController timeouts (5–8s).</li>
              <li>Promise.allSettled() ensures all 8 factors complete — rejected promises receive a conservative 30/100 score.</li>
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
