'use client';

import { useEffect, useRef, useState } from 'react';
import type { EdgeVerdict } from '@/lib/types';

interface ScoreGaugeProps {
  score: number;
  verdict: EdgeVerdict;
  size?: number;
}

const VERDICT_COLORS: Record<EdgeVerdict, string> = {
  poor:     '#22c55e', // green — great for solar pitch
  marginal: '#f59e0b',
  moderate: '#f97316',
  strong:   '#ef4444',
};

const VERDICT_LABELS: Record<EdgeVerdict, string> = {
  poor:     'Poor Edge\nCandidate',
  marginal: 'Marginal\nEdge',
  moderate: 'Moderate\nEdge',
  strong:   'Strong Edge\nCandidate',
};

export function ScoreGauge({ score, verdict, size = 180 }: ScoreGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const duration = 1200;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [score]);

  const cx = size / 2;
  const cy = size / 2;
  const r = (size / 2) * 0.72;
  const strokeWidth = (size / 2) * 0.12;

  // Arc spans 240 degrees (from 150° to 30°)
  const arcStart = 150;
  const arcTotal = 240;

  function polarToCartesian(angle: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  }

  function describeArc(startAngle: number, endAngle: number) {
    const start = polarToCartesian(endAngle);
    const end = polarToCartesian(startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  }

  const bgPath = describeArc(arcStart, arcStart + arcTotal);
  const fillAngle = (displayScore / 100) * arcTotal;
  const fillPath = fillAngle > 0 ? describeArc(arcStart, arcStart + fillAngle) : '';
  const color = VERDICT_COLORS[verdict];
  const label = VERDICT_LABELS[verdict];

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <path
          d={bgPath}
          fill="none"
          stroke="#e4e4e7"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Score fill */}
        {fillPath && (
          <path
            d={fillPath}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}
        {/* Score number */}
        <text
          x={cx}
          y={cy - size * 0.04}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 0.22}
          fontWeight="700"
          fill={color}
          fontFamily="system-ui, sans-serif"
        >
          {displayScore}
        </text>
        <text
          x={cx}
          y={cy + size * 0.14}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 0.09}
          fill="#71717a"
          fontFamily="system-ui, sans-serif"
        >
          / 100
        </text>
      </svg>
      <div className="text-center">
        {label.split('\n').map((line, i) => (
          <p key={i} className="text-sm font-semibold leading-tight" style={{ color }}>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
