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

-- Sample Pennsylvania stores (Philadelphia, Pittsburgh, Oakland, and surrounding areas)
INSERT INTO stores (name, address, city, state, zip, latitude, longitude, phone, store_type) VALUES
  -- Philadelphia
  ('CVS Pharmacy #2345', '1600 Chestnut St', 'Philadelphia', 'PA', '19103', 39.9515, -75.1682, '(215) 555-0101', 'drugstore'),
  ('Wawa #550', '2100 Market St', 'Philadelphia', 'PA', '19103', 39.9535, -75.1796, '(215) 555-0102', 'convenience'),
  ('Giant Food Store', '4000 City Ave', 'Philadelphia', 'PA', '19131', 39.9813, -75.2205, '(215) 555-0103', 'grocery'),

  -- Pittsburgh Downtown
  ('Sheetz #205', '123 Penn Ave', 'Pittsburgh', 'PA', '15222', 40.4406, -79.9990, '(412) 555-0104', 'convenience'),
  ('GetGo Cafe & Market', '500 Forbes Ave', 'Pittsburgh', 'PA', '15219', 40.4388, -79.9974, '(412) 555-0105', 'convenience'),
  ('Rite Aid Pharmacy', '600 Penn Ave', 'Pittsburgh', 'PA', '15222', 40.4416, -80.0002, '(412) 555-0107', 'drugstore'),
  ('Market District Grocery', '2401 Smallman St', 'Pittsburgh', 'PA', '15222', 40.4350, -79.9985, '(412) 555-0120', 'grocery'),
  ('Walgreens Downtown', '800 Liberty Ave', 'Pittsburgh', 'PA', '15222', 40.4410, -80.0020, '(412) 555-0121', 'drugstore'),

  -- Oakland (Pittsburgh University Area) - Heavy Focus
  ('Giant Eagle #8021', '3618 Forbes Ave', 'Pittsburgh', 'PA', '15213', 40.4533, -79.9563, '(412) 555-0200', 'grocery'),
  ('CVS Pharmacy Oakland', '3700 Forbes Ave', 'Pittsburgh', 'PA', '15213', 40.4535, -79.9548, '(412) 555-0201', 'drugstore'),
  ('GetGo #412', '3550 Forbes Ave', 'Pittsburgh', 'PA', '15213', 40.4528, -79.9578, '(412) 555-0202', 'convenience'),
  ('Sheetz #089', '3450 Forbes Ave', 'Pittsburgh', 'PA', '15213', 40.4525, -79.9598, '(412) 555-0203', 'convenience'),
  ('Walgreens Oakland', '3900 Forbes Ave', 'Pittsburgh', 'PA', '15213', 40.4540, -79.9528, '(412) 555-0204', 'drugstore'),
  ('7-Eleven Oakland #1', '3800 O''Hara St', 'Pittsburgh', 'PA', '15213', 40.4550, -79.9545, '(412) 555-0205', 'convenience'),
  ('Shop n Save Oakland', '3600 Forbes Ave', 'Pittsburgh', 'PA', '15213', 40.4530, -79.9570, '(412) 555-0206', 'grocery'),
  ('Turkey Hill Market Oakland', '3750 Forbes Ave', 'Pittsburgh', 'PA', '15213', 40.4537, -79.9540, '(412) 555-0207', 'convenience'),
  ('Rite Aid Oakland', '3500 Forbes Ave', 'Pittsburgh', 'PA', '15213', 40.4527, -79.9585, '(412) 555-0208', 'drugstore'),
  ('Giant Eagle #1062', '4000 Fifth Ave', 'Pittsburgh', 'PA', '15213', 40.4560, -79.9520, '(412) 555-0209', 'grocery'),

  -- Shadyside (Near Oakland)
  ('GetGo Shadyside', '5805 Walnut St', 'Pittsburgh', 'PA', '15232', 40.4530, -79.9380, '(412) 555-0210', 'convenience'),
  ('CVS Pharmacy Shadyside', '5700 Walnut St', 'Pittsburgh', 'PA', '15232', 40.4525, -79.9390, '(412) 555-0211', 'drugstore'),
  ('Market District Shadyside', '5860 Ellsworth Ave', 'Pittsburgh', 'PA', '15232', 40.4535, -79.9370, '(412) 555-0212', 'grocery'),

  -- Squirrel Hill
  ('Giant Eagle Squirrel Hill', '1901 Murray Ave', 'Pittsburgh', 'PA', '15217', 40.4283, -79.9262, '(412) 555-0106', 'grocery'),
  ('Sheetz Squirrel Hill', '2000 Murray Ave', 'Pittsburgh', 'PA', '15217', 40.4290, -79.9250, '(412) 555-0213', 'convenience'),
  ('Walgreens Squirrel Hill', '1950 Murray Ave', 'Pittsburgh', 'PA', '15217', 40.4287, -79.9256, '(412) 555-0214', 'drugstore'),

  -- East Pittsburgh & Suburbs
  ('GetGo Wilkinsburg', '718 Wood St', 'Wilkinsburg', 'PA', '15221', 40.4450, -79.8700, '(412) 555-0215', 'convenience'),
  ('Giant Eagle Wilkinsburg', '800 Wood St', 'Wilkinsburg', 'PA', '15221', 40.4455, -79.8690, '(412) 555-0216', 'grocery'),
  ('CVS Pharmacy Wilkinsburg', '750 Wood St', 'Wilkinsburg', 'PA', '15221', 40.4452, -79.8695, '(412) 555-0217', 'drugstore'),

  -- North Hills
  ('GetGo North Hills', '4601 Gibsonia Rd', 'Pittsburgh', 'PA', '15237', 40.5200, -79.9450, '(412) 555-0218', 'convenience'),
  ('Giant Eagle North Hills', '4700 Gibsonia Rd', 'Pittsburgh', 'PA', '15237', 40.5210, -79.9440, '(412) 555-0219', 'grocery'),
  ('Sheetz North Hills', '4650 Gibsonia Rd', 'Pittsburgh', 'PA', '15237', 40.5205, -79.9445, '(412) 555-0220', 'convenience'),

  -- West End
  ('GetGo West End', '1500 Greentree Rd', 'Pittsburgh', 'PA', '15220', 40.4200, -80.0400, '(412) 555-0221', 'convenience'),
  ('Giant Eagle West End', '1600 Greentree Rd', 'Pittsburgh', 'PA', '15220', 40.4210, -80.0390, '(412) 555-0222', 'grocery'),

  -- Monroeville (East Suburbs)
  ('GetGo Monroeville', '3700 Mosside Blvd', 'Monroeville', 'PA', '15146', 40.4100, -79.7600, '(412) 555-0223', 'convenience'),
  ('Giant Eagle Monroeville', '3800 Mosside Blvd', 'Monroeville', 'PA', '15146', 40.4110, -79.7590, '(412) 555-0224', 'grocery'),
  ('Sheetz Monroeville', '3750 Mosside Blvd', 'Monroeville', 'PA', '15146', 40.4105, -79.7595, '(412) 555-0225', 'convenience'),

  -- Additional Areas
  ('Weis Markets #23', '100 Governor Dr', 'Harrisburg', 'PA', '17110', 40.2732, -76.8867, '(717) 555-0108', 'grocery'),
  ('Turkey Hill Minit Market', '200 Market St', 'Harrisburg', 'PA', '17101', 40.2632, -76.8839, '(717) 555-0109', 'convenience'),
  ('CVS Pharmacy #1887', '800 Hamilton St', 'Allentown', 'PA', '18101', 40.6021, -75.4713, '(610) 555-0110', 'drugstore'),
  ('GetGo State College', '126 Premiere Drive', 'State College', 'PA', '16801', 40.8530, -77.8690, '(814) 555-0226', 'convenience'),
  ('Giant Eagle State College', '200 Premiere Drive', 'State College', 'PA', '16801', 40.8540, -77.8680, '(814) 555-0227', 'grocery'),
  ('Sheetz Erie', '3700 Peach St', 'Erie', 'PA', '16509', 42.0850, -80.1970, '(814) 555-0228', 'convenience'),
  ('GetGo Edinboro', '301 Waterford St', 'Edinboro', 'PA', '16412', 41.8760, -80.4820, '(814) 555-0229', 'convenience'),
  ('Weis Markets Reading', '1000 Park Rd', 'Reading', 'PA', '19610', 40.3350, -75.9200, '(610) 555-0230', 'grocery'),
  ('GetGo Lancaster', '150 Spooky Nook Rd', 'Ephrata', 'PA', '17522', 40.1750, -76.2100, '(717) 555-0231', 'convenience')
