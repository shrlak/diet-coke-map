-- Add new stores in Pittsburgh Oakland near CMU and University of Pittsburgh,
-- and correct the CVS Centre Ave coordinates.

-- Fix: CVS 4610 Centre Ave coordinates were slightly off.
-- The store is at the Centre Ave / Craig St intersection (0.03 mi from the
-- Centre Ave at Craig St bus stop per CVS.com + Yellow Pages "CVS On Centre Ave Craig").
-- Adjusted from 40.454540,-79.949350 → 40.453500,-79.950000.
UPDATE stores
SET latitude  = 40.45350,
    longitude = -79.95000
WHERE name = 'CVS Pharmacy'
  AND address = '4610 Centre Ave'
  AND city = 'Pittsburgh'
  AND state = 'PA';

-- Add Oakland stores near CMU / Pitt campus.
-- Sources: 7-eleven.com/locations/pa/pittsburgh/195-north-craig-st-40106 (store #40106),
--          sunoco.com/locations/store/301-craft-ave-pittsburgh-pa-0859331103 (station #0859331103),
--          yelp.com/biz/7-eleven-pittsburgh-31, yelp.com/biz/sunoco-pittsburgh-8.
INSERT INTO stores (name, address, city, state, zip, latitude, longitude, phone, store_type) VALUES

  -- 7-Eleven on N Craig St — one block south of Centre Ave, the main convenience
  -- anchor for Pitt students on the Forbes/Craig corridor.
  ('7-Eleven', '195 N Craig St', 'Pittsburgh', 'PA', '15213', 40.44800, -79.95020, NULL, 'convenience'),

  -- Sunoco at Craft Ave — cited in multiple sources as the only full-service gas
  -- station in Oakland proper; on the medical center side of Forbes Ave.
  ('Sunoco', '301 Craft Ave', 'Pittsburgh', 'PA', '15213', 40.44080, -79.95660, NULL, 'gas_station')

ON CONFLICT DO NOTHING;

-- Store hours: 7-Eleven open 24/7; Sunoco open 6 am – 10 pm.
INSERT INTO store_hours (store_id, day_of_week, opens_at, closes_at)
SELECT s.id, d.day,
       CASE s.name WHEN '7-Eleven' THEN '00:00'::time ELSE '06:00'::time END,
       CASE s.name WHEN '7-Eleven' THEN '23:59'::time ELSE '22:00'::time END
FROM stores s, generate_series(0, 6) AS d(day)
WHERE s.address IN ('195 N Craig St', '301 Craft Ave')
  AND s.city = 'Pittsburgh'
ON CONFLICT DO NOTHING;

-- Link Diet Coke products to the new stores.
INSERT INTO store_products (store_id, product_id, in_stock)
SELECT s.id, p.id, true
FROM stores s, products p
WHERE s.address IN ('195 N Craig St', '301 Craft Ave')
  AND s.city = 'Pittsburgh'
  AND p.sku IN ('DC_20OZ_BOTTLE', 'DC_2L_BOTTLE', 'DC_6PACK_12OZ', 'DC_FOUNTAIN')
ON CONFLICT DO NOTHING;
