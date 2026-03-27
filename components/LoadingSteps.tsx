'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

const STEPS = [
  { id: 'geocode',     label: 'Geocoding address',               detail: 'Resolving coordinates via Google Maps' },
  { id: 'demand',      label: 'Scanning nearby businesses',       detail: 'Classifying 5-mile business ecosystem for edge demand' },
  { id: 'backhaul',    label: 'Calculating backhaul distance',    detail: 'Measuring proximity to 25 regional data centers' },
  { id: 'saturation',  label: 'Mapping market saturation',        detail: 'Counting colocation competitors within 15 miles' },
  { id: 'suitability', label: 'Evaluating building type',         detail: 'Assessing structural compatibility with DC requirements' },
  { id: 'fiber',       label: 'Checking fiber connectivity',      detail: 'Querying FCC Broadband Map for provider count' },
  { id: 'zoning',      label: 'Analyzing zoning & density',       detail: 'Pulling Census ACS population density data' },
  { id: 'climate',     label: 'Assessing climate & flood risk',   detail: 'Querying FEMA ArcGIS for flood zone classification' },
  { id: 'score',       label: 'Computing weighted score',         detail: 'Applying 8-factor weighted model' },
];

const STEP_DELAY_MS = 500;

interface LoadingStepsProps {
  isVisible: boolean;
}

export function LoadingSteps({ isVisible }: LoadingStepsProps) {
  const [completedSteps, setCompletedSteps] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setCompletedSteps(0);
      return;
    }

    let step = 0;
    const advance = () => {
      step += 1;
      setCompletedSteps(step);
      if (step < STEPS.length) {
        timer = setTimeout(advance, STEP_DELAY_MS);
      }
    };

    let timer = setTimeout(advance, STEP_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-zinc-700 mb-4 uppercase tracking-wide">
          Analysis in progress
        </h3>
        <div className="space-y-3">
          {STEPS.map((step, idx) => {
            const isDone = idx < completedSteps;
            const isActive = idx === completedSteps;
            return (
              <div
                key={step.id}
                className={`flex items-start gap-3 transition-opacity duration-300 ${
                  idx > completedSteps ? 'opacity-30' : 'opacity-100'
                }`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : isActive ? (
                    <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                  ) : (
                    <Circle className="w-5 h-5 text-zinc-300" />
                  )}
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDone ? 'text-zinc-500' : isActive ? 'text-zinc-900' : 'text-zinc-400'}`}>
                    {step.label}
                  </p>
                  {isActive && (
                    <p className="text-xs text-zinc-400 mt-0.5">{step.detail}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
