-- Restore 64 stores wiped by migration 000000 and fix two data errors from migration 003.
--
-- Background: migration 000000 did DELETE FROM stores, then re-inserted only 43 entries,
-- silently dropping the full Pittsburgh coverage that existed in schema.sql (GetGo ×10,
-- Sheetz ×9, CVS ×8, Walgreens ×5, Aldi ×10, Giant Eagle ×12, Target ×9, Walmart ×2).
-- All 64 stores below are sourced from schema.sql (verified May 2026).
--
-- Data errors fixed here:
--   1. Giant Eagle at 9805 McKnight Rd (McCandless): migration 003 Section B tried to fix
--      "CVS" at that address, but no CVS exists there — it is Giant Eagle. The coordinates
--      from migration 000 (40.560330, -80.016450) place it ~2.5 km south of the actual
--      shopping centre. Corrected to 40.58571, -80.03713.
--   2. CVS at 5818 Forbes Ave: migration 003 set phone (412) 421-2700 — the same number
--      as CVS at 2025 Murray Ave. Two distinct stores cannot share one phone number.
--      Forbes Ave entry is set to NULL pending re-verification via cvs.com/store-locator.

-- ============================================================
-- SECTION A: Fix data errors from migration 003
-- ============================================================

UPDATE stores
SET latitude  = 40.58571,
    longitude = -80.03713
WHERE name    ILIKE '%giant eagle%'
  AND address = '9805 McKnight Rd'
  AND city    = 'Pittsburgh'
  AND state   = 'PA';

UPDATE stores
SET phone = NULL
WHERE name    ILIKE '%cvs%'
  AND address = '5818 Forbes Ave'
  AND city    = 'Pittsburgh'
  AND state   = 'PA';

-- ============================================================
-- SECTION B: Restore missing stores
-- ============================================================
-- Each row uses WHERE NOT EXISTS (name + address + city + state) for idempotency.
-- CVS Pharmacy (McCandless) is inserted with the corrected coordinates
-- (40.58550, -80.03650) rather than the schema.sql original (40.58200, -80.03400)
-- so it sits in the same shopping centre as Giant Eagle at 9805 McKnight Rd.

-- GetGo Cafe + Market — 9 Pittsburgh-area locations
INSERT INTO stores (name, address, city, state, zip, latitude, longitude, phone, store_type)
SELECT v.name, v.address, v.city, v.state, v.zip, v.lat, v.lng, v.phone, v.store_type
FROM (VALUES
  ('GetGo (Ben Avon Heights)',             '156 Ben Avon Heights Rd', 'Pittsburgh', 'PA', '15237', 40.50460, -80.05240, '(412) 761-8460', 'convenience'),
  ('GetGo (Brentwood / Saw Mill Run)',     '3601 Saw Mill Run Blvd',  'Pittsburgh', 'PA', '15227', 40.37213, -79.98160, '(412) 885-7360', 'convenience'),
  ('GetGo (Carnegie / E Main St)',         '350 E Main St',           'Carnegie',   'PA', '15106', 40.39510, -80.08360, '(412) 276-8460', 'convenience'),
  ('GetGo (Cochran Rd)',                   '1636 Cochran Rd',         'Pittsburgh', 'PA', '15220', 40.39240, -80.04590, '(412) 343-6460', 'convenience'),
  ('GetGo (Edgewood / S Braddock Ave)',    '1043 S Braddock Ave',     'Pittsburgh', 'PA', '15218', 40.42650, -79.89790, '(412) 371-8460', 'convenience'),
  ('GetGo (Robinson / Steubenville Pike)', '4900 Steubenville Pike',  'Pittsburgh', 'PA', '15205', 40.45190, -80.14710, '(412) 490-8460', 'convenience'),
  ('GetGo (South Side / E Carson St)',     '3247 E Carson St',        'Pittsburgh', 'PA', '15203', 40.42710, -79.96660, '(412) 431-8460', 'convenience'),
  ('GetGo (Squirrel Hill / Forward Ave)',  '5801 Forward Ave',        'Pittsburgh', 'PA', '15217', 40.42999, -79.92326, '(412) 421-2742', 'convenience'),
  ('GetGo (Robinson / W Steubenville Pike)','6513 Steubenville Pike', 'Pittsburgh', 'PA', '15205', 40.44745, -80.16289, '(412) 446-0264', 'convenience')
) AS v(name, address, city, state, zip, lat, lng, phone, store_type)
WHERE NOT EXISTS (
  SELECT 1 FROM stores s
  WHERE s.name = v.name AND s.address = v.address AND s.city = v.city AND s.state = v.state
);

