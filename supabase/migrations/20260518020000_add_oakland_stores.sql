-- Add Oakland-focused Pittsburgh stores (Pitt/CMU campus area).
--
-- The previous migrations restored ~64 Pittsburgh-area chain stores. This adds
-- 8 Oakland-specific stores (15213 zip code area) that sell Diet Coke,
-- bringing the Oakland coverage to 12 stores: the 4 existing
-- (7-Eleven N Craig, Sunoco Craft, CVS Centre, GetGo Baum) plus the 8 below.
--
-- Sources: chain locators (cvs.com), Pitt Dining (Forbes Street Market),
-- oaklandpittsburgh.com directory, Yelp, Loc8NearMe.

INSERT INTO stores (name, address, city, state, zip, latitude, longitude, phone, store_type)
SELECT v.name, v.address, v.city, v.state, v.zip, v.lat, v.lng, v.phone, v.store_type
FROM (VALUES
  -- CVS Pharmacy on Forbes Ave (Pitt/UPMC campus) — cvs.com storeid=2348
  ('CVS Pharmacy (Oakland / Forbes)',  '3422 Forbes Ave',          'Pittsburgh', 'PA', '15213', 40.43876, -79.96023, '(412) 621-3060', 'drugstore'),

  -- Forbes Street Market (Pitt-owned grocery, in Bruce Hall next to William Pitt Union)
  ('Forbes Street Market',              '3955 Forbes Ave',          'Pittsburgh', 'PA', '15213', 40.44320, -79.95320, '(412) 648-4422', 'grocery'),

  -- Groceria Merante (Italian grocery in South Oakland, near Ward St)
  ('Groceria Merante',                  '3454 Bates St',            'Pittsburgh', 'PA', '15213', 40.43654, -79.95533, '(412) 683-1810', 'grocery'),

  -- Frenchi's Deli & Market (Central Oakland student deli)
  ('Frenchi''s Deli & Market',          '449 Atwood St',            'Pittsburgh', 'PA', '15213', 40.43705, -79.95870, '(412) 687-1105', 'convenience'),

  -- Food For Thought Deli (North Oakland deli, on N Craig)
  ('Food For Thought Deli',             '196 N Craig St',           'Pittsburgh', 'PA', '15213', 40.44830, -79.95040, '(412) 682-5033', 'convenience'),

  -- One Stop Mini Mart (South Oakland convenience, Blvd of the Allies / Ward St)
  ('One Stop Mini Mart',                '3601 Blvd of the Allies',  'Pittsburgh', 'PA', '15213', 40.43700, -79.95770, '(412) 621-4539', 'convenience'),

  -- The University Store on Fifth (largest independent bookstore, sells beverages)
  ('The University Store on Fifth',     '4000 Fifth Ave',           'Pittsburgh', 'PA', '15213', 40.44430, -79.95510, '(412) 648-1455', 'convenience'),

  -- The Pitt Shop (Pitt athletic / merchandise store, sells snacks & drinks)
  ('The Pitt Shop',                     '3939 Forbes Ave',          'Pittsburgh', 'PA', '15213', 40.44260, -79.95430, '(412) 648-7090', 'convenience')
) AS v(name, address, city, state, zip, lat, lng, phone, store_type)
WHERE NOT EXISTS (
  SELECT 1 FROM stores s WHERE s.name=v.name AND s.address=v.address AND s.city=v.city AND s.state=v.state
);

-- Store hours: drugstore default 8 am – 10 pm; convenience 7 am – 11 pm;
-- Forbes Street Market 7:30 am – 9 pm; Groceria Merante 9 am – 7 pm
INSERT INTO store_hours (store_id, day_of_week, opens_at, closes_at)
SELECT s.id, d.day,
       CASE
         WHEN s.name = 'CVS Pharmacy (Oakland / Forbes)' THEN '08:00'::time
         WHEN s.name = 'Forbes Street Market'             THEN '07:30'::time
         WHEN s.name = 'Groceria Merante'                 THEN '09:00'::time
         ELSE '07:00'::time
       END,
       CASE
         WHEN s.name = 'CVS Pharmacy (Oakland / Forbes)' THEN '22:00'::time
         WHEN s.name = 'Forbes Street Market'             THEN '21:00'::time
         WHEN s.name = 'Groceria Merante'                 THEN '19:00'::time
         ELSE '23:00'::time
       END
FROM stores s, generate_series(0, 6) AS d(day)
WHERE s.address IN ('3422 Forbes Ave', '3955 Forbes Ave', '3454 Bates St', '449 Atwood St',
                    '196 N Craig St', '3601 Blvd of the Allies', '4000 Fifth Ave', '3939 Forbes Ave')
  AND s.city = 'Pittsburgh' AND s.state = 'PA'
ON CONFLICT (store_id, day_of_week) DO NOTHING;

-- Products: base packs for all new Oakland stores
INSERT INTO store_products (store_id, product_id, in_stock)
SELECT s.id, p.id, true
FROM stores s, products p
WHERE s.address IN ('3422 Forbes Ave', '3955 Forbes Ave', '3454 Bates St', '449 Atwood St',
                    '196 N Craig St', '3601 Blvd of the Allies', '4000 Fifth Ave', '3939 Forbes Ave')
  AND s.city = 'Pittsburgh' AND s.state = 'PA'
  AND p.sku IN ('DC_20OZ_BOTTLE', 'DC_2L_BOTTLE', 'DC_6PACK_12OZ', 'DCZS_20OZ_BOTTLE', 'DCZS_2L_BOTTLE')
ON CONFLICT (store_id, product_id) DO NOTHING;

-- Fountain Diet Coke for convenience-type stores
INSERT INTO store_products (store_id, product_id, in_stock)
SELECT s.id, p.id, true
FROM stores s, products p
WHERE s.address IN ('449 Atwood St', '196 N Craig St', '3601 Blvd of the Allies',
                    '4000 Fifth Ave', '3939 Forbes Ave')
  AND s.city = 'Pittsburgh' AND s.state = 'PA'
  AND p.sku = 'DC_FOUNTAIN'
ON CONFLICT (store_id, product_id) DO NOTHING;

-- 12-pack cans for grocery types
INSERT INTO store_products (store_id, product_id, in_stock)
SELECT s.id, p.id, true
FROM stores s, products p
WHERE s.address IN ('3955 Forbes Ave', '3454 Bates St')
  AND s.city = 'Pittsburgh' AND s.state = 'PA'
  AND p.sku = 'DC_12PACK_12OZ'
ON CONFLICT (store_id, product_id) DO NOTHING;
