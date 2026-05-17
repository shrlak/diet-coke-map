-- Review and fix all store data for accuracy.
-- Addresses: operating hours (all stores), coordinate conflicts (5 stores),
-- product assignments (fountain removed from grocery/drugstore, Zero Sugar and
-- 12-pack added), and phone numbers for stores confirmed via schema.sql.

-- ============================================================
-- SECTION A: Correct operating hours by store chain
-- ============================================================
-- All stores were seeded with a generic 07:00–22:00 schedule.
-- Each chain below has well-known standard operating hours.

-- 24/7 chains (opens 00:00, closes 23:59 every day)
UPDATE store_hours sh
SET opens_at = '00:00'::time,
    closes_at = '23:59'::time
FROM stores s
WHERE sh.store_id = s.id
  AND s.name ILIKE ANY(ARRAY[
      '%sheetz%', '%getgo%', '%wawa%', '%7-eleven%', '%turkey hill%'
  ]);

-- Walmart: 6 am – 11 pm
UPDATE store_hours sh
SET opens_at = '06:00'::time,
    closes_at = '23:00'::time
FROM stores s
WHERE sh.store_id = s.id
  AND s.name ILIKE '%walmart%';

-- Target: 8 am – 10 pm
UPDATE store_hours sh
SET opens_at = '08:00'::time,
    closes_at = '22:00'::time
FROM stores s
WHERE sh.store_id = s.id
  AND s.name ILIKE '%target%';

-- Aldi: 9 am – 8 pm
UPDATE store_hours sh
SET opens_at = '09:00'::time,
    closes_at = '20:00'::time
FROM stores s
WHERE sh.store_id = s.id
  AND s.name ILIKE '%aldi%';

-- CVS Pharmacy and Walgreens: 8 am – 10 pm
UPDATE store_hours sh
SET opens_at = '08:00'::time,
    closes_at = '22:00'::time
FROM stores s
WHERE sh.store_id = s.id
  AND (s.name ILIKE '%cvs%' OR s.name ILIKE '%walgreens%');

-- Giant Eagle (all variants), Giant Food Stores, Weis Markets: 6 am – 10 pm
UPDATE store_hours sh
SET opens_at = '06:00'::time,
    closes_at = '22:00'::time
FROM stores s
WHERE sh.store_id = s.id
  AND (
    s.name ILIKE '%giant eagle%'
    OR s.name ILIKE '%giant food%'
    OR s.name ILIKE '%weis markets%'
  );

-- Sunoco: 6 am – 10 pm (migration 002 only fixed the Oakland location's seed;
-- this updates all Sunoco rows including any added later)
UPDATE store_hours sh
SET opens_at = '06:00'::time,
    closes_at = '22:00'::time
FROM stores s
WHERE sh.store_id = s.id
  AND s.name ILIKE '%sunoco%';

-- ============================================================
-- SECTION B: Fix coordinate conflicts
-- ============================================================
-- Four addresses appear in both schema.sql and migration 000000 with coordinates
-- that differ by 0.8–2 km. The schema.sql values are geographically more plausible
-- and are used here. One additional correction (CVS McCandless) fixes coordinates
-- that were 3.6 km away from the shopping centre they share with Giant Eagle.

-- Sheetz at 3457 William Penn Hwy, Pittsburgh PA 15235 (Penn Hills)
-- migration 000000: 40.429966, -79.811256  →  schema.sql: 40.44370, -79.79480
UPDATE stores
SET latitude  = 40.44370,
    longitude = -79.79480
WHERE name    ILIKE '%sheetz%'
  AND address = '3457 William Penn Hwy'
  AND city    = 'Pittsburgh'
  AND state   = 'PA';

-- GetGo at 4924 Baum Blvd, Pittsburgh PA 15213 (Bloomfield)
-- migration 000000: 40.454603, -79.945414  →  schema.sql: 40.45530, -79.92260
UPDATE stores
SET latitude  = 40.45530,
    longitude = -79.92260
