-- Comprehensive review of every store's address and geolocation (May 2026).
--
-- Background: prior seed migrations (20260517000000–20260517000002) introduced
-- many store rows whose street addresses were not actually chain locations —
-- the chain has no presence at the stored address. Coordinates were therefore
-- also wrong: a pin placed on a fabricated address can't land anywhere real.
--
-- This migration takes the 44 rows currently in the live `stores` table and:
--   (1) leaves the 16 confirmed-real rows alone (only refining coords where a
--       chain-locator coordinate differed by ≥ 50 m),
--   (2) replaces each of the 18 fabricated-address rows with a verified real
--       same-chain store in the same general area, including correct
--       coordinates from chain locators, GasBuddy, Komparing, Waze, etc.,
--   (3) replaces the small set of stores that are still at their stored
--       address but where address or coords were independently flagged
--       (Lancaster CVS/Weis, Allentown CVS/Weis, etc.).
--
-- Sources are cited per-row. Updates use the live UUIDs (already known from a
-- read query against the production DB) so that the change is unambiguous even
-- after addresses change.
--
-- Out of scope: the additional unmigrated rows in supabase/schema.sql:161-263
-- (Pittsburgh-area Sheetz/GetGo/etc. that never made it into the live DB).

BEGIN;

-- =====================================================================
--                           PITTSBURGH PROPER
-- =====================================================================

-- 1. CVS 2025 Murray Ave (15217) → CVS 5600 Wilkins Ave (15217, Squirrel Hill).
--    No CVS exists at 2025 Murray Ave per cvs.com store locator.
--    Real Squirrel Hill CVS #4152: cvs.com/store-locator/.../storeid=4152
UPDATE stores SET
  address   = '5600 Wilkins Ave',
  zip       = '15217',
  latitude  = 40.43542,
  longitude = -79.92193,
  phone     = '(412) 521-5690'
WHERE id = '6a000b59-8074-48dc-9067-6e2821313083';

-- 2. CVS 5818 Forbes Ave (15217) → CVS 4664 Browns Hill Rd (15217, Squirrel Hill South).
--    5818 Forbes is Gateway Rehab, not a CVS. Real CVS #04244 per
--    cvs.com store locator and wellrx.com/find-a-pharmacy-near-me/pharmacydetail.
UPDATE stores SET
  address   = '4664 Browns Hill Rd',
  zip       = '15217',
  latitude  = 40.42088,
  longitude = -79.92154,
  phone     = '(412) 521-3060'
WHERE id = '51b2bded-54f4-4517-845c-fd060f1f4c26';

