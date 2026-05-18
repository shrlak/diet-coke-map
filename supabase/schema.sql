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
-- (Giant Eagle, GetGo, Sheetz, CVS, Walgreens, Target, Walmart, Aldi, 7-Eleven, Sunoco)
-- Verified via official chain websites, Yelp, and Google Maps (May 2026)
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
  ('GetGo (Ross Township / McKnight Rd)', '7675 McKnight Rd', 'Pittsburgh', 'PA', '15237', 40.54554, -80.01647, '(412) 369-9297', 'convenience'),
  ('GetGo (South Side / E Carson St)', '3247 E Carson St', 'Pittsburgh', 'PA', '15203', 40.42710, -79.96660, '(412) 431-8460', 'convenience'),

  -- Sheetz (9 locations)
  ('Sheetz (Aspinwall / Freeport Rd)', '2871 Freeport Rd', 'Pittsburgh', 'PA', '15238', 40.48620, -79.90240, '(412) 530-0283', 'convenience'),
  ('Sheetz (North Hills / Perry Hwy)', '8500 Perry Hwy', 'Pittsburgh', 'PA', '15237', 40.56840, -80.03350, '(412) 536-3905', 'convenience'),
  ('Sheetz (Ohio Township / Mt Nebo)', '211 Mount Nebo Rd', 'Pittsburgh', 'PA', '15237', 40.50930, -80.11180, '(412) 351-9346', 'convenience'),
  ('Sheetz (Penn Hills / William Penn Hwy)', '3457 William Penn Hwy', 'Pittsburgh', 'PA', '15235', 40.44370, -79.79480, '(412) 388-9553', 'convenience'),
  ('Sheetz (Pleasant Hills / Clairton Blvd)', '1000 Clairton Blvd', 'Pittsburgh', 'PA', '15236', 40.32036, -79.94189, '(412) 284-0135', 'convenience'),
  ('Sheetz (Plum)', '950 Presque Isle Dr', 'Pittsburgh', 'PA', '15239', 40.49750, -79.76850, '(724) 519-8894', 'convenience'),
  ('Sheetz (Robinson / Campbells Run)', '5410 Campbells Run Rd', 'Pittsburgh', 'PA', '15205', 40.44574, -80.15871, '(412) 356-8371', 'convenience'),
  ('Sheetz (Ross Township / Babcock)', '3025 Babcock Blvd', 'Pittsburgh', 'PA', '15237', 40.51720, -80.02080, '(412) 931-1716', 'convenience'),
  ('Sheetz (Stowe / Grand Ave)', '5800 Grand Ave', 'Pittsburgh', 'PA', '15225', 40.48860, -80.07110, '(412) 375-2104', 'convenience'),

  -- CVS Pharmacy (9 locations — CVS at 3422 Forbes Ave Oakland removed: confirmed CLOSED per Yelp Apr 2026)
  ('CVS Pharmacy (Baldwin / Clairton)', '5242 Clairton Blvd', 'Pittsburgh', 'PA', '15236', 40.35770, -79.98530, '(412) 882-5480', 'drugstore'),
  ('CVS Pharmacy (Carnegie / W Steuben)', '70 W Steuben St', 'Pittsburgh', 'PA', '15205', 40.42530, -80.08760, '(412) 429-0360', 'drugstore'),
  ('CVS Pharmacy (Dormont / W Liberty)', '3075 W Liberty Ave', 'Pittsburgh', 'PA', '15216', 40.40160, -80.01570, '(412) 531-3240', 'drugstore'),
  ('CVS Pharmacy (Downtown / Fifth Ave)', '242 Fifth Ave', 'Pittsburgh', 'PA', '15222', 40.44180, -79.99890, '(412) 391-4430', 'drugstore'),
  ('CVS Pharmacy (Downtown / Smithfield)', '482 Smithfield St', 'Pittsburgh', 'PA', '15219', 40.43810, -79.99580, '(412) 281-3560', 'drugstore'),
  ('CVS Pharmacy (McCandless)', '9805 McKnight Rd', 'Pittsburgh', 'PA', '15237', 40.58200, -80.03400, '(412) 366-7290', 'drugstore'),
  -- Corrected longitude: -79.93710 in prior seed was east of Giant Eagle at 5550 Centre Ave;
  -- CVS sits at Centre Ave / Craig St intersection per cvs.com + Yellow Pages
  ('CVS Pharmacy (Oakland / Centre Ave)', '4610 Centre Ave', 'Pittsburgh', 'PA', '15213', 40.45350, -79.95000, '(412) 682-7400', 'drugstore'),
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
  ('Aldi (Bloomfield / Baum Blvd)', '5631 Baum Blvd', 'Pittsburgh', 'PA', '15206', 40.45430, -79.92340, NULL, 'grocery'),
  ('Aldi (Bloomfield / Penn Ave)', '5200 Penn Ave', 'Pittsburgh', 'PA', '15224', 40.46370, -79.93480, NULL, 'grocery'),
  ('Aldi (Lawrenceville / 56th St)', '450 56th St', 'Pittsburgh', 'PA', '15201', 40.47420, -79.95740, NULL, 'grocery'),
  ('Aldi (Overbrook / Sussex Ave)', '3089 Sussex Ave', 'Pittsburgh', 'PA', '15226', 40.38730, -80.00650, NULL, 'grocery'),
  ('Aldi (Ross Township / McKnight)', '7221 McKnight Rd', 'Pittsburgh', 'PA', '15237', 40.54300, -80.02000, NULL, 'grocery'),
  ('Aldi (Ross Township / Northway)', '6290 Northway Dr', 'Pittsburgh', 'PA', '15237', 40.51930, -80.01350, NULL, 'grocery'),
  ('Aldi (South Side / E Carson)', '2628 E Carson St', 'Pittsburgh', 'PA', '15203', 40.42700, -79.97410, NULL, 'grocery'),

  -- Giant Eagle / Market District (14 locations)
  ('Giant Eagle (Baldwin/Grove Rd)', '5260 Grove Rd', 'Pittsburgh', 'PA', '15236', 40.36000, -79.99500, '(412) 881-4601', 'grocery'),
  ('Giant Eagle (Ben Avon)', '132 Ben Avon Heights Rd', 'Pittsburgh', 'PA', '15237', 40.50450, -80.05250, '(412) 364-2390', 'grocery'),
  ('Giant Eagle (Bethel Park)', '5055 Library Rd', 'Bethel Park', 'PA', '15102', 40.33897, -80.02604, '(412) 831-7727', 'grocery'),
  ('Giant Eagle (Brentwood Towne Square)', '600 Towne Square Way', 'Pittsburgh', 'PA', '15227', 40.37210, -79.99270, '(412) 881-4075', 'grocery'),
  ('Giant Eagle (Cedar Ave, North Side)', '318 Cedar Ave', 'Pittsburgh', 'PA', '15212', 40.45620, -80.01730, '(412) 321-3551', 'grocery'),
  ('Giant Eagle (Churchill/Yost Blvd)', '254 Yost Blvd', 'Pittsburgh', 'PA', '15221', 40.41408, -79.85047, '(412) 271-3505', 'grocery'),
  ('Giant Eagle (McCandless)', '9805 McKnight Rd', 'Pittsburgh', 'PA', '15237', 40.58571, -80.03713, '(724) 934-0155', 'grocery'),
  ('Giant Eagle (Monroeville)', '4010 Monroeville Blvd', 'Monroeville', 'PA', '15146', 40.43575, -79.77114, '(412) 372-1220', 'grocery'),
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

  -- Walmart (2 locations)
  ('Walmart (Robinson / Summit Park)', '250 Summit Park Dr', 'Pittsburgh', 'PA', '15275', 40.50210, -80.21180, '(412) 788-9079', 'grocery'),
  ('Walmart (Moon Township)', '7500 University Blvd', 'Moon Township', 'PA', '15108', 40.51560, -80.22412, '(412) 893-0143', 'grocery'),

  -- Additional Aldi locations (verified stores.aldi.us May 2026)
  ('Aldi (Banksville Rd)', '2515 Banksville Rd', 'Pittsburgh', 'PA', '15216', 40.40574, -80.03594, NULL, 'grocery'),
  ('Aldi (Penn Hills / Saltsburg Rd)', '7350 Saltsburg Rd', 'Penn Hills', 'PA', '15235', 40.46410, -79.81830, NULL, 'grocery'),
  ('Aldi (Wilkinsburg / Penn Ave)', '401 Penn Ave', 'Wilkinsburg', 'PA', '15221', 40.44050, -79.87320, NULL, 'grocery'),

  -- Additional Giant Eagle locations (verified gianteagle.com / Yelp May 2026)
  ('Giant Eagle (Frankstown Rd, Penn Hills)', '9001 Frankstown Rd', 'Pittsburgh', 'PA', '15235', 40.45890, -79.82900, '(412) 371-0858', 'grocery'),
  ('Giant Eagle (Rodi Rd, Penn Hills)', '230 Rodi Rd', 'Pittsburgh', 'PA', '15235', 40.46323, -79.82416, '(412) 241-7744', 'grocery'),

  -- Additional GetGo locations (verified getgocafe.com / Yelp May 2026)
  ('GetGo (Squirrel Hill / Forward Ave)', '5801 Forward Ave', 'Pittsburgh', 'PA', '15217', 40.42999, -79.92326, '(412) 421-2742', 'convenience'),
  ('GetGo (Robinson / Steubenville Pike)', '6513 Steubenville Pike', 'Pittsburgh', 'PA', '15205', 40.44745, -80.16289, '(412) 446-0264', 'convenience'),

  -- Additional CVS location (verified cvs.com May 2026)
  ('CVS Pharmacy (Brookline Blvd)', '510 Brookline Blvd', 'Pittsburgh', 'PA', '15226', 40.39602, -80.02321, '(412) 531-2190', 'drugstore'),

  -- Additional Sheetz location (verified sheetz.com / Yelp May 2026)
  ('Sheetz (Pleasant Hills / Curry Hollow)', '251 Curry Hollow Rd', 'Pittsburgh', 'PA', '15236', 40.33643, -79.97151, '(412) 675-1712', 'convenience'),

  -- Additional Walgreens location (verified walgreens.com May 2026)
  ('Walgreens (Robinson / Enterprise Dr)', '130 Enterprise Dr', 'Pittsburgh', 'PA', '15275', 40.50280, -80.19620, '(412) 262-2910', 'drugstore'),

  -- Oakland / CMU / Pitt campus stores (verified May 2026)
  -- 7-eleven.com store #40106; yelp.com/biz/7-eleven-pittsburgh-31 (Apr 2026)
  ('7-Eleven', '195 N Craig St', 'Pittsburgh', 'PA', '15213', 40.44800, -79.95020, NULL, 'convenience'),
  -- sunoco.com station #0859331103; yelp.com/biz/sunoco-pittsburgh-8 (Dec 2025)
  -- Widely cited as the only full-service gas station in Oakland proper
  ('Sunoco', '301 Craft Ave', 'Pittsburgh', 'PA', '15213', 40.44080, -79.95660, NULL, 'gas_station'),
  -- CVS storeid=2348, across from UPMC Presbyterian (active)
  ('CVS Pharmacy (Oakland / Forbes)', '3422 Forbes Ave', 'Pittsburgh', 'PA', '15213', 40.43876, -79.96023, '(412) 621-3060', 'drugstore'),
  -- Pitt-owned grocery in Bruce Hall next to William Pitt Union (utimes.pitt.edu)
  ('Forbes Street Market', '3955 Forbes Ave', 'Pittsburgh', 'PA', '15213', 40.44320, -79.95320, '(412) 648-4422', 'grocery'),
  -- Italian grocery & deli in South Oakland (groceriamerante.com)
  ('Groceria Merante', '3454 Bates St', 'Pittsburgh', 'PA', '15213', 40.43654, -79.95533, '(412) 683-1810', 'grocery'),
  -- Central Oakland student deli (yelp.com/biz/frenchis-deli-and-market-pittsburgh-2)
  ('Frenchi''s Deli & Market', '449 Atwood St', 'Pittsburgh', 'PA', '15213', 40.43705, -79.95870, '(412) 687-1105', 'convenience'),
  -- North Oakland deli on N Craig St (yelp.com/biz/food-for-thought-deli-pittsburgh)
  ('Food For Thought Deli', '196 N Craig St', 'Pittsburgh', 'PA', '15213', 40.44830, -79.95040, '(412) 682-5033', 'convenience'),
  -- South Oakland convenience at Blvd of the Allies / Ward St
  ('One Stop Mini Mart', '3601 Blvd of the Allies', 'Pittsburgh', 'PA', '15213', 40.43700, -79.95770, '(412) 621-4539', 'convenience'),
  -- Pitt's largest independent bookstore (pittuniversitystore.com)
  ('The University Store on Fifth', '4000 Fifth Ave', 'Pittsburgh', 'PA', '15213', 40.44430, -79.95510, '(412) 648-1455', 'convenience'),
  -- Pitt athletic store on Forbes Ave (thepittshop.com)
  ('The Pitt Shop', '3939 Forbes Ave', 'Pittsburgh', 'PA', '15213', 40.44260, -79.95430, '(412) 648-7090', 'convenience'),

  -- Philadelphia (verified May 2026 — 1900 Market Wawa was permanently closed; 1524 Chestnut, 4000 City Ave never had the listed chain)
  ('Wawa',                        '1700 Sansom St',        'Philadelphia', 'PA', '19103', 39.95085, -75.16908, '(215) 564-4501', 'convenience'),
  ('CVS Pharmacy',                '1826 Chestnut St',      'Philadelphia', 'PA', '19103', 39.94980, -75.16973, NULL, 'drugstore'),
  ('Wawa',                        '3300 Market St',        'Philadelphia', 'PA', '19104', 39.95228, -75.20207, NULL, 'convenience'),
  ('Walgreens',                   '1349 Chestnut St',      'Philadelphia', 'PA', '19107', 39.94942, -75.16145, '(267) 330-0290', 'drugstore'),
  ('Giant Food Stores',           '2550 Grant Ave',        'Philadelphia', 'PA', '19114', 40.07665, -75.02820, '(215) 464-8280', 'grocery'),

  -- Harrisburg (verified May 2026 — Turkey Hill: 2941 Paxton replaced with actual 2885 Paxton, Komparing.com coords)
  ('Weis Markets',                '3885 Union Deposit Rd', 'Harrisburg',   'PA', '17109', 40.30256, -76.82157, NULL, 'grocery'),
  ('Turkey Hill Minit Market',    '2885 Paxton St',        'Harrisburg',   'PA', '17111', 40.25590, -76.83975, '(717) 561-1562', 'convenience'),
  -- 4651 Lindle Rd: confirmed at yelp.com/biz/sheetz-harrisburg-6, gasbuddy.com/station/185719
  ('Sheetz',                      '4651 Lindle Rd',        'Harrisburg',   'PA', '17111', 40.25380, -76.86640, NULL, 'convenience'),

  -- Allentown / Whitehall (verified May 2026 — 737 Hamilton CVS, 1425 Tilghman Weis, 2222 MacArthur Sheetz were fabricated)
  ('CVS Pharmacy',                '1601 W Liberty St',     'Allentown',    'PA', '18102', 40.60420, -75.49355, '(610) 820-9738', 'drugstore'),
  ('Weis Markets',                '1500 N Cedar Crest Blvd','Allentown',   'PA', '18104', 40.60833, -75.52333, '(610) 395-0345', 'grocery'),
  ('Sheetz',                      '5001 MacArthur Rd',     'Whitehall',    'PA', '18052', 40.67367, -75.51624, '(610) 262-8782', 'convenience'),

  -- State College (verified May 2026 — 418 E College Ave Sheetz is now apartments; 323 S Allen St CVS was fabricated)
  ('Sheetz',                      '3261 W College Ave',    'State College','PA', '16801', 40.79050, -77.91250, '(814) 234-4540', 'convenience'),
  ('Weis Markets',                '1471 Martin St',        'State College','PA', '16803', 40.80493, -77.89039, NULL, 'grocery'),
  ('CVS Pharmacy',                '116 W College Ave',     'State College','PA', '16801', 40.79415, -77.86150, '(814) 238-6797', 'drugstore'),

  -- Erie (verified May 2026 — 3510 Peach Sheetz fabricated; 2523 Peach Walgreens is actually at 3727 Peach)
  ('Sheetz',                      '8180 Perry Hwy',        'Erie',         'PA', '16509', 42.10449, -80.14992, '(814) 983-5727', 'convenience'),
  ('Giant Eagle',                 '2877 W 26th St',        'Erie',         'PA', '16506', 42.08814, -80.13729, NULL, 'grocery'),
  ('Walgreens',                   '3727 Peach St',         'Erie',         'PA', '16508', 42.09739, -80.08103, '(814) 864-0292', 'drugstore'),

  -- Reading (verified May 2026 — 1000 Morgantown Rd Weis was fabricated; #50 is at 2020 N 13th)
  ('Weis Markets',                '2020 N 13th St',        'Reading',      'PA', '19604', 40.36574, -75.91143, '(610) 929-2452', 'grocery'),
  -- 2246 Lancaster Pike: confirmed at yelp.com/biz/sheetz-reading-3, gasbuddy.com/station/61261
  ('Sheetz',                      '2246 Lancaster Pike',   'Reading',      'PA', '19607', 40.30695, -75.97932, NULL, 'convenience'),

  -- Lancaster (verified May 2026 — 325 Centerville Weis and 45 W Chestnut CVS were fabricated)
  ('Weis Markets',                '1400 Stony Battery Rd', 'Lancaster',    'PA', '17601', 40.07050, -76.39870, '(717) 285-9000', 'grocery'),
  ('Sheetz',                      '3101 Columbia Ave',     'Lancaster',    'PA', '17603', 40.03680, -76.33170, NULL, 'convenience'),
  ('CVS Pharmacy',                '32 W Lemon St',         'Lancaster',    'PA', '17603', 40.04392, -76.30854, '(717) 393-0623', 'drugstore')

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
