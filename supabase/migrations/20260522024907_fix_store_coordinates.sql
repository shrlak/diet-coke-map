-- Fix confirmed coordinate mismatches (May 2026).
--
-- Prior migration 20260520010000_revise_all_store_locations introduced several
-- wrong coordinates by trusting an automated geocoder that placed pins far from
-- the actual addresses. Each correction below was independently verified via
-- Apple Maps, Yelp, and/or the chain's own store locator.

BEGIN;

-- Target Downtown Pittsburgh (482 Smithfield St, 15222).
-- DB had 40.43760, -79.99640 — ~305 m south of actual entrance.
-- Correct coords from Apple Maps: 40.439872, -79.998576.
UPDATE stores
SET latitude  = 40.43987,
    longitude = -79.99858
WHERE id = '539ebff4-29da-4972-840c-dbd81a2886b5';

-- Target Monroeville (4004 Monroeville Blvd, 15146).
-- DB had 40.42810, -79.75650 — ~700 m south-east; placed it near a residential
-- area instead of the shopping centre. Correct: 40.43460, -79.77212 (adjacent
-- to the Giant Eagle at 4010 Monroeville Blvd, which is confirmed correct).
UPDATE stores
SET latitude  = 40.43460,
    longitude = -79.77212
WHERE id = 'f9df2517-317e-4898-ba3a-49df7ab0ccb7';

-- Target (600 Chauvet Dr) — city/zip/coords all wrong.
-- DB had city=Moon Township, zip=15108, lat=40.50060, lon=-80.20650 (~6 km off).
-- The store is in North Fayette Township, mailing city Pittsburgh, zip 15275.
-- Correct coords: 40.44576, -80.18328 (Apple Maps / Target store locator).
UPDATE stores
SET city      = 'Pittsburgh',
    zip       = '15275',
    latitude  = 40.44576,
    longitude = -80.18328
WHERE id = 'ac65d3bb-22f2-4286-ae86-a6945d97cda4';

-- Walmart (250 Summit Park Dr, Pittsburgh 15275, Robinson Township).
-- DB had 40.50210, -80.21180 — ~5.8 km north, placed it in Moon Township.
-- Correct coords: 40.44967, -80.17606 (Walmart store locator + Apple Maps).
UPDATE stores
SET latitude  = 40.44967,
    longitude = -80.17606
WHERE id = '7f3fab5a-6d77-4435-a124-d6cdd64ac5db';

-- Giant Eagle (1901 Murray Ave, Pittsburgh 15217, Squirrel Hill).
-- DB had 40.42860, -79.92620 — ~730 m south of the store.
-- Correct coords confirmed via gianteagle.com locator + Yelp: 40.43591, -79.92289.
UPDATE stores
SET latitude  = 40.43591,
    longitude = -79.92289
WHERE id = 'f65b48e0-e582-4407-8e15-b7c4e8880b0e';

-- Giant Eagle (600 Towne Square Way, Pittsburgh 15227, Brentwood).
-- DB had 40.37210, -79.99270 — ~730 m north + ~1 km west of the store.
-- Correct coords confirmed via gianteagle.com locator + Yelp: 40.36548, -79.98251.
UPDATE stores
SET latitude  = 40.36548,
    longitude = -79.98251
WHERE id = 'b2d654bd-4ef1-4bff-a65c-bcbde835930d';

COMMIT;
