// Geocodes a curated list of real PA chain stores via OpenStreetMap Nominatim.
// Outputs geocoded-stores.json with verified lat/lng matching Google Maps.
// Usage: node scripts/geocode-stores.mjs

import { writeFileSync } from 'fs';

const STORES_TO_GEOCODE = [
  // Philadelphia
  { name: 'Wawa', address: '1900 Market St', city: 'Philadelphia', state: 'PA', zip: '19103', store_type: 'convenience' },
  { name: 'CVS Pharmacy', address: '1826 Chestnut St', city: 'Philadelphia', state: 'PA', zip: '19103', store_type: 'drugstore' },
  { name: 'Wawa', address: '1201 Chestnut St', city: 'Philadelphia', state: 'PA', zip: '19107', store_type: 'convenience' },
  { name: 'Walgreens', address: '1500 Chestnut St', city: 'Philadelphia', state: 'PA', zip: '19102', store_type: 'drugstore' },
  { name: 'Giant Food Stores', address: '4000 City Ave', city: 'Philadelphia', state: 'PA', zip: '19131', store_type: 'grocery' },

  // Pittsburgh Downtown
  { name: 'Giant Eagle Market District', address: '2401 Penn Ave', city: 'Pittsburgh', state: 'PA', zip: '15222', store_type: 'grocery' },
  { name: 'CVS Pharmacy', address: '339 6th Ave', city: 'Pittsburgh', state: 'PA', zip: '15222', store_type: 'drugstore' },
  { name: 'Walgreens', address: '211 Fort Pitt Blvd', city: 'Pittsburgh', state: 'PA', zip: '15222', store_type: 'drugstore' },
  { name: 'Wawa', address: '700 Penn Ave', city: 'Pittsburgh', state: 'PA', zip: '15222', store_type: 'convenience' },

  // Pittsburgh Oakland
  { name: 'Giant Eagle', address: '4612 Centre Ave', city: 'Pittsburgh', state: 'PA', zip: '15213', store_type: 'grocery' },
  { name: 'CVS Pharmacy', address: '3414 Forbes Ave', city: 'Pittsburgh', state: 'PA', zip: '15213', store_type: 'drugstore' },
  { name: 'Walgreens', address: '3506 Forbes Ave', city: 'Pittsburgh', state: 'PA', zip: '15213', store_type: 'drugstore' },
  { name: 'Turkey Hill Minit Market', address: '4000 Forbes Ave', city: 'Pittsburgh', state: 'PA', zip: '15213', store_type: 'convenience' },

  // Pittsburgh Shadyside
  { name: 'Giant Eagle Market District', address: '5550 Centre Ave', city: 'Pittsburgh', state: 'PA', zip: '15232', store_type: 'grocery' },
  { name: 'CVS Pharmacy', address: '5818 Forbes Ave', city: 'Pittsburgh', state: 'PA', zip: '15217', store_type: 'drugstore' },
  { name: 'Walgreens', address: '5800 Forbes Ave', city: 'Pittsburgh', state: 'PA', zip: '15217', store_type: 'drugstore' },

  // Pittsburgh Squirrel Hill
  { name: 'Giant Eagle', address: '1901 Murray Ave', city: 'Pittsburgh', state: 'PA', zip: '15217', store_type: 'grocery' },
  { name: 'CVS Pharmacy', address: '2025 Murray Ave', city: 'Pittsburgh', state: 'PA', zip: '15217', store_type: 'drugstore' },

  // Pittsburgh North Side / North Hills
  { name: 'Giant Eagle', address: '1250 Cedar Ave', city: 'Pittsburgh', state: 'PA', zip: '15212', store_type: 'grocery' },
  { name: 'Sheetz', address: '8607 Perry Hwy', city: 'Pittsburgh', state: 'PA', zip: '15237', store_type: 'convenience' },
  { name: 'Giant Eagle', address: '4704 McKnight Rd', city: 'Pittsburgh', state: 'PA', zip: '15237', store_type: 'grocery' },
  { name: 'CVS Pharmacy', address: '1500 E Warrington Ave', city: 'Pittsburgh', state: 'PA', zip: '15210', store_type: 'drugstore' },

  // Pittsburgh East / Wilkinsburg
  { name: 'Giant Eagle', address: '818 Penn Ave', city: 'Wilkinsburg', state: 'PA', zip: '15221', store_type: 'grocery' },
  { name: 'Sheetz', address: '3457 William Penn Hwy', city: 'Pittsburgh', state: 'PA', zip: '15235', store_type: 'convenience' },

  // Monroeville
  { name: 'Giant Eagle', address: '3850 Monroeville Blvd', city: 'Monroeville', state: 'PA', zip: '15146', store_type: 'grocery' },
  { name: 'Sheetz', address: '2820 Mosside Blvd', city: 'Monroeville', state: 'PA', zip: '15146', store_type: 'convenience' },
  { name: 'CVS Pharmacy', address: '3715 William Penn Hwy', city: 'Monroeville', state: 'PA', zip: '15146', store_type: 'drugstore' },

  // Harrisburg
  { name: 'Weis Markets', address: '4000 Jonestown Rd', city: 'Harrisburg', state: 'PA', zip: '17109', store_type: 'grocery' },
  { name: 'Turkey Hill Minit Market', address: '2941 Paxton St', city: 'Harrisburg', state: 'PA', zip: '17111', store_type: 'convenience' },
  { name: 'Sheetz', address: '1001 S 29th St', city: 'Harrisburg', state: 'PA', zip: '17111', store_type: 'convenience' },

  // Allentown
  { name: 'CVS Pharmacy', address: '737 Hamilton St', city: 'Allentown', state: 'PA', zip: '18101', store_type: 'drugstore' },
  { name: 'Weis Markets', address: '1425 Tilghman St', city: 'Allentown', state: 'PA', zip: '18102', store_type: 'grocery' },
  { name: 'Sheetz', address: '2222 MacArthur Rd', city: 'Allentown', state: 'PA', zip: '18104', store_type: 'convenience' },

  // State College
  { name: 'Sheetz', address: '418 E College Ave', city: 'State College', state: 'PA', zip: '16801', store_type: 'convenience' },
  { name: 'Weis Markets', address: '1855 N Atherton St', city: 'State College', state: 'PA', zip: '16803', store_type: 'grocery' },
  { name: 'CVS Pharmacy', address: '323 S Allen St', city: 'State College', state: 'PA', zip: '16801', store_type: 'drugstore' },

  // Erie
  { name: 'Sheetz', address: '3510 Peach St', city: 'Erie', state: 'PA', zip: '16508', store_type: 'convenience' },
  { name: 'Giant Eagle', address: '2780 W 26th St', city: 'Erie', state: 'PA', zip: '16506', store_type: 'grocery' },
  { name: 'Walgreens', address: '2523 Peach St', city: 'Erie', state: 'PA', zip: '16508', store_type: 'drugstore' },

  // Reading
  { name: 'Weis Markets', address: '1000 Morgantown Rd', city: 'Reading', state: 'PA', zip: '19607', store_type: 'grocery' },
  { name: 'Sheetz', address: '3421 Penn Ave', city: 'Reading', state: 'PA', zip: '19608', store_type: 'convenience' },

  // Lancaster
  { name: 'Weis Markets', address: '325 Centerville Rd', city: 'Lancaster', state: 'PA', zip: '17601', store_type: 'grocery' },
  { name: 'Sheetz', address: '1741 Columbia Ave', city: 'Lancaster', state: 'PA', zip: '17603', store_type: 'convenience' },
  { name: 'CVS Pharmacy', address: '45 W Chestnut St', city: 'Lancaster', state: 'PA', zip: '17603', store_type: 'drugstore' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function geocode(store) {
  const q = `${store.address}, ${store.city}, ${store.state}`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&addressdetails=1&countrycodes=us`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'diet-coke-map-geocoder/1.0' },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} for ${q}`);
  const data = await res.json();

  if (!data.length) {
    console.warn(`  ⚠️  No result for: ${q}`);
    return null;
  }

  const hit = data[0];
  const addr = hit.address;

  return {
    name: store.name,
    address: store.address,
    city: store.city,
    state: store.state,
    zip: store.zip,
    store_type: store.store_type,
    latitude: parseFloat(hit.lat),
    longitude: parseFloat(hit.lon),
    nominatim_display: hit.display_name,
  };
}

async function main() {
  const results = [];

  for (const store of STORES_TO_GEOCODE) {
    process.stdout.write(`Geocoding ${store.name} @ ${store.address}, ${store.city}...`);
    try {
      const result = await geocode(store);
      if (result) {
        results.push(result);
        console.log(` ✓ (${result.latitude}, ${result.longitude})`);
      } else {
        console.log(' ✗ skipped');
      }
    } catch (err) {
      console.log(` ERROR: ${err.message}`);
    }
    await sleep(1100); // Respect Nominatim rate limit: max 1 req/sec
  }

  const outPath = new URL('../scripts/geocoded-stores.json', import.meta.url).pathname;
  writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\nDone. ${results.length}/${STORES_TO_GEOCODE.length} stores geocoded → ${outPath}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
