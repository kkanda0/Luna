'use client';

import dynamic from 'next/dynamic';
import type { AnalysisResult } from '@/lib/types';
import { ExecutivePanel } from './ExecutivePanel';
import { FactorGrid } from './FactorGrid';
import { ZoningRiskPanel } from './ZoningRiskPanel';
import { MethodologySection } from './MethodologySection';
import { BuildingOwnerSummary } from './BuildingOwnerSummary';
import { ArrowLeft } from 'lucide-react';

const MapPanel = dynamic(
  () => import('./MapPanel').then(m => ({ default: m.MapPanel })),
  {
    ssr: false,
    loading: () => (
      <section>
        <div className="h-96 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center animate-pulse">
          <p className="text-sm text-zinc-400">Loading map…</p>
        </div>
      </section>
    ),
  },
);

interface ResultsDashboardProps {
  result: AnalysisResult;
  onReset: () => void;
}

export function ResultsDashboard({ result, onReset }: ResultsDashboardProps) {
  return (
    <div className="space-y-8 pb-4">
      {/* Breadcrumb */}
      <button
        onClick={onReset}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700 transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Analyze another property
      </button>

      {/* 1 · Executive decision */}
      <ExecutivePanel result={result} />

      {/* 2 · Factor breakdown */}
      <FactorGrid factors={result.factors} />

      {/* 3 · Map / geographic context */}
      <MapPanel result={result} />

      {/* 4 · Execution risk */}
      <ZoningRiskPanel result={result} />

      {/* 5 · Solar pitch */}
      <BuildingOwnerSummary result={result} />

      {/* 6 · Methodology (collapsible) */}
      <MethodologySection />
    </div>
  );
}
