-- Fix four store locations that had unverified/fabricated addresses.
-- Each replacement address is confirmed via Yelp, GasBuddy, Walgreens.com, or GetGo.com.

-- 1. Sheetz Harrisburg: 1001 S 29th St does not exist.
--    Real location: 4651 Lindle Rd (Swatara Township, Exit 2 off I-283), confirmed at
--    yelp.com/biz/sheetz-harrisburg-6, gasbuddy.com/station/185719, yellowpages.com.
UPDATE stores
SET address   = '4651 Lindle Rd',
    zip       = '17111',
    latitude  = 40.25380,
    longitude = -76.86640
WHERE name = 'Sheetz'
  AND address = '1001 S 29th St'
  AND city = 'Harrisburg'
  AND state = 'PA';

-- 2. Sheetz Reading: 3421 Penn Ave does not exist in Reading.
--    Real location: 2246 Lancaster Pike (Shillington/Reading), confirmed at
--    yelp.com/biz/sheetz-reading-3, gasbuddy.com/station/61261, posc.org/gas-station/sheetz-328.
--    Coordinates sourced from freetireair.com and confirmed by two independent sources.
UPDATE stores
SET address   = '2246 Lancaster Pike',
    zip       = '19607',
    latitude  = 40.30695,
    longitude = -75.97932
WHERE name = 'Sheetz'
  AND address = '3421 Penn Ave'
  AND city = 'Reading'
  AND state = 'PA';

-- 3. GetGo Pittsburgh Strip District: 1101 Penn Ave has no GetGo; the Strip District
--    has no GetGo gas station. Real Lawrenceville GetGo: 4000 Butler St (15201),
--    confirmed at yelp.com/biz/getgo-pittsburgh-2, getgocafe.com/stores/3107,
--    gasbuddy.com/station/76685.
UPDATE stores
SET address   = '4000 Butler St',
    zip       = '15201',
    latitude  = 40.47300,
    longitude = -79.94920
WHERE name = 'GetGo Cafe + Market'
  AND address = '1101 Penn Ave'
  AND city = 'Pittsburgh'
  AND state = 'PA';

-- 4. Walgreens Pittsburgh Oakland: No Walgreens exists at 3600 Fifth Ave (15213).
--    Replacing with confirmed Walgreens at 7628 Penn Ave, Pittsburgh 15221 (Wilkinsburg),
--    confirmed at walgreens.com/locator/…/id=10345, yelp.com/biz/walgreens-pittsburgh,
--    loc8nearme.com/pennsylvania/pittsburgh/walgreens/194850.
UPDATE stores
SET address   = '7628 Penn Ave',
    zip       = '15221',
    latitude  = 40.44080,
    longitude = -79.88020
WHERE name = 'Walgreens'
  AND address = '3600 Fifth Ave'
  AND city = 'Pittsburgh'
  AND state = 'PA';
