-- Comprehensive store location revision (May 2026).
--
-- The geocoder used in a prior pass (Nominatim / edge-function pipeline)
-- misplaced many stores — some by 5–10 km. This migration restores the
-- authoritative coordinates from:
--   • 20260518000000_review_all_store_geolocations.sql  (cited chain locators)
--   • 20260518010000_refine_store_coordinates.sql        (cited Komparing/Yelp)
--   • 20260519000000_audit_newly_added_stores.sql
--   • supabase/schema.sql initial seed (verified via chain websites, May 2026)
--
-- Each update cites the source used to establish the correct coordinate.

BEGIN;

-- ============================================================
--  ERIE
-- ============================================================

-- Sheetz 8180 Perry Hwy, Erie 16509 (Summit Township, near I-90 exit 27).
-- Prior migration 20260518010000 corrected from Loc8NearMe/Yelp.
-- Geocoder overwrote to 42.065/-80.037 (wrong — south of city, wrong highway).
UPDATE stores SET latitude = 42.10449, longitude = -80.14992
WHERE id = 'db79322c-838b-4afe-a1af-16398e5dfda9';

-- Giant Eagle 2877 W 26th St, Erie 16506.
-- Refined in 20260518010000 from Yelp/Superpages.
UPDATE stores SET latitude = 42.08814, longitude = -80.13729
WHERE id = '8d8d0548-4fea-487e-bfbb-7ba33bbb1c09';

-- ============================================================
--  HARRISBURG
-- ============================================================

-- Sheetz 4651 Lindle Rd, Harrisburg 17111 (near HIA airport).
-- Geocoder placed at 40.242/-76.803 — east of Swatara Creek, wrong.
-- Correct: 40.254/-76.866 per schema.sql + sheetz.com/gasbuddy.
UPDATE stores SET latitude = 40.25380, longitude = -76.86640
WHERE id = 'a9c11441-d424-4543-843f-ade2e4b618b5';

-- Turkey Hill 2885 Paxton St, Harrisburg 17111.
-- Geocoder placed at 40.255/-76.853; correct coords per Komparing.com URL.
UPDATE stores SET latitude = 40.25590, longitude = -76.83975
WHERE id = '923202d8-a802-4aab-99e5-5c839961a006';

-- ============================================================
--  ALLENTOWN
-- ============================================================

-- Weis Markets 1500 N Cedar Crest Blvd, Allentown 18104.
-- Geocoder placed ~2 km south at 40.590. Chain locator/Yelp: 40.608.
UPDATE stores SET latitude = 40.60833, longitude = -75.52333
WHERE id = 'a6ad3e32-6410-447c-bbc2-625196ea9d5d';

-- ============================================================
--  STATE COLLEGE
-- ============================================================

-- Sheetz 3261 W College Ave, State College 16801.
-- Geocoder placed at 40.759/-77.878 — south of campus, wrong street.
-- Correct: 40.791/-77.913 per schema.sql + sheetz.com/yelp.
UPDATE stores SET latitude = 40.79050, longitude = -77.91250
WHERE id = 'd70f38d3-6ae7-48f1-a9ad-5dc66417b4e4';

-- Weis Markets 1471 Martin St, State College 16803.
-- Refined in 20260518010000 from weismarkets.com store page.
UPDATE stores SET latitude = 40.80493, longitude = -77.89039
WHERE id = '2ae4f432-405e-47f8-8ee2-22e43acf03c9';

-- ============================================================
--  LANCASTER
-- ============================================================

-- Sheetz 3101 Columbia Ave, Lancaster 17603.
-- Geocoder placed at 40.041/-76.391 (too far west). Correct: 40.037/-76.332.
UPDATE stores SET latitude = 40.03680, longitude = -76.33170
WHERE id = 'e69c1715-b9f4-4440-8e79-a07e7ffba13d';

-- Weis Markets 1400 Stony Battery Rd, Lancaster 17601.
-- Geocoder placed at 40.064/-76.412 (too far west). Correct: 40.071/-76.399
-- per weismarkets.com store #138 / Yelp.
UPDATE stores SET latitude = 40.07050, longitude = -76.39870
WHERE id = 'ac62d38e-8a89-4cb7-861d-fcb089fff45e';

-- ============================================================
--  PHILADELPHIA
-- ============================================================

