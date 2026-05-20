-- Add fast food restaurant stores in the Pittsburgh / Oakland, PA area
-- Chains: McDonald's, Five Guys, Panera Bread, Burger King, Wendy's, Chick-fil-A
-- Products: DC_FOUNTAIN for all; DC_20OZ_BOTTLE for chains that sell bottled drinks

-- ============================================================
-- 1. INSERT STORES
-- ============================================================
INSERT INTO stores (name, address, city, state, zip, latitude, longitude, phone, store_type) VALUES
  -- McDonald's
  ('McDonald''s (Oakland)', '3637 Forbes Ave', 'Pittsburgh', 'PA', '15213', 40.44240, -79.95950, '(412) 681-0780', 'fast_food'),
  ('McDonald''s (Downtown Pittsburgh)', '340 Sixth Ave', 'Pittsburgh', 'PA', '15222', 40.44130, -79.99700, '(412) 281-3100', 'fast_food'),
  ('McDonald''s (South Side)', '2901 E Carson St', 'Pittsburgh', 'PA', '15203', 40.42820, -79.96720, '(412) 481-0710', 'fast_food'),
  ('McDonald''s (North Shore)', '620 W North Ave', 'Pittsburgh', 'PA', '15212', 40.45570, -80.00960, '(412) 321-4630', 'fast_food'),

  -- Five Guys
  ('Five Guys (Oakland)', '3628 Forbes Ave', 'Pittsburgh', 'PA', '15213', 40.44230, -79.95970, '(412) 621-5557', 'fast_food'),
  ('Five Guys (Downtown Pittsburgh)', '530 Smithfield St', 'Pittsburgh', 'PA', '15222', 40.44060, -79.99620, '(412) 281-2222', 'fast_food'),
  ('Five Guys (The Waterfront)', '161 W Waterfront Dr', 'Homestead', 'PA', '15120', 40.40420, -79.91430, '(412) 461-5557', 'fast_food'),

  -- Panera Bread
  ('Panera Bread (Oakland)', '3538 Forbes Ave', 'Pittsburgh', 'PA', '15213', 40.44200, -79.96100, '(412) 621-8200', 'fast_food'),
  ('Panera Bread (Squirrel Hill)', '1813 Murray Ave', 'Pittsburgh', 'PA', '15217', 40.43590, -79.92300, '(412) 521-7700', 'fast_food'),
  ('Panera Bread (Downtown Pittsburgh)', '301 Fifth Ave', 'Pittsburgh', 'PA', '15222', 40.44130, -79.99710, '(412) 281-6200', 'fast_food'),

  -- Burger King
  ('Burger King (Oakland)', '3900 Forbes Ave', 'Pittsburgh', 'PA', '15213', 40.44340, -79.95590, '(412) 682-1400', 'fast_food'),
  ('Burger King (Downtown Pittsburgh)', '600 Penn Ave', 'Pittsburgh', 'PA', '15222', 40.44260, -79.99320, '(412) 281-9100', 'fast_food'),
  ('Burger King (Strip District)', '2200 Penn Ave', 'Pittsburgh', 'PA', '15222', 40.45350, -79.97080, '(412) 261-1800', 'fast_food'),

  -- Wendy's
  ('Wendy''s (Oakland)', '4006 Forbes Ave', 'Pittsburgh', 'PA', '15213', 40.44360, -79.95470, '(412) 683-0400', 'fast_food'),
  ('Wendy''s (South Side)', '128 E Carson St', 'Pittsburgh', 'PA', '15203', 40.42940, -79.98590, '(412) 431-0550', 'fast_food'),
  ('Wendy''s (North Side)', '1601 Brighton Rd', 'Pittsburgh', 'PA', '15212', 40.46300, -80.01830, '(412) 321-7700', 'fast_food'),

  -- Chick-fil-A
  ('Chick-fil-A (Oakland)', '4216 Forbes Ave', 'Pittsburgh', 'PA', '15213', 40.44420, -79.95390, '(412) 683-3000', 'fast_food'),
  ('Chick-fil-A (The Waterfront)', '275 W Waterfront Dr', 'Homestead', 'PA', '15120', 40.40460, -79.91360, '(412) 461-3000', 'fast_food')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. STORE HOURS
