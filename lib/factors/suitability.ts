import type { FactorScore, GeocodeResult } from '../types';
import { FACTOR_WEIGHTS } from '../scoring';

interface BuildingClassification {
  category: 'unsuitable' | 'difficult' | 'possible' | 'suitable';
  label: string;
  rawScore: number;
}

const BUILDING_RULES: Array<{ types: string[]; classification: BuildingClassification }> = [
  // Unsuitable — structural load cannot support server racks without full rebuild
  {
    types: ['restaurant', 'food', 'bar', 'cafe', 'bakery', 'meal_delivery'],
    classification: { category: 'unsuitable', label: 'Restaurant / Food Service', rawScore: 8 },
  },
  {
    types: ['grocery_or_supermarket', 'supermarket', 'convenience_store'],
    classification: { category: 'unsuitable', label: 'Grocery / Supermarket', rawScore: 10 },
  },
  {
    types: ['clothing_store', 'shoe_store', 'jewelry_store'],
    classification: { category: 'unsuitable', label: 'Specialty Retail', rawScore: 10 },
  },
  {
    types: ['beauty_salon', 'hair_care', 'spa', 'gym', 'fitness_center'],
    classification: { category: 'unsuitable', label: 'Personal Services / Fitness', rawScore: 5 },
  },
  {
    types: ['church', 'place_of_worship', 'mosque', 'synagogue', 'cemetery'],
    classification: { category: 'unsuitable', label: 'Religious / Civic Institution', rawScore: 5 },
  },
  {
    types: ['school', 'secondary_school', 'primary_school'],
    classification: { category: 'unsuitable', label: 'School', rawScore: 5 },
  },
  {
    types: ['hospital', 'general_hospital', 'emergency_room'],
    classification: { category: 'difficult', label: 'Hospital / Medical Center', rawScore: 20 },
  },
  // Difficult — significant structural and permitting challenges
  {
    types: ['shopping_mall', 'department_store'],
    classification: { category: 'difficult', label: 'Shopping Mall / Retail Complex', rawScore: 15 },
  },
  {
    types: ['office', 'corporate_office', 'real_estate_agency', 'insurance_agency'],
    classification: { category: 'difficult', label: 'Office Building', rawScore: 30 },
  },
  {
    types: ['car_dealer', 'car_repair', 'car_wash', 'gas_station'],
    classification: { category: 'difficult', label: 'Automotive Facility', rawScore: 20 },
  },
  {
    types: ['hotel', 'lodging', 'motel'],
    classification: { category: 'difficult', label: 'Hotel / Hospitality', rawScore: 20 },
  },
  // Possible — requires moderate retrofit
  {
    types: ['storage', 'moving_company', 'home_goods_store'],
    classification: { category: 'possible', label: 'Storage / Warehouse Retail', rawScore: 55 },
  },
  {
    types: ['electronics_store', 'hardware_store'],
    classification: { category: 'possible', label: 'Large Format Retail', rawScore: 45 },
  },
  // Suitable — industrial/warehouse buildings have better structural specs
  {
    types: ['warehouse_store', 'wholesaler'],
    classification: { category: 'suitable', label: 'Warehouse / Distribution', rawScore: 68 },
  },
  {
    types: ['airport', 'transit_station'],
    classification: { category: 'possible', label: 'Transportation Facility', rawScore: 40 },
  },
];

export async function analyzeSuitability(
  geo: GeocodeResult,
  googleKey: string,
): Promise<FactorScore> {
  let placeTypes: string[] = [];
  let placeName = '';
  let apiStatus: 'live' | 'fallback' = 'live';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    // Get place details for the geocoded address
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('place_id', geo.placeId);
    url.searchParams.set('fields', 'types,name');
    url.searchParams.set('key', googleKey);

    const res = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.result) {
        placeTypes = data.result.types ?? [];
        placeName = data.result.name ?? '';
      }
    }
  } catch {
    apiStatus = 'fallback';
  }

  // Classify building
  let classification: BuildingClassification = {
    category: 'difficult',
    label: 'Unknown Commercial Building',
    rawScore: 30,
  };

  for (const rule of BUILDING_RULES) {
    if (placeTypes.some((t) => rule.types.includes(t))) {
      classification = rule.classification;
      break;
    }
  }

  const rawScore = apiStatus === 'fallback' ? 30 : classification.rawScore;

  const structuralNote = rawScore < 30
    ? 'Server racks require 150–250 lbs/sqft floor load capacity. Most commercial buildings are designed for 50–100 lbs/sqft. Full structural reinforcement would cost $50–200/sqft of converted space.'
    : rawScore < 55
    ? 'Structural upgrades would be needed. Floor load requirements for server equipment typically exceed commercial building specifications by 2–3x.'
    : 'Industrial/warehouse buildings have higher floor load ratings, making structural adaptation more feasible — though cooling, power distribution, and fire suppression systems would still require significant capital investment.';

  let headline: string;
  let detail: string;
  let recommendation: string;

  switch (classification.category) {
    case 'unsuitable':
      headline = `${classification.label} — structurally incompatible with data center use`;
      detail = `${classification.label} buildings are fundamentally incompatible with data center operations. ${structuralNote} Beyond structural issues, the HVAC systems, electrical capacity, and physical layout are designed for entirely different purposes. Conversion cost would likely exceed the value of a purpose-built facility.`;
      recommendation = `${classification.label} buildings cannot support data center loads without complete structural reconstruction — economically infeasible.`;
      break;
    case 'difficult':
      headline = `${classification.label} — major structural and systems challenges`;
      detail = `Converting a ${classification.label} building to data center use faces significant structural obstacles. ${structuralNote} Additionally, commercial HVAC systems cannot provide the precise temperature/humidity control data centers require. The permitting, engineering, and construction timeline would likely be 3–5 years and cost tens of millions.`;
      recommendation = `${classification.label} conversion would require $50–200/sqft in structural upgrades plus full mechanical/electrical overhaul — a multi-year, high-cost undertaking.`;
      break;
    case 'possible':
      headline = `${classification.label} — moderate retrofit required`;
      detail = `${classification.label} buildings have better structural characteristics than typical commercial buildings. ${structuralNote} However, significant investment in cooling systems, power distribution, security perimeter, and fire suppression would still be required. Budget 2–3 years for permitting and construction.`;
      recommendation = `${classification.label} buildings have some structural advantages, but require significant mechanical/electrical investment before hosting data center loads.`;
      break;
    case 'suitable':
      headline = `${classification.label} — better structural foundation for data center conversion`;
      detail = `${classification.label} buildings typically have higher floor load ratings (100–300 lbs/sqft) and open floor plans that make data center conversion more feasible. ${structuralNote} This is a genuine structural advantage, though power, cooling, fiber, and security infrastructure still require substantial capital investment.`;
      recommendation = `Structural characteristics are more favorable for data center use, but power, cooling, and connectivity infrastructure investment remains substantial.`;
      break;
  }

  const weight = FACTOR_WEIGHTS.suitability;
  return {
    factorId: 'suitability',
    label: 'Building Suitability',
    icon: '🏗️',
    weight,
    rawScore,
    weightedScore: Math.round(rawScore * weight * 10) / 10,
    status: apiStatus,
    headline,
    detail,
    impact: rawScore >= 55 ? 'neutral' : 'boosts_solar',
    dataPoints: {
      placeName,
      googlePlaceTypes: placeTypes,
      classification: classification.category,
      classificationLabel: classification.label,
      structuralNote,
    },
    recommendation,
  };
}
