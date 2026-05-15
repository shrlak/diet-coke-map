# Supabase Setup Guide

This guide walks you through setting up Supabase for the Diet Coke Store Locator application.

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in the form:
   - **Project name:** diet-coke-map
   - **Database password:** Choose a strong password
   - **Region:** Select US region (e.g., us-east-1)
4. Click "Create new project"
5. Wait for project to be created (~2 minutes)

## 2. Get Credentials

After project is created:

1. Go to **Settings** → **API**
2. Copy the following:
   - **Project URL:** `https://[project-id].supabase.co`
   - **Anon (public) Key:** Copy the long string under "anon public"
3. Save these in your `.env.local` file

## 3. Create Database Tables

In the Supabase SQL Editor (Query Editor), paste and run this SQL:

```sql
-- Enable pgvector extension (for PostGIS)
CREATE EXTENSION IF NOT EXISTS pgtrgm;
CREATE EXTENSION IF NOT EXISTS earthdistance;
CREATE EXTENSION IF NOT EXISTS cube;

-- Create stores table
CREATE TABLE stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  phone TEXT,
  store_type TEXT, -- convenience, grocery, gas, drugstore, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create index for geospatial queries
CREATE INDEX stores_lat_lon_idx ON stores (latitude, longitude);

-- Create store_hours table
CREATE TABLE store_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
  opens_at TIME NOT NULL,
  closes_at TIME NOT NULL,
  is_closed BOOLEAN DEFAULT false,
  special_note TEXT,
  UNIQUE(store_id, day_of_week)
);

-- Create products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- bottle, fountain, can, pack
  volume_ml INTEGER,
  sku TEXT UNIQUE
);

-- Create store_products junction table
CREATE TABLE store_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  in_stock BOOLEAN DEFAULT true,
  last_verified_at TIMESTAMP DEFAULT now(),
  UNIQUE(store_id, product_id)
);

-- Create favorite_stores table
CREATE TABLE favorite_stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, store_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_stores ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Public read access
CREATE POLICY "stores are viewable by everyone" ON stores
  FOR SELECT USING (true);

CREATE POLICY "store_hours are viewable by everyone" ON store_hours
  FOR SELECT USING (true);

CREATE POLICY "products are viewable by everyone" ON products
  FOR SELECT USING (true);

CREATE POLICY "store_products are viewable by everyone" ON store_products
  FOR SELECT USING (true);

-- RLS Policies - Favorites require authentication
CREATE POLICY "users can view their own favorites" ON favorite_stores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users can create their own favorites" ON favorite_stores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can delete their own favorites" ON favorite_stores
  FOR DELETE USING (auth.uid() = user_id);

-- Create nearby_stores RPC function (PostGIS-based proximity search)
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
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  distance_km DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.address,
    s.city,
    s.state,
    s.zip,
    s.latitude,
    s.longitude,
    s.phone,
    s.store_type,
    s.is_active,
    s.created_at,
    s.updated_at,
    ROUND(
      (
        6371 * acos(
          cos(radians(user_lat::float)) * cos(radians(s.latitude::float)) *
          cos(radians(s.longitude::float) - radians(user_lon::float)) +
          sin(radians(user_lat::float)) * sin(radians(s.latitude::float))
        )
      )::NUMERIC,
      2
    ) AS distance_km
  FROM stores s
  WHERE s.is_active = true
  HAVING
    6371 * acos(
      cos(radians(user_lat::float)) * cos(radians(s.latitude::float)) *
      cos(radians(s.longitude::float) - radians(user_lon::float)) +
      sin(radians(user_lat::float)) * sin(radians(s.latitude::float))
    ) <= radius_km::float
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;
```

## 4. Seed Initial Product Data

In the SQL Editor, add the standard Diet Coke products:

```sql
-- Insert standard Diet Coke products
INSERT INTO products (name, category, volume_ml, sku) VALUES
('Diet Coke - 20oz Bottle', 'bottle', 591, 'DC_20OZ_BOTTLE'),
('Diet Coke - 2L Bottle', 'bottle', 2000, 'DC_2L_BOTTLE'),
('Diet Coke - 6-Pack (12oz cans)', 'pack', 355, 'DC_6PACK_12OZ'),
('Diet Coke - 12-Pack (12oz cans)', 'pack', 355, 'DC_12PACK_12OZ'),
('Diet Coke - Fountain (cup size varies)', 'fountain', NULL, 'DC_FOUNTAIN'),
('Diet Coke Zero Sugar - 20oz Bottle', 'bottle', 591, 'DCZS_20OZ_BOTTLE'),
('Diet Coke Zero Sugar - 2L Bottle', 'bottle', 2000, 'DCZS_2L_BOTTLE'),
('Diet Coke Lime - 20oz Bottle', 'bottle', 591, 'DCLIME_20OZ_BOTTLE')
ON CONFLICT DO NOTHING;
```

