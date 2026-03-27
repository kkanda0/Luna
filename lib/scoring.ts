import type { FactorId, FactorScore, EdgeVerdict } from './types';

export const FACTOR_WEIGHTS: Record<FactorId, number> = {
  demand:      0.20,
  backhaul:    0.10,
  saturation:  0.12,
  suitability: 0.15,
  fiber:       0.15,
  zoning:      0.10,
  climate:     0.08,
  power:       0.10,
};

export function computeWeightedScore(factors: FactorScore[]): number {
  const total = factors.reduce((sum, f) => sum + f.weightedScore, 0);
  return Math.round(Math.max(0, Math.min(100, total)));
}

export function getVerdict(score: number): EdgeVerdict {
  if (score < 35) return 'poor';
  if (score < 55) return 'marginal';
  if (score < 75) return 'moderate';
  return 'strong';
}

export function getVerdictLabel(verdict: EdgeVerdict): string {
  switch (verdict) {
    case 'poor':     return 'Poor Edge Candidate — Solar Recommended';
    case 'marginal': return 'Marginal Edge Candidate — Solar Likely Superior';
    case 'moderate': return 'Moderate Edge Potential — Detailed Analysis Needed';
    case 'strong':   return 'Strong Edge Candidate';
  }
}

export function getSolarPitchStrength(
  verdict: EdgeVerdict,
): 'strong' | 'moderate' | 'weak' {
  switch (verdict) {
    case 'poor':     return 'strong';
    case 'marginal': return 'moderate';
    case 'moderate': return 'moderate';
    case 'strong':   return 'weak';
  }
}

export function buildNarrative(
  factors: FactorScore[],
  verdict: EdgeVerdict,
  city: string,
): string {
  const score = computeWeightedScore(factors);
  const lowestFactors = [...factors]
    .sort((a, b) => a.rawScore - b.rawScore)
    .slice(0, 2)
    .map((f) => f.label.toLowerCase());

  const intros: Record<EdgeVerdict, string> = {
    poor: `This property faces significant structural barriers to edge data center conversion.`,
    marginal: `This property shows some edge data center potential but faces several meaningful obstacles.`,
    moderate: `This property has moderate edge data center viability, though several factors warrant careful consideration.`,
    strong: `This property demonstrates strong characteristics for edge data center development.`,
  };

  return `${intros[verdict]} With a composite score of ${score}/100, the analysis highlights particular concerns around ${lowestFactors.join(' and ')}. ${
    verdict === 'poor' || verdict === 'marginal'
      ? `For Solar Landscape, this creates a compelling opportunity: a rooftop solar installation offers predictable lease income with none of the operational complexity, capital intensity, or regulatory friction that an edge data center would require.`
      : `Even with this score, the operational and capital requirements for a viable edge data center remain substantial. A Solar Landscape rooftop installation can generate reliable income from day one with far less risk.`
  }`;
}

export function buildTopReasons(factors: FactorScore[]): string[] {
  return [...factors]
    .sort((a, b) => a.rawScore - b.rawScore)
    .slice(0, 3)
    .map((f) => f.recommendation);
}
