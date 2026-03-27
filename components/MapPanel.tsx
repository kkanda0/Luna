'use client';

import { useRef, useEffect, useState } from 'react';
import type { AnalysisResult, NearbyBusiness, DataCenter } from '@/lib/types';

const DEMAND_COLORS: Record<string, string> = {
  high:    '#EF4444',
  medium:  '#F59E0B',
  low:     '#94A3B8',
  neutral: '#CBD5E1',
};

const MI_TO_M = 1609.34;

interface MapPanelProps {
  result: AnalysisResult;
}

export function MapPanel({ result }: MapPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const { coordinates } = result.address;
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    if (!ref.current || !token) { setError('Map token not configured'); return; }
    let map: mapboxgl.Map;

    import('mapbox-gl').then(mgl => {
      mgl.default.accessToken = token;

      map = new mgl.default.Map({
        container: ref.current!,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [coordinates.lng, coordinates.lat],
        zoom: 11.5,
        attributionControl: false,
      });

      map.on('load', () => {
        // Radius rings
        [5, 10, 15].forEach((mi, idx) => {
          const id = `ring-${mi}`;
          map.addSource(id, { type: 'geojson', data: circle(coordinates.lat, coordinates.lng, mi * MI_TO_M) });
          map.addLayer({ id: `${id}-fill`, type: 'fill', source: id,
            paint: { 'fill-color': '#6366F1', 'fill-opacity': 0.025 + idx * 0.01 } });
          map.addLayer({ id: `${id}-line`, type: 'line', source: id,
            paint: { 'line-color': '#818CF8', 'line-width': 1, 'line-dasharray': [4, 3], 'line-opacity': 0.6 } });
        });

        // Business markers
        result.nearbyBusinesses.slice(0, 60).forEach((b: NearbyBusiness) => {
          const el = document.createElement('div');
          el.style.cssText = `width:8px;height:8px;border-radius:50%;background:${DEMAND_COLORS[b.demandCategory] ?? '#94A3B8'};border:1.5px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.2);cursor:pointer;transition:transform 0.12s ease;`;
          el.onmouseenter = () => { el.style.transform = 'scale(1.8)'; };
          el.onmouseleave = () => { el.style.transform = 'scale(1)'; };
          new mgl.default.Marker({ element: el })
            .setLngLat([b.coordinates.lng, b.coordinates.lat])
            .setPopup(new mgl.default.Popup({ offset: 10, closeButton: false, maxWidth: '200px' }).setHTML(
              `<p style="font-weight:700;margin:0 0 3px;font-size:12px">${b.name}</p><p style="color:#6B7280;margin:0;font-size:11px">${b.industryLabel} · ${b.distanceMi.toFixed(1)} mi</p>`,
            ))
            .addTo(map);
        });

        // Data center markers
        result.nearbyDataCenters.forEach((dc: DataCenter) => {
          const el = document.createElement('div');
          el.style.cssText = `width:11px;height:11px;border-radius:3px;background:#7C3AED;border:2px solid white;box-shadow:0 2px 6px rgba(124,58,237,0.35);cursor:pointer;transition:transform 0.12s ease;`;
          el.onmouseenter = () => { el.style.transform = 'scale(1.5)'; };
          el.onmouseleave = () => { el.style.transform = 'scale(1)'; };
          new mgl.default.Marker({ element: el })
            .setLngLat([dc.coordinates.lng, dc.coordinates.lat])
            .setPopup(new mgl.default.Popup({ offset: 12, closeButton: false, maxWidth: '200px' }).setHTML(
              `<p style="font-weight:700;margin:0 0 3px;font-size:12px">${dc.name}</p><p style="color:#6B7280;margin:0;font-size:11px">${dc.operator} · Tier ${dc.tier} · ${dc.distanceMi?.toFixed(1)} mi</p>`,
            ))
            .addTo(map);
        });

        // Subject property
        const pin = document.createElement('div');
        pin.style.cssText = `
          width:18px;height:18px;border-radius:50%;
          background:linear-gradient(135deg,#F97316,#EF4444);
          border:3px solid white;
          box-shadow:0 2px 10px rgba(249,115,22,0.5);
          cursor:pointer;
        `;
        new mgl.default.Marker({ element: pin })
          .setLngLat([coordinates.lng, coordinates.lat])
          .setPopup(new mgl.default.Popup({ offset: 14, closeButton: false, maxWidth: '280px' }).setHTML(
            `<p style="font-weight:700;font-size:12px;margin:0;color:#0A0A0B">${result.address.formattedAddress}</p>`,
          ))
          .addTo(map);
      });
    }).catch(() => setError('Failed to load map'));

    return () => { map?.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative w-full h-full">
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-50 text-zinc-400 text-sm">
          {error}
        </div>
      ) : (
        <div ref={ref} className="absolute inset-0" />
      )}

      {/* Map legend — bottom left overlay */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl border border-zinc-200 px-3 py-2.5"
        style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
        <div className="space-y-1.5">
          {[
            { color: '#EF4444', label: 'High demand business' },
            { color: '#F59E0B', label: 'Medium demand' },
            { color: '#94A3B8', label: 'Low demand' },
            { color: '#7C3AED', label: 'Data center', shape: 'square' },
            { color: '#F97316', label: 'Subject property' },
          ].map(({ color, label, shape }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="flex-shrink-0" style={{
                width: shape === 'square' ? 9 : 8,
                height: shape === 'square' ? 9 : 8,
                borderRadius: shape === 'square' ? 2 : '50%',
                background: color,
                border: '1.5px solid white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
              <span className="text-[10px] text-zinc-600">{label}</span>
            </div>
          ))}
        </div>
        <p className="text-[9px] text-zinc-400 mt-1.5 border-t border-zinc-100 pt-1.5">
          Rings: 5, 10, 15 mi · Click markers for details
        </p>
      </div>
    </div>
  );
}

function circle(lat: number, lng: number, r: number): GeoJSON.Feature<GeoJSON.Polygon> {
  const n = 64;
  const coords: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * 2 * Math.PI;
    coords.push([
      lng + (r * Math.cos(a)) / (111320 * Math.cos((lat * Math.PI) / 180)),
      lat + (r * Math.sin(a)) / 111320,
    ]);
  }
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [coords] } };
}
