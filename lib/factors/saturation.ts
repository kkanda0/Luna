import type { FactorScore, GeocodeResult, DataCenter } from '../types';
import { haversineDistance } from '../haversine';
import { FACTOR_WEIGHTS } from '../scoring';
import datacenters from '../../data/datacenters.json';

const DCS = datacenters as DataCenter[];
const SATURATION_RADIUS_MI = 15;

export async function analyzeSaturation(
  geo: GeocodeResult,
  googleKey: string,
): Promise<FactorScore> {
  const target = geo.coordinates;

  // Count DCs from hardcoded list within 15mi
  const hardcodedNearby = DCS.filter(
    (dc) => haversineDistance(target, dc.coordinates) <= SATURATION_RADIUS_MI,
  );

  // Also query Google Places for data centers / colocation
  let placesCount = 0;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    const url = new URL(
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
    );
    url.searchParams.set('location', `${target.lat},${target.lng}`);
    url.searchParams.set('radius', '24140'); // 15mi in meters
    url.searchParams.set('keyword', 'data center colocation server farm');
    url.searchParams.set('key', googleKey);

    const res = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      placesCount = (data.results ?? []).length;
    }
  } catch {
    // Non-critical — hardcoded list is sufficient
  }

  const totalCount = hardcodedNearby.length + Math.min(placesCount, 5);

  // INVERTED: more DCs = lower score (more competition)
  const rawScore = Math.max(0, Math.round(100 - totalCount * 10));

  let headline: string;
  let detail: string;
  let recommendation: string;

  if (totalCount === 0) {
    headline = `No established data centers within ${SATURATION_RADIUS_MI} miles`;
    detail = `The absence of existing data center infrastructure nearby might initially appear to be an opportunity. However, it most likely signals low edge compute demand in this area. Where there IS genuine demand, established operators invariably claim the market first. A greenfield edge DC here would need to build the customer base from scratch.`;
    recommendation = `No existing DCs nearby likely indicates low market demand, not an open opportunity.`;
  } else if (totalCount <= 3) {
    headline = `${totalCount} data center${totalCount > 1 ? 's' : ''} operating within ${SATURATION_RADIUS_MI} miles`;
    detail = `There are ${totalCount} established data center facilities within ${SATURATION_RADIUS_MI} miles, including ${hardcodedNearby.slice(0, 2).map((d) => d.name).join(' and ')}. A new entrant would compete against operators with existing carrier relationships, redundant infrastructure, and established SLAs. While not fully saturated, this market already has options for tenants.`;
    recommendation = `${totalCount} competitors within ${SATURATION_RADIUS_MI} miles have established carrier relationships and track records that are hard to displace.`;
  } else if (totalCount <= 7) {
    headline = `${totalCount} data centers within ${SATURATION_RADIUS_MI} miles — competitive market`;
    detail = `With ${totalCount} operational data center facilities within ${SATURATION_RADIUS_MI} miles — including major operators like ${hardcodedNearby.slice(0, 2).map((d) => `${d.name} (${d.operator})`).join(' and ')} — this market is well-served. New entrants face established competitors with redundant power feeds, diverse carrier options, and long-term tenant relationships. Market share would be extremely difficult to capture.`;
    recommendation = `Heavily competitive market — ${totalCount} data center facilities within ${SATURATION_RADIUS_MI} miles with established operators and carrier agreements.`;
  } else {
    headline = `${totalCount}+ data centers within ${SATURATION_RADIUS_MI} miles — saturated market`;
    detail = `This is one of the most data center-dense corridors in the region, with ${totalCount}+ facilities within ${SATURATION_RADIUS_MI} miles. Operating in this zone means competing with Equinix, Digital Realty, and other Tier 3/4 operators who offer certified redundancy, diverse carriers, and decades of operational track records. A new building conversion cannot realistically compete on any dimension.`;
    recommendation = `Saturated market — ${totalCount}+ existing facilities dominate this corridor. Zero viable path to tenant acquisition.`;
  }

  const weight = FACTOR_WEIGHTS.saturation;
  return {
    factorId: 'saturation',
    label: 'Market Saturation',
    icon: '🏢',
    weight,
    rawScore,
    weightedScore: Math.round(rawScore * weight * 10) / 10,
    status: 'live',
    headline,
    detail,
    impact: rawScore >= 60 ? 'neutral' : 'boosts_solar',
    dataPoints: {
      hardcodedDCsWithin15Mi: hardcodedNearby.length,
      googlePlacesResults: placesCount,
      totalEstimated: totalCount,
      namedFacilities: hardcodedNearby.slice(0, 5).map((d) => d.name),
    },
    recommendation,
  };
}
