'use client';

import { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { Search, ArrowRight, Loader2 } from 'lucide-react';

let mapsConfigured = false;

interface AddressInputProps {
  onAnalyze: (address: string) => void;
  isLoading: boolean;
}

export function AddressInput({ onAnalyze, isLoading }: AddressInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const acRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key || !inputRef.current) return;
    if (!mapsConfigured) { setOptions({ key, v: 'weekly' }); mapsConfigured = true; }

    importLibrary('places').then(() => {
      if (!inputRef.current) return;
      acRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'us' },
        fields: ['formatted_address'],
      });
      acRef.current.addListener('place_changed', () => {
        const place = acRef.current?.getPlace();
        if (place?.formatted_address) setValue(place.formatted_address);
      });
    }).catch(() => {});

    return () => {
      if (acRef.current) google.maps.event.clearInstanceListeners(acRef.current);
    };
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = value.trim();
    if (!v || isLoading) return;
    onAnalyze(v);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1 p-1">
      {/* Input */}
      <div className="relative flex-1">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-150"
          style={{ width: 16, height: 16, color: focused ? '#0A0A0B' : '#9CA3AF' }}
        />
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Enter a commercial US address…"
          disabled={isLoading}
          autoComplete="off"
          className="w-full h-13 pl-11 pr-4 text-[15px] font-medium text-zinc-900 placeholder:text-zinc-400
            bg-transparent outline-none disabled:opacity-50"
          style={{ height: 52 }}
          aria-label="Commercial address input"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!value.trim() || isLoading}
        className="flex-shrink-0 h-11 px-5 rounded-xl text-sm font-bold text-white
          flex items-center gap-2
          disabled:opacity-40 disabled:cursor-not-allowed
          transition-all duration-150 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #F97316, #EF4444)',
          boxShadow: '0 2px 12px rgba(249,115,22,0.4)',
        }}
        aria-label="Analyze address"
      >
        {isLoading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing</>
        ) : (
          <>Analyze <ArrowRight className="w-4 h-4" /></>
        )}
      </button>
    </form>
  );
}
