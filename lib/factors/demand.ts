import type { FactorScore, GeocodeResult, NearbyBusiness, DemandCategory } from '../types';
import { haversineDistance } from '../haversine';
import { FACTOR_WEIGHTS } from '../scoring';

interface ClassificationRule {
  types: string[];
  category: DemandCategory;
  industryLabel: string;
}

const RULES: ClassificationRule[] = [
  // HIGH demand
  { types: ['hospital', 'general_hospital', 'emergency_room'], category: 'high', industryLabel: 'Healthcare / Hospital' },
  { types: ['university', 'school', 'secondary_school', 'primary_school'], category: 'high', industryLabel: 'Education / Campus' },
  { types: ['stadium', 'arena', 'convention_center', 'event_venue'], category: 'high', industryLabel: 'Large Venue / Events' },
  { types: ['casino'], category: 'high', industryLabel: 'Gaming / Casino' },
  { types: ['financial_institution', 'bank', 'insurance_agency'], category: 'high', industryLabel: 'Financial Services' },
  { types: ['storage', 'moving_company'], category: 'high', industryLabel: 'Logistics / Distribution' },
  { types: ['airport', 'train_station', 'transit_station'], category: 'high', industryLabel: 'Transportation Hub' },
  { types: ['local_government_office', 'police', 'courthouse', 'city_hall'], category: 'high', industryLabel: 'Government / Public Safety' },
  { types: ['manufacturing', 'factory', 'industrial_park', 'car_wash'], category: 'high', industryLabel: 'Manufacturing / Industrial' },
  // MEDIUM demand
  { types: ['office', 'corporate_office', 'business_center', 'real_estate_agency'], category: 'medium', industryLabel: 'Corporate Office' },
  { types: ['coworking_space'], category: 'medium', industryLabel: 'Co-working Space' },
  { types: ['shopping_mall', 'department_store'], category: 'medium', industryLabel: 'Retail Complex' },
  { types: ['hotel', 'lodging', 'motel', 'extended_stay_hotel'], category: 'medium', industryLabel: 'Hospitality' },
  { types: ['warehouse_store', 'home_goods_store'], category: 'medium', industryLabel: 'Warehouse / Big Box' },
  { types: ['pharmacy', 'medical_clinic', 'dental_clinic', 'doctor', 'physiotherapist'], category: 'medium', industryLabel: 'Medical Clinic' },
  { types: ['veterinary_care', 'animal_shelter'], category: 'medium', industryLabel: 'Veterinary / Animal' },
  // LOW demand
  { types: ['restaurant', 'food', 'bar', 'cafe', 'bakery', 'meal_delivery', 'meal_takeaway'], category: 'low', industryLabel: 'Food & Beverage' },
  { types: ['grocery_or_supermarket', 'supermarket', 'convenience_store', 'food_store'], category: 'low', industryLabel: 'Grocery / Retail' },
  { types: ['store', 'clothing_store', 'shoe_store', 'electronics_store', 'furniture_store', 'hardware_store'], category: 'low', industryLabel: 'Retail Store' },
  { types: ['beauty_salon', 'hair_care', 'spa', 'nail_salon'], category: 'low', industryLabel: 'Personal Services' },
  { types: ['gym', 'fitness_center', 'yoga_studio'], category: 'low', industryLabel: 'Fitness' },
  { types: ['church', 'mosque', 'synagogue', 'place_of_worship'], category: 'low', industryLabel: 'Religious Institution' },
  { types: ['car_dealer', 'car_repair', 'gas_station', 'car_wash'], category: 'low', industryLabel: 'Automotive' },
  { types: ['laundry', 'dry_cleaning'], category: 'low', industryLabel: 'Laundry / Cleaning' },
  // NEUTRAL
  { types: ['park', 'campground', 'cemetery', 'natural_feature'], category: 'neutral', industryLabel: 'Open Space' },
  { types: ['neighborhood', 'sublocality', 'political', 'locality'], category: 'neutral', industryLabel: 'Geographic Area' },
];

function classifyBusiness(types: string[]): { category: DemandCategory; industryLabel: string } {
  for (const rule of RULES) {
    if (types.some((t) => rule.types.includes(t))) {
      return { category: rule.category, industryLabel: rule.industryLabel };
    }
  }
  return { category: 'neutral', industryLabel: 'Other' };
}