-- Sheetz — 9 Pittsburgh-area locations
INSERT INTO stores (name, address, city, state, zip, latitude, longitude, phone, store_type)
SELECT v.name, v.address, v.city, v.state, v.zip, v.lat, v.lng, v.phone, v.store_type
FROM (VALUES
  ('Sheetz (Aspinwall / Freeport Rd)',        '2871 Freeport Rd',     'Pittsburgh', 'PA', '15238', 40.48620, -79.90240, '(412) 635-1003', 'convenience'),
  ('Sheetz (North Hills / Perry Hwy)',         '8500 Perry Hwy',       'Pittsburgh', 'PA', '15237', 40.56840, -80.03350, '(412) 635-1002', 'convenience'),
  ('Sheetz (Ohio Township / Mt Nebo)',         '211 Mount Nebo Rd',    'Pittsburgh', 'PA', '15237', 40.50930, -80.11180, '(412) 635-1001', 'convenience'),
  ('Sheetz (Pleasant Hills / Clairton Blvd)', '1000 Clairton Blvd',   'Pittsburgh', 'PA', '15236', 40.35900, -79.98550, '(412) 284-0135', 'convenience'),
  ('Sheetz (Plum)',                            '950 Presque Isle Dr',  'Plum',       'PA', '15239', 40.49750, -79.76850, '(412) 635-1004', 'convenience'),
  ('Sheetz (Robinson / Campbells Run)',        '5410 Campbells Run Rd','Pittsburgh', 'PA', '15205', 40.44778, -80.15735, '(412) 356-8371', 'convenience'),
  ('Sheetz (Ross Township / Babcock)',         '3025 Babcock Blvd',    'Pittsburgh', 'PA', '15237', 40.51720, -80.02080, '(412) 635-1000', 'convenience'),
  ('Sheetz (Stowe / Grand Ave)',               '5800 Grand Ave',       'Pittsburgh', 'PA', '15225', 40.48860, -80.07110, '(412) 375-2104', 'convenience'),
  ('Sheetz (Pleasant Hills / Curry Hollow)',   '251 Curry Hollow Rd',  'Pittsburgh', 'PA', '15236', 40.33643, -79.97151, '(412) 675-1712', 'convenience')
) AS v(name, address, city, state, zip, lat, lng, phone, store_type)
WHERE NOT EXISTS (
  SELECT 1 FROM stores s
  WHERE s.name = v.name AND s.address = v.address AND s.city = v.city AND s.state = v.state
);

