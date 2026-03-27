import type { AnalysisResult } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ZoningRiskPanelProps {
  result: AnalysisResult;
}

function RiskMeter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-zinc-600 mb-1">
        <span className="font-medium">{label}</span>
        <span className={`font-semibold ${color}`}>{value}/100</span>
      </div>
      <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${
            value >= 65 ? 'bg-red-400' : value >= 40 ? 'bg-amber-400' : 'bg-emerald-400'
          }`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function ZoningRiskPanel({ result }: ZoningRiskPanelProps) {
  const climateFactor = result.factors.find((f) => f.factorId === 'climate');
  const zoningFactor = result.factors.find((f) => f.factorId === 'zoning');
  const powerFactor = result.factors.find((f) => f.factorId === 'power');

  const floodZone = String(climateFactor?.dataPoints?.floodZone ?? 'Unknown');
  const coastalMi = Number(climateFactor?.dataPoints?.coastalProximityMi ?? 0);
  const urbanClass = String(zoningFactor?.dataPoints?.urbanClass ?? 'Unknown');
  const density = Number(zoningFactor?.dataPoints?.populationDensityPerSqMi ?? 0);
  const rate = Number(powerFactor?.dataPoints?.rateCentsPerKwh ?? 0);
  const utility = String(powerFactor?.dataPoints?.utility ?? 'Unknown');

  const floodRisk = climateFactor ? 100 - climateFactor.rawScore : 50;
  const zoningRisk = zoningFactor ? 100 - zoningFactor.rawScore : 50;
  const powerRisk = powerFactor ? 100 - powerFactor.rawScore : 50;

  const floodColor = floodRisk >= 65 ? 'text-red-600' : floodRisk >= 40 ? 'text-amber-600' : 'text-emerald-600';
  const zoningColor = zoningRisk >= 65 ? 'text-red-600' : zoningRisk >= 40 ? 'text-amber-600' : 'text-emerald-600';
  const powerColor = powerRisk >= 65 ? 'text-red-600' : powerRisk >= 40 ? 'text-amber-600' : 'text-emerald-600';

  return (
    <section>
      <h2 className="text-lg font-bold text-zinc-800 mb-4">Environmental & Infrastructure Risks</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Flood / Climate */}
        <Card className="border-zinc-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              🌊 Flood & Climate Risk
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <RiskMeter label="Flood risk" value={floodRisk} color={floodColor} />
            <div className="text-xs text-zinc-600 space-y-1 pt-1">
              <div className="flex justify-between">
                <span className="text-zinc-500">FEMA Zone</span>
                <span className={`font-semibold ${['A','AE','V','VE'].includes(floodZone) ? 'text-red-600' : 'text-zinc-700'}`}>
                  {floodZone}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Coastal distance</span>
                <span className="font-medium text-zinc-700">{coastalMi.toFixed(1)} mi</span>
              </div>
            </div>
            <p className="text-xs text-zinc-500 pt-1">
              {floodRisk >= 65
                ? 'High flood risk requires expensive mitigation for critical equipment.'
                : floodRisk >= 40
                ? 'Moderate climate exposure. Coastal proximity increases insurance costs.'
                : 'Low flood risk for this area.'}
            </p>
          </CardContent>
        </Card>

        {/* Zoning / Density */}
        <Card className="border-zinc-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              📋 Zoning & Permitting Risk
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <RiskMeter label="Permitting friction" value={zoningRisk} color={zoningColor} />
            <div className="text-xs text-zinc-600 space-y-1 pt-1">
              <div className="flex justify-between">
                <span className="text-zinc-500">Urban class</span>
                <span className="font-semibold text-zinc-700 capitalize">{urbanClass.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Pop. density</span>
                <span className="font-medium text-zinc-700">{density.toLocaleString()}/sqmi</span>
              </div>
            </div>
            <p className="text-xs text-zinc-500 pt-1">
              {zoningRisk >= 65
                ? 'Dense urban zoning creates multi-year permitting friction.'
                : zoningRisk >= 40
                ? 'Suburban rezoning typically adds 6–18 months to project timelines.'
                : 'Favorable zoning environment for development.'}
            </p>
          </CardContent>
        </Card>

        {/* Power */}
        <Card className="border-zinc-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              ⚡ Power Grid Risk
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <RiskMeter label="Power cost risk" value={powerRisk} color={powerColor} />
            <div className="text-xs text-zinc-600 space-y-1 pt-1">
              <div className="flex justify-between">
                <span className="text-zinc-500">Utility</span>
                <span className="font-semibold text-zinc-700 truncate max-w-[120px]" title={utility}>{utility.split(' ').slice(0, 3).join(' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Rate</span>
                <span className="font-medium text-zinc-700">{rate}¢/kWh</span>
              </div>
            </div>
            <p className="text-xs text-zinc-500 pt-1">
              {powerRisk >= 65
                ? 'High power costs make edge DC economics very challenging.'
                : powerRisk >= 40
                ? 'Above-average rates compress margins significantly.'
                : 'Competitive power rates for this region.'}
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
