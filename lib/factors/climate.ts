import type { FactorScore, GeocodeResult, ClimateResult, FemaFloodZone } from '../types';
import { haversineDistance } from '../haversine';
import { FACTOR_WEIGHTS } from '../scoring';

// Coastal reference points for NJ/NY/PA coastline
const COASTAL_POINTS: Array<{ lat: number; lng: number }> = [
  { lat: 40.2179, lng: -74.0060 }, // Sandy Hook
  { lat: 40.1754, lng: -74.0288 }, // Sea Bright
  { lat: 40.1093, lng: -74.0388 }, // Long Branch
  { lat: 40.0146, lng: -74.0093 }, // Asbury Park
  { lat: 39.9318, lng: -74.0096 }, // Point Pleasant
  { lat: 39.8559, lng: -74.0782 }, // Seaside Heights
  { lat: 39.7023, lng: -74.2318 }, // Beach Haven
  { lat: 39.5010, lng: -74.3218 }, // Ocean City
  { lat: 39.3398, lng: -74.5938 }, // Cape May
  { lat: 40.5795, lng: -74.1502 }, // Staten Island
  { lat: 40.6892, lng: -74.0445 }, // Brooklyn
  { lat: 39.9526, lng: -75.1652 }, // Philadelphia (Delaware River)
];

// NJ zip codes with known high flood risk (AE/VE zones)
const HIGH_FLOOD_ZIPS = new Set([
  '07701', '07735', '07748', '07753', '07757', '07760', // Monmouth coast
  '08720', '08721', '08722', '08723', '08724', '08735', '08736', '08738', '08739', '08740',
  '08741', '08742', '08750', '08751', '08752', '08753', '08754', '08755', '08757',
  '08201', '08202', '08203', '08204', '08210', '08212', '08221', '08223', '08226', '08230',
  '08232', '08240', '08241', '08242', '08243', '08244', '08245', '08246', '08247',
  '08401', '08402', '08403', '08404', '08405', '08406', // Atlantic City
  '07001', '07002', '07003', '07008', '07036', // Perth Amboy / Raritan Bay
]);

const MODERATE_FLOOD_ZIPS = new Set([
  '07030', '07047', '07086', '07087', '07093', '07094', '07095', // Hudson County
  '07001', '07002', '07062', '07064', '07065', // Union County coast
  '08816', '08817', '08818', '08820', '08830', // Middlesex Coast
]);

function closestCoastalDistanceMi(lat: number, lng: number): number {
  return Math.min(
    ...COASTAL_POINTS.map((p) => haversineDistance({ lat, lng }, p)),
  );
}

function classifyFloodZone(zip: string): FemaFloodZone {
  if (HIGH_FLOOD_ZIPS.has(zip)) return 'AE';
  if (MODERATE_FLOOD_ZIPS.has(zip)) return 'X500';
  return 'X';
}

function scoreFromClimate(floodZone: FemaFloodZone, coastalMi: number): number {
  let floodPenalty: number;
  switch (floodZone) {
    case 'V':
    case 'VE':
      floodPenalty = 80;
      break;
    case 'A':
    case 'AE':
    case 'AH':
    case 'AO':
      floodPenalty = 55;
      break;
    case 'X500':
      floodPenalty = 30;
      break;
    default:
      floodPenalty = 0;
  }

  let coastalPenalty: number;
  if (coastalMi < 1) coastalPenalty = 40;
  else if (coastalMi < 3) coastalPenalty = 25;
  else if (coastalMi < 8) coastalPenalty = 15;
  else if (coastalMi < 20) coastalPenalty = 5;
  else coastalPenalty = 0;

  const totalPenalty = Math.min(90, floodPenalty + coastalPenalty);
  return Math.max(10, 100 - totalPenalty);
}

