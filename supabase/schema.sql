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

-- Sample Pennsylvania stores (Philadelphia & Pittsburgh area)
INSERT INTO stores (name, address, city, state, zip, latitude, longitude, phone, store_type) VALUES
  ('CVS Pharmacy #2345', '1600 Chestnut St', 'Philadelphia', 'PA', '19103', 39.9515, -75.1682, '(215) 555-0101', 'drugstore'),
  ('Wawa #550', '2100 Market St', 'Philadelphia', 'PA', '19103', 39.9535, -75.1796, '(215) 555-0102', 'convenience'),
  ('Giant Food Store', '4000 City Ave', 'Philadelphia', 'PA', '19131', 39.9813, -75.2205, '(215) 555-0103', 'grocery'),
  ('Sheetz #205', '123 Penn Ave', 'Pittsburgh', 'PA', '15222', 40.4406, -79.9990, '(412) 555-0104', 'convenience'),
  ('GetGo Cafe & Market', '500 Forbes Ave', 'Pittsburgh', 'PA', '15219', 40.4388, -79.9974, '(412) 555-0105', 'convenience'),
  ('Giant Eagle #4035', '1901 Murray Ave', 'Pittsburgh', 'PA', '15217', 40.4283, -79.9262, '(412) 555-0106', 'grocery'),
  ('Rite Aid Pharmacy', '600 Penn Ave', 'Pittsburgh', 'PA', '15222', 40.4416, -80.0002, '(412) 555-0107', 'drugstore'),
  ('Weis Markets #23', '100 Governor Dr', 'Harrisburg', 'PA', '17110', 40.2732, -76.8867, '(717) 555-0108', 'grocery'),
  ('Turkey Hill Minit Market', '200 Market St', 'Harrisburg', 'PA', '17101', 40.2632, -76.8839, '(717) 555-0109', 'convenience'),
  ('CVS Pharmacy #1887', '800 Hamilton St', 'Allentown', 'PA', '18101', 40.6021, -75.4713, '(610) 555-0110', 'drugstore')
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