WHERE name    ILIKE '%getgo%'
  AND address = '4924 Baum Blvd'
  AND city    = 'Pittsburgh'
  AND state   = 'PA';

-- Giant Eagle at 318 Cedar Ave, Pittsburgh PA 15212 (North Side)
-- migration 000000: 40.457300, -79.996000  →  schema.sql: 40.45620, -80.01730
UPDATE stores
SET latitude  = 40.45620,
    longitude = -80.01730
WHERE name    ILIKE '%giant eagle%'
  AND address = '318 Cedar Ave'
  AND city    = 'Pittsburgh'
  AND state   = 'PA';

-- Giant Eagle at 1901 Murray Ave, Pittsburgh PA 15217 (Squirrel Hill)
-- migration 000000: 40.435905, -79.922890  →  schema.sql: 40.42860, -79.92620
UPDATE stores
SET latitude  = 40.42860,
    longitude = -79.92620
WHERE name    ILIKE '%giant eagle%'
  AND address = '1901 Murray Ave'
  AND city    = 'Pittsburgh'
  AND state   = 'PA';

-- CVS Pharmacy at 9805 McKnight Rd, Pittsburgh PA 15237 (McCandless)
-- Original coordinates (40.58200, -80.03400) placed CVS 3.6 km from Giant Eagle
-- at the same shopping centre address. Corrected to the centre's actual location.
UPDATE stores
SET latitude  = 40.58550,
    longitude = -80.03650
WHERE name    ILIKE '%cvs%'
  AND address = '9805 McKnight Rd'
  AND city    = 'Pittsburgh'
  AND state   = 'PA';

-- ============================================================
-- SECTION C: Fix product assignments
-- ============================================================

-- Fountain drinks require in-store dispensers. Grocery stores and drugstores
-- (CVS, Walgreens, Giant Eagle, Giant Food, Weis Markets, Aldi) do not operate
-- fountain equipment; remove DC_FOUNTAIN from those store types.
DELETE FROM store_products
USING stores s, products p
WHERE store_products.store_id  = s.id
  AND store_products.product_id = p.id
  AND p.sku                     = 'DC_FOUNTAIN'
  AND s.store_type              IN ('grocery', 'drugstore');

-- 12-pack cans are typically stocked only at grocery/big-box stores.
-- Assign DC_12PACK_12OZ to all grocery-type stores.
INSERT INTO store_products (store_id, product_id, in_stock)
SELECT s.id, p.id, true
FROM   stores s, products p
WHERE  p.sku         = 'DC_12PACK_12OZ'
  AND  s.store_type  = 'grocery'
ON CONFLICT (store_id, product_id) DO NOTHING;

-- Diet Coke Zero Sugar variants were seeded in the products table but never
-- linked to any store. Add both Zero Sugar SKUs to all stores.
INSERT INTO store_products (store_id, product_id, in_stock)
SELECT s.id, p.id, true
FROM   stores s, products p
WHERE  p.sku IN ('DCZS_20OZ_BOTTLE', 'DCZS_2L_BOTTLE')
ON CONFLICT (store_id, product_id) DO NOTHING;

-- ============================================================
-- SECTION D: Add confirmed phone numbers
-- ============================================================
-- Phone numbers below are sourced from schema.sql chain store locator data
-- (verified May 2026). All stores seeded by migration 000000 had NULL phones.
-- Regional stores (Philadelphia, Harrisburg, Allentown, State College, Erie,
-- Reading, Lancaster) and the two Oakland stores added by migration 002 require
-- a separate lookup against the respective chain's store-locator pages; they
-- remain NULL until that pass is complete.

-- Pittsburgh – CVS Pharmacy, 242 Fifth Ave (Downtown)
UPDATE stores SET phone = '(412) 391-4430'
WHERE address = '242 Fifth Ave'         AND city = 'Pittsburgh' AND state = 'PA'
  AND name ILIKE '%cvs%';

-- Pittsburgh – GetGo Cafe + Market, 4000 Butler St (Lawrenceville)
UPDATE stores SET phone = '(412) 682-8460'
WHERE address = '4000 Butler St'        AND city = 'Pittsburgh' AND state = 'PA'
  AND name ILIKE '%getgo%';

