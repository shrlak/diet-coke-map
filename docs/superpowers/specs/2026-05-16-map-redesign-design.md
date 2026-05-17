# Diet Coke Map — Full UI Redesign Spec

**Date:** 2026-05-16
**Scope:** Map feature, geolocation, filter UI, traffic layer toggle

---

## Overview

Replace the current search-bar-above-map layout with a full-map-first experience. Filters become a bottom sheet, active filter state is communicated via dismissible chips in a top bar, store results live in a horizontal strip at the bottom of the map, and map controls (layer switcher + traffic toggle) float as a vertical panel on the map itself.

---

## 1. Layout

**Current:** Map takes ~60% of the screen with a search bar and filter dropdown above it, store list beside or below.

**New:** Map fills the entire content area below the navbar. All controls float over or anchor to the map edges.

### Structure (top to bottom)

```
┌─────────────────────────────────────────────────┐
│  Navbar (red)  ·  Search bar  ·  Login          │
├─────────────────────────────────────────────────┤
│  Chip bar: [⚙️ Filters] [5mi ×] [20oz ×]  [Map|List] │
├─────────────────────────────────────────────────┤
│                                                 │
│                   MAP (full)                    │
│                                                 │
│  [14 stores]     ┌──────────┐   [📍]            │
│  (top-left)      │ Controls │   (bottom-right)  │
│                  │ 🌍 Street│                   │
│                  │ 🌑 Dark  │                   │
│                  │ 🛰 Sat   │                   │
│                  │──────────│                   │
│                  │ 🚦 ON    │                   │
│                  └──────────┘                   │
│                                                 │
├──── Store strip (horizontal scroll) ────────────┤
│ [Walgreens · 0.4mi] [Kroger · 0.8mi] [7-Eleven] │
└─────────────────────────────────────────────────┘
```

### Navbar
- Background: `#b91c1c` (existing brand red)
- Contains: logo, full-width search input (white/transparent), auth link
- Search triggers store search; geolocation button moves to the chip bar

### Chip Bar
- White background, `border-b border-gray-200`
- Left side: `⚙️ Filters` button (turns red when any filter is active) + `📍` geolocate icon button + dismissible active-filter chips:
  - Radius chip: only shown when `radiusKm !== 25` (default). Label: e.g. `3 mi ×`
  - Product chips: one per selected product ID. Label: product label + `×`
  - Store type chip: shown when `storeType` is set and not empty. Label: type label + `×`
  - Tapping `×` on any chip clears just that filter
- Right side: Map / List toggle (two-segment button)
- Store count shown inline: "14 stores" between filters and toggle

### Store Strip
- Fixed 72px height, white background, pinned to bottom of map
- Horizontally scrollable `StoreCard` thumbnails
- Selected store card highlighted with red left border
- Tapping a card: centers the map on that store, selects it, and opens `StoreDetailsModal`
- The existing right-panel sidebar (desktop) is removed; the strip is the only store list in map view
- **Bottom sheet mutual exclusion:** filter sheet and store detail modal cannot be open at the same time. Opening either closes the other.

---

## 2. Filter Panel — Bottom Sheet

**Trigger:** Tapping `⚙️ Filters` chip opens the sheet.

**Behavior:**
- Slides up via CSS transition (`transform: translateY`)
- Dimmed backdrop (`bg-black/40`) behind it; tapping backdrop closes it
- Drag handle at top (purely decorative, no drag-to-dismiss needed in v1)
- Sheet height: `auto` with `max-height: 80vh`, scrollable if content overflows

**Content layout (2-column grid for top controls):**

```
┌───────────────────────────────────┐
│            ▬ (handle)             │
│  Filters              [Clear all] │
├──────────────┬────────────────────┤
│  Radius      │  Sort By           │
│  [3][6][15][31] mi  │  [📍 Near][A–Z]    │
├──────────────┴────────────────────┤
│  Diet Coke Type                   │
│  [20oz] [2L] [6-Pack] [12-Pack] [Fountain] │
├───────────────────────────────────┤
│  Store Type                       │
│  [All] [Grocery] [Gas] [Drugstore] [Conv.] │
├───────────────────────────────────┤
│  [Clear all]   [Show 14 Results →]│
└───────────────────────────────────┘
```

**Active state:** Selected chips use `bg-red-50 border-red-600 text-red-700`. Inactive chips use `bg-gray-50 border-gray-200 text-gray-600`.

**State management:** All filter state stays in the existing `filterStore`. The `sortBy` field is already in the store but was not previously exposed in the UI — wire it up here.

