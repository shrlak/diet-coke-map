-- Fix remaining coordinate mismatches (May 2026).
--
-- An automated geocoder (Nominatim / edge-function pipeline) overwrote
-- coordinates for stores that were not covered by the prior revision in
-- 20260520010000_revise_all_store_locations.sql.
--
-- All corrected coordinates below come from:
--   • supabase/schema.sql (verified via chain locators, Yelp, Google Maps, May 2026)
--   • 20260517000004_restore_missing_stores.sql
--   • 20260518010000_refine_store_coordinates.sql
--   • 20260520000000_add_fast_food_stores.sql

BEGIN;

-- ============================================================
--  PITTSBURGH — CARNEGIE
-- ============================================================

-- GetGo 350 E Main St, Carnegie 15106.
-- Geocoder placed ~1.6 km north at 40.409/-80.084.
-- Carnegie's E Main St is at ~40.395; correct per schema.sql.
UPDATE stores SET latitude = 40.39510, longitude = -80.08360
WHERE id = '5491fd80-a917-4176-87cb-1fb2dec4975b';

-- ============================================================
--  PITTSBURGH — BETHEL PARK / SOUTH HILLS
-- ============================================================

-- Giant Eagle 5055 Library Rd, Bethel Park 15102.
-- Geocoder shifted longitude ~220 m east to -80.024. Correct: -80.026 per schema.sql.
UPDATE stores SET latitude = 40.33897, longitude = -80.02604
WHERE id = 'b7354a68-fd19-469a-8e96-93e9119b8bfb';

-- Giant Eagle Market District 7000 Oxford Dr, Bethel Park 15102.
-- Geocoder placed ~1.4 km north at 40.347. Correct: 40.335 per schema.sql.
UPDATE stores SET latitude = 40.33460, longitude = -80.04720
WHERE id = 'd7df0729-8afa-4512-a10d-fa73029304a8';

-- ============================================================
--  PITTSBURGH — ROBINSON / STEUBENVILLE PIKE
-- ============================================================

-- GetGo 6513 Steubenville Pike, Pittsburgh 15205.
-- Geocoder placed ~410 m northeast. Correct per schema.sql / migration 004.
UPDATE stores SET latitude = 40.44745, longitude = -80.16289
WHERE id = 'cf8e3052-218d-4434-8c4f-76e8b7c65e62';

-- ============================================================
--  PITTSBURGH — NORTH HILLS / MCCANDLESS
-- ============================================================

-- Giant Eagle 9805 McKnight Rd, Pittsburgh 15237 (McCandless).
-- Geocoder moved ~380 m east to -80.033. Correct: -80.037 per migration 18010000.
UPDATE stores SET latitude = 40.58571, longitude = -80.03713
WHERE id = 'd9601848-98c8-4c02-8db8-6c410439ecb8';

-- ============================================================
--  PITTSBURGH — LAWRENCEVILLE
-- ============================================================

-- GetGo 4000 Butler St, Pittsburgh 15201 (Lawrenceville).
-- Geocoder shifted ~190 m south-east. Correct per schema.sql / migration 001.
UPDATE stores SET latitude = 40.46990, longitude = -79.96050
WHERE id = '1e03e1a4-cef2-4690-979a-83b617f3ba5f';

-- ============================================================
--  PITTSBURGH — WEST (COCHRAN RD)
-- ============================================================

-- Giant Eagle Market District 1717 Cochran Rd, Pittsburgh 15220.
-- Geocoder shifted ~150 m south-west. Correct per schema.sql / migration 004.
UPDATE stores SET latitude = 40.39328, longitude = -80.06523
WHERE id = 'ef9b0422-0324-4a1b-91ac-a169a0510e1a';

-- ============================================================
--  PITTSBURGH — SHADYSIDE
-- ============================================================

-- Giant Eagle Market District 5550 Centre Ave, Pittsburgh 15232 (Shadyside).
-- Geocoder shifted ~95 m south-east. Correct per schema.sql.
UPDATE stores SET latitude = 40.45695, longitude = -79.93497
WHERE id = '8b9ab545-b8b8-4e3d-91b4-375a0fb68d46';

-- Walgreens 5956 Centre Ave, Pittsburgh 15206 (Shadyside).
-- Geocoder placed ~245 m north-east. Correct per schema.sql.
UPDATE stores SET latitude = 40.45730, longitude = -79.92800
WHERE id = '30cf06a4-2c69-43a0-91e4-b20211a42708';

-- ============================================================
--  PITTSBURGH — PENN HILLS
-- ============================================================

-- Giant Eagle 230 Rodi Rd, Pittsburgh 15235 (Penn Hills).
-- Geocoder shifted ~170 m south-east. Correct per schema.sql / migration 004.
UPDATE stores SET latitude = 40.46323, longitude = -79.82416
WHERE id = 'd4c99d40-9373-4dba-95f5-cb31ce2bd93b';

-- ============================================================
--  PITTSBURGH — DOWNTOWN
-- ============================================================

-- CVS Pharmacy 242 Fifth Ave, Pittsburgh 15222 (Downtown).
-- Geocoder placed ~230 m west at -80.001. Correct: -79.999 per schema.sql.
UPDATE stores SET latitude = 40.44180, longitude = -79.99890
WHERE id = 'ea9f59f9-298f-4ed6-aa3f-12ea26632982';

-- CVS Pharmacy 482 Smithfield St, Pittsburgh 15219 (Downtown).
-- Geocoder placed ~200 m north at 40.440. Correct: 40.438 per schema.sql / migration 004.
UPDATE stores SET latitude = 40.43810, longitude = -79.99580
WHERE id = '4126949d-bcbf-40b1-b6e3-1dea71d13bac';

-- ============================================================
--  PITTSBURGH — OAKLAND
-- ============================================================