## 5. Configure Authentication

### Enable Email Auth
By default, Email authentication is enabled. Verify in **Authentication** → **Providers**

### Add Google OAuth

1. Go to **Authentication** → **Providers**
2. Click **Google**
3. Enable the provider
4. Set up Google OAuth:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project
   - Enable "Google+ API"
   - Create OAuth 2.0 credentials (Web Application)
   - Add authorized JavaScript origins:
     - `http://localhost:5173`
     - `https://yourdomain.com`
   - Add authorized redirect URIs:
     - `https://[project-id].supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret
   - Paste into Supabase Google provider settings

### Add Apple Sign-In

1. Go to **Authentication** → **Providers**
2. Click **Apple**
3. Enable the provider
4. Set up Apple ID:
   - Go to [Apple Developer](https://developer.apple.com)
   - Sign in with Apple Developer account
   - Create a new "Sign in with Apple" service ID
   - Configure return URLs:
     - `https://[project-id].supabase.co/auth/v1/callback`
   - Copy Team ID, Bundle ID, and Key ID
   - Generate private key file
   - Paste credentials into Supabase Apple provider settings

## 6. Create Anon Key Restrictions (Optional but Recommended)

For security, restrict the anon key to read-only:

1. Go to **Authentication** → **API Tokens**
2. Create a new token with limited permissions
3. Use this token in your frontend instead of the full anon key

## 7. Test Connection from Frontend

Create a test file to verify connection:

```typescript
// Test if .env.local is loaded correctly
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)

import { supabase } from './src/services/supabase'

// Test connection
const testConnection = async () => {
  const { data, error } = await supabase.from('products').select('*')
  console.log('Test query result:', { data, error })
}

testConnection()
```

## 8. Populate Sample Data

Create a CSV file with sample Pennsylvania stores:

**sample_stores.csv:**
```csv
name,address,city,state,zip,latitude,longitude,phone,store_type
CVS Pharmacy - Downtown Pittsburgh,626 Smithfield Street,Pittsburgh,PA,15222,40.4406,-80.0029,(412) 555-0100,drugstore
Weis Markets - East Pittsburgh,400 Bessemer Ave,East Pittsburgh,PA,15112,40.3867,-79.8744,(412) 555-0101,grocery
GetGo Gas Station - Pittsburgh,200 Ninth Street,Pittsburgh,PA,15222,40.4418,-80.0047,(412) 555-0102,gas
Sheetz - Philadelphia,1234 Market Street,Philadelphia,PA,19107,39.9526,-75.1652,(215) 555-0103,convenience
Acme Markets - Philadelphia,1300 Center City,Philadelphia,PA,19107,39.9534,-75.1699,(215) 555-0104,grocery
```

Then insert via Supabase dashboard:
1. Go to **SQL Editor**
2. Create a new query:

```sql
-- Insert sample stores
INSERT INTO stores (name, address, city, state, zip, latitude, longitude, phone, store_type)
VALUES
('CVS Pharmacy - Downtown Pittsburgh', '626 Smithfield Street', 'Pittsburgh', 'PA', '15222', 40.4406, -80.0029, '(412) 555-0100', 'drugstore'),
('Weis Markets - East Pittsburgh', '400 Bessemer Ave', 'East Pittsburgh', 'PA', '15112', 40.3867, -79.8744, '(412) 555-0101', 'grocery'),
('GetGo Gas Station - Pittsburgh', '200 Ninth Street', 'Pittsburgh', 'PA', '15222', 40.4418, -80.0047, '(412) 555-0102', 'gas');

-- Insert store hours (example for first store)
INSERT INTO store_hours (store_id, day_of_week, opens_at, closes_at)
SELECT id, day, '06:00'::time, '22:00'::time
FROM stores, generate_series(0, 6) as day
WHERE name = 'CVS Pharmacy - Downtown Pittsburgh';

-- Link products to stores (example for first store)
INSERT INTO store_products (store_id, product_id, in_stock)
SELECT stores.id, products.id, true
FROM stores, products
WHERE stores.name = 'CVS Pharmacy - Downtown Pittsburgh';
```

## Troubleshooting

### Connection Error: Missing Credentials
- Check `.env.local` has correct keys
- Make sure no typos in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### RLS Policy Errors
- Verify RLS policies are created correctly
- Check that user is authenticated for protected endpoints
- Test in Supabase UI first before frontend testing

### PostGIS Not Available
- Some features require PostGIS, but basic queries work without it
- If PostGIS functions fail, frontend falls back to client-side distance calculation

### API Rate Limiting
- Free tier: 2M requests/month (~65k/day)
- Monitor usage in Supabase dashboard
- Upgrade if needed

## Next Steps

Once Supabase is set up:
1. Update `.env.local` with your credentials
2. Run `npm run dev` to start frontend
3. Test authentication flows
4. Populate more store data for Pennsylvania