**Result count:** "Show N Results" button always shows the live count, computed from the filtered store list.

---

## 3. Map Controls — Vertical Side Panel

**Position:** Absolute, `top-3 right-3`, `z-[1000]` (above Leaflet tiles).

**Component:** `MapControls.tsx` — receives `mapLayer`, `onMapLayerChange`, `showTraffic`, `onTrafficToggle` as props. It reads `import.meta.env.VITE_TOMTOM_API_KEY` directly to derive `trafficEnabled` — the key is not passed as a prop.

### Layer switcher
Three buttons stacked vertically:
- `🌍 Street` → OpenStreetMap tiles (default, no key needed)
- `🌑 Dark` → CartoDB Dark Matter tiles (free, no key)
- `🛰 Sat` → ESRI World Imagery tiles (free, no key)

Active button: `bg-blue-700 text-white`. Inactive: `bg-gray-50 text-gray-500`.

### Traffic toggle
Below a divider:
- Button with 🚦 icon and ON/OFF label
- **ON state:** `bg-red-50 border-2 border-red-600 text-red-700`
- **OFF state:** `bg-gray-50 border-2 border-gray-200 text-gray-500`
- If `VITE_TOMTOM_API_KEY` is not set: button is disabled (`opacity-50 cursor-not-allowed`) with a tooltip: "Add VITE_TOMTOM_API_KEY to .env to enable live traffic"

### Traffic tile layer
When ON and API key is present, render a second `<TileLayer>` in `Map.tsx`:
```
https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key={key}
```
Opacity: `0.7`. Attribution: "© TomTom".

---

## 4. Map Layer Tile URLs

| Style   | URL                                                                 | Key required |
|---------|---------------------------------------------------------------------|--------------|
| Street  | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`               | No           |
| Dark    | `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`    | No           |
| Satellite | `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}` | No |
| Traffic | `https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key={key}` | Yes (TomTom) |

---

## 5. Geolocation

**Problem:** `Home.tsx` has inline `navigator.geolocation.getCurrentPosition` that duplicates `useGeoLocation.ts`. The hook is imported but unused for location.

**Changes to `useGeoLocation.ts`:**
- Add `watchPosition` support: add `startWatching()` / `stopWatching()` to the returned API
- Add `isWatching: boolean` state
- Add `accuracy: number | null` to the returned location object (already captured, just expose it)
- Keep existing error messages as-is (they are already actionable)

**Changes to `Home.tsx`:**
- Remove inline `navigator.geolocation` block
- Use `useGeoLocation()` hook: `const { location, loading: geoLoading, error: geoError, requestLocation } = useGeoLocation()`
- `handleGeolocate` calls `requestLocation()` then in a `useEffect` watching `location`, calls `setCenter` / `setZoom` / `getStoresNearby`

**Accuracy circle on map (`Map.tsx`):**
- When `userLocation` is present and `userLocation.accuracy` is set, render a `<Circle>` (from `react-leaflet`) centered on the user pin
- Radius: `userLocation.accuracy` meters
- Style: `fillColor="#2563eb"` `fillOpacity={0.1}` `color="#2563eb"` `opacity={0.3}` `weight={1}`

---

## 6. State Changes

### `mapStore.ts` additions
```ts
mapLayer: 'street' | 'dark' | 'satellite'  // default: 'street'
showTraffic: boolean                         // default: false
setMapLayer: (layer: ...) => void
setShowTraffic: (show: boolean) => void
```

### `filterStore.ts` — no changes needed
`sortBy` is already present. Just wire it to the new Sort By buttons in the filter sheet.

---

## 7. Component Changes Summary

| File | Change |
|------|--------|
| `Home.tsx` | Remove inline geolocation; use hook; pass `mapLayer`/`showTraffic` to Map; render chip bar + bottom sheet |
| `Map.tsx` | Accept `mapLayer`, `showTraffic` props; render correct TileLayer; reads `VITE_TOMTOM_API_KEY` directly for traffic layer; add accuracy Circle; render `MapControls` |
| `MapControls.tsx` | New component: layer switcher + traffic toggle |
| `FilterPanel.tsx` | Full rewrite: bottom sheet with 2-col grid layout |
| `useGeoLocation.ts` | Add `watchPosition`, `isWatching`, expose `accuracy` |
| `mapStore.ts` | Add `mapLayer`, `showTraffic` state |

---

## 8. Out of Scope

- Drag-to-dismiss gesture on bottom sheet
- Offline tile caching
- Clustering store markers at low zoom levels
- Traffic layer for non-TomTom providers
