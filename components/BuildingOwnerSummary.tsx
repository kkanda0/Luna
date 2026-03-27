import type { AnalysisResult } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, DollarSign, Clock } from 'lucide-react';

interface BuildingOwnerSummaryProps {
  result: AnalysisResult;
}

export function BuildingOwnerSummary({ result }: BuildingOwnerSummaryProps) {
  const { solarPitchStrength, verdict } = result;

  const isStrongPitch = solarPitchStrength === 'strong';
  const accentColor = isStrongPitch ? 'text-orange-600' : 'text-amber-600';
  const accentBg = isStrongPitch ? 'bg-orange-50 border-orange-200' : 'bg-amber-50 border-amber-200';

  const edgeSummary =
    verdict === 'poor'
      ? 'The data shows this property faces structural, connectivity, and economic barriers that make edge data center conversion impractical.'
      : verdict === 'marginal'
      ? 'The analysis reveals significant challenges that would make an edge data center conversion costly, slow, and competitively difficult.'
      : 'While edge data center scores show some potential, the capital requirements, operational complexity, and competitive environment remain daunting.';

  return (
    <section className={`rounded-xl border-2 p-6 ${accentBg}`}>
      <div className="flex items-center gap-2 mb-2">
        <Sun className={`w-5 h-5 ${accentColor}`} />
        <h2 className={`text-lg font-bold ${accentColor}`}>The Solar Landscape Advantage</h2>
      </div>
      <p className="text-sm text-zinc-600 mb-6 leading-relaxed">
        {edgeSummary} Here&apos;s what a Solar Landscape rooftop lease offers instead:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Revenue */}
        <Card className="border-zinc-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Predictable Lease Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-700 mb-1">$0 capex</p>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Solar Landscape handles all installation, permitting, and maintenance costs.
              Building owners receive a fixed monthly lease payment — no investment required.
              Typical NJ commercial leases run 20–25 years with escalation clauses.
            </p>
          </CardContent>
        </Card>

        {/* Speed */}
        <Card className="border-zinc-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Revenue Starts in Months
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-700 mb-1">6–12 mo.</p>
            <p className="text-xs text-zinc-600 leading-relaxed">
              From signed lease to first check typically takes 6–12 months for NJ commercial
              installations. Edge data center conversion takes 3–7 years minimum with no income
              during construction. Solar income is recurring from day one of operation.
            </p>
          </CardContent>
        </Card>

        {/* Risk */}
        <Card className="border-zinc-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sun className={`w-4 h-4 ${accentColor}`} />
              None of the Edge DC Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold mb-1 ${accentColor}`}>Zero risk</p>
            <p className="text-xs text-zinc-600 leading-relaxed">
              No structural retrofits, no fiber buildout, no PJM interconnection queue,
              no permitting battles, no competitive threat from Equinix. Building owners
              retain full use of their property and collect passive lease income with no
              operational involvement.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 p-3 bg-white/70 rounded-lg border border-white">
        <p className="text-xs text-zinc-600 text-center">
          <strong className={accentColor}>Solar Landscape</strong> · Commercial Rooftop Solar · Asbury Park, NJ ·{' '}
          Specializing in NJ commercial & industrial rooftop installations
        </p>
      </div>
    </section>
  );
}