-- CVS Pharmacy — 8 Pittsburgh-area locations
-- Note: CVS (McCandless) uses corrected coordinates (40.58550, -80.03650) rather than
-- the schema.sql value (40.58200, -80.03400) to place it correctly within the
-- McCandless shopping centre shared with Giant Eagle at 9805 McKnight Rd.
INSERT INTO stores (name, address, city, state, zip, latitude, longitude, phone, store_type)
SELECT v.name, v.address, v.city, v.state, v.zip, v.lat, v.lng, v.phone, v.store_type
FROM (VALUES
  ('CVS Pharmacy (Baldwin / Clairton)',     '5242 Clairton Blvd',  'Pittsburgh', 'PA', '15236', 40.35770, -79.98530, '(412) 882-5480', 'drugstore'),
  ('CVS Pharmacy (Carnegie / W Steuben)',   '70 W Steuben St',     'Pittsburgh', 'PA', '15205', 40.42530, -80.08760, '(412) 429-0360', 'drugstore'),
  ('CVS Pharmacy (Dormont / W Liberty)',    '3075 W Liberty Ave',  'Pittsburgh', 'PA', '15216', 40.40160, -80.01570, '(412) 531-3240', 'drugstore'),
  ('CVS Pharmacy (Downtown / Smithfield)',  '482 Smithfield St',   'Pittsburgh', 'PA', '15219', 40.43810, -79.99580, '(412) 281-3560', 'drugstore'),
  ('CVS Pharmacy (McCandless)',             '9805 McKnight Rd',    'Pittsburgh', 'PA', '15237', 40.58550, -80.03650, '(412) 366-7290', 'drugstore'),
  ('CVS Pharmacy (Penn Hills / Frankstown)','10600 Frankstown Rd', 'Pittsburgh', 'PA', '15235', 40.46050, -79.83150, '(412) 244-7360', 'drugstore'),
  ('CVS Pharmacy (Upper St Clair)',         '1740 Washington Rd',  'Pittsburgh', 'PA', '15241', 40.34670, -80.04910, '(412) 831-3430', 'drugstore'),
  ('CVS Pharmacy (Brookline Blvd)',         '510 Brookline Blvd',  'Pittsburgh', 'PA', '15226', 40.39602, -80.02321, '(412) 531-2190', 'drugstore')
) AS v(name, address, city, state, zip, lat, lng, phone, store_type)
WHERE NOT EXISTS (
  SELECT 1 FROM stores s
  WHERE s.name = v.name AND s.address = v.address AND s.city = v.city AND s.state = v.state
);

-- Walgreens — 5 Pittsburgh-area locations
INSERT INTO stores (name, address, city, state, zip, latitude, longitude, phone, store_type)
SELECT v.name, v.address, v.city, v.state, v.zip, v.lat, v.lng, v.phone, v.store_type
FROM (VALUES
  ('Walgreens (Mt Lebanon / Bower Hill)', '1000 Bower Hill Rd',  'Pittsburgh', 'PA', '15243', 40.37490, -80.04890, '(412) 344-4110', 'drugstore'),
  ('Walgreens (Penn Hills / Saltsburg)',  '6201 Saltsburg Rd',   'Pittsburgh', 'PA', '15235', 40.45950, -79.82500, '(412) 795-5340', 'drugstore'),
  ('Walgreens (Ross Township / McKnight)','4885 McKnight Rd',    'Pittsburgh', 'PA', '15237', 40.51860, -80.01680, '(412) 366-2380', 'drugstore'),
  ('Walgreens (Upper St Clair)',          '1741 Washington Rd',  'Pittsburgh', 'PA', '15241', 40.34660, -80.04910, '(412) 854-5230', 'drugstore'),
  ('Walgreens (Robinson / Enterprise Dr)','130 Enterprise Dr',   'Pittsburgh', 'PA', '15275', 40.50280, -80.19620, '(412) 262-2910', 'drugstore')
) AS v(name, address, city, state, zip, lat, lng, phone, store_type)
WHERE NOT EXISTS (
  SELECT 1 FROM stores s
  WHERE s.name = v.name AND s.address = v.address AND s.city = v.city AND s.state = v.state
);

