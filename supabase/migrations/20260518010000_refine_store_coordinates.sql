-- Follow-up coordinate audit (May 18, 2026): correct 12 stores whose lat/lng
-- still don't quite land on the actual address per chain locator and Komparing.com
-- URL-embedded coordinates.
--
-- This is a precision pass on top of 20260518000000_review_all_store_geolocations.sql.
-- All addresses themselves are correct; only coordinates are being adjusted.
--
-- Major errors (≥ 500 m off):
--   1. CVS 4664 Browns Hill Rd — pin was ~700 m north of the actual storefront
--   2. CVS 1601 W Liberty St — pin was ~1.1 km southwest of the actual storefront
--   3. Sheetz 8180 Perry Hwy — pin was ~6 km east of the actual Summit Twp store
--   4. Giant Eagle 4010 Monroeville Blvd — pin was ~280 m south of the storefront
--   5. Weis 2020 N 13th St Reading — pin was ~1.4 km southwest of the storefront
--   6. Giant Eagle 9805 McKnight Rd — pin was ~3 km south of the shopping centre
--   7. Giant Eagle 2877 W 26th St Erie — pin was ~1.5 km east of the storefront
--   8. Weis 1471 Martin St State College — pin was ~3 km southeast of the storefront
--   9. Giant Food 2550 Grant Ave Philadelphia — pin was ~2 km southwest of the storefront
--  10. Giant Eagle 254 Yost Blvd — pin was ~400 m west of the storefront
--
-- Minor errors (~100 m, refined for accuracy):
--  11. CVS 32 W Lemon St Lancaster — ~150 m east of the storefront
--  12. Wawa 1700 Sansom St Philadelphia — ~110 m southwest of the storefront

BEGIN;

-- 1. CVS 4664 Browns Hill Rd, Pittsburgh — corrected from CVS storeid=10767 + maptons.com
UPDATE stores SET latitude = 40.41458, longitude = -79.92264
WHERE id = '51b2bded-54f4-4517-845c-fd060f1f4c26';

-- 2. CVS 1601 W Liberty St, Allentown — corrected from CVS storeid=974 + InsideRx coords
UPDATE stores SET latitude = 40.60420, longitude = -75.49355
WHERE id = 'b3b97da3-5876-4c9a-8094-a8b3bb1b9fe7';

-- 3. Sheetz 8180 Perry Hwy, Erie — corrected from Yelp/Loc8NearMe coords for Summit Twp I-90 exit 27
UPDATE stores SET latitude = 42.10449, longitude = -80.14992
WHERE id = 'db79322c-838b-4afe-a1af-16398e5dfda9';

-- 4. Giant Eagle 4010 Monroeville Blvd — corrected from gianteagle.com/stores/60 + Yelp coords
UPDATE stores SET latitude = 40.43575, longitude = -79.77114
WHERE id = '61badc32-101f-417a-952c-5b43ea5dfb6f';

-- 5. Weis Markets 2020 N 13th St, Reading — corrected from weismarkets.com/stores/.../4396 + Yelp
UPDATE stores SET latitude = 40.36574, longitude = -75.91143
WHERE id = '10f77cdb-e817-4e66-bb73-d04d890bfb1b';

-- 6. Giant Eagle 9805 McKnight Rd, Pittsburgh — corrected from gianteagle.com #45 + Yelp coords
UPDATE stores SET latitude = 40.58571, longitude = -80.03713
WHERE id = 'd9601848-98c8-4c02-8db8-6c410439ecb8';

-- 7. Giant Eagle 2877 W 26th St, Erie — corrected from Yelp/Superpages coords
UPDATE stores SET latitude = 42.08814, longitude = -80.13729
WHERE id = '8d8d0548-4fea-487e-bfbb-7ba33bbb1c09';

-- 8. Weis Markets 1471 Martin St, State College — corrected from weismarkets.com/stores/.../4397
UPDATE stores SET latitude = 40.80493, longitude = -77.89039
WHERE id = '2ae4f432-405e-47f8-8ee2-22e43acf03c9';

-- 9. Giant Food Stores 2550 Grant Ave, Philadelphia — corrected from stores.giantfoodstores.com + Yelp
UPDATE stores SET latitude = 40.07665, longitude = -75.02820
WHERE id = 'd7805646-e358-4c7e-9944-118ce64a3aa8';

-- 10. Giant Eagle 254 Yost Blvd, Pittsburgh — corrected from gianteagle.com #77 + Yelp coords
UPDATE stores SET latitude = 40.41408, longitude = -79.85047
WHERE id = '58db15f9-3b3b-4fe9-bbfe-636ccdaa78fe';

-- 11. CVS 32 W Lemon St, Lancaster — refined from cvs.com storeid=2158 + InsideRx coords
UPDATE stores SET latitude = 40.04392, longitude = -76.30854
WHERE id = 'a8ed6d8f-1a72-420b-a74d-6cfc111dd35e';

-- 12. Wawa 1700 Sansom St, Philadelphia — refined from Google Maps URL-embedded coords
UPDATE stores SET latitude = 39.95085, longitude = -75.16908
WHERE id = '157b6b01-0956-4408-bca8-e9df34be2af3';

COMMIT;