-- CVS Pharmacy 4610 Centre Ave, Pittsburgh 15213 (Oakland).
-- Geocoder shifted ~245 m south-east. Correct per schema.sql / migration 002.
UPDATE stores SET latitude = 40.45350, longitude = -79.95000
WHERE id = '9aa14861-9598-402a-989c-092449155c99';

-- Food For Thought Deli 196 N Craig St, Pittsburgh 15213 (Oakland).
-- Geocoder placed ~150 m north. Correct per schema.sql.
UPDATE stores SET latitude = 40.44830, longitude = -79.95040
WHERE id = '09d6a302-9aaa-4a9a-b169-5f75fbe61a51';

-- Forbes Street Market 3955 Forbes Ave, Pittsburgh 15213 (Oakland).
-- Geocoder shifted ~200 m west. Correct per schema.sql.
UPDATE stores SET latitude = 40.44320, longitude = -79.95320
WHERE id = 'dfd148a0-8e06-4a7d-947f-413eb2420cae';

-- The University Store on Fifth 4000 Fifth Ave, Pittsburgh 15213 (Oakland).
-- Geocoder shifted ~130 m south-west. Correct per schema.sql.
UPDATE stores SET latitude = 40.44430, longitude = -79.95510
WHERE id = '3781dacd-e0dd-4ffa-be88-a59f8c7bf2c6';

-- The Pitt Shop 3939 Forbes Ave, Pittsburgh 15213 (Oakland).
-- Geocoder shifted longitude ~120 m west to -79.956. Correct: -79.954 per schema.sql.
UPDATE stores SET latitude = 40.44260, longitude = -79.95430
WHERE id = '64ccffc0-a8fe-4f51-a841-c41ca69cd355';

-- McDonald's 3637 Forbes Ave, Pittsburgh 15213 (Oakland).
-- Geocoder shifted ~185 m south-east. Correct per migration 20260520000000.
UPDATE stores SET latitude = 40.44240, longitude = -79.95950
WHERE id = '5a8f230a-f933-4fc4-842f-497881b980bc';

-- Five Guys 3628 Forbes Ave, Pittsburgh 15213 (Oakland).
-- Geocoder shifted ~235 m south-east. Correct per migration 20260520000000.
UPDATE stores SET latitude = 40.44230, longitude = -79.95970
WHERE id = '2340a43c-c34c-4cb4-a703-a67963ac56bd';

-- Panera Bread 3538 Forbes Ave, Pittsburgh 15213 (Oakland).
-- Geocoder shifted ~290 m south-east. Correct per migration 20260520000000.
UPDATE stores SET latitude = 40.44200, longitude = -79.96100
WHERE id = '3e09a57d-4904-4217-8e93-1d7e540e661f';

-- Burger King 3900 Forbes Ave, Pittsburgh 15213 (Oakland).
-- Geocoder placed ~270 m east at -79.953. Correct: -79.956 per migration 20260520000000.
UPDATE stores SET latitude = 40.44340, longitude = -79.95590
WHERE id = '83258377-b662-4445-b735-89f460357b88';

-- Chick-fil-A 4216 Forbes Ave, Pittsburgh 15213 (Oakland).
-- Geocoder placed ~300 m east at -79.950. Correct: -79.954 per migration 20260520000000.
UPDATE stores SET latitude = 40.44420, longitude = -79.95390
WHERE id = '759b0bd1-fae3-40bd-9b52-2f460167d0fd';

-- ============================================================
--  PITTSBURGH — DOWNTOWN (FAST FOOD)
-- ============================================================

-- McDonald's 340 Sixth Ave, Pittsburgh 15222 (Downtown).
-- Geocoder shifted ~155 m west. Correct per migration 20260520000000.
UPDATE stores SET latitude = 40.44130, longitude = -79.99700
WHERE id = 'ee0f2091-68d7-4900-b13a-9be9a428c5ba';

-- Five Guys 530 Smithfield St, Pittsburgh 15222 (Downtown).
-- Geocoder shifted ~160 m west. Correct per migration 20260520000000.
UPDATE stores SET latitude = 40.44060, longitude = -79.99620
WHERE id = '17d514b9-4256-4b9c-a70a-98d70d73ae58';

-- Panera Bread 301 Fifth Ave, Pittsburgh 15222 (Downtown).
-- Geocoder shifted ~225 m west. Correct per migration 20260520000000.
UPDATE stores SET latitude = 40.44130, longitude = -79.99710
WHERE id = '385664a5-6f12-4ed8-b32e-75448111d803';

-- ============================================================
--  PITTSBURGH — SQUIRREL HILL
-- ============================================================

-- Panera Bread 1813 Murray Ave, Pittsburgh 15217 (Squirrel Hill).
-- Geocoder placed ~97 m north. Correct per migration 20260520000000.
UPDATE stores SET latitude = 40.43590, longitude = -79.92300
WHERE id = 'f5bf742a-cd26-4770-8467-884f960cf314';

-- ============================================================
--  PITTSBURGH — NORTH SHORE
-- ============================================================

-- McDonald's 620 W North Ave, Pittsburgh 15212 (North Shore).
-- Geocoder placed ~335 m south-west. Correct per migration 20260520000000.
UPDATE stores SET latitude = 40.45570, longitude = -80.00960
WHERE id = '919ea472-ff1d-44db-a616-662648824833';

-- ============================================================
--  HOMESTEAD / WATERFRONT
-- ============================================================

-- Target 360 Waterfront Dr E, Homestead 15120.
-- Geocoder placed ~880 m northwest. Correct per schema.sql / migration 004.
UPDATE stores SET latitude = 40.40830, longitude = -79.90080
WHERE id = 'd12ac729-26df-40f8-83f3-1f0938c19d7a';

COMMIT;
