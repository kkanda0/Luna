import type { FactorScore, GeocodeResult, PowerResult } from '../types';
import { FACTOR_WEIGHTS } from '../scoring';
import utilities from '../../data/utilities.json';

interface UtilityZone {
  zone: string;
  utilityName: string;
  states: string[];
  zipPrefixes: string[];
  avgRateCentsPerKwh: number;
  gridReliabilityScore: number;
  notes: string;
}

const UTILITIES = utilities as UtilityZone[];

export function analyzePower(geo: GeocodeResult): {
  factor: FactorScore;
  powerResult: PowerResult;
} {
  const zip = geo.zipCode || '';
  const prefix = zip.substring(0, 3);
  const state = geo.state;

  // Find matching utility by zip prefix
  let matched = UTILITIES.find(
    (u) => u.zipPrefixes.includes(prefix) && u.states.includes(state),
  );

  // Fallback: match by state only
  if (!matched) {
    matched = UTILITIES.find((u) => u.states.includes(state));
  }

  // Final fallback
  const utility = matched ?? UTILITIES.find((u) => u.zone === 'DEFAULT')!;

  const rate = utility.avgRateCentsPerKwh;
  const reliabilityScore = utility.gridReliabilityScore;

  // Score: combine rate penalty + reliability
  // Low rate (< 12¢) → high score; high rate (> 16¢) → low score
  let rateScore: number;
  if (rate < 12) rateScore = 75;
  else if (rate < 14) rateScore = 60;
  else if (rate < 16) rateScore = 45;
  else if (rate < 18) rateScore = 30;
  else rateScore = 15;

  const rawScore = Math.round((rateScore * 0.6 + reliabilityScore * 0.4));

  let headline: string;
  let detail: string;
  let recommendation: string;

  if (rawScore >= 60) {
    headline = `${utility.utilityName} — ${rate}¢/kWh commercial rate`;
    detail = `Power costs are a primary operating expense for edge data centers, which consume 1–5+ MW continuously. At ${rate}¢/kWh under ${utility.utilityName}, operating costs are relatively competitive. However, the capital cost of grid interconnection, backup generators, and redundant UPS systems remains substantial regardless of rate.`;
    recommendation = `Power rates (${rate}¢/kWh via ${utility.utilityName}) are competitive, but interconnection queue delays still pose timeline risk.`;
  } else if (rawScore >= 40) {
    headline = `${utility.utilityName} — ${rate}¢/kWh rate creates operating cost headwinds`;
    detail = `Power is typically 30–50% of edge data center operating costs. At ${rate}¢/kWh under ${utility.utilityName}, energy expenses for a 1MW edge facility would exceed $1.2M annually — before accounting for cooling, labor, and maintenance. ${utility.notes}`;
    recommendation = `Above-average utility rates (${rate}¢/kWh, ${utility.utilityName}) compress edge DC margins significantly.`;
  } else {
    headline = `${utility.utilityName} at ${rate}¢/kWh — high power costs undermine edge economics`;
    detail = `At ${rate}¢/kWh, this location is among the highest-cost power markets in the region. A modest 1MW edge data center would spend $1.4M+ annually on electricity alone. Combined with PJM interconnection queue delays (often 3–5 years for commercial-scale loads) and grid capacity constraints, power economics represent a serious barrier. ${utility.notes}`;
    recommendation = `High utility rates (${rate}¢/kWh via ${utility.utilityName}) make edge data center economics very challenging. Annual power costs at 1MW would exceed $1.4M.`;
  }

  const weight = FACTOR_WEIGHTS.power;
  const powerResult: PowerResult = {
    utilityName: utility.utilityName,
    utilityZone: utility.zone,
    avgRateCentsPerKwh: rate,
    status: 'live',
  };

  const factor: FactorScore = {
    factorId: 'power',
    label: 'Power Grid Capacity',
    icon: '⚡',
    weight,
    rawScore,
    weightedScore: Math.round(rawScore * weight * 10) / 10,
    status: 'live',
    headline,
    detail,
    impact: rawScore >= 60 ? 'neutral' : 'boosts_solar',
    dataPoints: {
      utility: utility.utilityName,
      zone: utility.zone,
      rateCentsPerKwh: rate,
      annualCostAt1MW: `$${((rate / 100) * 1_000_000 * 8760 / 1_000_000).toFixed(2)}M`,
      gridReliabilityScore: reliabilityScore,
      notes: utility.notes,
    },
    recommendation,
  };

  return { factor, powerResult };
}
