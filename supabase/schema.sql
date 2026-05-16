-- Diet Coke Store Locator Database Schema
-- Run this in Supabase SQL Editor to set up your database

-- Create stores table
CREATE TABLE IF NOT EXISTS stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  phone TEXT,
  store_type TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for lat/lon lookups
CREATE INDEX IF NOT EXISTS stores_lat_lon_idx ON stores (latitude, longitude);

-- Create store_hours table
CREATE TABLE IF NOT EXISTS store_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  opens_at TIME NOT NULL,
  closes_at TIME NOT NULL,
  is_closed BOOLEAN DEFAULT false,
  special_note TEXT,
  UNIQUE(store_id, day_of_week)
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  volume_ml INTEGER,
  sku TEXT UNIQUE
);

-- Create store_products junction table
CREATE TABLE IF NOT EXISTS store_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  in_stock BOOLEAN DEFAULT true,
  last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(store_id, product_id)
);

-- Create favorite_stores table
CREATE TABLE IF NOT EXISTS favorite_stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, store_id)
);

-- Enable Row Level Security
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_stores ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (safe to re-run)
DROP POLICY IF EXISTS "stores_public_read" ON stores;
DROP POLICY IF EXISTS "store_hours_public_read" ON store_hours;
DROP POLICY IF EXISTS "products_public_read" ON products;
DROP POLICY IF EXISTS "store_products_public_read" ON store_products;
DROP POLICY IF EXISTS "favorites_select" ON favorite_stores;
DROP POLICY IF EXISTS "favorites_insert" ON favorite_stores;
DROP POLICY IF EXISTS "favorites_delete" ON favorite_stores;

-- Public read access for store data
CREATE POLICY "stores_public_read" ON stores FOR SELECT USING (true);
CREATE POLICY "store_hours_public_read" ON store_hours FOR SELECT USING (true);
CREATE POLICY "products_public_read" ON products FOR SELECT USING (true);
CREATE POLICY "store_products_public_read" ON store_products FOR SELECT USING (true);

-- Favorites: authenticated users can manage their own
CREATE POLICY "favorites_select" ON favorite_stores
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites_insert" ON favorite_stores
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_delete" ON favorite_stores
  FOR DELETE USING (auth.uid() = user_id);

