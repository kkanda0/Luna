import type { FactorScore, GeocodeResult, DataCenter } from '../types';
import { haversineDistance } from '../haversine';
import { FACTOR_WEIGHTS } from '../scoring';
import datacenters from '../../data/datacenters.json';

const DCS = datacenters as DataCenter[];

export function analyzeBackhaul(geo: GeocodeResult): {
  factor: FactorScore;
  nearbyDCs: DataCenter[];
} {
  const target = geo.coordinates;

  // Calculate distance to all DCs
  const withDist = DCS.map((dc) => ({
    ...dc,
    distanceMi: haversineDistance(target, dc.coordinates),
  })).sort((a, b) => a.distanceMi - b.distanceMi);

  const nearest = withDist[0];
  const distMi = nearest.distanceMi;

  // Score: 100 at 0mi, 0 at 50mi+
  const rawScore = Math.round(Math.max(0, 100 - (distMi / 50) * 100));

  // DCs within 30mi for map display
  const nearbyDCs = withDist.filter((dc) => dc.distanceMi <= 30);

  let headline: string;
  let detail: string;
  let recommendation: string;

  if (distMi < 10) {
    headline = `${nearest.name} is ${distMi.toFixed(1)} mi away — excellent backhaul proximity`;
    detail = `Edge data centers require constant high-bandwidth sync with core infrastructure for model updates, data replication, and workload handoff. At ${distMi.toFixed(1)} miles from ${nearest.name} (${nearest.operator}), backhaul latency and cost are manageable — a genuine strength for edge viability.`;
    recommendation = `Backhaul access to core infrastructure is adequate (${distMi.toFixed(1)} mi to ${nearest.name}).`;
  } else if (distMi < 25) {
    headline = `Nearest core DC is ${distMi.toFixed(1)} mi away — moderate backhaul`;
    detail = `Edge data centers depend on core infrastructure for synchronization, redundancy, and workload offloading. At ${distMi.toFixed(1)} miles from the nearest major facility (${nearest.name}, ${nearest.operator}), backhaul costs will be elevated but not prohibitive. However, this distance introduces measurable latency that could affect latency-sensitive workloads.`;
    recommendation = `Backhaul to core infrastructure is ${distMi.toFixed(1)} miles (${nearest.name}), adding operational cost and latency risk.`;
  } else {
    headline = `${distMi.toFixed(1)} mi to nearest DC — poor backhaul efficiency`;
    detail = `Edge data centers cannot operate in isolation — they require continuous synchronization with larger regional facilities. At ${distMi.toFixed(1)} miles from the nearest major data center (${nearest.name}, ${nearest.operator}), this site faces significant backhaul costs, higher latency exposure, and limited redundancy options. Dedicated fiber circuits at this distance carry substantial recurring costs.`;
    recommendation = `Poor backhaul position — ${distMi.toFixed(1)} miles to nearest core DC (${nearest.name}). Sustained connectivity costs would be prohibitive.`;
  }

  const weight = FACTOR_WEIGHTS.backhaul;
  const factor: FactorScore = {
    factorId: 'backhaul',
    label: 'Backhaul Efficiency',
    icon: '🔗',
    weight,
    rawScore,
    weightedScore: Math.round(rawScore * weight * 10) / 10,
    status: 'live',
    headline,
    detail,
    impact: rawScore >= 60 ? 'boosts_edge' : 'boosts_solar',
    dataPoints: {
      nearestDC: nearest.name,
      nearestOperator: nearest.operator,
      distanceMi: distMi.toFixed(1),
      top5DCs: withDist.slice(0, 5).map((d) => ({
        name: d.name,
        distanceMi: d.distanceMi.toFixed(1),
      })),
    },
    recommendation,
  };

  return { factor, nearbyDCs };
}
