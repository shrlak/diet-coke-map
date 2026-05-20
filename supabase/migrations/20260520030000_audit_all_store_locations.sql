-- Comprehensive store location audit (May 2026).
--
-- Sources: official chain locators (mcdonalds.com, fiveguys.com, panerabread.com,
-- chick-fil-a.com, bk.com, wendys.com), Yelp, GasBuddy, Google Maps.
--
-- Findings summary:
--   • Fast food migration (20260520000000) contained many fabricated / wrong addresses.
--     This migration corrects confirmed wrong addresses and deactivates stores that:
--       – are permanently closed,
--       – were never at the listed address (wrong business at that address), or
--       – could not be confirmed to exist anywhere near the listed address.
--   • CVS Pharmacy (McCandless) was supposed to be added by migration 004 but is
--     absent from the live DB; re-inserted here.
--   • GetGo (Cochran Rd) confirmed closed for extended remodeling (May 2026).

BEGIN;

-- ============================================================
--  ADDRESS + COORDINATE CORRECTIONS
-- ============================================================

-- McDonald's Oakland: 3637 Forbes Ave was wrong street number.
-- Confirmed: 3708 Forbes Ave, Pittsburgh 15213 per mcdonalds.com + Yelp.
-- Phone: (412) 687-3747
UPDATE stores
SET address   = '3708 Forbes Ave',
    latitude  = 40.44140,
    longitude = -79.95670,
    phone     = '(412) 687-3747'
WHERE id = '5a8f230a-f933-4fc4-842f-497881b980bc';

-- McDonald's Downtown: 340 Sixth Ave — no McDonald's at this address.
-- Confirmed location: 500 Liberty Ave, Pittsburgh 15222 per mcdonalds.com.
-- Phone: (412) 391-5470
UPDATE stores
SET name      = 'McDonald''s (Downtown Pittsburgh)',
    address   = '500 Liberty Ave',
    zip       = '15222',
    latitude  = 40.44000,
    longitude = -80.00200,
    phone     = '(412) 391-5470'
WHERE id = 'ee0f2091-68d7-4900-b13a-9be9a428c5ba';

-- McDonald's North Shore: 620 W North Ave — no McDonald's at this address.
-- Confirmed location: 801 Allegheny Ave, Pittsburgh 15233 per mcdonalds.com.
-- Phone: (412) 322-6660
UPDATE stores
SET address   = '801 Allegheny Ave',
    zip       = '15233',
    latitude  = 40.45080,
    longitude = -80.01900,
    phone     = '(412) 322-6660'
WHERE id = '919ea472-ff1d-44db-a616-662648824833';

-- Five Guys Oakland: 3628 Forbes Ave was wrong — no Five Guys at that address.
-- Confirmed: 117 S Bouquet St, Pittsburgh 15213 per restaurants.fiveguys.com + Yelp.
-- Phone: (412) 802-7100
UPDATE stores
SET address   = '117 S Bouquet St',
    latitude  = 40.44230,
    longitude = -79.95670,
    phone     = '(412) 802-7100'
WHERE id = '2340a43c-c34c-4cb4-a703-a67963ac56bd';

-- Five Guys Downtown: 530 Smithfield St was wrong.
-- Confirmed: 3 PPG Place, Pittsburgh 15222 per restaurants.fiveguys.com + Yelp.
-- Phone: (412) 227-0206
UPDATE stores
SET address   = '3 PPG Place',
    latitude  = 40.44010,
    longitude = -80.00270,
    phone     = '(412) 227-0206'
WHERE id = '17d514b9-4256-4b9c-a70a-98d70d73ae58';

-- Panera Bread Oakland: 3538 Forbes Ave was wrong street number.
-- Confirmed: 3800 Forbes Ave, Pittsburgh 15213 per panerabread.com + Yelp.
-- Phone: (412) 683-3727
UPDATE stores
SET address   = '3800 Forbes Ave',
    latitude  = 40.44150,
    longitude = -79.95680,
    phone     = '(412) 683-3727'
WHERE id = '3e09a57d-4904-4217-8e93-1d7e540e661f';

-- Chick-fil-A Oakland: 4216 Forbes Ave is incorrect.
-- Confirmed: 3719 Terrace St, Pittsburgh 15213 (Petersen Events Center / Pitt campus)
-- per chick-fil-a.com + Yelp. Phone: (412) 648-9576
UPDATE stores
SET address   = '3719 Terrace St',
    latitude  = 40.44380,
    longitude = -79.95510,
    phone     = '(412) 648-9576'
WHERE id = '759b0bd1-fae3-40bd-9b52-2f460167d0fd';

-- Chick-fil-A Waterfront: 275 W Waterfront Dr was wrong side of the shopping centre.
-- Confirmed: 480 E Waterfront Dr, Homestead 15120 per chick-fil-a.com + Yelp.
-- Phone: (412) 462-9202; coords from Yelp/Google Maps.
UPDATE stores
SET address   = '480 E Waterfront Dr',
    latitude  = 40.41270,
    longitude = -79.90790,
    phone     = '(412) 462-9202'
WHERE id = '0a57ad2a-9763-46c5-a5f0-cb818616b5a4';

-- ============================================================
--  DEACTIVATE — PERMANENTLY CLOSED
-- ============================================================

