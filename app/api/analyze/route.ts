import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import type { AnalysisResult, FactorScore, GeocodeResult } from '@/lib/types';
import { computeWeightedScore, getVerdict, getVerdictLabel, getSolarPitchStrength, buildNarrative, buildTopReasons, FACTOR_WEIGHTS } from '@/lib/scoring';
import { cacheGet, cacheSet } from '@/lib/cache';
import { analyzeBackhaul } from '@/lib/factors/backhaul';
import { analyzeDemand } from '@/lib/factors/demand';
import { analyzeSaturation } from '@/lib/factors/saturation';
import { analyzeSuitability } from '@/lib/factors/suitability';
import { analyzeFiber } from '@/lib/factors/fiber';
import { analyzeZoning } from '@/lib/factors/zoning';
import { analyzeClimate } from '@/lib/factors/climate';
import { analyzePower } from '@/lib/factors/power';

function fallbackFactor(
  factorId: FactorScore['factorId'],
  label: string,
  icon: string,
  error?: string,
): FactorScore {
  const weight = FACTOR_WEIGHTS[factorId];
  return {
    factorId,
    label,
    icon,
    weight,
    rawScore: 30,
    weightedScore: Math.round(30 * weight * 10) / 10,
    status: 'unavailable',
    headline: `${label} data temporarily unavailable`,
    detail: `Analysis for ${label} could not be completed at this time${error ? `: ${error}` : ''}. A conservative score has been applied.`,
    impact: 'neutral',
    dataPoints: { error: error ?? 'Unknown error' },
    recommendation: `${label} data unavailable — manual assessment recommended.`,
  };
}

export async function POST(request: NextRequest) {
  let body: { address?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { address } = body;
  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    return NextResponse.json({ success: false, error: 'Missing address' }, { status: 400 });
  }

  // Cache check
  const cached = cacheGet(address);
  if (cached) {
    return NextResponse.json({ success: true, data: { ...cached, cached: true } });
  }

  const googleKey = process.env.GOOGLE_MAPS_API_KEY ?? '';
  const fccUsername = process.env.FCC_USERNAME;

  // Geocode (sequential — all factors need lat/lng)
  let geo: GeocodeResult;
  try {
    const geoUrl = new URL('/api/geocode', request.url);
    geoUrl.searchParams.set('address', address.trim());
    const geoRes = await fetch(geoUrl.toString());
    const geoData = await geoRes.json();
    if (!geoData.success) {
      return NextResponse.json({ success: false, error: geoData.error ?? 'Geocoding failed' }, { status: 422 });
    }
    geo = geoData.data as GeocodeResult;
  } catch {
    return NextResponse.json({ success: false, error: 'Geocoding service failed' }, { status: 502 });
  }

  // Parallel factor analysis
  const [
    backhaulResult,
    demandResult,
    saturationResult,
    suitabilityResult,
    fiberResult,
    zoningResult,
    climateResult,
    powerResult,
  ] = await Promise.allSettled([
    Promise.resolve(analyzeBackhaul(geo)),
    analyzeDemand(geo, googleKey),
    analyzeSaturation(geo, googleKey),
    analyzeSuitability(geo, googleKey),
    analyzeFiber(geo, fccUsername),
    analyzeZoning(geo),
    analyzeClimate(geo),
    Promise.resolve(analyzePower(geo)),
  ]);

  // Unwrap results — rejected → fallback factor
  const backhaulFactor =
    backhaulResult.status === 'fulfilled'
      ? backhaulResult.value.factor
      : fallbackFactor('backhaul', 'Backhaul Efficiency', '🔗');

  const nearbyDCs =
    backhaulResult.status === 'fulfilled' ? backhaulResult.value.nearbyDCs : [];

  const demandFactor =
    demandResult.status === 'fulfilled'
      ? demandResult.value.factor
      : fallbackFactor('demand', 'Edge Demand Signal', '📡');

  const nearbyBusinesses =
    demandResult.status === 'fulfilled' ? demandResult.value.businesses : [];

  const saturationFactor =
    saturationResult.status === 'fulfilled'
      ? saturationResult.value
      : fallbackFactor('saturation', 'Market Saturation', '🏢');

  const suitabilityFactor =
    suitabilityResult.status === 'fulfilled'
      ? suitabilityResult.value
      : fallbackFactor('suitability', 'Building Suitability', '🏗️');

  const fiberFactor =
    fiberResult.status === 'fulfilled'
      ? fiberResult.value.factor
      : fallbackFactor('fiber', 'Fiber Connectivity', '🌐');

  const zoningFactor =
    zoningResult.status === 'fulfilled'
      ? zoningResult.value.factor
      : fallbackFactor('zoning', 'Zoning Friction', '📋');

  const climateFactor =
    climateResult.status === 'fulfilled'
      ? climateResult.value.factor
      : fallbackFactor('climate', 'Climate Risk', '🌊');

  const powerFactor =
    powerResult.status === 'fulfilled'
      ? powerResult.value.factor
      : fallbackFactor('power', 'Power Grid Capacity', '⚡');

  const factors: FactorScore[] = [
    demandFactor,
    backhaulFactor,
    saturationFactor,
    suitabilityFactor,
    fiberFactor,
    zoningFactor,
    climateFactor,
    powerFactor,
  ];

  const finalScore = computeWeightedScore(factors);
  const verdict = getVerdict(finalScore);
  const verdictLabel = getVerdictLabel(verdict);
  const solarPitchStrength = getSolarPitchStrength(verdict);
  const executiveSummary = buildNarrative(factors, verdict, geo.city);
  const topReasons = buildTopReasons(factors);

  const result: AnalysisResult = {
    requestId: uuidv4(),
    analyzedAt: new Date().toISOString(),
    address: geo,
    factors,
    finalScore,
    verdict,
    verdictLabel,
    solarPitchStrength,
    nearbyBusinesses,
    nearbyDataCenters: nearbyDCs,
    executiveSummary,
    topReasons,
    cached: false,
  };

  cacheSet(address, result);
  return NextResponse.json({ success: true, data: result });
}
