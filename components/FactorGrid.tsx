import type { FactorScore } from '@/lib/types';
import { FactorCard } from './FactorCard';

interface FactorGridProps {
  factors: FactorScore[];
}

export function FactorGrid({ factors }: FactorGridProps) {
  return (
    <section>
      <h2 className="text-lg font-bold text-zinc-800 mb-4">Factor Breakdown</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {factors.map((factor) => (
          <FactorCard key={factor.factorId} factor={factor} />
        ))}
      </div>
    </section>
  );
}
