import type { AnalysisResult } from '@/lib/types';
import { ShieldAlert } from 'lucide-react';

interface ZoningRiskPanelProps {
  result: AnalysisResult;
}

interface RiskMeterProps {
  label: string;
  description: string;
  risk: number; // 0-100, higher = more risk
  icon: string;
}

function RiskMeter({ label, description, risk, icon }: RiskMeterProps) {
  const level = risk >= 65 ? 'high' : risk >= 40 ? 'moderate' : 'low';
  const config = {
    high:     { bar: 'bg-red-400',    text: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-100',    badge: 'bg-red-100 text-red-700',    label: 'High' },
    moderate: { bar: 'bg-amber-400',  text: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-100',  badge: 'bg-amber-100 text-amber-700',  label: 'Moderate' },
    low:      { bar: 'bg-emerald-400', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', badge: 'bg-emerald-100 text-emerald-700', label: 'Low' },
  }[level];

  return (
    <div className={`rounded-xl border ${config.border} ${config.bg} p-4`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <div>
            <p className="text-sm font-semibold text-zinc-800">{label}</p>
            <p className="text-xs text-zinc-500 leading-snug">{description}</p>
          </div>
        </div>
        <span className={`flex-shrink-0 text-[10px] font-bold rounded-full px-2 py-0.5 ${config.badge}`}>
          {config.label}
        </span>
      </div>
      {/* Segmented risk bar */}
      <div className="space-y-1">
        <div className="w-full h-2 bg-white/80 rounded-full overflow-hidden">
          <div
            className={`h-2 rounded-full ${config.bar} transition-all duration-700`}
            style={{ width: `${risk}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-zinc-400 font-medium">
          <span>Low risk</span>
          <span>High risk</span>
        </div>
      </div>
    </div>
  );
}

export function ZoningRiskPanel({ result }: ZoningRiskPanelProps) {
  const climateFactor  = result.factors.find(f => f.factorId === 'climate');
  const zoningFactor   = result.factors.find(f => f.factorId === 'zoning');
  const powerFactor    = result.factors.find(f => f.factorId === 'power');
  const suitFactor     = result.factors.find(f => f.factorId === 'suitability');

  const floodZone   = String(climateFactor?.dataPoints?.floodZone ?? '—');
  const coastalMi   = Number(climateFactor?.dataPoints?.coastalProximityMi ?? 0);
  const urbanClass  = String(zoningFactor?.dataPoints?.urbanClass ?? '—').replace(/_/g, ' ');
  const density     = Number(zoningFactor?.dataPoints?.populationDensityPerSqMi ?? 0);
  const rate        = Number(powerFactor?.dataPoints?.rateCentsPerKwh ?? 0);
  const utility     = String(powerFactor?.dataPoints?.utility ?? '—');
  const annualCost  = String(powerFactor?.dataPoints?.annualCostAt1MW ?? '—');
  const buildingType = String(suitFactor?.dataPoints?.classificationLabel ?? '—');

  const floodRisk   = climateFactor  ? 100 - climateFactor.rawScore  : 50;
  const zoningRisk  = zoningFactor   ? 100 - zoningFactor.rawScore   : 50;
  const powerRisk   = powerFactor    ? 100 - powerFactor.rawScore    : 50;
  const structRisk  = suitFactor     ? 100 - suitFactor.rawScore     : 70;

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert className="w-5 h-5 text-zinc-400" />
        <h2 className="text-lg font-bold text-zinc-800">Execution & Environmental Risk</h2>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 card-shadow-md overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-zinc-100">
          {/* Risk meters */}
          {[
            { label: 'Flood & Climate', description: `FEMA Zone ${floodZone} · ${coastalMi.toFixed(1)} mi coast`, risk: floodRisk, icon: '🌊' },
            { label: 'Zoning Friction', description: `${urbanClass} · ${density.toLocaleString()}/sqmi`, risk: zoningRisk, icon: '📋' },
            { label: 'Power Cost',      description: `${utility.split(' ').slice(0,2).join(' ')} · ${rate}¢/kWh`, risk: powerRisk, icon: '⚡' },
            { label: 'Structural Fit',  description: buildingType, risk: structRisk, icon: '🏗️' },
          ].map((item) => (
            <div key={item.label} className="bg-white p-4">
              <RiskMeter {...item} />
            </div>
          ))}
        </div>

        {/* Detail strip */}
        <div className="px-5 py-3 bg-zinc-50 border-t border-zinc-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-zinc-400 mb-0.5">FEMA flood zone</p>
              <p className={`font-semibold ${['A','AE','V','VE'].includes(floodZone) ? 'text-red-600' : 'text-zinc-700'}`}>{floodZone}</p>
            </div>
            <div>
              <p className="text-zinc-400 mb-0.5">Population density</p>
              <p className="font-semibold text-zinc-700">{density.toLocaleString()}/sqmi</p>
            </div>
            <div>
              <p className="text-zinc-400 mb-0.5">Power cost at 1MW</p>
              <p className="font-semibold text-zinc-700">{annualCost}/yr</p>
            </div>
            <div>
              <p className="text-zinc-400 mb-0.5">Building classification</p>
              <p className="font-semibold text-zinc-700 truncate">{buildingType}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