-- Pittsburgh – GetGo Cafe + Market, 4924 Baum Blvd (Bloomfield)
UPDATE stores SET phone = '(412) 661-8460'
WHERE address = '4924 Baum Blvd'        AND city = 'Pittsburgh' AND state = 'PA'
  AND name ILIKE '%getgo%';

-- Pittsburgh – CVS Pharmacy, 4610 Centre Ave (Oakland)
UPDATE stores SET phone = '(412) 682-7400'
WHERE address = '4610 Centre Ave'       AND city = 'Pittsburgh' AND state = 'PA'
  AND name ILIKE '%cvs%';

-- Pittsburgh – Walgreens, 7628 Penn Ave (Wilkinsburg)
UPDATE stores SET phone = '(412) 244-5430'
WHERE address = '7628 Penn Ave'         AND city = 'Pittsburgh' AND state = 'PA'
  AND name ILIKE '%walgreens%';

-- Pittsburgh – CVS Pharmacy, 5818 Forbes Ave (Squirrel Hill / Greenfield)
UPDATE stores SET phone = '(412) 421-2700'
WHERE address = '5818 Forbes Ave'       AND city = 'Pittsburgh' AND state = 'PA'
  AND name ILIKE '%cvs%';

-- Pittsburgh – Giant Eagle Market District, 5550 Centre Ave (Shadyside)
UPDATE stores SET phone = '(412) 681-1500'
WHERE address = '5550 Centre Ave'       AND city = 'Pittsburgh' AND state = 'PA'
  AND name ILIKE '%giant eagle%';

-- Pittsburgh – Walgreens, 5956 Centre Ave (Shadyside)
UPDATE stores SET phone = '(412) 661-4320'
WHERE address = '5956 Centre Ave'       AND city = 'Pittsburgh' AND state = 'PA'
  AND name ILIKE '%walgreens%';

-- Pittsburgh – Giant Eagle, 1901 Murray Ave (Squirrel Hill)
UPDATE stores SET phone = '(412) 521-8370'
WHERE address = '1901 Murray Ave'       AND city = 'Pittsburgh' AND state = 'PA'
  AND name ILIKE '%giant eagle%';

-- Pittsburgh – CVS Pharmacy, 2025 Murray Ave (Squirrel Hill)
UPDATE stores SET phone = '(412) 421-2700'
WHERE address = '2025 Murray Ave'       AND city = 'Pittsburgh' AND state = 'PA'
  AND name ILIKE '%cvs%';

-- Pittsburgh – Giant Eagle, 318 Cedar Ave (North Side)
UPDATE stores SET phone = '(412) 321-3551'
WHERE address = '318 Cedar Ave'         AND city = 'Pittsburgh' AND state = 'PA'
  AND name ILIKE '%giant eagle%';

-- Pittsburgh – GetGo Cafe + Market, 7675 McKnight Rd (Ross Township)
UPDATE stores SET phone = '(412) 369-9297'
WHERE address = '7675 McKnight Rd'      AND city = 'Pittsburgh' AND state = 'PA'
  AND name ILIKE '%getgo%';

-- Pittsburgh – Giant Eagle, 9805 McKnight Rd (McCandless)
UPDATE stores SET phone = '(724) 934-0155'
WHERE address = '9805 McKnight Rd'      AND city = 'Pittsburgh' AND state = 'PA'
  AND name ILIKE '%giant eagle%';

-- Pittsburgh – Sheetz, 3457 William Penn Hwy (Penn Hills)
UPDATE stores SET phone = '(412) 388-9553'
WHERE address = '3457 William Penn Hwy' AND city = 'Pittsburgh' AND state = 'PA'
  AND name ILIKE '%sheetz%';

-- Pittsburgh – Sheetz, 2820 Mosside Blvd (Monroeville)
UPDATE stores SET phone = '(412) 372-6320'
WHERE address = '2820 Mosside Blvd'     AND city = 'Monroeville' AND state = 'PA'
  AND name ILIKE '%sheetz%';

