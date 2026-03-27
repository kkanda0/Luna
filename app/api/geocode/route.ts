import { NextRequest, NextResponse } from 'next/server';
import type { GeocodeResult } from '@/lib/types';

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address');
  if (!address) {
    return NextResponse.json({ success: false, error: 'Missing address parameter' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'Geocoding service not configured' }, { status: 503 });
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('address', address);
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) {
      return NextResponse.json({ success: false, error: 'Geocoding service unavailable' }, { status: 502 });
    }

    const data = await res.json();
    if (data.status !== 'OK' || !data.results?.length) {
      return NextResponse.json({ success: false, error: 'Address not found' }, { status: 404 });
    }

    const r = data.results[0];
    const components: Array<{ types: string[]; long_name: string; short_name: string }> =
      r.address_components ?? [];

    function getComponent(type: string, useLong = true): string {
      const c = components.find((comp) => comp.types.includes(type));
      return c ? (useLong ? c.long_name : c.short_name) : '';
    }

    const geocodeResult: GeocodeResult = {
      address,
      formattedAddress: r.formatted_address,
      coordinates: {
        lat: r.geometry.location.lat,
        lng: r.geometry.location.lng,
      },
      placeId: r.place_id,
      state: getComponent('administrative_area_level_1', false),
      county: getComponent('administrative_area_level_2'),
      zipCode: getComponent('postal_code'),
      city: getComponent('locality') || getComponent('sublocality') || getComponent('neighborhood'),
    };

    return NextResponse.json({ success: true, data: geocodeResult });
  } catch {
    return NextResponse.json({ success: false, error: 'Geocoding failed' }, { status: 500 });
  }
}