export async function analyzeDemand(
  geo: GeocodeResult,
  googleKey: string,
): Promise<{ factor: FactorScore; businesses: NearbyBusiness[] }> {
  const target = geo.coordinates;
  let businesses: NearbyBusiness[] = [];
  let apiStatus: 'live' | 'fallback' = 'live';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
    url.searchParams.set('location', `${target.lat},${target.lng}`);
    url.searchParams.set('radius', '8046'); // 5 miles in meters
    url.searchParams.set('key', googleKey);

    const res = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const results = (data.results ?? []).slice(0, 60);

      businesses = results.map((r: { name: string; types: string[]; geometry: { location: { lat: number; lng: number } } }) => {
        const coords = { lat: r.geometry.location.lat, lng: r.geometry.location.lng };
        const { category, industryLabel } = classifyBusiness(r.types ?? []);
        return {
          name: r.name,
          types: r.types ?? [],
          coordinates: coords,
          distanceMi: haversineDistance(target, coords),
          demandCategory: category,
          industryLabel,
        } satisfies NearbyBusiness;
      });
    }
  } catch {
    apiStatus = 'fallback';
  }

  // Filter out neutral for scoring
  const relevant = businesses.filter((b) => b.demandCategory !== 'neutral');
  const highCount = relevant.filter((b) => b.demandCategory === 'high').length;
  const mediumCount = relevant.filter((b) => b.demandCategory === 'medium').length;
  const lowCount = relevant.filter((b) => b.demandCategory === 'low').length;

  let rawScore: number;
  if (relevant.length === 0) {
    rawScore = apiStatus === 'fallback' ? 40 : 10;
  } else {
    const weighted = highCount * 1.0 + mediumCount * 0.5 + lowCount * 0.1;
    const maxPossible = relevant.length;
    rawScore = Math.round((weighted / maxPossible) * 100);
  }

  // Cap score for dense urban areas to prevent inflation
  if (rawScore > 65 && relevant.length > 40) {
    rawScore = 65;
  }

  const totalRelevant = relevant.length;
  const dominantCategory = highCount > mediumCount ? 'high-demand industries' :
                           mediumCount > lowCount ? 'mid-tier commercial uses' : 'low-demand retail and services';

  let headline: string;
  let detail: string;
  let recommendation: string;

  if (rawScore >= 60) {
    headline = `${highCount} high-demand, ${mediumCount} medium-demand businesses within 5 miles`;
    detail = `The surrounding area shows meaningful edge compute demand signals: ${highCount} high-demand businesses (healthcare, financial services, logistics) and ${mediumCount} medium-demand establishments within 5 miles. These industries have legitimate edge computing needs. However, they likely already have or are evaluating purpose-built colocation options from established providers.`;
    recommendation = `Edge demand signal is real (${highCount} high-demand businesses nearby), but established colocation providers are better positioned to serve them.`;
  } else if (rawScore >= 35) {
    headline = `Mixed ecosystem — ${highCount} high-demand, ${lowCount} low-demand businesses within 5 miles`;
    detail = `The surrounding business ecosystem is predominantly ${dominantCategory}. With ${highCount} high-demand and ${lowCount} low-demand businesses within 5 miles, edge compute demand is limited and fragmented. Most nearby businesses have minimal need for ultra-low-latency compute — their IT requirements are met by existing cloud providers.`;
    recommendation = `Limited edge demand — ${highCount} high-demand vs. ${lowCount} low-demand businesses. Most nearby uses have minimal edge compute requirements.`;
  } else {
    headline = `${totalRelevant > 0 ? `${lowCount} low-demand businesses dominate` : 'Minimal commercial activity'} — weak edge demand signal`;
    detail = `The surrounding area is predominantly ${dominantCategory}. With ${highCount} high-demand businesses and ${lowCount} low-demand retail/service establishments within 5 miles, there is almost no local market for edge compute services. Restaurants, salons, and small retail businesses have minimal data processing requirements and rely entirely on consumer-grade internet connections.`;
    recommendation = `Weak edge demand — area is dominated by ${dominantCategory} (${lowCount} low-demand vs. ${highCount} high-demand businesses). No viable local customer base for edge compute.`;
  }

  const weight = FACTOR_WEIGHTS.demand;
  return {
    factor: {
      factorId: 'demand',
      label: 'Edge Demand Signal',
      icon: '📡',
      weight,
      rawScore,
      weightedScore: Math.round(rawScore * weight * 10) / 10,
      status: apiStatus,
      headline,
      detail,
      impact: rawScore >= 50 ? 'boosts_edge' : 'boosts_solar',
      dataPoints: {
        totalBusinessesScanned: businesses.length,
        highDemand: highCount,
        mediumDemand: mediumCount,
        lowDemand: lowCount,
        neutralExcluded: businesses.length - relevant.length,
        sampleHighDemand: businesses.filter((b) => b.demandCategory === 'high').slice(0, 3).map((b) => b.name),
      },
      recommendation,
    },
    businesses,
  };
}
