# Luna

### Decide what a commercial site is better suited for: edge compute or rooftop solar.

Luna is a geospatial infrastructure decision tool that evaluates commercial properties for two increasingly valuable uses: **edge data centers** and **rooftop solar deployment**.

Enter an address, and Luna combines location data, infrastructure constraints, proximity signals, and weighted scoring into a side-by-side site suitability assessment.

---

## Why Luna?

Commercial real estate is usually evaluated around what already exists on the property.

Luna asks a different question:

**What infrastructure could this location support next?**

A warehouse near dense population and network infrastructure may be valuable as an edge computing site.

A large commercial rooftop with strong solar conditions may be better suited for distributed energy generation.

Luna turns that decision into a measurable comparison instead of a guess.

---

## Demo

> Add a short GIF here showing:
>
> `Enter address → Analysis runs → Map loads → Suitability score appears → Adjust scoring weights`

The best demo would be around 15–20 seconds and show both the geographic and scoring sides of the application.

---

## How It Works

1. Enter a commercial address.
2. Luna geocodes the site and gathers relevant infrastructure and geographic signals.
3. Eight scoring factors are evaluated.
4. The site is plotted alongside surrounding infrastructure.
5. Luna produces a suitability assessment.
6. Users can adjust factor weights and immediately see how the final score changes.

---

## Architecture

```text
                      ┌─────────────────────┐
                      │   Commercial Site   │
                      │       Address       │
                      └──────────┬──────────┘
                                 │
                                 ▼
                      ┌─────────────────────┐
                      │     Next.js App     │
                      │   Address + UI      │
                      └──────────┬──────────┘
                                 │
                           POST /api/analyze
                                 │
                                 ▼
                  ┌─────────────────────────────┐
                  │      Analysis Pipeline      │
                  │                             │
                  │ Geospatial Data             │
                  │ Infrastructure Signals      │
                  │ Site Characteristics        │
                  │ Scoring Factors             │
                  └─────────────┬───────────────┘
                                │
                   ┌────────────┴────────────┐
                   │                         │
                   ▼                         ▼
        ┌────────────────────┐    ┌────────────────────┐
        │   Map Intelligence │    │ Suitability Engine │
        │ Mapbox + Clusters  │    │ Weighted Scoring   │
        └────────────────────┘    └──────────┬─────────┘
                                             │
                                             ▼
                                  ┌────────────────────┐
                                  │ Intelligence Panel │
                                  │ Score + Factors    │
                                  └────────────────────┘
```

The application separates raw geographic signals from the final decision score, allowing the weighting model to be changed without rerunning the entire site analysis.

---

## Engineering Highlights

### Multi-Factor Site Scoring

Luna does not reduce infrastructure suitability to one metric.

Instead, each site is evaluated across multiple independent factors, which are normalized into a weighted score.

The final score follows the general structure:

```text
score =
Σ(factor score × factor weight)
──────────────────────────────
Σ(weights)
```

Each factor contributes a raw score, while adjustable weights control how strongly that factor influences the final result.

This makes the model useful for different priorities rather than locking every user into the same definition of a "good" site.

---

### Interactive Weighting

The scoring model is intentionally exposed to the user.

Changing a factor weight recalculates the suitability score immediately without rerunning the underlying analysis.

That makes Luna less of a static recommendation engine and more of a decision-support system.

A developer, investor, or infrastructure planner can ask:

- What if network proximity matters more?
- What if energy potential becomes the priority?
- How much is the final recommendation dependent on one factor?

The result updates as those assumptions change.

---

### Geospatial Infrastructure Analysis

Luna uses an interactive map to place the commercial property in the context of surrounding infrastructure.

The application uses:

- Mapbox GL
- React Map GL
- Supercluster
- Turf.js
- Google Maps tooling

to visualize and reason about spatial relationships rather than presenting the site as an isolated address.

This is especially useful for infrastructure decisions where **distance itself is part of the feature set**.

---

### Infrastructure Intelligence

The current interface combines:

- **8 scoring factors**
- **6 live data sources**
- **25 mapped data centers**

into a single site analysis workflow.

Instead of requiring users to inspect each dataset separately, Luna compresses those signals into one interactive evaluation.

---

### ML-Assisted Decision Support

Luna is designed as an **ML-assisted** site evaluation system rather than an opaque recommendation engine.

The model contributes to the analysis, but the factors and their relative importance remain visible to the user.

The goal is not simply:

> “This site is good.”

It is:

> “This is the score, these are the signals behind it, and this is how the answer changes when your priorities change.”

---

## Product Flow

```text
Address
   ↓
Geocode Site
   ↓
Collect Infrastructure + Geographic Signals
   ↓
Normalize Factors
   ↓
Weighted Suitability Score
   ↓
Map + Intelligence Panel
   ↓
User Adjusts Assumptions
   ↓
Score Recomputed in Real Time
```

---

## Tech Stack

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Radix UI
- Lucide

### Mapping & Geospatial
- Mapbox GL
- React Map GL
- Google Maps API
- Turf.js
- Supercluster

### Analysis
- Weighted scoring engine
- Geospatial feature processing
- ML-assisted site evaluation

---

## Repository Structure

```text
Luna/
├── app/
│   ├── api/
│   └── page.tsx
│
├── components/
│   ├── AddressInput
│   ├── IntelligencePanel
│   ├── LoadingSteps
│   └── MapPanel
│
├── data/
│
├── lib/
│   ├── scoring
│   └── types
│
├── memory/
│
├── public/
│
├── package.json
└── tsconfig.json
```

---

## Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/kkanda0/Luna.git
cd Luna
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Add the API credentials required by the geospatial data sources.

```bash
cp .env.example .env.local
```

### 4. Start the development server

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

---

## What Luna Explores

Luna started from a broader infrastructure question:

**Can the same piece of commercial real estate have radically different value depending on what system you imagine building on top of it?**

Edge computing and solar generation have very different requirements, yet both depend heavily on geography, existing infrastructure, and physical constraints.

Luna turns those overlapping signals into something that can be inspected, weighted, and compared.

The interesting part is not producing one final score.

It is making the assumptions behind that score visible enough to challenge.
