'use client';

import { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AddressInputProps {
  onAnalyze: (address: string) => void;
  isLoading: boolean;
}

export function AddressInput({ onAnalyze, isLoading }: AddressInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [value, setValue] = useState('');
  const [mapsLoaded, setMapsLoaded] = useState(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !inputRef.current) return;

    setOptions({ key: apiKey, v: 'weekly' });

    importLibrary('places').then(() => {
      setMapsLoaded(true);
      if (!inputRef.current) return;
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'us' },
        fields: ['formatted_address'],
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place?.formatted_address) {
          setValue(place.formatted_address);
        }
      });
    }).catch(() => {
      setMapsLoaded(false);
    });

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onAnalyze(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={
            mapsLoaded
              ? 'Enter a commercial address (e.g., 300 Kimball Ave, Westfield, NJ)'
              : 'Enter a commercial address...'
          }
          className="flex-1 h-12 text-base bg-white border-zinc-300 focus:border-orange-500 focus:ring-orange-500"
          disabled={isLoading}
          autoComplete="off"
        />
        <Button
          type="submit"
          disabled={!value.trim() || isLoading}
          className="h-12 px-6 bg-orange-500 hover:bg-orange-600 text-white font-semibold whitespace-nowrap"
        >
          {isLoading ? 'Analyzing…' : 'Analyze Property'}
        </Button>
      </div>
      <p className="text-xs text-zinc-500">
        Enter any US commercial address. Analysis takes ~10 seconds and pulls live data from 6 sources.
      </p>
    </form>
  );
}