export async function analyzeClimate(
  geo: GeocodeResult,
): Promise<{ factor: FactorScore; climateResult: ClimateResult }> {
  const { lat, lng } = geo.coordinates;
  const zip = geo.zipCode;
  let floodZone: FemaFloodZone = 'UNKNOWN';
  let status: 'live' | 'fallback' = 'live';

  // Try FEMA ArcGIS Flood Zone lookup
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    // FEMA NFHL ArcGIS REST service
    const femaUrl = new URL(
      'https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query',
    );
    femaUrl.searchParams.set('geometry', `${lng},${lat}`);
    femaUrl.searchParams.set('geometryType', 'esriGeometryPoint');
    femaUrl.searchParams.set('inSR', '4326');
    femaUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
    femaUrl.searchParams.set('outFields', 'FLD_ZONE,ZONE_SUBTY');
    femaUrl.searchParams.set('returnGeometry', 'false');
    femaUrl.searchParams.set('f', 'json');

    const res = await fetch(femaUrl.toString(), { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const features = data?.features ?? [];
      if (features.length > 0) {
        const zone: string = features[0]?.attributes?.FLD_ZONE ?? 'X';
        const subType: string = features[0]?.attributes?.ZONE_SUBTY ?? '';
        if (zone === 'X' && subType?.includes('500')) {
          floodZone = 'X500';
        } else {
          floodZone = zone as FemaFloodZone;
        }
      } else {
        floodZone = 'X'; // No data = not in mapped flood zone
      }
    } else {
      status = 'fallback';
    }
  } catch {
    status = 'fallback';
  }

  // Fallback: use zip-based classification
  if (status === 'fallback' || floodZone === 'UNKNOWN') {
    status = 'fallback';
    floodZone = classifyFloodZone(zip);
  }

  const coastalProximityMi = Math.round(closestCoastalDistanceMi(lat, lng) * 10) / 10;
  const rawScore = scoreFromClimate(floodZone, coastalProximityMi);

  const climateResult: ClimateResult = {
    floodZone,
    coastalProximityMi,
    status,
  };

  const isHighRisk = ['A', 'AE', 'AH', 'AO', 'V', 'VE'].includes(floodZone);
  const isModerateRisk = floodZone === 'X500';
  const isCoastal = coastalProximityMi < 5;

  let headline: string;
  let detail: string;
  let recommendation: string;

  if (isHighRisk) {
    headline = `FEMA Flood Zone ${floodZone} — high flood risk at this location`;
    detail = `This property falls within FEMA Special Flood Hazard Area (SFHA) Zone ${floodZone}, indicating a greater than 1% annual chance of flooding. Data centers require extensive flood mitigation — raised electrical equipment, waterproof enclosures, elevated generator placement, and flood barriers. Insurance costs in SFHA zones can be prohibitive, and some carriers refuse to underwrite data center equipment in these zones. Post-Sandy, NJ SFHA zones face additional state-level resilience requirements.`;
    recommendation = `FEMA Zone ${floodZone} designation requires expensive flood mitigation. Data center equipment insurance in SFHA zones can add $200K+/year.`;
  } else if (isModerateRisk && isCoastal) {
    headline = `500-year flood zone + ${coastalProximityMi.toFixed(1)} mi from coast — meaningful storm risk`;
    detail = `This location sits in the 500-year flood zone and is ${coastalProximityMi.toFixed(1)} miles from the coastline. While not in the highest-risk SFHA category, coastal proximity means exposure to storm surge events, extreme wind loads, and salt-air corrosion that accelerates hardware degradation. Post-Hurricane Sandy, New Jersey regulators apply heightened scrutiny to large electrical installations near the coast.`;
    recommendation = `Coastal proximity (${coastalProximityMi.toFixed(1)} mi) combined with 500-year flood zone creates meaningful storm surge and corrosion risk for sensitive data center equipment.`;
  } else if (isCoastal) {
    headline = `${coastalProximityMi.toFixed(1)} mi from coast — salt-air corrosion and storm risk`;
    detail = `At ${coastalProximityMi.toFixed(1)} miles from the NJ coastline, this location is outside FEMA's designated flood zones but remains exposed to salt-air corrosion (which degrades server hardware and electrical connections at elevated rates), extreme wind events during coastal storms, and potential future flood zone reclassification as sea levels rise. Data centers in coastal markets also face higher insurance costs even outside SFHA zones.`;
    recommendation = `Coastal proximity (${coastalProximityMi.toFixed(1)} mi) increases corrosion risk and insurance costs even outside FEMA flood zones.`;
  } else {
    headline = `FEMA Zone X (minimal flood risk) — ${coastalProximityMi.toFixed(1)} mi from coast`;
    detail = `This location falls within FEMA Zone X, indicating minimal flood risk, and is ${coastalProximityMi.toFixed(1)} miles from the nearest coastline. Climate and weather risk factors are relatively favorable for this region. However, NJ's location in a high-frequency storm track means that backup power systems and proper grounding remain essential for any critical infrastructure regardless of flood zone classification.`;
    recommendation = `Climate risk is relatively low (Zone X, ${coastalProximityMi.toFixed(1)} mi from coast). NJ storm exposure still requires robust backup power infrastructure.`;
  }

  const weight = FACTOR_WEIGHTS.climate;
  return {
    factor: {
      factorId: 'climate',
      label: 'Climate Risk',
      icon: '🌊',
      weight,
      rawScore,
      weightedScore: Math.round(rawScore * weight * 10) / 10,
      status,
      headline,
      detail,
      impact: rawScore >= 60 ? 'neutral' : 'adds_risk',
      dataPoints: {
        floodZone,
        coastalProximityMi,
        isHighRiskZone: isHighRisk,
        dataSource: status === 'live' ? 'FEMA ArcGIS NFHL' : 'Zip-code fallback classification',
        zipCode: zip,
      },
      recommendation,
    },
    climateResult,
  };
}