ON CONFLICT DO NOTHING;

-- Additional Pittsburgh-area stores (100+)
INSERT INTO stores (name, address, city, state, zip, latitude, longitude, phone, store_type) VALUES
  -- Strip District / Cultural District
  ('CVS Pharmacy Strip District', '2218 Penn Ave', 'Pittsburgh', 'PA', '15222', 40.44750, -79.98920, '(412) 555-0301', 'drugstore'),
  ('7-Eleven Strip District', '1800 Penn Ave', 'Pittsburgh', 'PA', '15222', 40.44630, -79.99100, '(412) 555-0302', 'convenience'),
  ('Giant Eagle Market District Penn Ave', '1600 Penn Ave', 'Pittsburgh', 'PA', '15222', 40.44530, -79.99280, '(412) 555-0303', 'grocery'),

  -- North Shore / North Side
  ('GetGo North Shore', '1 Federal St', 'Pittsburgh', 'PA', '15212', 40.44790, -80.00650, '(412) 555-0304', 'convenience'),
  ('7-Eleven North Side', '900 Western Ave', 'Pittsburgh', 'PA', '15233', 40.45440, -80.01380, '(412) 555-0305', 'convenience'),
  ('CVS Pharmacy North Side', '1100 East Ohio St', 'Pittsburgh', 'PA', '15212', 40.45560, -80.00740, '(412) 555-0306', 'drugstore'),

  -- South Side
  ('Sheetz South Side', '2519 E Carson St', 'Pittsburgh', 'PA', '15203', 40.42860, -79.97480, '(412) 555-0307', 'convenience'),
  ('CVS Pharmacy South Side', '2600 E Carson St', 'Pittsburgh', 'PA', '15203', 40.42870, -79.97400, '(412) 555-0308', 'drugstore'),
  ('Giant Eagle South Side', '1900 E Carson St', 'Pittsburgh', 'PA', '15203', 40.42800, -79.98100, '(412) 555-0309', 'grocery'),
  ('Walgreens South Side', '2300 E Carson St', 'Pittsburgh', 'PA', '15203', 40.42830, -79.97720, '(412) 555-0310', 'drugstore'),
  ('GetGo South Side Works', '450 S 27th St', 'Pittsburgh', 'PA', '15203', 40.42710, -79.97420, '(412) 555-0311', 'convenience'),
  ('Rite Aid South Side', '2100 E Carson St', 'Pittsburgh', 'PA', '15203', 40.42820, -79.97900, '(412) 555-0312', 'drugstore'),

  -- Lawrenceville
  ('Giant Eagle Lawrenceville', '4950 Penn Ave', 'Pittsburgh', 'PA', '15224', 40.46500, -79.93480, '(412) 555-0313', 'grocery'),
  ('CVS Pharmacy Lawrenceville', '4812 Butler St', 'Pittsburgh', 'PA', '15201', 40.47200, -79.95300, '(412) 555-0314', 'drugstore'),
  ('GetGo Lawrenceville', '4500 Penn Ave', 'Pittsburgh', 'PA', '15224', 40.46400, -79.94000, '(412) 555-0315', 'convenience'),
  ('Walgreens Lawrenceville', '3600 Butler St', 'Pittsburgh', 'PA', '15201', 40.46700, -79.96000, '(412) 555-0316', 'drugstore'),
  ('Dollar General Lawrenceville', '4200 Butler St', 'Pittsburgh', 'PA', '15201', 40.46900, -79.95700, '(412) 555-0317', 'convenience'),
  ('Sheetz Lawrenceville', '5000 Butler St', 'Pittsburgh', 'PA', '15201', 40.47350, -79.94800, '(412) 555-0318', 'convenience'),

  -- Bloomfield
  ('CVS Pharmacy Bloomfield', '4412 Liberty Ave', 'Pittsburgh', 'PA', '15224', 40.45980, -79.94400, '(412) 555-0319', 'drugstore'),
  ('Giant Eagle Bloomfield', '4550 Liberty Ave', 'Pittsburgh', 'PA', '15224', 40.46000, -79.94300, '(412) 555-0320', 'grocery'),
  ('GetGo Bloomfield', '4300 Liberty Ave', 'Pittsburgh', 'PA', '15224', 40.45960, -79.94600, '(412) 555-0321', 'convenience'),

  -- East Liberty
  ('Giant Eagle East Liberty', '6024 Centre Ave', 'Pittsburgh', 'PA', '15206', 40.46290, -79.92710, '(412) 555-0322', 'grocery'),
  ('Target East Liberty', '6231 Penn Circle S', 'Pittsburgh', 'PA', '15206', 40.45950, -79.92200, '(412) 555-0323', 'grocery'),
  ('CVS Pharmacy East Liberty', '5500 Penn Ave', 'Pittsburgh', 'PA', '15206', 40.46300, -79.92950, '(412) 555-0324', 'drugstore'),
  ('Walgreens East Liberty', '6100 Penn Ave', 'Pittsburgh', 'PA', '15206', 40.46250, -79.92680, '(412) 555-0325', 'drugstore'),
  ('Aldi East Liberty', '5929 Penn Ave', 'Pittsburgh', 'PA', '15206', 40.46100, -79.92850, '(412) 555-0326', 'grocery'),
  ('Dollar General East Liberty', '5700 Penn Ave', 'Pittsburgh', 'PA', '15206', 40.46100, -79.93100, '(412) 555-0327', 'convenience'),

  -- Point Breeze / Regent Square
  ('Giant Eagle Point Breeze', '5870 Baum Blvd', 'Pittsburgh', 'PA', '15206', 40.45200, -79.91730, '(412) 555-0328', 'grocery'),
  ('CVS Pharmacy Point Breeze', '6040 Walnut St', 'Pittsburgh', 'PA', '15206', 40.45200, -79.91900, '(412) 555-0329', 'drugstore'),

  -- Greenfield / Hazelwood
  ('CVS Pharmacy Greenfield', '3705 Greenfield Ave', 'Pittsburgh', 'PA', '15207', 40.40730, -79.94180, '(412) 555-0330', 'drugstore'),
  ('Dollar General Hazelwood', '4801 Hazelwood Ave', 'Pittsburgh', 'PA', '15207', 40.40120, -79.93300, '(412) 555-0331', 'convenience'),
  ('GetGo Greenfield', '3800 Greenfield Ave', 'Pittsburgh', 'PA', '15207', 40.40720, -79.94000, '(412) 555-0332', 'convenience'),

  -- Homestead / Waterfront District
  ('Target Waterfront', '200 E Waterfront Dr', 'Homestead', 'PA', '15120', 40.40800, -79.90560, '(412) 555-0333', 'grocery'),
  ('Giant Eagle Waterfront', '300 E Waterfront Dr', 'Homestead', 'PA', '15120', 40.40750, -79.90480, '(412) 555-0334', 'grocery'),
  ('CVS Pharmacy Homestead', '3701 E Carson St', 'Pittsburgh', 'PA', '15120', 40.40780, -79.89800, '(412) 555-0335', 'drugstore'),
  ('Walgreens Homestead', '400 E Waterfront Dr', 'Homestead', 'PA', '15120', 40.40820, -79.90440, '(412) 555-0336', 'drugstore'),

  -- Edgewood / Swissvale
  ('Giant Eagle Edgewood', '100 Edgewood Ave', 'Edgewood', 'PA', '15218', 40.42910, -79.88180, '(412) 555-0337', 'grocery'),
  ('CVS Pharmacy Swissvale', '7300 Fairless Dr', 'Swissvale', 'PA', '15218', 40.41850, -79.88930, '(412) 555-0338', 'drugstore'),
  ('GetGo Edgewood', '200 Edgewood Ave', 'Edgewood', 'PA', '15218', 40.42890, -79.88120, '(412) 555-0339', 'convenience'),

  -- Penn Hills
  ('Giant Eagle Penn Hills', '12000 Frankstown Rd', 'Penn Hills', 'PA', '15235', 40.46000, -79.82950, '(412) 555-0340', 'grocery'),
  ('CVS Pharmacy Penn Hills', '11001 Frankstown Rd', 'Penn Hills', 'PA', '15235', 40.45980, -79.83200, '(412) 555-0341', 'drugstore'),
  ('GetGo Penn Hills', '12250 Frankstown Rd', 'Penn Hills', 'PA', '15235', 40.46050, -79.82700, '(412) 555-0342', 'convenience'),
  ('Walgreens Penn Hills', '11400 Frankstown Rd', 'Penn Hills', 'PA', '15235', 40.46000, -79.83050, '(412) 555-0343', 'drugstore'),
  ('Sheetz Penn Hills', '12500 Frankstown Rd', 'Penn Hills', 'PA', '15235', 40.46100, -79.82600, '(412) 555-0344', 'convenience'),

  -- Plum Borough
  ('Giant Eagle Plum', '4745 New Texas Rd', 'Plum', 'PA', '15239', 40.49250, -79.75400, '(412) 555-0345', 'grocery'),
  ('CVS Pharmacy Plum', '4600 New Texas Rd', 'Plum', 'PA', '15239', 40.49150, -79.75600, '(412) 555-0346', 'drugstore'),
  ('Sheetz Plum', '4900 New Texas Rd', 'Plum', 'PA', '15239', 40.49350, -79.75250, '(412) 555-0347', 'convenience'),
  ('GetGo Plum', '4500 New Texas Rd', 'Plum', 'PA', '15239', 40.49050, -79.75700, '(412) 555-0348', 'convenience'),

  -- Murrysville / Export
  ('Giant Eagle Murrysville', '4844 William Penn Hwy', 'Murrysville', 'PA', '15668', 40.44110, -79.67100, '(412) 555-0349', 'grocery'),
  ('CVS Pharmacy Murrysville', '4700 William Penn Hwy', 'Murrysville', 'PA', '15668', 40.44000, -79.67300, '(412) 555-0350', 'drugstore'),
  ('Sheetz Murrysville', '5100 William Penn Hwy', 'Murrysville', 'PA', '15668', 40.44250, -79.66800, '(412) 555-0351', 'convenience'),
  ('Walgreens Murrysville', '4850 William Penn Hwy', 'Murrysville', 'PA', '15668', 40.44130, -79.67060, '(412) 555-0352', 'drugstore'),

  -- McKeesport
  ('Giant Eagle McKeesport', '2800 Braddock Ave', 'McKeesport', 'PA', '15132', 40.35400, -79.85000, '(412) 555-0353', 'grocery'),
  ('CVS Pharmacy McKeesport', '1701 5th Ave', 'McKeesport', 'PA', '15132', 40.34790, -79.84530, '(412) 555-0354', 'drugstore'),
  ('Walgreens McKeesport', '1900 5th Ave', 'McKeesport', 'PA', '15132', 40.34790, -79.84300, '(412) 555-0355', 'drugstore'),
  ('Sheetz McKeesport', '2600 Braddock Ave', 'McKeesport', 'PA', '15132', 40.35200, -79.85200, '(412) 555-0356', 'convenience'),

  -- West Mifflin / Duquesne
  ('Giant Eagle West Mifflin', '3000 Lebanon Church Rd', 'West Mifflin', 'PA', '15122', 40.36260, -79.86720, '(412) 555-0357', 'grocery'),
  ('CVS Pharmacy West Mifflin', '2900 Lebanon Church Rd', 'West Mifflin', 'PA', '15122', 40.36200, -79.86800, '(412) 555-0358', 'drugstore'),
  ('GetGo West Mifflin', '3100 Lebanon Church Rd', 'West Mifflin', 'PA', '15122', 40.36300, -79.86640, '(412) 555-0359', 'convenience'),

  -- Baldwin / Brentwood
  ('Giant Eagle Brentwood', '3663 Brownsville Rd', 'Brentwood', 'PA', '15227', 40.37290, -79.97580, '(412) 555-0360', 'grocery'),
  ('CVS Pharmacy Baldwin', '4700 Clairton Blvd', 'Pittsburgh', 'PA', '15236', 40.36170, -79.98260, '(412) 555-0361', 'drugstore'),
  ('GetGo Baldwin', '4800 Clairton Blvd', 'Pittsburgh', 'PA', '15236', 40.36120, -79.98180, '(412) 555-0362', 'convenience'),
  ('Walgreens Brentwood', '3700 Brownsville Rd', 'Brentwood', 'PA', '15227', 40.37300, -79.97560, '(412) 555-0363', 'drugstore'),

  -- Whitehall
  ('Giant Eagle Whitehall', '100 Brentwood Sq', 'Pittsburgh', 'PA', '15227', 40.36170, -79.99950, '(412) 555-0364', 'grocery'),
  ('Walgreens Whitehall', '200 Whitehall Rd', 'Pittsburgh', 'PA', '15227', 40.36200, -80.00100, '(412) 555-0365', 'drugstore'),
  ('CVS Pharmacy Whitehall', '150 Whitehall Rd', 'Pittsburgh', 'PA', '15227', 40.36180, -80.00030, '(412) 555-0366', 'drugstore'),
  ('GetGo Whitehall', '300 Whitehall Rd', 'Pittsburgh', 'PA', '15227', 40.36190, -80.00180, '(412) 555-0367', 'convenience'),

  -- Mount Lebanon
  ('Giant Eagle Mt. Lebanon', '1150 Bower Hill Rd', 'Pittsburgh', 'PA', '15243', 40.37400, -80.05200, '(412) 555-0368', 'grocery'),
  ('CVS Pharmacy Mt. Lebanon', '800 Washington Rd', 'Pittsburgh', 'PA', '15228', 40.37400, -80.04700, '(412) 555-0369', 'drugstore'),
  ('Walgreens Mt. Lebanon', '950 Washington Rd', 'Pittsburgh', 'PA', '15228', 40.37390, -80.04680, '(412) 555-0370', 'drugstore'),
  ('GetGo Mt. Lebanon', '1100 Bower Hill Rd', 'Pittsburgh', 'PA', '15243', 40.37420, -80.05140, '(412) 555-0371', 'convenience'),
  ('Sheetz Mt. Lebanon', '700 Washington Rd', 'Pittsburgh', 'PA', '15228', 40.37380, -80.04650, '(412) 555-0372', 'convenience'),

  -- Bethel Park
  ('Giant Eagle Bethel Park', '5027 Library Rd', 'Bethel Park', 'PA', '15102', 40.33300, -80.04800, '(412) 555-0373', 'grocery'),
  ('CVS Pharmacy Bethel Park', '4983 Library Rd', 'Bethel Park', 'PA', '15102', 40.33250, -80.04750, '(412) 555-0374', 'drugstore'),
  ('GetGo Bethel Park', '5200 Library Rd', 'Bethel Park', 'PA', '15102', 40.33350, -80.04850, '(412) 555-0375', 'convenience'),
  ('Sheetz Bethel Park', '5400 Library Rd', 'Bethel Park', 'PA', '15102', 40.33400, -80.04900, '(412) 555-0376', 'convenience'),
  ('Walgreens Bethel Park', '4900 Library Rd', 'Bethel Park', 'PA', '15102', 40.33220, -80.04720, '(412) 555-0377', 'drugstore'),

  -- Carnegie / Scott Township
  ('Giant Eagle Carnegie', '100 W Main St', 'Carnegie', 'PA', '15106', 40.39500, -80.08300, '(412) 555-0378', 'grocery'),
  ('CVS Pharmacy Carnegie', '200 W Main St', 'Carnegie', 'PA', '15106', 40.39480, -80.08350, '(412) 555-0379', 'drugstore'),
  ('GetGo Scott Township', '1400 Cochran Rd', 'Pittsburgh', 'PA', '15220', 40.37800, -80.09000, '(412) 555-0380', 'convenience'),
  ('Sheetz Carnegie', '300 W Main St', 'Carnegie', 'PA', '15106', 40.39460, -80.08400, '(412) 555-0381', 'convenience'),
  ('Walgreens Carnegie', '400 W Main St', 'Carnegie', 'PA', '15106', 40.39440, -80.08450, '(412) 555-0382', 'drugstore'),

  -- Bridgeville
  ('Giant Eagle Bridgeville', '1 McKee Pl', 'Bridgeville', 'PA', '15017', 40.35630, -80.11880, '(412) 555-0383', 'grocery'),
  ('Sheetz Bridgeville', '1100 Washington Pike', 'Bridgeville', 'PA', '15017', 40.35700, -80.11800, '(412) 555-0384', 'convenience'),
  ('GetGo Bridgeville', '900 Washington Pike', 'Bridgeville', 'PA', '15017', 40.35600, -80.11950, '(412) 555-0385', 'convenience'),
  ('CVS Pharmacy Bridgeville', '600 Washington Pike', 'Bridgeville', 'PA', '15017', 40.35550, -80.12000, '(412) 555-0386', 'drugstore'),

  -- McKees Rocks / Stowe Township
  ('Giant Eagle McKees Rocks', '300 Chartiers Ave', 'McKees Rocks', 'PA', '15136', 40.46930, -80.06550, '(412) 555-0387', 'grocery'),
  ('CVS Pharmacy McKees Rocks', '400 Chartiers Ave', 'McKees Rocks', 'PA', '15136', 40.46900, -80.06600, '(412) 555-0388', 'drugstore'),
  ('GetGo Stowe Township', '600 Chartiers Ave', 'McKees Rocks', 'PA', '15136', 40.47060, -80.06400, '(412) 555-0389', 'convenience'),
  ('Sheetz McKees Rocks', '500 Chartiers Ave', 'McKees Rocks', 'PA', '15136', 40.46950, -80.06480, '(412) 555-0390', 'convenience'),

  -- Coraopolis / Moon Township
  ('Giant Eagle Moon Township', '500 Chauvet Dr', 'Moon Township', 'PA', '15108', 40.50300, -80.20410, '(412) 555-0391', 'grocery'),
  ('GetGo Moon Township', '600 Chauvet Dr', 'Moon Township', 'PA', '15108', 40.50350, -80.20500, '(412) 555-0392', 'convenience'),
  ('Sheetz Coraopolis', '1101 5th Ave', 'Coraopolis', 'PA', '15108', 40.51910, -80.16590, '(412) 555-0393', 'convenience'),
  ('CVS Pharmacy Moon Township', '700 Chauvet Dr', 'Moon Township', 'PA', '15108', 40.50400, -80.20600, '(412) 555-0394', 'drugstore'),
  ('Walgreens Coraopolis', '1200 5th Ave', 'Coraopolis', 'PA', '15108', 40.51880, -80.16450, '(412) 555-0395', 'drugstore'),
  ('Target Moon Township', '800 Chauvet Dr', 'Moon Township', 'PA', '15108', 40.50450, -80.20700, '(412) 555-0396', 'grocery'),

  -- Robinson Township
  ('Giant Eagle Robinson', '101 Settlers Ridge Center Dr', 'Pittsburgh', 'PA', '15205', 40.44880, -80.15080, '(412) 555-0397', 'grocery'),
  ('Target Robinson', '6000 Steubenville Pike', 'Pittsburgh', 'PA', '15205', 40.45200, -80.14830, '(412) 555-0398', 'grocery'),
  ('Walmart Robinson', '100 Kenmawr Ave', 'Carnegie', 'PA', '15106', 40.45300, -80.14750, '(412) 555-0399', 'grocery'),
  ('Sam''s Club Robinson', '300 Kenmawr Ave', 'Carnegie', 'PA', '15106', 40.45270, -80.14720, '(412) 555-0400', 'grocery'),
  ('Sheetz Robinson', '4800 Steubenville Pike', 'Pittsburgh', 'PA', '15205', 40.44900, -80.14500, '(412) 555-0401', 'convenience'),
  ('CVS Pharmacy Robinson', '200 Settlers Ridge Center Dr', 'Pittsburgh', 'PA', '15205', 40.44920, -80.15100, '(412) 555-0402', 'drugstore'),

  -- Ross Township / McKnight Rd Corridor
  ('Giant Eagle McKnight Rd', '4901 McKnight Rd', 'Pittsburgh', 'PA', '15237', 40.51800, -80.01750, '(412) 555-0403', 'grocery'),
  ('Target North Hills Village', '4900 McKnight Rd', 'Pittsburgh', 'PA', '15237', 40.51750, -80.01700, '(412) 555-0404', 'grocery'),
  ('Walmart Ross Park', '4600 McKnight Rd', 'Pittsburgh', 'PA', '15237', 40.51200, -80.01800, '(412) 555-0405', 'grocery'),
  ('CVS Pharmacy Ross Township', '5000 McKnight Rd', 'Pittsburgh', 'PA', '15237', 40.51850, -80.01720, '(412) 555-0406', 'drugstore'),
  ('Walgreens McKnight Rd', '5100 McKnight Rd', 'Pittsburgh', 'PA', '15237', 40.51900, -80.01680, '(412) 555-0407', 'drugstore'),
  ('GetGo Ross Township', '5200 McKnight Rd', 'Pittsburgh', 'PA', '15237', 40.51950, -80.01640, '(412) 555-0408', 'convenience'),
  ('Sheetz Ross Township', '4700 McKnight Rd', 'Pittsburgh', 'PA', '15237', 40.51250, -80.01780, '(412) 555-0409', 'convenience'),
  ('Aldi Ross Township', '5050 McKnight Rd', 'Pittsburgh', 'PA', '15237', 40.51860, -80.01710, '(412) 555-0410', 'grocery'),

  -- McCandless Township
  ('Giant Eagle McCandless', '7600 Pines Plaza', 'Pittsburgh', 'PA', '15237', 40.58300, -80.00500, '(412) 555-0411', 'grocery'),
  ('CVS Pharmacy McCandless', '9400 McKnight Rd', 'Pittsburgh', 'PA', '15237', 40.58350, -80.00400, '(412) 555-0412', 'drugstore'),
  ('GetGo McCandless', '9300 McKnight Rd', 'Pittsburgh', 'PA', '15237', 40.58250, -80.00550, '(412) 555-0413', 'convenience'),
  ('Sheetz McCandless', '9200 McKnight Rd', 'Pittsburgh', 'PA', '15237', 40.58200, -80.00600, '(412) 555-0414', 'convenience'),
  ('Walgreens McCandless', '9500 McKnight Rd', 'Pittsburgh', 'PA', '15237', 40.58400, -80.00350, '(412) 555-0415', 'drugstore'),

  -- Shaler Township
  ('Giant Eagle Shaler', '1800 Mt Royal Blvd', 'Glenshaw', 'PA', '15116', 40.53200, -79.96700, '(412) 555-0416', 'grocery'),
  ('CVS Pharmacy Shaler', '1700 Mt Royal Blvd', 'Glenshaw', 'PA', '15116', 40.53150, -79.96750, '(412) 555-0417', 'drugstore'),
  ('GetGo Shaler', '1600 Mt Royal Blvd', 'Glenshaw', 'PA', '15116', 40.53100, -79.96800, '(412) 555-0418', 'convenience'),
  ('Sheetz Shaler', '1900 Mt Royal Blvd', 'Glenshaw', 'PA', '15116', 40.53250, -79.96650, '(412) 555-0419', 'convenience'),

  -- Cranberry Township
  ('Giant Eagle Cranberry', '20025 Route 19', 'Cranberry Township', 'PA', '16066', 40.68450, -80.09340, '(724) 555-0420', 'grocery'),
  ('Target Cranberry', '20000 Route 19', 'Cranberry Township', 'PA', '16066', 40.68400, -80.09300, '(724) 555-0421', 'grocery'),
  ('CVS Pharmacy Cranberry', '20050 Route 19', 'Cranberry Township', 'PA', '16066', 40.68480, -80.09320, '(724) 555-0422', 'drugstore'),
  ('Walgreens Cranberry', '20100 Route 19', 'Cranberry Township', 'PA', '16066', 40.68500, -80.09280, '(724) 555-0423', 'drugstore'),
  ('GetGo Cranberry', '20200 Route 19', 'Cranberry Township', 'PA', '16066', 40.68550, -80.09250, '(724) 555-0424', 'convenience'),
  ('Sheetz Cranberry', '19900 Route 19', 'Cranberry Township', 'PA', '16066', 40.68350, -80.09400, '(724) 555-0425', 'convenience'),
  ('Aldi Cranberry', '20300 Route 19', 'Cranberry Township', 'PA', '16066', 40.68600, -80.09200, '(724) 555-0426', 'grocery'),
  ('Walmart Cranberry', '20500 Route 19', 'Cranberry Township', 'PA', '16066', 40.68650, -80.09150, '(724) 555-0427', 'grocery'),

  -- Wexford
  ('Giant Eagle Wexford', '10800 Perry Hwy', 'Wexford', 'PA', '15090', 40.63450, -80.05000, '(724) 555-0428', 'grocery'),
  ('CVS Pharmacy Wexford', '10700 Perry Hwy', 'Wexford', 'PA', '15090', 40.63400, -80.05050, '(724) 555-0429', 'drugstore'),
  ('Sheetz Wexford', '10900 Perry Hwy', 'Wexford', 'PA', '15090', 40.63500, -80.04950, '(724) 555-0430', 'convenience'),
  ('Walgreens Wexford', '11000 Perry Hwy', 'Wexford', 'PA', '15090', 40.63550, -80.04900, '(724) 555-0431', 'drugstore'),
  ('GetGo Wexford', '10600 Perry Hwy', 'Wexford', 'PA', '15090', 40.63350, -80.05100, '(724) 555-0432', 'convenience'),
  ('Giant Eagle Wexford North', '11200 Perry Hwy', 'Wexford', 'PA', '15090', 40.63600, -80.04850, '(724) 555-0433', 'grocery'),

  -- Millvale / Aspinwall / Fox Chapel
  ('GetGo Millvale', '317 N Canal St', 'Millvale', 'PA', '15209', 40.48620, -79.97450, '(412) 555-0434', 'convenience'),
  ('CVS Pharmacy Aspinwall', '310 Commercial Ave', 'Aspinwall', 'PA', '15215', 40.48690, -79.89660, '(412) 555-0435', 'drugstore'),
  ('Giant Eagle Fox Chapel', '1901 Fox Chapel Rd', 'Pittsburgh', 'PA', '15238', 40.51950, -79.88890, '(412) 555-0436', 'grocery'),
  ('GetGo Fox Chapel', '1800 Fox Chapel Rd', 'Pittsburgh', 'PA', '15238', 40.51900, -79.88950, '(412) 555-0437', 'convenience'),

  -- Additional Wilkinsburg stores
  ('7-Eleven Wilkinsburg', '730 Penn Ave', 'Wilkinsburg', 'PA', '15221', 40.44400, -79.87500, '(412) 555-0438', 'convenience'),
  ('Walgreens Wilkinsburg', '720 Penn Ave', 'Wilkinsburg', 'PA', '15221', 40.44420, -79.87520, '(412) 555-0439', 'drugstore'),

  -- Additional Squirrel Hill stores
  ('Aldi Squirrel Hill', '2628 Murray Ave', 'Pittsburgh', 'PA', '15217', 40.42700, -79.92480, '(412) 555-0440', 'grocery'),
  ('7-Eleven Squirrel Hill', '1907 Murray Ave', 'Pittsburgh', 'PA', '15217', 40.42810, -79.92590, '(412) 555-0441', 'convenience'),
  ('Rite Aid Squirrel Hill', '2134 Murray Ave', 'Pittsburgh', 'PA', '15217', 40.42830, -79.92560, '(412) 555-0442', 'drugstore'),

  -- Additional Shadyside stores
  ('Walgreens Shadyside', '5810 Ellsworth Ave', 'Pittsburgh', 'PA', '15232', 40.45380, -79.93650, '(412) 555-0443', 'drugstore'),
  ('Whole Foods Market Shadyside', '5847 Centre Ave', 'Pittsburgh', 'PA', '15232', 40.45400, -79.93260, '(412) 555-0444', 'grocery'),
  ('Rite Aid Shadyside', '5700 Ellsworth Ave', 'Pittsburgh', 'PA', '15232', 40.45340, -79.93740, '(412) 555-0445', 'drugstore'),

  -- Additional North Hills / Gibsonia area
  ('Walmart North Hills', '4800 Gibsonia Rd', 'Pittsburgh', 'PA', '15237', 40.52150, -79.94380, '(412) 555-0446', 'grocery'),
  ('CVS Pharmacy North Hills', '4650 Gibsonia Rd', 'Pittsburgh', 'PA', '15237', 40.52080, -79.94460, '(412) 555-0447', 'drugstore'),
  ('Walgreens North Hills', '4700 Gibsonia Rd', 'Pittsburgh', 'PA', '15237', 40.52100, -79.94440, '(412) 555-0448', 'drugstore'),

  -- Additional West End / Greentree stores
  ('Sheetz West End', '1300 Greentree Rd', 'Pittsburgh', 'PA', '15220', 40.41950, -80.04100, '(412) 555-0449', 'convenience'),
  ('CVS Pharmacy West End', '1400 Greentree Rd', 'Pittsburgh', 'PA', '15220', 40.41980, -80.04050, '(412) 555-0450', 'drugstore'),
  ('Walgreens West End', '1550 Greentree Rd', 'Pittsburgh', 'PA', '15220', 40.42020, -80.04000, '(412) 555-0451', 'drugstore'),

  -- Additional Monroeville stores
  ('Target Monroeville', '3625 Mosside Blvd', 'Monroeville', 'PA', '15146', 40.40900, -79.76100, '(412) 555-0452', 'grocery'),
  ('CVS Pharmacy Monroeville', '3500 William Penn Hwy', 'Monroeville', 'PA', '15146', 40.42300, -79.77200, '(412) 555-0453', 'drugstore'),
  ('Walgreens Monroeville', '3700 William Penn Hwy', 'Monroeville', 'PA', '15146', 40.42350, -79.76900, '(412) 555-0454', 'drugstore'),
  ('Walmart Monroeville', '3740 Mosside Blvd', 'Monroeville', 'PA', '15146', 40.42200, -79.76500, '(412) 555-0455', 'grocery'),
  ('Aldi Monroeville', '3800 William Penn Hwy', 'Monroeville', 'PA', '15146', 40.42380, -79.76700, '(412) 555-0456', 'grocery'),

  -- Oakdale / Imperial (far west)
  ('Sheetz Oakdale', '50 Millers Run Rd', 'Oakdale', 'PA', '15071', 40.39960, -80.18560, '(412) 555-0457', 'convenience'),
  ('Giant Eagle Oakdale', '100 Millers Run Rd', 'Oakdale', 'PA', '15071', 40.39980, -80.18530, '(412) 555-0458', 'grocery'),

  -- Canonsburg / Peters Township
  ('Giant Eagle Canonsburg', '200 Pike St', 'Canonsburg', 'PA', '15317', 40.26570, -80.18640, '(724) 555-0459', 'grocery'),
  ('Sheetz Canonsburg', '300 Pike St', 'Canonsburg', 'PA', '15317', 40.26540, -80.18660, '(724) 555-0460', 'convenience'),
  ('CVS Pharmacy Canonsburg', '150 Pike St', 'Canonsburg', 'PA', '15317', 40.26560, -80.18650, '(724) 555-0461', 'drugstore'),

  -- Uniontown (South)
  ('Giant Eagle Uniontown', '320 Matthew Dr', 'Uniontown', 'PA', '15401', 39.89940, -79.71940, '(724) 555-0462', 'grocery'),
  ('Sheetz Uniontown', '400 Matthew Dr', 'Uniontown', 'PA', '15401', 39.89960, -79.71920, '(724) 555-0463', 'convenience'),

  -- Additional Downtown stores
  ('Dollar General Downtown', '600 Smithfield St', 'Pittsburgh', 'PA', '15222', 40.43860, -79.99670, '(412) 555-0464', 'convenience'),
  ('CVS Pharmacy Cultural District', '700 Penn Ave', 'Pittsburgh', 'PA', '15222', 40.44300, -79.99540, '(412) 555-0465', 'drugstore'),
  ('7-Eleven Downtown Pittsburgh', '501 Grant St', 'Pittsburgh', 'PA', '15219', 40.43890, -79.99830, '(412) 555-0466', 'convenience'),

  -- Carrick / Knoxville (South)
  ('Giant Eagle Carrick', '2021 Brownsville Rd', 'Pittsburgh', 'PA', '15210', 40.40600, -79.97800, '(412) 555-0467', 'grocery'),
  ('CVS Pharmacy Carrick', '1900 Brownsville Rd', 'Pittsburgh', 'PA', '15210', 40.40580, -79.97820, '(412) 555-0468', 'drugstore'),
  ('Dollar General Knoxville', '700 Warrington Ave', 'Pittsburgh', 'PA', '15210', 40.41200, -79.99500, '(412) 555-0469', 'convenience')

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