-- CVS 1826 Chestnut St, Philadelphia 19103.
-- Geocoder placed ~250 m northeast. Correct per cvs.com storeid.
UPDATE stores SET latitude = 39.94980, longitude = -75.16973
WHERE id = '40d54ffc-e67c-4e56-be01-704ff0e56232';

-- Walgreens 1349 Chestnut St, Philadelphia 19107.
-- Geocoder placed ~250 m north. Correct per walgreens.com locator.
UPDATE stores SET latitude = 39.94942, longitude = -75.16145
WHERE id = 'f48c3b5c-fd53-46ae-9ecd-47a3f89ab639';

-- Wawa 3300 Market St, Philadelphia 19104.
-- Geocoder placed ~1.2 km east at 39.955/-75.190. Correct: 39.952/-75.202.
UPDATE stores SET latitude = 39.95228, longitude = -75.20207
WHERE id = '6fbf6346-ca92-4fa2-a77f-a530b9ae281f';

-- Giant Food Stores 2550 Grant Ave, Philadelphia 19114.
-- Refined in 20260518010000 from stores.giantfoodstores.com + Yelp.
UPDATE stores SET latitude = 40.07665, longitude = -75.02820
WHERE id = 'd7805646-e358-4c7e-9944-118ce64a3aa8';

-- ============================================================
--  MONROEVILLE
-- ============================================================