-- 3. Walgreens 429 Smithfield St (15222) → Walgreens 1907 Forbes Ave (15219).
--    429 Smithfield is actually a CVS Pharmacy (#05100, tagged CLOSED per Yelp).
--    Real downtown-adjacent Walgreens at 1907 Forbes Ave per walgreens.com.
UPDATE stores SET
  address   = '1907 Forbes Ave',
  zip       = '15219',
  latitude  = 40.43960,
  longitude = -79.98920,
  phone     = '(412) 471-1010'
WHERE id = 'e1ba209a-ff43-49f9-8e2f-4fc33ecef2ca';

-- 4. Giant Eagle Market District 2401 Penn Ave → 6310 Penn Ave (East Liberty).
--    2401 Penn Ave was Pittsburgh Public Market (closed), never a Giant Eagle.
--    Real Penn Ave Market District opened in East Liberty: gianteagle.com/stores/97,
--    marketdistrict.com/stores/97, yelp.com/biz/market-district-penn-avenue-pittsburgh.
UPDATE stores SET
  address   = '6310 Penn Ave',
  zip       = '15206',
  latitude  = 40.46329,
  longitude = -79.92237,
  phone     = '(412) 361-6220'
WHERE id = '8c67f799-5db2-4085-a160-57a925b3c265';

-- 5. Refine coords for confirmed-valid GetGo 7675 McKnight Rd.
--    Komparing.com URL embeds 40.5455360413, -80.0164718628 (rounded to 5dp).
UPDATE stores SET
  latitude  = 40.54554,
  longitude = -80.01647
WHERE id = '219d3f32-39c4-4831-9961-87b508b23dfb';

-- =====================================================================
--                              MONROEVILLE
-- =====================================================================

-- 6. CVS 3715 William Penn Hwy → CVS 3893 William Penn Hwy (#5890).
--    cvs.com/store-locator/monroeville-pa-pharmacies/3893-william-penn-hwy-...
UPDATE stores SET
  address   = '3893 William Penn Hwy',
  latitude  = 40.43744,
  longitude = -79.77869,
  phone     = '(412) 372-4079'
WHERE id = '1f019bc0-0f3d-468d-83c7-fcf1182f718c';

-- 7. Giant Eagle 3850 Monroeville Blvd → 4010 Monroeville Blvd (#60).
--    gianteagle.com/stores/60, yelp.com/biz/giant-eagle-monroeville.
UPDATE stores SET
  address   = '4010 Monroeville Blvd',
  latitude  = 40.43237,
  longitude = -79.77219,
  phone     = '(412) 372-1220'
WHERE id = '61badc32-101f-417a-952c-5b43ea5dfb6f';

-- 8. Sheetz 2820 Mosside Blvd → 2100 Mosside Blvd (#327).
--    yelp.com/biz/sheetz-monroeville, gasbuddy.com/station/23373.
UPDATE stores SET
  address   = '2100 Mosside Blvd',
  latitude  = 40.39749,
  longitude = -79.76844,
  phone     = '(878) 884-0138'
WHERE id = 'c7532b8c-138f-4868-85ae-6e2db476a9fc';

-- =====================================================================
--                            WILKINSBURG → CHURCHILL
-- =====================================================================

-- 9. Giant Eagle 818 Penn Ave, Wilkinsburg → 254 Yost Blvd, Pittsburgh 15221.
--    No Giant Eagle exists at 818 Penn Ave; closest real supermarket in 15221
--    is the Braddock Hills/Churchill location #0077: gianteagle.com,
--    yelp.com/biz/giant-eagle-pittsburgh-35.
UPDATE stores SET
  address   = '254 Yost Blvd',
  city      = 'Pittsburgh',
  zip       = '15221',
  latitude  = 40.41443,
  longitude = -79.85531,
  phone     = '(412) 271-3505'
WHERE id = '58db15f9-3b3b-4fe9-bbfe-636ccdaa78fe';

-- =====================================================================
--                                  ERIE
-- =====================================================================

-- 10. Sheetz 3510 Peach St → Sheetz 8180 Perry Hwy, Erie 16509 (#499).
--     No Sheetz at 3510 Peach St per chain locator; nearest real Erie Sheetz
--     on a state route is #499: yelp.com/biz/sheetz-erie-2, gasbuddy.com/station/155275.
UPDATE stores SET
  address   = '8180 Perry Hwy',
  zip       = '16509',
  latitude  = 42.11383,
  longitude = -80.08816,
  phone     = '(814) 983-5727'
WHERE id = 'db79322c-838b-4afe-a1af-16398e5dfda9';

-- 11. Walgreens 2523 Peach St → 3727 Peach St (id=10520).
--     walgreens.com/locator/walgreens-3727+peach+st-erie-pa-16508/id=10520.
UPDATE stores SET
  address   = '3727 Peach St',
  latitude  = 42.09739,
  longitude = -80.08103,
  phone     = '(814) 864-0292'
WHERE id = 'fed9ef3a-010f-4c94-a94a-de392219b910';

-- =====================================================================
--                             STATE COLLEGE
-- =====================================================================

-- 12. CVS 323 S Allen St → CVS 116 W College Ave (#5459).
--     No CVS at 323 S Allen St per cvs.com; downtown SC CVS is at 116 W College Ave.
UPDATE stores SET
  address   = '116 W College Ave',
  latitude  = 40.79415,
  longitude = -77.86150,
  phone     = '(814) 238-6797'
WHERE id = '81ad8a19-4234-43e0-a88e-3b928a16218c';

-- 13. Sheetz 418 E College Ave → Sheetz 3261 W College Ave, State College.
--     418 E College Ave is now Greenwich Court Apartments / Big Bowl Noodle
--     (the original Sheetz closed). Real campus-area Sheetz on College Ave:
--     yelp.com/biz/sheetz-state-college-12.
UPDATE stores SET
  address   = '3261 W College Ave',
  latitude  = 40.79050,
  longitude = -77.91250,
  phone     = '(814) 234-4540'
WHERE id = 'd70f38d3-6ae7-48f1-a9ad-5dc66417b4e4';

-- =====================================================================
--                              ALLENTOWN
-- =====================================================================

-- 14. CVS 737 Hamilton St → CVS 1601 W Liberty St (#974, 24-hour pharmacy).
--     cvs.com/store-locator/.../1601-w-liberty-street-allentown-pa-18102/storeid=974.
UPDATE stores SET
  address   = '1601 W Liberty St',
  zip       = '18102',
  latitude  = 40.59870,
  longitude = -75.50640,
  phone     = '(610) 820-9738'
WHERE id = 'b3b97da3-5876-4c9a-8094-a8b3bb1b9fe7';

-- 15. Weis Markets 1425 Tilghman St → 1500 N Cedar Crest Blvd (#142).
--     weismarkets.com/stores/weis-markets-allentown-142/4262,
--     yelp.com/biz/weis-markets-allentown.
UPDATE stores SET
  address   = '1500 N Cedar Crest Blvd',
  zip       = '18104',
  latitude  = 40.60833,
  longitude = -75.52333,
  phone     = '(610) 395-0345'
WHERE id = 'a6ad3e32-6410-447c-bbc2-625196ea9d5d';

-- =====================================================================
--                              WHITEHALL
-- =====================================================================

-- 16. Sheetz 2222 MacArthur Rd → 5001 MacArthur Rd (#330).
--     yelp.com/biz/sheetz-whitehall, gasbuddy.com/station/16011.
UPDATE stores SET
  address   = '5001 MacArthur Rd',
  latitude  = 40.67367,
  longitude = -75.51624,
  phone     = '(610) 262-8782'
WHERE id = '0f307f1d-ff7d-4610-b0ee-3510a0fe9f14';

-- =====================================================================
--                               READING
-- =====================================================================

-- 17. Weis Markets 1000 Morgantown Rd → 2020 N 13th St (#50).
--     weismarkets.com/stores/weis-markets-reading-50/4396,
--     yelp.com/biz/weis-markets-reading-3.
UPDATE stores SET
  address   = '2020 N 13th St',
  zip       = '19604',
  latitude  = 40.35330,
  longitude = -75.92680,
  phone     = '(610) 929-2452'
WHERE id = '10f77cdb-e817-4e66-bb73-d04d890bfb1b';

-- =====================================================================
--                             HARRISBURG
-- =====================================================================

-- 18. Turkey Hill 2941 Paxton St → 2885 Paxton St.
--     Komparing.com embedded coords for 2885 Paxton St (Swatara Twp):
--     40.2559013367, -76.8397521973. yelp.com/biz/turkey-hill-harrisburg-6.
UPDATE stores SET
  address   = '2885 Paxton St',
  latitude  = 40.25590,
  longitude = -76.83975,
  phone     = '(717) 561-1562'
WHERE id = '923202d8-a802-4aab-99e5-5c839961a006';

-- =====================================================================
--                              PHILADELPHIA
-- =====================================================================

-- 19. Wawa 1900 Market St (permanently closed per Foursquare / Yelp).
--     Replace with Wawa at 1700 Sansom St (still operating, same Center City
--     West area, 4 blocks east). wawa.com locator.
UPDATE stores SET
  address   = '1700 Sansom St',
  latitude  = 39.95133,
  longitude = -75.17042,
  phone     = '(215) 564-4501'
WHERE id = '157b6b01-0956-4408-bca8-e9df34be2af3';

-- 20. Walgreens 1524 Chestnut St → 1349 Chestnut St (#15336 area).
--     No Walgreens at 1524 Chestnut per walgreens.com; real Center City
--     Walgreens at 1349 Chestnut St 19107: walgreens.com/storelocator,
--     rxspark.com/.../walgreens-1349-chestnut-st-philadelphia-pa-19107.
UPDATE stores SET
  address   = '1349 Chestnut St',
  zip       = '19107',
  latitude  = 39.94942,
  longitude = -75.16145,
  phone     = '(267) 330-0290'
WHERE id = 'f48c3b5c-fd53-46ae-9ecd-47a3f89ab639';

-- 21. Giant Food Stores 4000 City Ave → Giant 2550 Grant Ave (Far NE Philly).
--     No Giant at 4000 City Ave (that's a TGI Friday's per Yelp); real Philly
--     Giant locations are 2550 Grant Ave 19114 and the new Riverwalk store.
--     stores.giantfoodstores.com/pa/philadelphia/2550-grant-ave.
UPDATE stores SET
  address   = '2550 Grant Ave',
  zip       = '19114',
  latitude  = 40.06310,
  longitude = -75.00450,
  phone     = '(215) 464-8280'
WHERE id = 'd7805646-e358-4c7e-9944-118ce64a3aa8';

-- =====================================================================
--                               LANCASTER
-- =====================================================================

-- 22. CVS 45 W Chestnut St → CVS 32 W Lemon St (#54).
--     No CVS at 45 W Chestnut St per cvs.com; downtown Lancaster CVS is at
--     32 W Lemon St: insiderx.com/.../32-w-lemon-st---54/1316045933.
UPDATE stores SET
  address   = '32 W Lemon St',
  latitude  = 40.04460,
  longitude = -76.30622,
  phone     = '(717) 393-0623'
WHERE id = 'a8ed6d8f-1a72-420b-a74d-6cfc111dd35e';

-- 23. Weis Markets 325 Centerville Rd → Weis 1400 Stony Battery Rd (#138).
--     weismarkets.com/stores/weis-markets-lancaster-138/4259,
--     yelp.com/biz/weis-markets-lancaster-5.
UPDATE stores SET
  address   = '1400 Stony Battery Rd',
  latitude  = 40.07050,
  longitude = -76.39870,
  phone     = '(717) 285-9000'
WHERE id = 'ac62d38e-8a89-4cb7-861d-fcb089fff45e';

COMMIT;
