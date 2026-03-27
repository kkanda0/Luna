import type { FactorScore, GeocodeResult, FiberResult } from '../types';
import { FACTOR_WEIGHTS } from '../scoring';

// Hardcoded NJ county-level fiber fallback (providers with fiber service)
const NJ_COUNTY_FIBER: Record<string, number> = {
  hudson: 4,
  essex: 4,
  union: 3,
  bergen: 3,
  middlesex: 3,
  passaic: 2,
  morris: 2,
  somerset: 2,
  mercer: 2,
  monmouth: 2,
  ocean: 1,
  atlantic: 1,
  cape_may: 1,
  cumberland: 1,
  salem: 1,
  gloucester: 1,
  camden: 2,
  burlington: 2,
  warren: 1,
  sussex: 1,
  hunterdon: 1,
};

function fiberScoreFromCount(count: number): number {
  if (count === 0) return 10;
  if (count === 1) return 35;
  if (count === 2) return 55;
  if (count === 3) return 70;
  return 85;
}

function countyToKey(county: string): string {
  return county.toLowerCase().replace(/\s+county$/i, '').trim().replace(/\s+/g, '_');
}

export async function analyzeFiber(
  geo: GeocodeResult,
  fccUsername: string | undefined,
): Promise<{ factor: FactorScore; fiberResult: FiberResult }> {
  const { lat, lng } = geo.coordinates;
  let blockFips = '';
  let fiberProviderCount = 0;
  let status: 'live' | 'fallback' = 'live';

  // Step 1: Get census block FIPS (no auth required)
  try {
    const blockController = new AbortController();
    const blockTimeout = setTimeout(() => blockController.abort(), 6000);
    const blockUrl = `https://geo.fcc.gov/api/census/block/find?latitude=${lat}&longitude=${lng}&format=json`;
    const blockRes = await fetch(blockUrl, { signal: blockController.signal });
    clearTimeout(blockTimeout);

    if (blockRes.ok) {
      const blockData = await blockRes.json();
      blockFips = blockData?.Block?.FIPS ?? '';
    }
  } catch {
    status = 'fallback';
  }

  // Step 2: Query FCC broadband availability (requires username)
  if (blockFips && fccUsername) {
    try {
      const availController = new AbortController();
      const availTimeout = setTimeout(() => availController.abort(), 7000);
      const availUrl = new URL('https://broadbandmap.fcc.gov/api/public/map/listAvailability');
      availUrl.searchParams.set('latitude', String(lat));
      availUrl.searchParams.set('longitude', String(lng));
      availUrl.searchParams.set('unit', 'location');
      availUrl.searchParams.set('username', fccUsername);

      const availRes = await fetch(availUrl.toString(), { signal: availController.signal });
      clearTimeout(availTimeout);

      if (availRes.ok) {
        const availData = await availRes.json();
        const providers = availData?.data ?? [];
        // Count fiber technology providers (tech_code 50 = fiber)
        fiberProviderCount = providers.filter(
          (p: { technology: number }) => p.technology === 50,
        ).length;
        status = 'live';
      } else {
        status = 'fallback';
      }
    } catch {
      status = 'fallback';
    }
  } else if (!fccUsername) {
    status = 'fallback';
  }

  // Fallback: use county-level data
  if (status === 'fallback') {
    const countyKey = countyToKey(geo.county);
    fiberProviderCount = NJ_COUNTY_FIBER[countyKey] ?? 1;
  }

  const rawScore = fiberScoreFromCount(fiberProviderCount);
  const hasFiber = fiberProviderCount > 0;

  let headline: string;
  let detail: string;
  let recommendation: string;

  if (fiberProviderCount === 0) {
    headline = `No fiber providers detected — critical connectivity gap`;
    detail = `Edge data centers require diverse, redundant fiber connectivity — typically multiple 10Gbps+ circuits from independent providers to meet carrier-neutral uptime guarantees. With no fiber providers detected at this location, meeting baseline edge DC connectivity requirements would require building entirely new fiber infrastructure, costing $50,000–$500,000 per mile.`;
    recommendation = `No fiber connectivity detected. Fiber buildout costs ($50K–$500K/mi) make this location economically non-viable for edge hosting.`;
  } else if (fiberProviderCount === 1) {
    headline = `Only 1 fiber provider — single point of failure for edge DC`;
    detail = `Edge data centers require diverse, carrier-neutral fiber connectivity to meet standard uptime SLAs. With only 1 fiber provider available, this location has no path to the redundant connectivity that enterprise tenants require. A single fiber cut would take the entire facility offline with no failover option.`;
    recommendation = `Single fiber provider creates unacceptable single-point-of-failure risk. Enterprise tenants require multi-carrier fiber redundancy.`;
  } else if (fiberProviderCount === 2) {
    headline = `${fiberProviderCount} fiber providers — minimal redundancy for edge operations`;
    detail = `With ${fiberProviderCount} fiber providers, this location has the minimum possible path to carrier redundancy. While technically dual-homed configurations are feasible, two-provider markets often have limited competitive pricing and constrained bandwidth capacity. Purpose-built colocation facilities in this market corridor typically offer 10+ carrier options.`;
    recommendation = `${fiberProviderCount} fiber providers provides minimal redundancy but limited carrier diversity compared to established colocation facilities.`;
  } else if (fiberProviderCount <= 3) {
    headline = `${fiberProviderCount} fiber providers — moderate connectivity`;
    detail = `With ${fiberProviderCount} fiber providers, this location has reasonable fiber diversity for basic edge operations. However, established colocation facilities in the NJ/NY corridor typically offer 10–20 carrier options, enabling far lower bandwidth costs through competitive bidding. A converted building would immediately be at a competitive disadvantage on transit pricing.`;
    recommendation = `${fiberProviderCount} fiber providers is adequate but falls short of the carrier diversity that established colocation facilities offer tenants.`;
  } else {
    headline = `${fiberProviderCount} fiber providers — good connectivity, but DC competition is high`;
    detail = `Multiple fiber providers indicate good market connectivity. However, areas with dense fiber infrastructure tend to already have established data center facilities that have locked in carrier relationships and negotiated deeply discounted transit pricing. A new entrant in a fiber-rich market faces the most sophisticated competition.`;
    recommendation = `Good fiber diversity, but dense fiber markets are also where established DCs have strongest competitive positions on transit pricing.`;
  }

  const fiberResult: FiberResult = {
    hasFiber,
    providerCount: fiberProviderCount,
    fiberProviderCount,
    blockFips,
    status,
  };

  const weight = FACTOR_WEIGHTS.fiber;
  return {
    factor: {
      factorId: 'fiber',
      label: 'Fiber Connectivity',
      icon: '🌐',
      weight,
      rawScore,
      weightedScore: Math.round(rawScore * weight * 10) / 10,
      status,
      headline,
      detail,
      impact: rawScore >= 55 ? 'boosts_edge' : 'boosts_solar',
      dataPoints: {
        fiberProviderCount,
        blockFips: blockFips || 'N/A',
        dataSource: status === 'live' ? 'FCC Broadband Map' : 'NJ County-level fallback',
        county: geo.county,
      },
      recommendation,
    },
    fiberResult,
  };
}