-- Giant Eagle 4010 Monroeville Blvd (#60).
-- Refined in 20260518010000 from gianteagle.com/stores/60 + Yelp.
UPDATE stores SET latitude = 40.43575, longitude = -79.77114
WHERE id = '61badc32-101f-417a-952c-5b43ea5dfb6f';

-- Target 4004 Monroeville Blvd.
-- Geocoder placed ~1.8 km north. Correct per target.com store locator.
UPDATE stores SET latitude = 40.42810, longitude = -79.75650
WHERE id = 'f9df2517-317e-4898-ba3a-49df7ab0ccb7';

-- ============================================================
--  PITTSBURGH — NORTH HILLS / ROSS TOWNSHIP
-- ============================================================

-- GetGo Cafe + Market 7675 McKnight Rd (Ross Township).
-- Corrected in 20260518000000; geocoder overwrote to 40.499/-80.013 (~5 km south).
UPDATE stores SET latitude = 40.54554, longitude = -80.01647
WHERE id = '219d3f32-39c4-4831-9961-87b508b23dfb';

-- Target 105 Blazier Dr, Pittsburgh 15237 (North Hills).
-- Geocoder placed ~4 km too far north (McCandless area) at 40.585.
-- Blazier Dr is at ~40.550 per target.com + schema.sql.
UPDATE stores SET latitude = 40.55030, longitude = -80.02180
WHERE id = '06daab5a-e031-4718-b675-6dfeebd99e57';

-- Sheetz 8500 Perry Hwy (North Hills).
-- Geocoder placed ~950 m south. Correct per schema.sql.
UPDATE stores SET latitude = 40.56840, longitude = -80.03350
WHERE id = 'eb68cea6-65f8-4a49-b9ab-aa29a6b0f52d';

-- Sheetz 3025 Babcock Blvd (Ross Township).
-- Geocoder placed ~1 km east. Correct per schema.sql.
UPDATE stores SET latitude = 40.51720, longitude = -80.02080
WHERE id = 'c9f9dd98-a2e9-4da3-8de9-506abaad8544';

-- Walgreens 4885 McKnight Rd (Ross Township).
-- Geocoder placed ~1.3 km too far north. Correct per schema.sql.
UPDATE stores SET latitude = 40.51860, longitude = -80.01680
WHERE id = 'd228db4a-0cca-4e01-9299-ab9e9696604e';

-- Aldi 7221 McKnight Rd (Ross Township).
-- Geocoder placed ~950 m south-east. Correct per stores.aldi.us.
UPDATE stores SET latitude = 40.54300, longitude = -80.02000
WHERE id = '8ed0327e-9595-430b-9948-a04feef57d4d';

-- ============================================================
--  PITTSBURGH — BEN AVON / OHIO TOWNSHIP
-- ============================================================

-- GetGo 156 Ben Avon Heights Rd (Ben Avon Heights).
-- Geocoder placed ~2 km north in Ohio Township. Correct per schema.sql.
UPDATE stores SET latitude = 40.50460, longitude = -80.05240
WHERE id = '6beb6a09-8297-4c84-a8ef-1b9c84b7d8f8';

-- Giant Eagle 132 Ben Avon Heights Rd (Ben Avon).
-- Same geocoder error as GetGo above (~2 km north). Correct per schema.sql.
UPDATE stores SET latitude = 40.50450, longitude = -80.05250
WHERE id = 'c2eb494e-7aa1-4bba-b2b9-bc8cc130a990';

-- Sheetz 211 Mount Nebo Rd (Ohio Township).
-- Geocoder placed ~4 km east at 40.533/-80.072.
-- Mount Nebo Rd is west of Pittsburgh toward Emsworth; correct: 40.509/-80.112.
UPDATE stores SET latitude = 40.50930, longitude = -80.11180
WHERE id = '14b7eebe-a3d6-4bf7-b083-4b8210cf83ab';

-- ============================================================
--  PITTSBURGH — ROBINSON / MOON / STOWE
-- ============================================================

-- Walmart 250 Summit Park Dr, Pittsburgh 15275 (Robinson Township).
-- Schema.sql verified coordinate from Walmart store locator.
UPDATE stores SET latitude = 40.50210, longitude = -80.21180
WHERE id = '7f3fab5a-6d77-4435-a124-d6cdd64ac5db';

-- Walmart 7500 University Blvd, Moon Township 15108.
-- Schema.sql verified coordinate from Walmart store locator.
UPDATE stores SET latitude = 40.51560, longitude = -80.22412
WHERE id = 'fc46fbbb-6f5b-48c7-b868-0ced7d6dcead';

-- GetGo 4900 Steubenville Pike (Robinson Township).
-- Geocoder placed ~3 km east at 40.450/-80.107. Correct: 40.452/-80.147.
UPDATE stores SET latitude = 40.45190, longitude = -80.14710
WHERE id = '92e8f4a9-f641-485a-a52a-e28f6b9dd859';

-- Sheetz 5800 Grand Ave (Stowe Township).
-- Geocoder placed at 40.513/-80.133 (~5 km too far west).
-- 5800 Grand Ave, zip 15225, is closer to the city: 40.489/-80.071.
UPDATE stores SET latitude = 40.48860, longitude = -80.07110
WHERE id = '0f2d8543-2226-4531-9d58-910ca49a28f6';

-- Sheetz 5410 Campbells Run Rd (Robinson).
-- Corrected in 20260519000000 to 40.44574/-80.15871.
UPDATE stores SET latitude = 40.44574, longitude = -80.15871
WHERE id = '1cc65d2b-29c2-431f-8ac7-4d8e6b9beaa5';

-- ============================================================
--  PITTSBURGH — CARNEGIE / DORMONT / WEST
-- ============================================================

-- CVS 70 W Steuben St, Pittsburgh 15205 (Carnegie).
-- Geocoder placed at 40.443/-80.044 (Crafton / Ingram area — wrong).
-- Carnegie's W Steuben St is around 40.425/-80.088 per schema.sql.
UPDATE stores SET latitude = 40.42530, longitude = -80.08760
WHERE id = 'ef7e5898-8318-471d-abc0-25ee812a38ec';

-- CVS 3075 W Liberty Ave (Dormont).
-- Geocoder placed ~2 km east at 40.391/-80.038. Correct: 40.402/-80.016.
UPDATE stores SET latitude = 40.40160, longitude = -80.01570
WHERE id = 'd845e7f6-818c-49e8-be55-3690ef9918be';

-- Walgreens 1000 Bower Hill Rd (Mt Lebanon).
-- Geocoder placed ~1.3 km west at 40.379/-80.066. Correct: 40.375/-80.049.
UPDATE stores SET latitude = 40.37490, longitude = -80.04890
WHERE id = 'fa20b452-136e-4068-a5b6-76037bc7d4a3';

-- ============================================================
--  PITTSBURGH — BRENTWOOD / SOUTH HILLS
-- ============================================================

-- GetGo 3601 Saw Mill Run Blvd (Brentwood).
-- Geocoder placed ~900 m north-east. Correct per schema.sql.
UPDATE stores SET latitude = 40.37213, longitude = -79.98160
WHERE id = 'bb3eccc5-8a27-47f0-bb64-ea3491ff3eac';

-- Giant Eagle 600 Towne Square Way (Brentwood Towne Square).
-- Geocoder placed ~850 m south-west. Correct per schema.sql.
UPDATE stores SET latitude = 40.37210, longitude = -79.99270
WHERE id = 'b2d654bd-4ef1-4bff-a65c-bcbde835930d';

-- CVS 1740 Washington Rd (Upper St Clair).
-- Geocoder placed ~500 m north-west. Correct per schema.sql.
UPDATE stores SET latitude = 40.34670, longitude = -80.04910
WHERE id = 'cfaa1afb-c165-4298-a376-44b659032f48';

-- Target 201 S Hills Village (South Hills Village mall).
-- Geocoder placed ~800 m south-west. Correct per schema.sql.
UPDATE stores SET latitude = 40.34610, longitude = -80.04870
WHERE id = '29a44a70-4712-4573-b494-34d7f47aaeeb';

-- ============================================================
--  PITTSBURGH — PENN HILLS / FRANKSTOWN
-- ============================================================

-- CVS 10600 Frankstown Rd (Penn Hills).
-- Geocoder placed ~4 km west at -79.874. Correct: -79.832 per schema.sql.
UPDATE stores SET latitude = 40.46050, longitude = -79.83150
WHERE id = '676d0f1f-cbb6-41d5-8280-6c305c9ff7dd';

-- Giant Eagle 9001 Frankstown Rd (Penn Hills).
-- Geocoder placed ~3 km west at 40.463/-79.865. Correct: 40.459/-79.829.
UPDATE stores SET latitude = 40.45890, longitude = -79.82900
WHERE id = '1475776b-6fa7-4ae5-b03f-e803cee61d1a';

-- Sheetz 3457 William Penn Hwy (Penn Hills).
-- Geocoder placed ~1.7 km west-south-west at 40.431/-79.811.
-- Correct: 40.444/-79.795 per schema.sql.
UPDATE stores SET latitude = 40.44370, longitude = -79.79480
WHERE id = 'fb2450d1-7793-4c33-9e4b-a37cb4c908b6';

-- Aldi 7350 Saltsburg Rd (Penn Hills).
-- Geocoder placed ~2.5 km east at 40.477/-79.786. Correct: 40.464/-79.818.
UPDATE stores SET latitude = 40.46410, longitude = -79.81830
WHERE id = '6bc479ff-3e89-49e3-b47a-6590fc9fe038';

-- Walgreens 6201 Saltsburg Rd (Penn Hills).
-- Geocoder and schema agree: 40.460/-79.825.
UPDATE stores SET latitude = 40.45950, longitude = -79.82500
WHERE id = 'd70a5115-1553-4f61-a514-012b3399fd3b';

-- ============================================================
--  PITTSBURGH — WILKINSBURG / EAST END
-- ============================================================

-- Walgreens 7628 Penn Ave (Wilkinsburg).
-- Geocoder placed ~3.6 km west at -79.895. Penn Ave 7628 is in Churchill:
-- 40.449/-79.854 per schema.sql.
UPDATE stores SET latitude = 40.44880, longitude = -79.85350
WHERE id = '71c3c37a-f2bd-4999-9a28-f9f79c20b350';

-- Aldi 401 Penn Ave (Wilkinsburg).
-- Geocoder placed ~1.2 km east at 40.446/-79.889. Correct: 40.441/-79.873.
UPDATE stores SET latitude = 40.44050, longitude = -79.87320
WHERE id = '9af1b61d-3324-4a74-82ce-49a1cb8894ef';

-- ============================================================
--  PITTSBURGH — FOX CHAPEL / ASPINWALL / WATERWORKS
-- ============================================================

-- Sheetz 2871 Freeport Rd (Aspinwall).
-- Geocoder placed ~10 km east in Indiana Township at 40.539/-79.831.
-- Aspinwall/Blawnox area correct coords from schema.sql: 40.486/-79.902.
UPDATE stores SET latitude = 40.48620, longitude = -79.90240
WHERE id = '2c5fc23b-018c-4983-a46d-e1e04c95b50a';

-- Target 2661 Freeport Rd (Fox Chapel / Waterworks area).
-- Geocoder placed ~10 km east in Indiana Township at 40.538/-79.837.
-- Waterworks area correct coords from schema.sql: 40.484/-79.899.
UPDATE stores SET latitude = 40.48440, longitude = -79.89930
WHERE id = '3493b203-9b59-49fb-a37c-f73b661b2c16';

-- Giant Eagle Market District 910 Freeport Rd (Waterworks).
-- Geocoder placed ~1.2 km south. Correct per schema.sql: 40.499/-79.899.
UPDATE stores SET latitude = 40.49900, longitude = -79.89930
WHERE id = '837712c4-f39e-4101-930c-8ea4efd3c4ce';

-- ============================================================
--  PITTSBURGH — SQUIRREL HILL / SHADYSIDE
-- ============================================================

-- CVS 5600 Wilkins Ave (Squirrel Hill).
-- Corrected in 20260518010000 to 40.43542/-79.92193 (cvs.com storeid=4152).
-- Geocoder overwrote to 40.444/-79.928.
UPDATE stores SET latitude = 40.43542, longitude = -79.92193
WHERE id = '6a000b59-8074-48dc-9067-6e2821313083';

-- Giant Eagle 1901 Murray Ave (Squirrel Hill).
-- Geocoder placed ~800 m north at 40.436/-79.923. Correct: 40.429/-79.926.
UPDATE stores SET latitude = 40.42860, longitude = -79.92620
WHERE id = 'f65b48e0-e582-4407-8e15-b7c4e8880b0e';

-- Giant Eagle Market District 6310 Penn Ave (East Liberty).
-- Corrected in 20260518000000 from 2401 Penn Ave (wrong). Current geocoded
-- value (40.459/-79.919) is ~500 m south of the actual store.
-- Correct: 40.463/-79.922 per gianteagle.com/stores/97.
UPDATE stores SET latitude = 40.46329, longitude = -79.92237
WHERE id = '8c67f799-5db2-4085-a160-57a925b3c265';

-- Target 6231 Penn Ave (East Liberty).
-- Geocoder within 200 m; refine to schema.sql value.
UPDATE stores SET latitude = 40.45910, longitude = -79.92210
WHERE id = '51c4942a-28ec-4d13-b311-a5b2b2793c64';

-- Target 4801 McKnight Rd (Ross Township).
-- Geocoder placed ~1.4 km east at 40.526/-80.006. Correct: 40.518/-80.018.
UPDATE stores SET latitude = 40.51800, longitude = -80.01830
WHERE id = 'c4552f69-81ce-4523-898c-c5f90e3cd47a';

-- ============================================================
--  PITTSBURGH — BLOOMFIELD / LAWRENCEVILLE / BAUM BLVD
-- ============================================================

-- GetGo Cafe + Market 4924 Baum Blvd (Bloomfield).
-- Geocoder placed ~1.6 km west at -79.945. Correct: 40.455/-79.923.
UPDATE stores SET latitude = 40.45530, longitude = -79.92260
WHERE id = '086c3f3c-7817-441e-b749-4f4b89ad7323';

-- Aldi 5631 Baum Blvd (Bloomfield).
-- Geocoder placed ~800 m north-east. Correct: 40.454/-79.923.
UPDATE stores SET latitude = 40.45430, longitude = -79.92340
WHERE id = 'ea93a083-154e-45dd-8c22-f748e88f2b59';

-- Aldi 5200 Penn Ave (Bloomfield/Garfield).
-- Geocoder placed ~300 m east. Correct per stores.aldi.us.
UPDATE stores SET latitude = 40.46370, longitude = -79.93480
WHERE id = '7a7b69db-0c64-49e7-8e4f-f6c408a92a5e';

-- Aldi 450 56th St (Lawrenceville).
-- Geocoder placed ~1.2 km north at 40.483/-79.948. Correct: 40.474/-79.957.
UPDATE stores SET latitude = 40.47420, longitude = -79.95740
WHERE id = 'd84baf05-49ec-4298-b7cd-a4d95234059c';

-- ============================================================
--  PITTSBURGH — NORTH SIDE
-- ============================================================

-- Giant Eagle 318 Cedar Ave (North Side).
-- Geocoder placed ~1.5 km east at 40.451/-80.001. Correct: 40.456/-80.017.
UPDATE stores SET latitude = 40.45620, longitude = -80.01730
WHERE id = '2a8eab53-7395-4b49-835f-746dccad26cc';

-- ============================================================
--  PITTSBURGH — SOUTH SIDE
-- ============================================================

-- GetGo 3247 E Carson St (South Side).
-- Geocoder placed ~650 m east. Correct per schema.sql: 40.427/-79.967.
UPDATE stores SET latitude = 40.42710, longitude = -79.96660
WHERE id = '36f05e8e-28fe-4ccd-b439-7d09efeebda7';

-- Aldi 2628 E Carson St (South Side).
-- Geocoder within 300 m; refine to schema.sql value.
UPDATE stores SET latitude = 40.42700, longitude = -79.97410
WHERE id = 'e17485fc-50c7-4ca2-8f2e-e5844cf6082a';

-- Aldi 3089 Sussex Ave (Overbrook).
-- Geocoder placed ~750 m south-east. Correct: 40.387/-80.007.
UPDATE stores SET latitude = 40.38730, longitude = -80.00650
WHERE id = '6508b72e-3da7-4894-b8f3-dae4f1e2293b';

-- ============================================================
--  PITTSBURGH — EDGEWOOD / SWISSVALE / BRADDOCK
-- ============================================================

-- GetGo 1043 S Braddock Ave (Edgewood/Swissvale).
-- Geocoder placed ~1.2 km north at 40.437/-79.896. Correct: 40.427/-79.898.
UPDATE stores SET latitude = 40.42650, longitude = -79.89790
WHERE id = '276d007c-2af6-4720-8aba-92d38e60c1f7';

-- ============================================================
--  PITTSBURGH — DOWNTOWN / FIFTH AVE CORRIDOR
-- ============================================================

-- Target 482 Smithfield St (Downtown).
-- Geocoder placed ~300 m north. Correct per schema.sql: 40.438/-79.996.
UPDATE stores SET latitude = 40.43760, longitude = -79.99640
WHERE id = '539ebff4-29da-4972-840c-dbd81a2886b5';

-- Walgreens 1907 Forbes Ave (Downtown-adjacent).
-- Corrected address in 20260518000000. Refine coords: 40.440/-79.989.
UPDATE stores SET latitude = 40.43960, longitude = -79.98920
WHERE id = 'e1ba209a-ff43-49f9-8e2f-4fc33ecef2ca';

-- ============================================================
--  PITTSBURGH — OAKLAND / CRAIG ST / BLVD OF ALLIES
-- ============================================================

-- Sunoco 301 Craft Ave (Oakland).
-- Geocoder placed ~800 m south at 40.436/-79.961. Correct: 40.441/-79.957.
UPDATE stores SET latitude = 40.44080, longitude = -79.95660
WHERE id = '1679a2ce-0561-4419-aa78-0575ceafc2a5';

-- Frenchi's Deli 449 Atwood St (South Oakland).
-- Geocoder placed ~400 m east on longitude. Correct: 40.437/-79.959.
UPDATE stores SET latitude = 40.43705, longitude = -79.95870
WHERE id = 'b9118d26-b1c6-4337-bfed-9038fab1f8ae';

-- One Stop Mini Mart 3601 Blvd of the Allies.
-- Geocoder placed ~360 m south-east. Correct per schema.sql: 40.437/-79.958.
UPDATE stores SET latitude = 40.43700, longitude = -79.95770
WHERE id = '50d76abc-8cef-4ad8-a38a-3d4369aabd94';

-- ============================================================
--  PITTSBURGH — FAST FOOD (added 20260520000000)
-- ============================================================

-- McDonald's 2901 E Carson St (South Side).
-- Geocoder placed ~400 m north. Correct per migration: 40.428/-79.967.
UPDATE stores SET latitude = 40.42820, longitude = -79.96720
WHERE id = '48702887-9d49-4eac-bcd3-f0cf1978b200';

-- Burger King 600 Penn Ave (Downtown).
-- Geocoder placed ~600 m west at 40.443/-80.002. Correct: 40.443/-79.993.
UPDATE stores SET latitude = 40.44260, longitude = -79.99320
WHERE id = 'a26726cd-d3e5-482e-b7e0-b569484306ea';

-- Burger King 2200 Penn Ave (Strip District).
-- Geocoder placed ~1.1 km west at -79.982. Strip District is east:
-- 40.454/-79.971 per migration.
UPDATE stores SET latitude = 40.45350, longitude = -79.97080
WHERE id = 'b9fdf070-8db7-45a2-8808-31945f2c0902';

-- Five Guys 161 W Waterfront Dr (Homestead / Waterfront).
-- Geocoder placed ~500 m north. Correct per migration: 40.404/-79.914.
UPDATE stores SET latitude = 40.40420, longitude = -79.91430
WHERE id = '098c5e3e-1c57-423c-acb0-3c0e066f09da';

-- Chick-fil-A 275 W Waterfront Dr (Homestead / Waterfront).
-- Geocoder placed ~500 m north. Correct per migration: 40.405/-79.914.
UPDATE stores SET latitude = 40.40460, longitude = -79.91360
WHERE id = '0a57ad2a-9763-46c5-a5f0-cb818616b5a4';

COMMIT;
