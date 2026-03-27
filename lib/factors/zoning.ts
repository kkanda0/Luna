import type { FactorScore, GeocodeResult, ZoningResult } from '../types';
import { FACTOR_WEIGHTS } from '../scoring';

function urbanClassFromDensity(
  density: number,
): ZoningResult['urbanClass'] {
  if (density > 10000) return 'dense_urban';
  if (density > 5000) return 'urban';
  if (density > 1000) return 'suburban';
  return 'rural';
}

function scoreFromUrbanClass(urbanClass: ZoningResult['urbanClass']): number {
  switch (urbanClass) {
    case 'dense_urban': return 15;
    case 'urban':       return 30;
    case 'suburban':    return 55;
    case 'rural':       return 75;
  }
}

export async function analyzeZoning(
  geo: GeocodeResult,
): Promise<{ factor: FactorScore; zoningResult: ZoningResult }> {
  const { lat, lng } = geo.coordinates;
  let populationDensityPerSqMi = 0;
  let tractGeoid = '';
  let status: 'live' | 'fallback' = 'live';

  // Step 1: Get census tract from coordinates
  try {
    const geoController = new AbortController();
    const geoTimeout = setTimeout(() => geoController.abort(), 8000);
    const geoUrl =
      `https://geocoding.geo.census.gov/geocoder/geographies/coordinates` +
      `?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current` +
      `&layers=Census+Tracts&format=json`;

    const geoRes = await fetch(geoUrl, { signal: geoController.signal });
    clearTimeout(geoTimeout);

    if (geoRes.ok) {
      const geoData = await geoRes.json();
      const tracts = geoData?.result?.geographies?.['Census Tracts'] ?? [];
      if (tracts.length > 0) {
        const tract = tracts[0];
        const state = tract.STATE;
        const county = tract.COUNTY;
        const tractNum = tract.TRACT;
        tractGeoid = `${state}${county}${tractNum}`;

        // Step 2: Get ACS population data for the tract
        try {
          const acsController = new AbortController();
          const acsTimeout = setTimeout(() => acsController.abort(), 8000);
          const acsUrl =
            `https://api.census.gov/data/2022/acs/acs5` +
            `?get=B01003_001E,B01003_001MA` +
            `&for=tract:${tractNum}&in=state:${state}%20county:${county}`;

          const acsRes = await fetch(acsUrl, { signal: acsController.signal });
          clearTimeout(acsTimeout);

          if (acsRes.ok) {
            const acsData = await acsRes.json();
            // acsData[0] = headers, acsData[1] = values
            if (acsData.length >= 2) {
              const pop = parseInt(acsData[1][0], 10);
              // Average census tract is ~1.5 sq miles
              populationDensityPerSqMi = Math.round(pop / 1.5);
            }
          } else {
            status = 'fallback';
          }
        } catch {
          status = 'fallback';
        }
      } else {
        status = 'fallback';
      }
    } else {
      status = 'fallback';
    }
  } catch {
    status = 'fallback';
  }

  // Fallback: use NJ state average density
  if (status === 'fallback' || populationDensityPerSqMi === 0) {
    status = 'fallback';
    populationDensityPerSqMi = 1200; // NJ suburban average
  }

  const urbanClass = urbanClassFromDensity(populationDensityPerSqMi);
  const rawScore = scoreFromUrbanClass(urbanClass);

  const zoningResult: ZoningResult = {
    populationDensityPerSqMi,
    tractGeoid,
    urbanClass,
    status,
  };

  let headline: string;
  let detail: string;
  let recommendation: string;

  switch (urbanClass) {
    case 'dense_urban':
      headline = `Dense urban area (${populationDensityPerSqMi.toLocaleString()}/sqmi) — major zoning friction`;
      detail = `Dense urban environments impose the highest barriers to data center development. Industrial-scale electrical infrastructure, cooling towers, and backup generators face intense scrutiny from planning boards, noise ordinances, and community opposition. NYC-adjacent zones have some of the longest permitting timelines in the country — 3–7 years is typical for projects involving significant electrical load increases.`;
      recommendation = `Dense urban zoning creates severe permitting friction, noise/visual objections, and multi-year approval timelines for data center conversion.`;
      break;
    case 'urban':
      headline = `Urban density (${populationDensityPerSqMi.toLocaleString()}/sqmi) — significant permitting challenges`;
      detail = `Urban areas present meaningful zoning obstacles for data center conversion. Rooftop cooling equipment, electrical transformers, backup generators, and 24/7 operations often conflict with mixed-use zoning, residential adjacency, and community aesthetic standards. Conditional use permits and environmental impact reviews add 18–36 months to project timelines.`;
      recommendation = `Urban setting requires conditional use permits, environmental review, and community notification — adding 1.5–3 years to the permitting path.`;
      break;
    case 'suburban':
      headline = `Suburban density (${populationDensityPerSqMi.toLocaleString()}/sqmi) — moderate zoning friction`;
      detail = `Suburban commercial zones have more straightforward paths to data center permitting than dense urban areas, but commercial-to-industrial conversion typically requires a zoning variance or special use permit. Backup generator noise, cooling systems, and increased truck traffic often trigger conditional approval requirements and neighborhood review processes.`;
      recommendation = `Suburban commercial rezoning typically requires a special use permit (6–18 months). Generator noise and traffic are likely neighborhood objections.`;
      break;
    case 'rural':
      headline = `Low-density area (${populationDensityPerSqMi.toLocaleString()}/sqmi) — easiest zoning path`;
      detail = `Low-density rural/exurban areas have the most permissive regulatory environment for data center development. Fewer neighbors means less community opposition to cooling equipment noise, backup generator testing, and increased electrical infrastructure. However, this population density likely indicates insufficient edge compute demand to justify the project — and poor access to enterprise fiber networks.`;
      recommendation = `Easiest permitting path, but low density suggests insufficient edge demand and poor fiber diversity in this market.`;
      break;
  }

  const weight = FACTOR_WEIGHTS.zoning;
  return {
    factor: {
      factorId: 'zoning',
      label: 'Zoning Friction',
      icon: '📋',
      weight,
      rawScore,
      weightedScore: Math.round(rawScore * weight * 10) / 10,
      status,
      headline,
      detail,
      impact: rawScore >= 55 ? 'neutral' : 'boosts_solar',
      dataPoints: {
        populationDensityPerSqMi,
        urbanClass,
        tractGeoid: tractGeoid || 'N/A',
        dataSource: status === 'live' ? 'Census ACS 2022' : 'NJ state average fallback',
      },
      recommendation,
    },
    zoningResult,
  };
}