-- Aldi — 10 Pittsburgh-area locations (entire chain was absent from migration 000000)
INSERT INTO stores (name, address, city, state, zip, latitude, longitude, phone, store_type)
SELECT v.name, v.address, v.city, v.state, v.zip, v.lat, v.lng, v.phone, v.store_type
FROM (VALUES
  ('Aldi (Bloomfield / Baum Blvd)',    '5631 Baum Blvd',       'Pittsburgh', 'PA', '15206', 40.45430, -79.92340, '(412) 682-0170', 'grocery'),
  ('Aldi (Bloomfield / Penn Ave)',      '5200 Penn Ave',        'Pittsburgh', 'PA', '15224', 40.46370, -79.93480, '(412) 661-0170', 'grocery'),
  ('Aldi (Lawrenceville / 56th St)',    '450 56th St',          'Pittsburgh', 'PA', '15201', 40.47420, -79.95740, '(412) 363-0170', 'grocery'),
  ('Aldi (Overbrook / Sussex Ave)',     '3089 Sussex Ave',      'Pittsburgh', 'PA', '15226', 40.38730, -80.00650, '(412) 531-0170', 'grocery'),
  ('Aldi (Ross Township / McKnight)',   '7221 McKnight Rd',     'Pittsburgh', 'PA', '15237', 40.54300, -80.02000, '(412) 563-0170', 'grocery'),
  ('Aldi (Ross Township / Northway)',   '6290 Northway Dr',     'Pittsburgh', 'PA', '15237', 40.51930, -80.01350, '(412) 369-0170', 'grocery'),
  ('Aldi (South Side / E Carson)',      '2628 E Carson St',     'Pittsburgh', 'PA', '15203', 40.42700, -79.97410, '(412) 431-0170', 'grocery'),
  ('Aldi (Banksville Rd)',              '2515 Banksville Rd',   'Pittsburgh', 'PA', '15216', 40.40574, -80.03594, '(855) 955-2534', 'grocery'),
  ('Aldi (Penn Hills / Saltsburg Rd)',  '7350 Saltsburg Rd',    'Penn Hills', 'PA', '15235', 40.46410, -79.81830, '(855) 955-2534', 'grocery'),
  ('Aldi (Wilkinsburg / Penn Ave)',     '401 Penn Ave',         'Wilkinsburg','PA', '15221', 40.44050, -79.87320, '(855) 955-2534', 'grocery')
) AS v(name, address, city, state, zip, lat, lng, phone, store_type)
WHERE NOT EXISTS (
  SELECT 1 FROM stores s
  WHERE s.name = v.name AND s.address = v.address AND s.city = v.city AND s.state = v.state
);

-- Giant Eagle / Market District — 12 Pittsburgh-area locations
INSERT INTO stores (name, address, city, state, zip, latitude, longitude, phone, store_type)
SELECT v.name, v.address, v.city, v.state, v.zip, v.lat, v.lng, v.phone, v.store_type
FROM (VALUES
  ('Giant Eagle (Baldwin/Grove Rd)',             '5260 Grove Rd',       'Pittsburgh',  'PA', '15236', 40.36000, -79.99500, '(412) 881-4601', 'grocery'),
  ('Giant Eagle (Ben Avon)',                     '132 Ben Avon Heights Rd','Pittsburgh','PA', '15237', 40.50450, -80.05250, '(412) 364-2390', 'grocery'),
  ('Giant Eagle (Bethel Park)',                  '5055 Library Rd',     'Bethel Park', 'PA', '15102', 40.33897, -80.02604, '(412) 831-7727', 'grocery'),
  ('Giant Eagle (Brentwood Towne Square)',        '600 Towne Square Way','Pittsburgh',  'PA', '15227', 40.37210, -79.99270, '(412) 881-4075', 'grocery'),
  ('Giant Eagle (Churchill/Yost Blvd)',           '254 Yost Blvd',       'Pittsburgh',  'PA', '15221', 40.42800, -79.87000, '(412) 829-2400', 'grocery'),
  ('Giant Eagle (Monroeville)',                   '4010 Monroeville Blvd','Monroeville','PA', '15146', 40.42730, -79.75660, '(412) 372-1220', 'grocery'),
  ('Giant Eagle (North Hills/Blazier Dr)',        '225 Blazier Dr',      'Pittsburgh',  'PA', '15237', 40.55010, -80.02180, '(412) 366-6828', 'grocery'),
  ('Giant Eagle Market District (Cochran Rd)',    '1717 Cochran Rd',     'Pittsburgh',  'PA', '15220', 40.39328, -80.06523, '(412) 343-8020', 'grocery'),
  ('Giant Eagle Market District (South Hills)',   '7000 Oxford Dr',      'Bethel Park', 'PA', '15102', 40.33460, -80.04720, '(412) 854-9300', 'grocery'),
  ('Giant Eagle Market District (Waterworks)',    '910 Freeport Rd',     'Pittsburgh',  'PA', '15238', 40.49900, -79.89930, '(412) 781-6605', 'grocery'),
  ('Giant Eagle (Frankstown Rd, Penn Hills)',     '9001 Frankstown Rd',  'Pittsburgh',  'PA', '15235', 40.45890, -79.82900, '(412) 371-0858', 'grocery'),
  ('Giant Eagle (Rodi Rd, Penn Hills)',           '230 Rodi Rd',         'Pittsburgh',  'PA', '15235', 40.46323, -79.82416, '(412) 241-7744', 'grocery')
) AS v(name, address, city, state, zip, lat, lng, phone, store_type)
WHERE NOT EXISTS (
  SELECT 1 FROM stores s
  WHERE s.name = v.name AND s.address = v.address AND s.city = v.city AND s.state = v.state
);