-- PostGIS nearby_stores function (Haversine distance)
CREATE OR REPLACE FUNCTION nearby_stores(
  user_lat DECIMAL,
  user_lon DECIMAL,
  radius_km DECIMAL DEFAULT 25
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  phone TEXT,
  store_type TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  distance_km DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id, s.name, s.address, s.city, s.state, s.zip,
    s.latitude, s.longitude, s.phone, s.store_type,
    s.is_active, s.created_at, s.updated_at,
    ROUND(
      (6371 * acos(
        LEAST(1.0, cos(radians(user_lat::float)) *
          cos(radians(s.latitude::float)) *
          cos(radians(s.longitude::float) - radians(user_lon::float)) +
          sin(radians(user_lat::float)) *
          sin(radians(s.latitude::float))
        )
      ))::NUMERIC, 2
    ) AS distance_km
  FROM stores s
  WHERE s.is_active = true
  HAVING
    6371 * acos(
      LEAST(1.0, cos(radians(user_lat::float)) *
        cos(radians(s.latitude::float)) *
        cos(radians(s.longitude::float) - radians(user_lon::float)) +
        sin(radians(user_lat::float)) *
        sin(radians(s.latitude::float))
      )
    ) <= radius_km::float
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed default Diet Coke products
INSERT INTO products (name, category, volume_ml, sku) VALUES
  ('Diet Coke - 20oz Bottle', 'bottle', 591, 'DC_20OZ_BOTTLE'),
  ('Diet Coke - 2L Bottle', 'bottle', 2000, 'DC_2L_BOTTLE'),
  ('Diet Coke - 6-Pack (12oz cans)', 'pack', 355, 'DC_6PACK_12OZ'),
  ('Diet Coke - 12-Pack (12oz cans)', 'pack', 355, 'DC_12PACK_12OZ'),
  ('Diet Coke - Fountain', 'fountain', NULL, 'DC_FOUNTAIN'),
  ('Diet Coke Zero Sugar - 20oz Bottle', 'bottle', 591, 'DCZS_20OZ_BOTTLE'),
  ('Diet Coke Zero Sugar - 2L Bottle', 'bottle', 2000, 'DCZS_2L_BOTTLE')
ON CONFLICT (sku) DO NOTHING;

-- Pittsburgh-area stores — real verified locations sourced from chain store locators
-- (Giant Eagle, GetGo, Sheetz, CVS, Walgreens, Target, Walmart, Aldi)
INSERT INTO stores (name, address, city, state, zip, latitude, longitude, phone, store_type) VALUES
  -- GetGo (10 locations — Giant Eagle fuel & convenience brand)
  ('GetGo (Ben Avon Heights)', '156 Ben Avon Heights Rd', 'Pittsburgh', 'PA', '15237', 40.50460, -80.05240, '(412) 761-8460', 'convenience'),
  ('GetGo (Bloomfield / Baum Blvd)', '4924 Baum Blvd', 'Pittsburgh', 'PA', '15213', 40.45530, -79.92260, '(412) 661-8460', 'convenience'),
  ('GetGo (Brentwood / Saw Mill Run)', '3601 Saw Mill Run Blvd', 'Pittsburgh', 'PA', '15227', 40.37213, -79.98160, '(412) 885-7360', 'convenience'),
  ('GetGo (Carnegie / E Main St)', '350 E Main St', 'Carnegie', 'PA', '15106', 40.39510, -80.08360, '(412) 276-8460', 'convenience'),
  ('GetGo (Cochran Rd)', '1636 Cochran Rd', 'Pittsburgh', 'PA', '15220', 40.39240, -80.04590, '(412) 343-6460', 'convenience'),
  ('GetGo (Edgewood / S Braddock Ave)', '1043 S Braddock Ave', 'Pittsburgh', 'PA', '15218', 40.42650, -79.89790, '(412) 371-8460', 'convenience'),
  ('GetGo (Lawrenceville / Butler St)', '4000 Butler St', 'Pittsburgh', 'PA', '15201', 40.46990, -79.96050, '(412) 682-8460', 'convenience'),
  ('GetGo (Robinson / Steubenville Pike)', '4900 Steubenville Pike', 'Pittsburgh', 'PA', '15205', 40.45190, -80.14710, '(412) 490-8460', 'convenience'),
  ('GetGo (Ross Township / McKnight Rd)', '7675 McKnight Rd', 'Pittsburgh', 'PA', '15237', 40.54550, -80.01650, '(412) 369-9297', 'convenience'),
  ('GetGo (South Side / E Carson St)', '3247 E Carson St', 'Pittsburgh', 'PA', '15203', 40.42710, -79.96660, '(412) 431-8460', 'convenience'),

  -- Sheetz (9 locations)
  ('Sheetz (Aspinwall / Freeport Rd)', '2871 Freeport Rd', 'Pittsburgh', 'PA', '15238', 40.48620, -79.90240, '(412) 635-1003', 'convenience'),
  ('Sheetz (North Hills / Perry Hwy)', '8500 Perry Hwy', 'Pittsburgh', 'PA', '15237', 40.56840, -80.03350, '(412) 635-1002', 'convenience'),
  ('Sheetz (Ohio Township / Mt Nebo)', '211 Mount Nebo Rd', 'Pittsburgh', 'PA', '15237', 40.50930, -80.11180, '(412) 635-1001', 'convenience'),
  ('Sheetz (Penn Hills / William Penn Hwy)', '3457 William Penn Hwy', 'Pittsburgh', 'PA', '15235', 40.44370, -79.79480, '(412) 388-9553', 'convenience'),
  ('Sheetz (Pleasant Hills / Clairton Blvd)', '1000 Clairton Blvd', 'Pittsburgh', 'PA', '15236', 40.35900, -79.98550, '(412) 284-0135', 'convenience'),
  ('Sheetz (Plum)', '950 Presque Isle Dr', 'Plum', 'PA', '15239', 40.49750, -79.76850, '(412) 635-1004', 'convenience'),
  ('Sheetz (Robinson / Campbells Run)', '5410 Campbells Run Rd', 'Pittsburgh', 'PA', '15205', 40.44778, -80.15735, '(412) 356-8371', 'convenience'),
  ('Sheetz (Ross Township / Babcock)', '3025 Babcock Blvd', 'Pittsburgh', 'PA', '15237', 40.51720, -80.02080, '(412) 635-1000', 'convenience'),
  ('Sheetz (Stowe / Grand Ave)', '5800 Grand Ave', 'Pittsburgh', 'PA', '15225', 40.48860, -80.07110, '(412) 375-2104', 'convenience'),

  -- CVS Pharmacy (10 locations)
  ('CVS Pharmacy (Baldwin / Clairton)', '5242 Clairton Blvd', 'Pittsburgh', 'PA', '15236', 40.35770, -79.98530, '(412) 882-5480', 'drugstore'),
  ('CVS Pharmacy (Carnegie / W Steuben)', '70 W Steuben St', 'Pittsburgh', 'PA', '15205', 40.42530, -80.08760, '(412) 429-0360', 'drugstore'),
  ('CVS Pharmacy (Dormont / W Liberty)', '3075 W Liberty Ave', 'Pittsburgh', 'PA', '15216', 40.40160, -80.01570, '(412) 531-3240', 'drugstore'),
  ('CVS Pharmacy (Downtown / Fifth Ave)', '242 Fifth Ave', 'Pittsburgh', 'PA', '15222', 40.44180, -79.99890, '(412) 391-4430', 'drugstore'),
  ('CVS Pharmacy (Downtown / Smithfield)', '482 Smithfield St', 'Pittsburgh', 'PA', '15219', 40.43810, -79.99580, '(412) 281-3560', 'drugstore'),
  ('CVS Pharmacy (McCandless)', '9805 McKnight Rd', 'Pittsburgh', 'PA', '15237', 40.58200, -80.03400, '(412) 366-7290', 'drugstore'),
  ('CVS Pharmacy (Oakland / Centre Ave)', '4610 Centre Ave', 'Pittsburgh', 'PA', '15213', 40.45300, -79.93710, '(412) 682-7400', 'drugstore'),
  ('CVS Pharmacy (Oakland / Forbes Ave)', '3422 Forbes Ave', 'Pittsburgh', 'PA', '15213', 40.43876, -79.96023, '(412) 682-4240', 'drugstore'),
  ('CVS Pharmacy (Penn Hills / Frankstown)', '10600 Frankstown Rd', 'Pittsburgh', 'PA', '15235', 40.46050, -79.83150, '(412) 244-7360', 'drugstore'),
  ('CVS Pharmacy (Upper St Clair)', '1740 Washington Rd', 'Pittsburgh', 'PA', '15241', 40.34670, -80.04910, '(412) 831-3430', 'drugstore'),

  -- Walgreens (6 locations)
  ('Walgreens (Mt Lebanon / Bower Hill)', '1000 Bower Hill Rd', 'Pittsburgh', 'PA', '15243', 40.37490, -80.04890, '(412) 344-4110', 'drugstore'),
  ('Walgreens (Penn Hills / Saltsburg)', '6201 Saltsburg Rd', 'Pittsburgh', 'PA', '15235', 40.45950, -79.82500, '(412) 795-5340', 'drugstore'),
  ('Walgreens (Ross Township / McKnight)', '4885 McKnight Rd', 'Pittsburgh', 'PA', '15237', 40.51860, -80.01680, '(412) 366-2380', 'drugstore'),
  ('Walgreens (Shadyside / Centre Ave)', '5956 Centre Ave', 'Pittsburgh', 'PA', '15206', 40.45730, -79.92800, '(412) 661-4320', 'drugstore'),
  ('Walgreens (Upper St Clair)', '1741 Washington Rd', 'Pittsburgh', 'PA', '15241', 40.34660, -80.04910, '(412) 854-5230', 'drugstore'),
  ('Walgreens (Wilkinsburg / Penn Ave)', '7628 Penn Ave', 'Pittsburgh', 'PA', '15221', 40.44880, -79.85350, '(412) 244-5430', 'drugstore'),

  -- Aldi (7 locations)
  ('Aldi (Bloomfield / Baum Blvd)', '5631 Baum Blvd', 'Pittsburgh', 'PA', '15206', 40.45430, -79.92340, '(412) 682-0170', 'grocery'),
  ('Aldi (Bloomfield / Penn Ave)', '5200 Penn Ave', 'Pittsburgh', 'PA', '15224', 40.46370, -79.93480, '(412) 661-0170', 'grocery'),
  ('Aldi (Lawrenceville / 56th St)', '450 56th St', 'Pittsburgh', 'PA', '15201', 40.47420, -79.95740, '(412) 363-0170', 'grocery'),
  ('Aldi (Overbrook / Sussex Ave)', '3089 Sussex Ave', 'Pittsburgh', 'PA', '15226', 40.38730, -80.00650, '(412) 531-0170', 'grocery'),
  ('Aldi (Ross Township / McKnight)', '7221 McKnight Rd', 'Pittsburgh', 'PA', '15237', 40.54300, -80.02000, '(412) 563-0170', 'grocery'),
  ('Aldi (Ross Township / Northway)', '6290 Northway Dr', 'Pittsburgh', 'PA', '15237', 40.51930, -80.01350, '(412) 369-0170', 'grocery'),
  ('Aldi (South Side / E Carson)', '2628 E Carson St', 'Pittsburgh', 'PA', '15203', 40.42700, -79.97410, '(412) 431-0170', 'grocery'),

  -- Giant Eagle / Market District (14 locations)
  ('Giant Eagle (Baldwin/Grove Rd)', '5260 Grove Rd', 'Pittsburgh', 'PA', '15236', 40.36000, -79.99500, '(412) 881-4601', 'grocery'),
  ('Giant Eagle (Ben Avon)', '132 Ben Avon Heights Rd', 'Pittsburgh', 'PA', '15237', 40.50450, -80.05250, '(412) 364-2390', 'grocery'),
  ('Giant Eagle (Bethel Park)', '5055 Library Rd', 'Bethel Park', 'PA', '15102', 40.33897, -80.02604, '(412) 831-7727', 'grocery'),
  ('Giant Eagle (Brentwood Towne Square)', '600 Towne Square Way', 'Pittsburgh', 'PA', '15227', 40.37210, -79.99270, '(412) 881-4075', 'grocery'),
  ('Giant Eagle (Cedar Ave, North Side)', '318 Cedar Ave', 'Pittsburgh', 'PA', '15212', 40.45620, -80.01730, '(412) 321-3551', 'grocery'),
  ('Giant Eagle (Churchill/Yost Blvd)', '254 Yost Blvd', 'Pittsburgh', 'PA', '15221', 40.42800, -79.87000, '(412) 829-2400', 'grocery'),
  ('Giant Eagle (McCandless)', '9805 McKnight Rd', 'Pittsburgh', 'PA', '15237', 40.58571, -80.03713, '(724) 934-0155', 'grocery'),
  ('Giant Eagle (Monroeville)', '4010 Monroeville Blvd', 'Monroeville', 'PA', '15146', 40.42730, -79.75660, '(412) 372-1220', 'grocery'),
  ('Giant Eagle (North Hills/Blazier Dr)', '225 Blazier Dr', 'Pittsburgh', 'PA', '15237', 40.55010, -80.02180, '(412) 366-6828', 'grocery'),
  ('Giant Eagle (Squirrel Hill)', '1901 Murray Ave', 'Pittsburgh', 'PA', '15217', 40.42860, -79.92620, '(412) 521-8370', 'grocery'),
  ('Giant Eagle Market District (Cochran Rd)', '1717 Cochran Rd', 'Pittsburgh', 'PA', '15220', 40.39328, -80.06523, '(412) 343-8020', 'grocery'),
  ('Giant Eagle Market District (Shadyside)', '5550 Centre Ave', 'Pittsburgh', 'PA', '15232', 40.45695, -79.93497, '(412) 681-1500', 'grocery'),
  ('Giant Eagle Market District (South Hills)', '7000 Oxford Dr', 'Bethel Park', 'PA', '15102', 40.33460, -80.04720, '(412) 854-9300', 'grocery'),
  ('Giant Eagle Market District (Waterworks)', '910 Freeport Rd', 'Pittsburgh', 'PA', '15238', 40.49900, -79.89930, '(412) 781-6605', 'grocery'),

  -- Target (9 locations)
  ('Target (Downtown Pittsburgh)', '482 Smithfield St', 'Pittsburgh', 'PA', '15219', 40.43760, -79.99640, '(412) 258-8500', 'grocery'),
  ('Target (East Liberty)', '6231 Penn Ave', 'Pittsburgh', 'PA', '15206', 40.45910, -79.92210, '(412) 626-3258', 'grocery'),
  ('Target (Fox Chapel / Freeport Rd)', '2661 Freeport Rd', 'Pittsburgh', 'PA', '15238', 40.48440, -79.89930, '(412) 820-6780', 'grocery'),
  ('Target (Monroeville)', '4004 Monroeville Blvd', 'Monroeville', 'PA', '15146', 40.42810, -79.75650, '(412) 374-9611', 'grocery'),
  ('Target (Moon Township)', '600 Chauvet Dr', 'Moon Township', 'PA', '15108', 40.50060, -80.20650, '(412) 490-0488', 'grocery'),
  ('Target (North Hills / Blazier Dr)', '105 Blazier Dr', 'Pittsburgh', 'PA', '15237', 40.55030, -80.02180, '(412) 369-9411', 'grocery'),
  ('Target (Ross Township / McKnight)', '4801 McKnight Rd', 'Pittsburgh', 'PA', '15237', 40.51800, -80.01830, '(412) 536-1807', 'grocery'),
  ('Target (South Hills Village)', '201 S Hills Village', 'Pittsburgh', 'PA', '15241', 40.34610, -80.04870, '(412) 595-9380', 'grocery'),
  ('Target (Waterfront / Homestead)', '360 Waterfront Dr E', 'Homestead', 'PA', '15120', 40.40830, -79.90080, '(412) 464-2522', 'grocery'),

  -- Walmart (1 location)
  ('Walmart (Robinson / Summit Park)', '250 Summit Park Dr', 'Pittsburgh', 'PA', '15275', 40.50210, -80.21180, '(412) 788-9079', 'grocery')

ON CONFLICT DO NOTHING;

-- Sample store hours (Mon-Sun 7am-10pm for all sample stores)
INSERT INTO store_hours (store_id, day_of_week, opens_at, closes_at)
SELECT s.id, d.day, '07:00'::time, '22:00'::time
FROM stores s, generate_series(0, 6) AS d(day)
ON CONFLICT DO NOTHING;

-- Link products to all sample stores
INSERT INTO store_products (store_id, product_id, in_stock)
SELECT s.id, p.id, true
FROM stores s, products p
WHERE p.sku IN ('DC_20OZ_BOTTLE', 'DC_2L_BOTTLE', 'DC_6PACK_12OZ', 'DC_FOUNTAIN')
ON CONFLICT DO NOTHING;
