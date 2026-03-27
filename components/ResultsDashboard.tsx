'use client';

import dynamic from 'next/dynamic';
import type { AnalysisResult } from '@/lib/types';
import { ExecutivePanel } from './ExecutivePanel';
import { FactorGrid } from './FactorGrid';
import { ZoningRiskPanel } from './ZoningRiskPanel';
import { MethodologySection } from './MethodologySection';
import { BuildingOwnerSummary } from './BuildingOwnerSummary';

const MapPanel = dynamic(() => import('./MapPanel').then((m) => ({ default: m.MapPanel })), {
  ssr: false,
  loading: () => (
    <div className="h-96 rounded-xl bg-zinc-100 flex items-center justify-center text-sm text-zinc-400">
      Loading map…
    </div>
  ),
});

interface ResultsDashboardProps {
  result: AnalysisResult;
  onReset: () => void;
}

export function ResultsDashboard({ result, onReset }: ResultsDashboardProps) {
  return (
    <div className="w-full space-y-8">
      {/* Back button */}
      <button
        onClick={onReset}
        className="text-sm text-zinc-500 hover:text-zinc-700 flex items-center gap-1 transition-colors"
      >
        ← Analyze another property
      </button>

      {/* Executive summary */}
      <ExecutivePanel result={result} />

      {/* Factor cards */}
      <FactorGrid factors={result.factors} />

      {/* Map */}
      <MapPanel result={result} />

      {/* Risk panel */}
      <ZoningRiskPanel result={result} />

      {/* Solar pitch */}
      <BuildingOwnerSummary result={result} />

      {/* Methodology */}
      <MethodologySection />
    </div>
  );
}