-- Target — 9 Pittsburgh-area locations (entire chain was absent from migration 000000)
INSERT INTO stores (name, address, city, state, zip, latitude, longitude, phone, store_type)
SELECT v.name, v.address, v.city, v.state, v.zip, v.lat, v.lng, v.phone, v.store_type
FROM (VALUES
  ('Target (Downtown Pittsburgh)',       '482 Smithfield St',     'Pittsburgh',   'PA', '15219', 40.43760, -79.99640, '(412) 258-8500', 'grocery'),
  ('Target (East Liberty)',              '6231 Penn Ave',          'Pittsburgh',   'PA', '15206', 40.45910, -79.92210, '(412) 626-3258', 'grocery'),
  ('Target (Fox Chapel / Freeport Rd)', '2661 Freeport Rd',       'Pittsburgh',   'PA', '15238', 40.48440, -79.89930, '(412) 820-6780', 'grocery'),
  ('Target (Monroeville)',               '4004 Monroeville Blvd',  'Monroeville',  'PA', '15146', 40.42810, -79.75650, '(412) 374-9611', 'grocery'),
  ('Target (Moon Township)',             '600 Chauvet Dr',         'Moon Township','PA', '15108', 40.50060, -80.20650, '(412) 490-0488', 'grocery'),
  ('Target (North Hills / Blazier Dr)', '105 Blazier Dr',         'Pittsburgh',   'PA', '15237', 40.55030, -80.02180, '(412) 369-9411', 'grocery'),
  ('Target (Ross Township / McKnight)', '4801 McKnight Rd',       'Pittsburgh',   'PA', '15237', 40.51800, -80.01830, '(412) 536-1807', 'grocery'),
  ('Target (South Hills Village)',       '201 S Hills Village',    'Pittsburgh',   'PA', '15241', 40.34610, -80.04870, '(412) 595-9380', 'grocery'),
  ('Target (Waterfront / Homestead)',   '360 Waterfront Dr E',    'Homestead',    'PA', '15120', 40.40830, -79.90080, '(412) 464-2522', 'grocery')
) AS v(name, address, city, state, zip, lat, lng, phone, store_type)
WHERE NOT EXISTS (
  SELECT 1 FROM stores s
  WHERE s.name = v.name AND s.address = v.address AND s.city = v.city AND s.state = v.state
);

-- Walmart — 2 Pittsburgh-area locations (entire chain was absent from migration 000000)
INSERT INTO stores (name, address, city, state, zip, latitude, longitude, phone, store_type)
SELECT v.name, v.address, v.city, v.state, v.zip, v.lat, v.lng, v.phone, v.store_type
FROM (VALUES
  ('Walmart (Robinson / Summit Park)', '250 Summit Park Dr',    'Pittsburgh',   'PA', '15275', 40.50210, -80.21180, '(412) 788-9079', 'grocery'),
  ('Walmart (Moon Township)',           '7500 University Blvd',  'Moon Township','PA', '15108', 40.51560, -80.22412, '(412) 893-0143', 'grocery')
) AS v(name, address, city, state, zip, lat, lng, phone, store_type)
WHERE NOT EXISTS (
  SELECT 1 FROM stores s
  WHERE s.name = v.name AND s.address = v.address AND s.city = v.city AND s.state = v.state
);

-- ============================================================
-- SECTION C: Seed store_hours for all newly added stores
-- ============================================================
-- ON CONFLICT DO NOTHING is safe because store_hours has UNIQUE(store_id, day_of_week).
-- Stores already in the DB retain their existing hours.