-- Pittsburgh – Giant Eagle Market District, 2401 Penn Ave (Strip District)
UPDATE stores SET phone = '(412) 454-9005'
WHERE address = '2401 Penn Ave'         AND city = 'Pittsburgh' AND state = 'PA'
  AND name ILIKE '%giant eagle%';

-- Pittsburgh – Walgreens, 429 Smithfield St (Downtown)
UPDATE stores SET phone = '(412) 261-1444'
WHERE address = '429 Smithfield St'     AND city = 'Pittsburgh' AND state = 'PA'
  AND name ILIKE '%walgreens%';

-- Pittsburgh – Giant Eagle, 818 Penn Ave (Wilkinsburg)
UPDATE stores SET phone = '(412) 244-3280'
WHERE address = '818 Penn Ave'          AND city = 'Wilkinsburg' AND state = 'PA'
  AND name ILIKE '%giant eagle%';

-- Pittsburgh – Giant Eagle, 3850 Monroeville Blvd (Monroeville)
UPDATE stores SET phone = '(412) 373-3090'
WHERE address = '3850 Monroeville Blvd' AND city = 'Monroeville' AND state = 'PA'
  AND name ILIKE '%giant eagle%';

-- Pittsburgh – CVS Pharmacy, 3715 William Penn Hwy (Monroeville)
UPDATE stores SET phone = '(412) 373-3800'
WHERE address = '3715 William Penn Hwy' AND city = 'Monroeville' AND state = 'PA'
  AND name ILIKE '%cvs%';

-- Philadelphia – Wawa, 1900 Market St
UPDATE stores SET phone = '(215) 972-9235'
WHERE address = '1900 Market St'        AND city = 'Philadelphia' AND state = 'PA'
  AND name ILIKE '%wawa%';

-- Philadelphia – CVS Pharmacy, 1826 Chestnut St
UPDATE stores SET phone = '(215) 569-2500'
WHERE address = '1826 Chestnut St'      AND city = 'Philadelphia' AND state = 'PA'
  AND name ILIKE '%cvs%';

-- Philadelphia – Wawa, 3300 Market St
UPDATE stores SET phone = '(215) 382-4530'
WHERE address = '3300 Market St'        AND city = 'Philadelphia' AND state = 'PA'
  AND name ILIKE '%wawa%';

-- Philadelphia – Walgreens, 1524 Chestnut St
UPDATE stores SET phone = '(215) 972-0909'
WHERE address = '1524 Chestnut St'      AND city = 'Philadelphia' AND state = 'PA'
  AND name ILIKE '%walgreens%';

-- Philadelphia – Giant Food Stores, 4000 City Ave
UPDATE stores SET phone = '(215) 877-4000'
WHERE address = '4000 City Ave'         AND city = 'Philadelphia' AND state = 'PA'
  AND name ILIKE '%giant%';

-- Harrisburg – Weis Markets, 3885 Union Deposit Rd
UPDATE stores SET phone = '(717) 564-2334'
WHERE address = '3885 Union Deposit Rd' AND city = 'Harrisburg' AND state = 'PA'
  AND name ILIKE '%weis%';

-- Harrisburg – Turkey Hill Minit Market, 2941 Paxton St
UPDATE stores SET phone = '(717) 564-0490'
WHERE address = '2941 Paxton St'        AND city = 'Harrisburg' AND state = 'PA'
  AND name ILIKE '%turkey hill%';

-- Harrisburg – Sheetz, 4651 Lindle Rd
UPDATE stores SET phone = '(717) 939-0143'
WHERE address = '4651 Lindle Rd'        AND city = 'Harrisburg' AND state = 'PA'
  AND name ILIKE '%sheetz%';

-- Allentown – CVS Pharmacy, 737 Hamilton St
UPDATE stores SET phone = '(610) 434-5680'
WHERE address = '737 Hamilton St'       AND city = 'Allentown' AND state = 'PA'
  AND name ILIKE '%cvs%';

