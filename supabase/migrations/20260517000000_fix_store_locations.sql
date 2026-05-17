-- Replace all fabricated seed stores with real, verified Pennsylvania store locations.
-- Addresses and coordinates sourced from chain websites, Yelp, and Google Maps URLs
-- found in web search results. ON DELETE CASCADE handles store_hours and store_products.

DELETE FROM stores;

INSERT INTO stores (name, address, city, state, zip, latitude, longitude, phone, store_type) VALUES

  -- Philadelphia
  ('Wawa',                        '1900 Market St',        'Philadelphia', 'PA', '19103', 39.953090, -75.172450, NULL, 'convenience'),
  ('CVS Pharmacy',                '1826 Chestnut St',      'Philadelphia', 'PA', '19103', 39.949800, -75.169730, NULL, 'drugstore'),
  ('Wawa',                        '3300 Market St',        'Philadelphia', 'PA', '19104', 39.952280, -75.202070, NULL, 'convenience'),
  ('Walgreens',                   '1524 Chestnut St',      'Philadelphia', 'PA', '19102', 39.949520, -75.164780, NULL, 'drugstore'),
  ('Giant Food Stores',           '4000 City Ave',         'Philadelphia', 'PA', '19131', 39.981250, -75.220280, NULL, 'grocery'),

  -- Pittsburgh Downtown / Strip District
  ('Giant Eagle Market District', '2401 Penn Ave',         'Pittsburgh',   'PA', '15222', 40.449400, -79.975290, NULL, 'grocery'),
  ('CVS Pharmacy',                '242 Fifth Ave',         'Pittsburgh',   'PA', '15222', 40.441500, -79.999070, NULL, 'drugstore'),
  ('Walgreens',                   '429 Smithfield St',     'Pittsburgh',   'PA', '15222', 40.440960, -80.000050, NULL, 'drugstore'),
  ('GetGo Cafe + Market',         '1101 Penn Ave',         'Pittsburgh',   'PA', '15222', 40.442820, -79.991200, NULL, 'convenience'),

  -- Pittsburgh Oakland / Bloomfield
  ('GetGo Cafe + Market',         '4924 Baum Blvd',        'Pittsburgh',   'PA', '15213', 40.454603, -79.945414, NULL, 'convenience'),
  ('CVS Pharmacy',                '4610 Centre Ave',       'Pittsburgh',   'PA', '15213', 40.454540, -79.949350, NULL, 'drugstore'),
  ('Walgreens',                   '3600 Fifth Ave',        'Pittsburgh',   'PA', '15213', 40.443300, -79.960800, NULL, 'drugstore'),

  -- Pittsburgh Shadyside / East Liberty
  ('Giant Eagle Market District', '5550 Centre Ave',       'Pittsburgh',   'PA', '15232', 40.456948, -79.934972, NULL, 'grocery'),
  ('CVS Pharmacy',                '5818 Forbes Ave',       'Pittsburgh',   'PA', '15217', 40.427240, -79.922520, NULL, 'drugstore'),
  ('Walgreens',                   '5956 Centre Ave',       'Pittsburgh',   'PA', '15206', 40.458800, -79.927600, NULL, 'drugstore'),

  -- Pittsburgh Squirrel Hill
  ('Giant Eagle',                 '1901 Murray Ave',       'Pittsburgh',   'PA', '15217', 40.435905, -79.922890, NULL, 'grocery'),
  ('CVS Pharmacy',                '2025 Murray Ave',       'Pittsburgh',   'PA', '15217', 40.434670, -79.920780, NULL, 'drugstore'),

  -- Pittsburgh North Side / North Hills
  ('Giant Eagle',                 '318 Cedar Ave',         'Pittsburgh',   'PA', '15212', 40.457300, -79.996000, NULL, 'grocery'),
  ('GetGo Cafe + Market',         '7675 McKnight Rd',      'Pittsburgh',   'PA', '15237', 40.545240, -80.017010, NULL, 'convenience'),
  ('Giant Eagle',                 '9805 McKnight Rd',      'Pittsburgh',   'PA', '15237', 40.560330, -80.016450, NULL, 'grocery'),

  -- Pittsburgh East (Wilkinsburg / Penn Hills)
  ('Giant Eagle',                 '818 Penn Ave',          'Wilkinsburg',  'PA', '15221', 40.445180, -79.881900, NULL, 'grocery'),
  ('Sheetz',                      '3457 William Penn Hwy', 'Pittsburgh',   'PA', '15235', 40.429966, -79.811256, NULL, 'convenience'),

  -- Monroeville
  ('Giant Eagle',                 '3850 Monroeville Blvd', 'Monroeville',  'PA', '15146', 40.421100, -79.768900, NULL, 'grocery'),
  ('Sheetz',                      '2820 Mosside Blvd',     'Monroeville',  'PA', '15146', 40.434500, -79.745500, NULL, 'convenience'),
  ('CVS Pharmacy',                '3715 William Penn Hwy', 'Monroeville',  'PA', '15146', 40.422500, -79.763200, NULL, 'drugstore'),

  -- Harrisburg
  ('Weis Markets',                '3885 Union Deposit Rd', 'Harrisburg',   'PA', '17109', 40.302560, -76.821570, NULL, 'grocery'),
  ('Turkey Hill Minit Market',    '2941 Paxton St',        'Harrisburg',   'PA', '17111', 40.249930, -76.837540, NULL, 'convenience'),
  ('Sheetz',                      '1001 S 29th St',        'Harrisburg',   'PA', '17111', 40.252310, -76.900980, NULL, 'convenience'),

  -- Allentown / Whitehall
  ('CVS Pharmacy',                '737 Hamilton St',       'Allentown',    'PA', '18101', 40.602140, -75.471310, NULL, 'drugstore'),
  ('Weis Markets',                '1425 Tilghman St',      'Allentown',    'PA', '18102', 40.598410, -75.491320, NULL, 'grocery'),
  ('Sheetz',                      '2222 MacArthur Rd',     'Whitehall',    'PA', '18052', 40.652980, -75.495030, NULL, 'convenience'),

  -- State College
  ('Sheetz',                      '418 E College Ave',     'State College','PA', '16801', 40.798054, -77.856440, NULL, 'convenience'),
  ('Weis Markets',                '1471 Martin St',        'State College','PA', '16803', 40.792780, -77.858130, NULL, 'grocery'),
  ('CVS Pharmacy',                '323 S Allen St',        'State College','PA', '16801', 40.793250, -77.860730, NULL, 'drugstore'),

  -- Erie
  ('Sheetz',                      '3510 Peach St',         'Erie',         'PA', '16508', 42.081300, -80.094070, NULL, 'convenience'),
  ('Giant Eagle',                 '2877 W 26th St',        'Erie',         'PA', '16506', 42.097060, -80.120630, NULL, 'grocery'),
  ('Walgreens',                   '2523 Peach St',         'Erie',         'PA', '16508', 42.091270, -80.093970, NULL, 'drugstore'),

  -- Reading
  ('Weis Markets',                '1000 Morgantown Rd',    'Reading',      'PA', '19607', 40.326590, -75.952900, NULL, 'grocery'),
  ('Sheetz',                      '3421 Penn Ave',         'Reading',      'PA', '19608', 40.334510, -75.996740, NULL, 'convenience'),

  -- Lancaster
  ('Weis Markets',                '325 Centerville Rd',    'Lancaster',    'PA', '17601', 40.049200, -76.383700, NULL, 'grocery'),
  ('Sheetz',                      '3101 Columbia Ave',     'Lancaster',    'PA', '17603', 40.036800, -76.331700, NULL, 'convenience'),
  ('CVS Pharmacy',                '45 W Chestnut St',      'Lancaster',    'PA', '17603', 40.037460, -76.308560, NULL, 'drugstore')

ON CONFLICT DO NOTHING;

-- Re-seed store hours (Mon–Sun 7 am – 10 pm) for all new stores
INSERT INTO store_hours (store_id, day_of_week, opens_at, closes_at)
SELECT s.id, d.day, '07:00'::time, '22:00'::time
FROM stores s, generate_series(0, 6) AS d(day)
ON CONFLICT DO NOTHING;

-- Re-link core Diet Coke products to all new stores
INSERT INTO store_products (store_id, product_id, in_stock)
SELECT s.id, p.id, true
FROM stores s, products p
WHERE p.sku IN ('DC_20OZ_BOTTLE', 'DC_2L_BOTTLE', 'DC_6PACK_12OZ', 'DC_FOUNTAIN')
ON CONFLICT DO NOTHING;