-- 24/7 chains (GetGo, Sheetz)
INSERT INTO store_hours (store_id, day_of_week, opens_at, closes_at)
SELECT s.id, d.day, '00:00'::time, '23:59'::time
FROM stores s, generate_series(0, 6) AS d(day)
WHERE s.name ILIKE ANY(ARRAY['%getgo%', '%sheetz%'])
ON CONFLICT (store_id, day_of_week) DO NOTHING;

-- Drugstore chains (CVS, Walgreens): 8 am – 10 pm
INSERT INTO store_hours (store_id, day_of_week, opens_at, closes_at)
SELECT s.id, d.day, '08:00'::time, '22:00'::time
FROM stores s, generate_series(0, 6) AS d(day)
WHERE s.name ILIKE ANY(ARRAY['%cvs%', '%walgreens%'])
ON CONFLICT (store_id, day_of_week) DO NOTHING;

-- Aldi: 9 am – 8 pm
INSERT INTO store_hours (store_id, day_of_week, opens_at, closes_at)
SELECT s.id, d.day, '09:00'::time, '20:00'::time
FROM stores s, generate_series(0, 6) AS d(day)
WHERE s.name ILIKE '%aldi%'
ON CONFLICT (store_id, day_of_week) DO NOTHING;

-- Giant Eagle (all variants): 6 am – 10 pm
INSERT INTO store_hours (store_id, day_of_week, opens_at, closes_at)
SELECT s.id, d.day, '06:00'::time, '22:00'::time
FROM stores s, generate_series(0, 6) AS d(day)
WHERE s.name ILIKE '%giant eagle%'
ON CONFLICT (store_id, day_of_week) DO NOTHING;

-- Target: 8 am – 10 pm
INSERT INTO store_hours (store_id, day_of_week, opens_at, closes_at)
SELECT s.id, d.day, '08:00'::time, '22:00'::time
FROM stores s, generate_series(0, 6) AS d(day)
WHERE s.name ILIKE '%target%'
ON CONFLICT (store_id, day_of_week) DO NOTHING;

-- Walmart: 6 am – 11 pm
INSERT INTO store_hours (store_id, day_of_week, opens_at, closes_at)
SELECT s.id, d.day, '06:00'::time, '23:00'::time
FROM stores s, generate_series(0, 6) AS d(day)
WHERE s.name ILIKE '%walmart%'
ON CONFLICT (store_id, day_of_week) DO NOTHING;

-- ============================================================
-- SECTION D: Seed store_products for all newly added stores
-- ============================================================
-- Product assignment rules (same logic as migration 003 Section C):
--   All stores:              DC_20OZ_BOTTLE, DC_2L_BOTTLE, DC_6PACK_12OZ,
--                            DCZS_20OZ_BOTTLE, DCZS_2L_BOTTLE
--   convenience / gas_station only: + DC_FOUNTAIN
--   grocery only:            + DC_12PACK_12OZ

-- Base products for all stores
INSERT INTO store_products (store_id, product_id, in_stock)
SELECT s.id, p.id, true
FROM stores s, products p
WHERE p.sku IN ('DC_20OZ_BOTTLE', 'DC_2L_BOTTLE', 'DC_6PACK_12OZ', 'DCZS_20OZ_BOTTLE', 'DCZS_2L_BOTTLE')
ON CONFLICT (store_id, product_id) DO NOTHING;

-- Fountain for convenience and gas_station stores only
INSERT INTO store_products (store_id, product_id, in_stock)
SELECT s.id, p.id, true
FROM stores s, products p
WHERE p.sku = 'DC_FOUNTAIN'
  AND s.store_type IN ('convenience', 'gas_station')
ON CONFLICT (store_id, product_id) DO NOTHING;

-- 12-pack cans for grocery stores only
INSERT INTO store_products (store_id, product_id, in_stock)
SELECT s.id, p.id, true
FROM stores s, products p
WHERE p.sku = 'DC_12PACK_12OZ'
  AND s.store_type = 'grocery'
ON CONFLICT (store_id, product_id) DO NOTHING;