-- ============================================================

-- McDonald's: 6am–midnight daily
INSERT INTO store_hours (store_id, day_of_week, opens_at, closes_at)
SELECT s.id, d.day, '06:00'::time, '23:59'::time
FROM stores s, generate_series(0, 6) AS d(day)
WHERE s.name LIKE 'McDonald''s%' AND s.store_type = 'fast_food'
ON CONFLICT DO NOTHING;

-- Five Guys: 11am–10pm daily
INSERT INTO store_hours (store_id, day_of_week, opens_at, closes_at)
SELECT s.id, d.day, '11:00'::time, '22:00'::time
FROM stores s, generate_series(0, 6) AS d(day)
WHERE s.name LIKE 'Five Guys%' AND s.store_type = 'fast_food'
ON CONFLICT DO NOTHING;

-- Panera Bread: 7am–9pm daily
INSERT INTO store_hours (store_id, day_of_week, opens_at, closes_at)
SELECT s.id, d.day, '07:00'::time, '21:00'::time
FROM stores s, generate_series(0, 6) AS d(day)
WHERE s.name LIKE 'Panera Bread%' AND s.store_type = 'fast_food'
ON CONFLICT DO NOTHING;

-- Burger King: 7am–11pm daily
INSERT INTO store_hours (store_id, day_of_week, opens_at, closes_at)
SELECT s.id, d.day, '07:00'::time, '23:00'::time
FROM stores s, generate_series(0, 6) AS d(day)
WHERE s.name LIKE 'Burger King%' AND s.store_type = 'fast_food'
ON CONFLICT DO NOTHING;

-- Wendy's: 10am–midnight daily
INSERT INTO store_hours (store_id, day_of_week, opens_at, closes_at)
SELECT s.id, d.day, '10:00'::time, '23:59'::time
FROM stores s, generate_series(0, 6) AS d(day)
WHERE s.name LIKE 'Wendy''s%' AND s.store_type = 'fast_food'
ON CONFLICT DO NOTHING;

-- Chick-fil-A: 6am–10pm Mon–Sat, closed Sunday (day_of_week = 0)
INSERT INTO store_hours (store_id, day_of_week, opens_at, closes_at)
SELECT s.id, d.day, '06:00'::time, '22:00'::time
FROM stores s, generate_series(1, 6) AS d(day)
WHERE s.name LIKE 'Chick-fil-A%' AND s.store_type = 'fast_food'
ON CONFLICT DO NOTHING;

INSERT INTO store_hours (store_id, day_of_week, opens_at, closes_at, is_closed)
SELECT s.id, 0, '00:00'::time, '00:00'::time, true
FROM stores s
WHERE s.name LIKE 'Chick-fil-A%' AND s.store_type = 'fast_food'
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. STORE PRODUCTS
-- ============================================================

-- All fast food stores get fountain Diet Coke
INSERT INTO store_products (store_id, product_id, in_stock)
SELECT s.id, p.id, true
FROM stores s, products p
WHERE s.store_type = 'fast_food'
  AND p.sku = 'DC_FOUNTAIN'
ON CONFLICT DO NOTHING;

-- McDonald's, Burger King, and Wendy's also carry 20oz bottles
INSERT INTO store_products (store_id, product_id, in_stock)
SELECT s.id, p.id, true
FROM stores s, products p
WHERE s.store_type = 'fast_food'
  AND (s.name LIKE 'McDonald''s%' OR s.name LIKE 'Burger King%' OR s.name LIKE 'Wendy''s%')
  AND p.sku = 'DC_20OZ_BOTTLE'
ON CONFLICT DO NOTHING;
