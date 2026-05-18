# Diet Coke Store Locator

Find Diet Coke retailers near you — search by address, zip code, or GPS, filter by distance and product type, and save your favorite stores.

**Live site:** https://shrlak.github.io/diet-coke-map/

---

## What It Does

The app shows an interactive map of Diet Coke retailers across the United States. Key features:

- Search by address, zip code, or current location
- Filter by distance (5, 10, or 25 miles) and product availability
- View store hours, phone number, and available products
- Save favorite stores (requires a free account)
- Works on mobile, tablet, and desktop

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS 4 |
| State | Zustand 5 |
| Maps | Leaflet + react-leaflet |
| Backend | Supabase (PostgreSQL + Auth) |
| Deployment | GitHub Pages via GitHub Actions |
| Routing | React Router 7 |

---

## Getting Started

**Prerequisites:** Node.js 20+, npm, a free [Supabase](https://supabase.com) account

```bash
git clone https://github.com/shrlak/diet-coke-map.git
cd diet-coke-map
npm install
```

Copy the environment template and fill in your credentials:

```bash
cp .env.example .env.local
```

```bash
npm run dev
# Open http://localhost:5173
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL (`https://[id].supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key (from Settings → API) |
| `VITE_TOMTOM_KEY` | TomTom API key for address geocoding |

For deployment, add these as GitHub repository secrets — the CI workflow reads them automatically.

---

## Project Structure

```
src/
├── components/       # Map, SearchBar, FilterPanel, StoreCard, etc.
├── pages/            # Home, Login, Favorites, Profile, About
├── services/         # Supabase client, store data utilities
├── hooks/            # useGeoLocation and other custom hooks
├── store/            # Zustand stores (auth, filters, map state)
├── types/            # TypeScript interfaces
├── design-tokens.ts  # UI constants (colors, spacing, breakpoints)
└── App.tsx           # Router and app shell
```

---

## Database Setup

See [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) for the full SQL schema and step-by-step Supabase configuration, including how to enable Google/Apple OAuth.

---

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run preview      # Preview production build locally
npm run type-check   # TypeScript type checking
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix ESLint errors
```

---

## Deployment

Pushing to `main` triggers the GitHub Actions workflow (`.github/workflows/deploy.yml`), which type-checks, builds, and deploys to GitHub Pages automatically.

To set up GitHub Pages on a fork:
1. Go to repo Settings → Pages
2. Set source to **GitHub Actions**
3. Add the three environment variables as repository secrets

---

## Roadmap

**Current (MVP):** Store map, search, filtering, favorites, and user auth are live.

**Next:**
- Crowdsourced store data updates
- Admin dashboard for data management
- Expand store coverage beyond current markets

**Future:**
- React Native mobile app
- Real-time inventory and stock alerts
- Store ratings and reviews

---

## License

MIT — free to use for personal or commercial projects.
