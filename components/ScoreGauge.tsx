'use client';

import { useEffect, useRef, useState } from 'react';

interface ScoreGaugeProps {
  score: number;
  color: string;       // hex
  trackColor: string;  // hex
  size?: number;
  label?: string;
  sublabel?: string;
}

export function ScoreGauge({ score, color, trackColor, size = 140, label, sublabel }: ScoreGaugeProps) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const dur = 1100;
    const animate = (now: number) => {
      const t = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(ease * score));
      if (t < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [score]);

  const cx = size / 2;
  const cy = size / 2;
  const r = (size / 2) * 0.74;
  const sw = size * 0.09;
  const arcSpan = 240;
  const arcStart = 150;

  function polar(angle: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arc(a1: number, a2: number) {
    const s = polar(a2); const e = polar(a1);
    const large = a2 - a1 > 180 ? '1' : '0';
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`;
  }

  const fill = (display / 100) * arcSpan;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.88} viewBox={`0 0 ${size} ${size * 0.88}`} style={{ overflow: 'visible' }}>
        <path d={arc(arcStart, arcStart + arcSpan)} fill="none" stroke={trackColor} strokeWidth={sw} strokeLinecap="round" />
        {fill > 0 && (
          <path d={arc(arcStart, arcStart + fill)} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" style={{ transition: 'none' }} />
        )}
        <text x={cx} y={cy - 2} textAnchor="middle" dominantBaseline="middle"
          fontSize={size * 0.24} fontWeight="700" fill={color} fontFamily="inherit">
          {display}
        </text>
        <text x={cx} y={cy + size * 0.17} textAnchor="middle" dominantBaseline="middle"
          fontSize={size * 0.1} fill="#A1A1AA" fontFamily="inherit">
          / 100
        </text>
      </svg>
      {label && <p className="text-sm font-semibold text-zinc-700 mt-1 text-center leading-tight">{label}</p>}
      {sublabel && <p className="text-xs text-zinc-400 text-center">{sublabel}</p>}
    </div>
  );
}
