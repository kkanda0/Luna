'use client';

import { useRef, useEffect, useState } from 'react';
import type { AnalysisResult, NearbyBusiness, DataCenter } from '@/lib/types';

const DEMAND_COLORS: Record<string, string> = {
  high:    '#ef4444',
  medium:  '#f59e0b',
  low:     '#94a3b8',
  neutral: '#cbd5e1',
};

const RING_RADII_MI = [5, 10, 15];
const MILES_TO_METERS = 1609.34;

interface MapPanelProps {
  result: AnalysisResult;
}

export function MapPanel({ result }: MapPanelProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { coordinates } = result.address;
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    if (!mapContainerRef.current || !token) {
      setError('Map token not configured');
      return;
    }

    let map: mapboxgl.Map;
    let mapboxgl: typeof import('mapbox-gl');

    import('mapbox-gl').then((mgl) => {
      mapboxgl = mgl;
      mgl.default.accessToken = token;

      map = new mgl.default.Map({
        container: mapContainerRef.current!,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [coordinates.lng, coordinates.lat],
        zoom: 11,
        attributionControl: false,
      });

      mapRef.current = map;

      map.on('load', () => {
        // Add radius rings using GeoJSON circles
        RING_RADII_MI.forEach((radiusMi, idx) => {
          const sourceId = `ring-${radiusMi}`;
          map.addSource(sourceId, {
            type: 'geojson',
            data: createCircleGeoJson(coordinates.lat, coordinates.lng, radiusMi * MILES_TO_METERS),
          });
          map.addLayer({
            id: `ring-fill-${radiusMi}`,
            type: 'fill',
            source: sourceId,
            paint: {
              'fill-color': '#0ea5e9',
              'fill-opacity': 0.02 + idx * 0.01,
            },
          });
          map.addLayer({
            id: `ring-line-${radiusMi}`,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': '#0ea5e9',
              'line-width': 1,
              'line-dasharray': [4, 4],
              'line-opacity': 0.5,
            },
          });
        });

        // Target marker
        const targetEl = document.createElement('div');
        targetEl.style.cssText = `
          width: 20px; height: 20px; border-radius: 50%;
          background: #f97316; border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        `;
        new mapboxgl.default.Marker({ element: targetEl })
          .setLngLat([coordinates.lng, coordinates.lat])
          .setPopup(new mapboxgl.default.Popup().setHTML(`<strong>${result.address.formattedAddress}</strong>`))
          .addTo(map);

        // Business markers (limit to 40 for performance)
        result.nearbyBusinesses.slice(0, 40).forEach((b: NearbyBusiness) => {
          const el = document.createElement('div');
          el.style.cssText = `
            width: 8px; height: 8px; border-radius: 50%;
            background: ${DEMAND_COLORS[b.demandCategory]};
            border: 1.5px solid white; opacity: 0.85;
          `;
          new mapboxgl.default.Marker({ element: el })
            .setLngLat([b.coordinates.lng, b.coordinates.lat])
            .setPopup(new mapboxgl.default.Popup({ offset: 8 }).setHTML(
              `<div style="font-size:12px"><strong>${b.name}</strong><br/>${b.industryLabel}<br/>${b.distanceMi.toFixed(1)} mi</div>`,
            ))
            .addTo(map);
        });

        // Data center markers
        result.nearbyDataCenters.forEach((dc: DataCenter) => {
          const el = document.createElement('div');
          el.style.cssText = `
            width: 14px; height: 14px; border-radius: 2px;
            background: #7c3aed; border: 2px solid white;
            box-shadow: 0 1px 4px rgba(0,0,0,0.3);
          `;
          new mapboxgl.default.Marker({ element: el })
            .setLngLat([dc.coordinates.lng, dc.coordinates.lat])
            .setPopup(new mapboxgl.default.Popup({ offset: 10 }).setHTML(
              `<div style="font-size:12px"><strong>${dc.name}</strong><br/>${dc.operator} · Tier ${dc.tier}<br/>${dc.distanceMi?.toFixed(1)} mi away</div>`,
            ))
            .addTo(map);
        });
      });
    }).catch(() => {
      setError('Failed to load map');
    });

    return () => {
      map?.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-zinc-800">Property & Market Map</h2>
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> High demand
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Medium
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" /> Low
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-violet-600 inline-block" /> Data center
          </span>
        </div>
      </div>
      <div className="rounded-xl overflow-hidden border border-zinc-200 shadow-sm">
        {error ? (
          <div className="h-64 flex items-center justify-center bg-zinc-50 text-zinc-500 text-sm">
            {error}
          </div>
        ) : (
          <div ref={mapContainerRef} className="h-96 w-full" />
        )}
      </div>
      <p className="text-xs text-zinc-400 mt-2">
        Rings show 5, 10, and 15-mile radii. Circles = businesses by demand category. Squares = existing data centers.
      </p>
    </section>
  );
}

// Create a GeoJSON circle polygon approximation
function createCircleGeoJson(
  lat: number,
  lng: number,
  radiusMeters: number,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const points = 64;
  const coords: [number, number][] = [];
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dx = radiusMeters * Math.cos(angle);
    const dy = radiusMeters * Math.sin(angle);
    const dLat = dy / 111320;
    const dLng = dx / (111320 * Math.cos((lat * Math.PI) / 180));
    coords.push([lng + dLng, lat + dLat]);
  }
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [coords] },
  };
}
