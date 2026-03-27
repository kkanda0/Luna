import type { AnalysisResult } from '@/lib/types';
import { Sun, DollarSign, Clock, ShieldCheck } from 'lucide-react';

interface BuildingOwnerSummaryProps {
  result: AnalysisResult;
}

const CARDS = [
  {
    icon: DollarSign,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    metric: '$0 capex',
    metricColor: 'text-emerald-700',
    title: 'Zero Owner Investment',
    body: 'Solar Landscape owns the installation. Building owners collect a fixed monthly lease payment — day one, no upfront cost, no maintenance responsibility.',
  },
  {
    icon: Clock,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    metric: '6–12 mo.',
    metricColor: 'text-blue-700',
    title: 'Revenue Starts Quickly',
    body: 'NJ commercial solar activations typically complete within 6–12 months. An edge data center conversion takes 3–7 years minimum — with zero income during construction.',
  },
  {
    icon: ShieldCheck,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    metric: 'Zero risk',
    metricColor: 'text-amber-700',
    title: 'None of the Edge DC Risk',
    body: 'No fiber buildout, no PJM interconnection queue, no structural retrofits, no permitting battles, no competition from Equinix or Digital Realty.',
  },
];

export function BuildingOwnerSummary({ result }: BuildingOwnerSummaryProps) {
  const { solarPitchStrength, verdict } = result;
  const isStrong = solarPitchStrength === 'strong';

  const intro = verdict === 'poor'
    ? 'The data shows significant structural, connectivity, and economic barriers that make edge data center conversion impractical for this property.'
    : verdict === 'marginal'
    ? 'While this property shows some edge potential, the capital requirements, competitive landscape, and operational complexity make rooftop solar the more rational choice.'
    : 'Even with moderate edge potential, the execution complexity, competitive environment, and capital intensity of an edge data center conversion remain daunting.';

  return (
    <section>
      <div className={`rounded-2xl border-2 p-6 md:p-8 overflow-hidden ${
        isStrong ? 'bg-gradient-to-br from-amber-50 via-white to-orange-50 border-amber-200' :
                   'bg-gradient-to-br from-zinc-50 via-white to-amber-50 border-zinc-200'
      }`}>
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
            <Sun className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900">What This Means for Building Owners</h2>
            <p className="text-sm text-zinc-500">Why rooftop solar outperforms edge data center conversion</p>
          </div>
        </div>

        <p className="text-sm text-zinc-600 leading-relaxed mb-8">{intro}</p>

        {/* 3 cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {CARDS.map(({ icon: Icon, iconBg, iconColor, metric, metricColor, title, body }) => (
            <div key={title} className="bg-white rounded-xl border border-zinc-200 p-5 card-shadow">
              <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4.5 h-4.5 ${iconColor}`} style={{ width: '18px', height: '18px' }} />
              </div>
              <p className={`text-2xl font-bold mb-1 ${metricColor}`}>{metric}</p>
              <p className="text-sm font-semibold text-zinc-800 mb-1.5">{title}</p>
              <p className="text-xs text-zinc-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        {/* Call to action footer */}
        <div className="bg-white/70 border border-white rounded-xl px-5 py-4 text-center">
          <p className="text-xs text-zinc-500 mb-1">Ready to evaluate your rooftop?</p>
          <p className="text-sm font-semibold text-zinc-800">
            Solar Landscape · Commercial Rooftop Solar · Asbury Park, NJ
          </p>
        </div>
      </div>
    </section>
  );
}