-- Panera Bread (Squirrel Hill) 1813 Murray Ave: permanently closed August 31, 2012
-- per TribLIVE article and Yelp (still shows as closed).
UPDATE stores SET is_active = false
WHERE id = 'f5bf742a-cd26-4770-8467-884f960cf314';

-- Burger King (Downtown Pittsburgh) 600 Penn Ave: permanently closed per Yelp.
UPDATE stores SET is_active = false
WHERE id = 'a26726cd-d3e5-482e-b7e0-b569484306ea';

-- ============================================================
--  DEACTIVATE — WRONG ADDRESS (different business at that location)
-- ============================================================

-- Burger King (Strip District) 2200 Penn Ave: address is Leaf & Bean coffee/cigar shop,
-- not a Burger King, per Yelp and loc8nearme.com.
UPDATE stores SET is_active = false
WHERE id = 'b9fdf070-8db7-45a2-8808-31945f2c0902';

-- Wendy's (North Side) 1601 Brighton Rd: address is Northside Common Ministries
-- Food Pantry (Tue/Wed/Fri 9:30 AM–12 PM), not a Wendy's, per northsidefoodpantry.org.
UPDATE stores SET is_active = false
WHERE id = '2f52fa42-2a57-416b-bb9b-92e16d4a8658';

-- ============================================================
--  DEACTIVATE — LOCATION DOES NOT EXIST
-- ============================================================

-- Five Guys (The Waterfront) 161 W Waterfront Dr: no Five Guys operates at
-- The Waterfront shopping centre per fiveguys.com locator.
UPDATE stores SET is_active = false
WHERE id = '098c5e3e-1c57-423c-acb0-3c0e066f09da';

-- Wendy's (Oakland) 4006 Forbes Ave: no Wendy's in Oakland per wendys.com locator.
-- Nearest is 4001 Butler St (Lawrenceville), a different neighbourhood.
UPDATE stores SET is_active = false
WHERE id = '0ad9bbb1-e6e2-4206-a81c-f33dc1d66a14';

-- Burger King (Oakland) 3900 Forbes Ave: no Burger King confirmed at this address
-- per bk.com locator and Yelp.
UPDATE stores SET is_active = false
WHERE id = '83258377-b662-4445-b735-89f460357b88';

-- McDonald's (South Side) 2901 E Carson St: no McDonald's found at this address
-- per mcdonalds.com locator or Yelp South Side searches.
UPDATE stores SET is_active = false
WHERE id = '48702887-9d49-4eac-bcd3-f0cf1978b200';

-- Panera Bread (Downtown Pittsburgh) 301 Fifth Ave: no Panera Bread confirmed at
-- this address per panerabread.com locator.
UPDATE stores SET is_active = false
WHERE id = '385664a5-6f12-4ed8-b32e-75448111d803';

-- Wendy's (South Side) 128 E Carson St: no Wendy's confirmed in South Side
-- per wendys.com locator.
UPDATE stores SET is_active = false
WHERE id = 'a506e253-24c0-473a-b2de-e4fbc6a33ce2';

-- ============================================================
--  DEACTIVATE — TEMPORARILY CLOSED
-- ============================================================

-- GetGo (Cochran Rd) 1636 Cochran Rd: confirmed closed for extended remodeling
-- as of March–May 2026 per GasBuddy station reports.
UPDATE stores SET is_active = false
WHERE id = '87b3e2e9-6b54-4c42-8c7d-e1ef46bd8c40';

-- ============================================================
--  ADD MISSING STORE
-- ============================================================

-- CVS Pharmacy (McCandless) 9805 McKnight Rd: this store exists and is active
-- (confirmed per cvs.com store locator and Yelp). Migration 004 attempted to add
-- it but it was not inserted into the live DB.
-- Coordinates co-located with Giant Eagle at 9805 McKnight Rd per migration 004.
INSERT INTO stores (name, address, city, state, zip, latitude, longitude, phone, store_type)
SELECT 'CVS Pharmacy (McCandless)', '9805 McKnight Rd', 'Pittsburgh', 'PA', '15237',
       40.58550, -80.03650, '(412) 366-7290', 'drugstore'
WHERE NOT EXISTS (
  SELECT 1 FROM stores
  WHERE name = 'CVS Pharmacy (McCandless)' AND address = '9805 McKnight Rd'
    AND city = 'Pittsburgh' AND state = 'PA'
);

-- Store hours for new CVS: 8 am–10 pm daily
INSERT INTO store_hours (store_id, day_of_week, opens_at, closes_at)
SELECT s.id, d.day, '08:00'::time, '22:00'::time
FROM stores s, generate_series(0, 6) AS d(day)
WHERE s.name = 'CVS Pharmacy (McCandless)' AND s.address = '9805 McKnight Rd'
  AND s.city = 'Pittsburgh' AND s.state = 'PA'
ON CONFLICT (store_id, day_of_week) DO NOTHING;

-- Products for new CVS
INSERT INTO store_products (store_id, product_id, in_stock)
SELECT s.id, p.id, true
FROM stores s, products p
WHERE s.name = 'CVS Pharmacy (McCandless)' AND s.address = '9805 McKnight Rd'
  AND s.city = 'Pittsburgh' AND s.state = 'PA'
  AND p.sku IN ('DC_20OZ_BOTTLE', 'DC_2L_BOTTLE', 'DC_6PACK_12OZ', 'DCZS_20OZ_BOTTLE', 'DCZS_2L_BOTTLE')
ON CONFLICT (store_id, product_id) DO NOTHING;

COMMIT;
