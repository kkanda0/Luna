// ─── Geographic ─────────────────────────────────────────────────────────────

export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeocodeResult {
  address: string;
  formattedAddress: string;
  coordinates: LatLng;
  placeId: string;
  state: string;
  county: string;
  zipCode: string;
  city: string;
}

// ─── Data Center Reference ───────────────────────────────────────────────────

export interface DataCenter {
  id: string;
  name: string;
  operator: string;
  tier: 1 | 2 | 3 | 4;
  coordinates: LatLng;
  city: string;
  state: string;
  mw: number;
  distanceMi?: number; // populated at runtime
}

// ─── Nearby Business ────────────────────────────────────────────────────────

export type DemandCategory = 'high' | 'medium' | 'low' | 'neutral';

export interface NearbyBusiness {
  name: string;
  types: string[];
  coordinates: LatLng;
  distanceMi: number;
  demandCategory: DemandCategory;
  industryLabel: string;
}

// ─── Factor Scoring ──────────────────────────────────────────────────────────

export type FactorId =
  | 'demand'
  | 'backhaul'
  | 'saturation'
  | 'suitability'
  | 'fiber'
  | 'zoning'
  | 'climate'
  | 'power';

export type DataStatus = 'live' | 'fallback' | 'unavailable';

export type ImpactDirection = 'boosts_edge' | 'boosts_solar' | 'adds_risk' | 'neutral';

export interface FactorScore {
  factorId: FactorId;
  label: string;
  icon: string;
  weight: number;
  rawScore: number;        // 0–100, higher = better for edge DC
  weightedScore: number;   // rawScore * weight
  status: DataStatus;
  headline: string;        // 1-line UI summary
  detail: string;          // 2-4 sentences for expanded card
  impact: ImpactDirection;
  dataPoints: Record<string, unknown>;
  recommendation: string;  // factor-specific insight for expanded view
}

// ─── Sub-factor Results ──────────────────────────────────────────────────────

export interface FiberResult {
  hasFiber: boolean;
  providerCount: number;
  fiberProviderCount: number;
  blockFips: string;
  status: DataStatus;
}

export interface ZoningResult {
  populationDensityPerSqMi: number;
  tractGeoid: string;
  urbanClass: 'rural' | 'suburban' | 'urban' | 'dense_urban';
  status: DataStatus;
}

export type FemaFloodZone =
  | 'A' | 'AE' | 'AH' | 'AO' | 'V' | 'VE'
  | 'X' | 'X500' | 'D' | 'UNKNOWN';

export interface ClimateResult {
  floodZone: FemaFloodZone;
  coastalProximityMi: number;
  status: DataStatus;
}

export interface PowerResult {
  utilityName: string;
  utilityZone: string;
  avgRateCentsPerKwh: number;
  status: DataStatus;
}

// ─── Analysis Result ─────────────────────────────────────────────────────────

export type EdgeVerdict = 'poor' | 'marginal' | 'moderate' | 'strong';

export interface AnalysisResult {
  requestId: string;
  analyzedAt: string;
  address: GeocodeResult;
  factors: FactorScore[];           // always 8 entries
  finalScore: number;               // 0–100 weighted average
  verdict: EdgeVerdict;
  verdictLabel: string;
  solarPitchStrength: 'strong' | 'moderate' | 'weak';
  nearbyBusinesses: NearbyBusiness[];
  nearbyDataCenters: DataCenter[];  // within 30mi
  executiveSummary: string;
  topReasons: string[];             // 3 bullet points for executive panel
  cached: boolean;
}

// ─── API Request / Response ──────────────────────────────────────────────────

export interface AnalyzeRequest {
  address: string;
}

export interface AnalyzeResponse {
  success: true;
  data: AnalysisResult;
}

export interface AnalyzeErrorResponse {
  success: false;
  error: string;
}

// ─── Loading State ───────────────────────────────────────────────────────────

export interface LoadingStep {
  id: string;
  label: string;
  detail: string;
}