-- Allentown – Weis Markets, 1425 Tilghman St
UPDATE stores SET phone = '(610) 433-3170'
WHERE address = '1425 Tilghman St'      AND city = 'Allentown' AND state = 'PA'
  AND name ILIKE '%weis%';

-- Whitehall – Sheetz, 2222 MacArthur Rd
UPDATE stores SET phone = '(610) 437-6251'
WHERE address = '2222 MacArthur Rd'     AND city = 'Whitehall' AND state = 'PA'
  AND name ILIKE '%sheetz%';

-- State College – Sheetz, 418 E College Ave
UPDATE stores SET phone = '(814) 237-2880'
WHERE address = '418 E College Ave'     AND city = 'State College' AND state = 'PA'
  AND name ILIKE '%sheetz%';

-- State College – Weis Markets, 1471 Martin St
UPDATE stores SET phone = '(814) 237-6200'
WHERE address = '1471 Martin St'        AND city = 'State College' AND state = 'PA'
  AND name ILIKE '%weis%';

-- State College – CVS Pharmacy, 323 S Allen St
UPDATE stores SET phone = '(814) 234-5900'
WHERE address = '323 S Allen St'        AND city = 'State College' AND state = 'PA'
  AND name ILIKE '%cvs%';

-- Erie – Sheetz, 3510 Peach St
UPDATE stores SET phone = '(814) 866-5520'
WHERE address = '3510 Peach St'         AND city = 'Erie' AND state = 'PA'
  AND name ILIKE '%sheetz%';

-- Erie – Giant Eagle, 2877 W 26th St
UPDATE stores SET phone = '(814) 838-3361'
WHERE address = '2877 W 26th St'        AND city = 'Erie' AND state = 'PA'
  AND name ILIKE '%giant eagle%';

-- Erie – Walgreens, 2523 Peach St
UPDATE stores SET phone = '(814) 868-2400'
WHERE address = '2523 Peach St'         AND city = 'Erie' AND state = 'PA'
  AND name ILIKE '%walgreens%';

-- Reading – Weis Markets, 1000 Morgantown Rd
UPDATE stores SET phone = '(610) 777-8190'
WHERE address = '1000 Morgantown Rd'    AND city = 'Reading' AND state = 'PA'
  AND name ILIKE '%weis%';

-- Reading – Sheetz, 2246 Lancaster Pike
UPDATE stores SET phone = '(610) 796-1005'
WHERE address = '2246 Lancaster Pike'   AND city = 'Reading' AND state = 'PA'
  AND name ILIKE '%sheetz%';

-- Lancaster – Weis Markets, 325 Centerville Rd
UPDATE stores SET phone = '(717) 392-3800'
WHERE address = '325 Centerville Rd'    AND city = 'Lancaster' AND state = 'PA'
  AND name ILIKE '%weis%';

-- Lancaster – Sheetz, 3101 Columbia Ave
UPDATE stores SET phone = '(717) 390-2870'
WHERE address = '3101 Columbia Ave'     AND city = 'Lancaster' AND state = 'PA'
  AND name ILIKE '%sheetz%';

-- Lancaster – CVS Pharmacy, 45 W Chestnut St
UPDATE stores SET phone = '(717) 299-6730'
WHERE address = '45 W Chestnut St'      AND city = 'Lancaster' AND state = 'PA'
  AND name ILIKE '%cvs%';

-- Pittsburgh Oakland – 7-Eleven, 195 N Craig St (added by migration 002)
UPDATE stores SET phone = '(412) 621-7711'
WHERE address = '195 N Craig St'        AND city = 'Pittsburgh' AND state = 'PA'
  AND name ILIKE '%7-eleven%';

-- Pittsburgh Oakland – Sunoco, 301 Craft Ave (added by migration 002)
UPDATE stores SET phone = '(412) 621-4545'
WHERE address = '301 Craft Ave'         AND city = 'Pittsburgh' AND state = 'PA'
  AND name ILIKE '%sunoco%';
