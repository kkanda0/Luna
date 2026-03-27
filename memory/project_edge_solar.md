---
name: Edge vs Solar Analyzer — Project Context
description: Hackathon project for Solar Landscape — edge DC feasibility analyzer that makes the case for rooftop solar
type: project
---

Full-stack Next.js 16 app built for Solar Landscape (Asbury Park NJ) hackathon. Analyzes any commercial address across 8 weighted factors to assess edge data center viability, calibrated so most NJ properties score <35 ("Poor Edge Candidate / Solar Recommended").

**Why:** Demonstrate to commercial building owners why rooftop solar is superior to edge DC conversion.

**How to apply:** All core logic and API routes are complete. The app runs with `npm run dev`. Three env vars needed: `GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_MAPBOX_TOKEN`. `FCC_USERNAME` is optional (county fallback activates without it).

Key architecture notes:
- `@googlemaps/js-api-loader` v2 uses `setOptions({ key })` + `importLibrary()` (NOT `new Loader().load()`)
- MapPanel is dynamic-imported with `ssr: false` to prevent Mapbox SSR crash
- All factor functions in `lib/factors/` have their own AbortController timeouts
- `Promise.allSettled()` in the analyze route — rejected factors fall back to score 30
- In-memory LRU cache (100 entries) in `lib/cache.ts`
