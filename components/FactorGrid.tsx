import type { FactorScore } from '@/lib/types';
import { FactorCard } from './FactorCard';
import { BarChart3 } from 'lucide-react';

interface FactorGridProps {
  factors: FactorScore[];
}

export function FactorGrid({ factors }: FactorGridProps) {
  const avg = Math.round(factors.reduce((s, f) => s + f.rawScore, 0) / factors.length);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-zinc-400" />
          <h2 className="text-lg font-bold text-zinc-800">Factor Analysis</h2>
        </div>
        <span className="text-xs text-zinc-500 bg-zinc-100 rounded-full px-3 py-1">
          Avg factor score: <span className="font-semibold text-zinc-700">{avg}/100</span>
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {factors.map((factor, i) => (
          <FactorCard key={factor.factorId} factor={factor} index={i} />
        ))}
      </div>
    </section>
  );
}
