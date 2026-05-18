-- Audit of newly-added stores (May 19, 2026).
--
-- Follow-up to PRs #7/#8/#9. Re-checks the 71 rows added in PR #9 against
-- chain locators, Yelp, Komparing.com (which embeds lat/lng in URL paths
-- for gas stations), and GasBuddy.
--
-- Findings applied here:
--   1. ALL Aldi phones set to NULL — the (855) 955-2534 calls are routed to
--      Aldi's national customer-service line, not the local store. Aldi does
--      not publish per-store phones. The previously-stored 412 numbers were
--      also fabricated (no per-store dial-in).
--   2. Sheetz Pleasant Hills/Clairton (1000 Clairton Blvd): coords were
--      ~4.5 km north of the actual storefront. Corrected from
--      40.359/-79.9855 to 40.32036/-79.94189 (Komparing.com URL).
--   3. Sheetz Robinson/Campbells Run (5410 Campbells Run Rd): coords ~250 m
--      off. Corrected from 40.44778/-80.15735 to 40.44574/-80.15871.
--   4. Six of the nine Sheetz rows had fabricated phones in a "(412) 635-100x"
--      sequence. Real phones from Yelp / chain locator:
--        - 2871 Freeport Rd  → (412) 530-0283
--        - 8500 Perry Hwy    → (412) 536-3905
--        - 211 Mount Nebo Rd → (412) 351-9346
--        - 3025 Babcock Blvd → (412) 931-1716
--        - 950 Presque Isle  → (724) 519-8894 (city also corrected: Plum → Pittsburgh per Yelp)
--   5. Sheetz Plum row: city was "Plum" but the chain locator + Yelp list it
--      as Pittsburgh PA 15239 (same zip).

BEGIN;

-- =====================================================================
-- 1. Aldi: drop fabricated/shared phone numbers
-- =====================================================================
UPDATE stores SET phone = NULL
WHERE name ILIKE 'Aldi (%';

-- =====================================================================
-- 2. Sheetz coordinate fixes (Komparing.com URL-embedded coords)
-- =====================================================================

-- Sheetz Pleasant Hills/Clairton (1000 Clairton Blvd) — pin was ~4.5 km N of storefront
UPDATE stores SET latitude = 40.32036, longitude = -79.94189
WHERE name = 'Sheetz (Pleasant Hills / Clairton Blvd)'
  AND address = '1000 Clairton Blvd';

-- Sheetz Robinson/Campbells Run — pin ~250 m off
UPDATE stores SET latitude = 40.44574, longitude = -80.15871
WHERE name = 'Sheetz (Robinson / Campbells Run)'
  AND address = '5410 Campbells Run Rd';

-- =====================================================================
-- 3. Sheetz phone corrections (the "635-100x" rows had fake numbers)
-- =====================================================================

-- Aspinwall (Yelp/yelp.com/biz/sheetz-pittsburgh-9)
UPDATE stores SET phone = '(412) 530-0283'
WHERE name = 'Sheetz (Aspinwall / Freeport Rd)'
  AND address = '2871 Freeport Rd';

-- North Hills / Perry Hwy (#115) — Yelp/yelp.com/biz/sheetz-pittsburgh-7
UPDATE stores SET phone = '(412) 536-3905'
WHERE name = 'Sheetz (North Hills / Perry Hwy)'
  AND address = '8500 Perry Hwy';

-- Ohio Township / Mt Nebo — Yelp/yelp.com/biz/sheetz-pittsburgh-11
UPDATE stores SET phone = '(412) 351-9346'
WHERE name = 'Sheetz (Ohio Township / Mt Nebo)'
  AND address = '211 Mount Nebo Rd';

-- Ross Township / Babcock — Yelp/yelp.com/biz/sheetz-pittsburgh-2 + businessyab.com
UPDATE stores SET phone = '(412) 931-1716'
WHERE name = 'Sheetz (Ross Township / Babcock)'
  AND address = '3025 Babcock Blvd';

-- Plum — phone wrong + city wrong (Yelp: Pittsburgh PA 15239, not Plum)
-- yelp.com/biz/sheetz-pittsburgh-13
UPDATE stores SET phone = '(724) 519-8894', city = 'Pittsburgh'
WHERE name = 'Sheetz (Plum)'
  AND address = '950 Presque Isle Dr';

COMMIT;
