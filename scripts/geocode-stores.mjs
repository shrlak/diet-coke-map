#!/usr/bin/env node
/**
 * Geocodes all store addresses via the TomTom Search API and writes a
 * Supabase migration file with corrected lat/lng coordinates.
 *
 * Usage:
 *   VITE_TOMTOM_KEY=your_key node scripts/geocode-stores.mjs
 *
 * Output:
 *   supabase/migrations/<timestamp>_geocode_all_stores.sql
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TOMTOM_KEY = process.env.VITE_TOMTOM_KEY

if (!TOMTOM_KEY) {
  console.error('Error: VITE_TOMTOM_KEY environment variable is required.')
  console.error('Usage: VITE_TOMTOM_KEY=your_key node scripts/geocode-stores.mjs')
  process.exit(1)
}

// All 113 stores from the database
const STORES = [
  { id: 'b3b97da3-5876-4c9a-8094-a8b3bb1b9fe7', name: 'CVS Pharmacy', address: '1601 W Liberty St', city: 'Allentown', state: 'PA', zip: '18102' },
  { id: 'a6ad3e32-6410-447c-bbc2-625196ea9d5d', name: 'Weis Markets', address: '1500 N Cedar Crest Blvd', city: 'Allentown', state: 'PA', zip: '18104' },
  { id: 'b7354a68-fd19-469a-8e96-93e9119b8bfb', name: 'Giant Eagle (Bethel Park)', address: '5055 Library Rd', city: 'Bethel Park', state: 'PA', zip: '15102' },
  { id: 'd7df0729-8afa-4512-a10d-fa73029304a8', name: 'Giant Eagle Market District (South Hills)', address: '7000 Oxford Dr', city: 'Bethel Park', state: 'PA', zip: '15102' },
  { id: '5491fd80-a917-4176-87cb-1fb2dec4975b', name: 'GetGo', address: '350 E Main St', city: 'Carnegie', state: 'PA', zip: '15106' },
  { id: '8d8d0548-4fea-487e-bfbb-7ba33bbb1c09', name: 'Giant Eagle', address: '2877 W 26th St', city: 'Erie', state: 'PA', zip: '16506' },
  { id: 'db79322c-838b-4afe-a1af-16398e5dfda9', name: 'Sheetz', address: '8180 Perry Hwy', city: 'Erie', state: 'PA', zip: '16509' },
  { id: 'fed9ef3a-010f-4c94-a94a-de392219b910', name: 'Walgreens', address: '3727 Peach St', city: 'Erie', state: 'PA', zip: '16508' },
  { id: 'a9c11441-d424-4543-843f-ade2e4b618b5', name: 'Sheetz', address: '4651 Lindle Rd', city: 'Harrisburg', state: 'PA', zip: '17111' },
  { id: '923202d8-a802-4aab-99e5-5c839961a006', name: 'Turkey Hill Minit Market', address: '2885 Paxton St', city: 'Harrisburg', state: 'PA', zip: '17111' },
  { id: '3bddf9fc-edfb-47fd-9e96-65c72039a876', name: 'Weis Markets', address: '3885 Union Deposit Rd', city: 'Harrisburg', state: 'PA', zip: '17109' },
  { id: 'd12ac729-26df-40f8-83f3-1f0938c19d7a', name: 'Target', address: '360 Waterfront Dr E', city: 'Homestead', state: 'PA', zip: '15120' },
  { id: 'a8ed6d8f-1a72-420b-a74d-6cfc111dd35e', name: 'CVS Pharmacy', address: '32 W Lemon St', city: 'Lancaster', state: 'PA', zip: '17603' },
  { id: 'e69c1715-b9f4-4440-8e79-a07e7ffba13d', name: 'Sheetz', address: '3101 Columbia Ave', city: 'Lancaster', state: 'PA', zip: '17603' },
  { id: 'ac62d38e-8a89-4cb7-861d-fcb089fff45e', name: 'Weis Markets', address: '1400 Stony Battery Rd', city: 'Lancaster', state: 'PA', zip: '17601' },
  { id: '1f019bc0-0f3d-468d-83c7-fcf1182f718c', name: 'CVS Pharmacy', address: '3893 William Penn Hwy', city: 'Monroeville', state: 'PA', zip: '15146' },
  { id: '61badc32-101f-417a-952c-5b43ea5dfb6f', name: 'Giant Eagle', address: '4010 Monroeville Blvd', city: 'Monroeville', state: 'PA', zip: '15146' },
  { id: 'c7532b8c-138f-4868-85ae-6e2db476a9fc', name: 'Sheetz', address: '2100 Mosside Blvd', city: 'Monroeville', state: 'PA', zip: '15146' },
  { id: 'f9df2517-317e-4898-ba3a-49df7ab0ccb7', name: 'Target', address: '4004 Monroeville Blvd', city: 'Monroeville', state: 'PA', zip: '15146' },
  { id: 'ac65d3bb-22f2-4286-ae86-a6945d97cda4', name: 'Target', address: '600 Chauvet Dr', city: 'Moon Township', state: 'PA', zip: '15108' },
  { id: 'fc46fbbb-6f5b-48c7-b868-0ced7d6dcead', name: 'Walmart', address: '7500 University Blvd', city: 'Moon Township', state: 'PA', zip: '15108' },
  { id: '6bc479ff-3e89-49e3-b47a-6590fc9fe038', name: 'Aldi', address: '7350 Saltsburg Rd', city: 'Penn Hills', state: 'PA', zip: '15235' },
  { id: '40d54ffc-e67c-4e56-be01-704ff0e56232', name: 'CVS Pharmacy', address: '1826 Chestnut St', city: 'Philadelphia', state: 'PA', zip: '19103' },
  { id: 'd7805646-e358-4c7e-9944-118ce64a3aa8', name: 'Giant Food Stores', address: '2550 Grant Ave', city: 'Philadelphia', state: 'PA', zip: '19114' },
  { id: 'f48c3b5c-fd53-46ae-9ecd-47a3f89ab639', name: 'Walgreens', address: '1349 Chestnut St', city: 'Philadelphia', state: 'PA', zip: '19107' },
  { id: '157b6b01-0956-4408-bca8-e9df34be2af3', name: 'Wawa', address: '1700 Sansom St', city: 'Philadelphia', state: 'PA', zip: '19103' },
  { id: '6fbf6346-ca92-4fa2-a77f-a530b9ae281f', name: 'Wawa', address: '3300 Market St', city: 'Philadelphia', state: 'PA', zip: '19104' },
  { id: 'afaf6df8-ce39-4721-940f-ec6d3b65f958', name: '7-Eleven', address: '195 N Craig St', city: 'Pittsburgh', state: 'PA', zip: '15213' },
  { id: '8fafc04a-1690-4e49-a626-de796d8ffc40', name: 'Aldi', address: '2515 Banksville Rd', city: 'Pittsburgh', state: 'PA', zip: '15216' },
  { id: 'ea93a083-154e-45dd-8c22-f748e88f2b59', name: 'Aldi', address: '5631 Baum Blvd', city: 'Pittsburgh', state: 'PA', zip: '15206' },
  { id: '7a7b69db-0c64-49e7-8e4f-f6c408a92a5e', name: 'Aldi', address: '5200 Penn Ave', city: 'Pittsburgh', state: 'PA', zip: '15224' },
  { id: 'd84baf05-49ec-4298-b7cd-a4d95234059c', name: 'Aldi', address: '450 56th St', city: 'Pittsburgh', state: 'PA', zip: '15201' },
  { id: '6508b72e-3da7-4894-b8f3-dae4f1e2293b', name: 'Aldi', address: '3089 Sussex Ave', city: 'Pittsburgh', state: 'PA', zip: '15226' },
  { id: '8ed0327e-9595-430b-9948-a04feef57d4d', name: 'Aldi', address: '7221 McKnight Rd', city: 'Pittsburgh', state: 'PA', zip: '15237' },
  { id: '27e80ba8-ea32-44a9-b33f-895df69754e4', name: 'Aldi', address: '6290 Northway Dr', city: 'Pittsburgh', state: 'PA', zip: '15237' },
  { id: 'e17485fc-50c7-4ca2-8f2e-e5844cf6082a', name: 'Aldi', address: '2628 E Carson St', city: 'Pittsburgh', state: 'PA', zip: '15203' },
  { id: '9aa14861-9598-402a-989c-092449155c99', name: 'CVS Pharmacy', address: '4610 Centre Ave', city: 'Pittsburgh', state: 'PA', zip: '15213' },
  { id: '6a000b59-8074-48dc-9067-6e2821313083', name: 'CVS Pharmacy', address: '5600 Wilkins Ave', city: 'Pittsburgh', state: 'PA', zip: '15217' },
  { id: '51b2bded-54f4-4517-845c-fd060f1f4c26', name: 'CVS Pharmacy', address: '4664 Browns Hill Rd', city: 'Pittsburgh', state: 'PA', zip: '15217' },
  { id: 'ea9f59f9-298f-4ed6-aa3f-12ea26632982', name: 'CVS Pharmacy', address: '242 Fifth Ave', city: 'Pittsburgh', state: 'PA', zip: '15222' },
  { id: '175e1a9d-fc87-466e-874e-f433621258d9', name: 'CVS Pharmacy', address: '5242 Clairton Blvd', city: 'Pittsburgh', state: 'PA', zip: '15236' },
  { id: '43f6d99b-f64b-43df-999f-d8c279201b5b', name: 'CVS Pharmacy', address: '510 Brookline Blvd', city: 'Pittsburgh', state: 'PA', zip: '15226' },
  { id: 'ef7e5898-8318-471d-abc0-25ee812a38ec', name: 'CVS Pharmacy', address: '70 W Steuben St', city: 'Pittsburgh', state: 'PA', zip: '15205' },
  { id: 'd845e7f6-818c-49e8-be55-3690ef9918be', name: 'CVS Pharmacy', address: '3075 W Liberty Ave', city: 'Pittsburgh', state: 'PA', zip: '15216' },
  { id: '4126949d-bcbf-40b1-b6e3-1dea71d13bac', name: 'CVS Pharmacy', address: '482 Smithfield St', city: 'Pittsburgh', state: 'PA', zip: '15219' },
  { id: 'a67e5b6f-7b09-43ef-b3bc-08c63a219647', name: 'CVS Pharmacy', address: '3422 Forbes Ave', city: 'Pittsburgh', state: 'PA', zip: '15213' },
  { id: '676d0f1f-cbb6-41d5-8280-6c305c9ff7dd', name: 'CVS Pharmacy', address: '10600 Frankstown Rd', city: 'Pittsburgh', state: 'PA', zip: '15235' },
  { id: 'cfaa1afb-c165-4298-a376-44b659032f48', name: 'CVS Pharmacy', address: '1740 Washington Rd', city: 'Pittsburgh', state: 'PA', zip: '15241' },
  { id: '09d6a302-9aaa-4a9a-b169-5f75fbe61a51', name: 'Food For Thought Deli', address: '196 N Craig St', city: 'Pittsburgh', state: 'PA', zip: '15213' },
  { id: 'dfd148a0-8e06-4a7d-947f-413eb2420cae', name: 'Forbes Street Market', address: '3955 Forbes Ave', city: 'Pittsburgh', state: 'PA', zip: '15213' },
  { id: 'b9118d26-b1c6-4337-bfed-9038fab1f8ae', name: "Frenchi's Deli & Market", address: '449 Atwood St', city: 'Pittsburgh', state: 'PA', zip: '15213' },
  { id: '6beb6a09-8297-4c84-a8ef-1b9c84b7d8f8', name: 'GetGo', address: '156 Ben Avon Heights Rd', city: 'Pittsburgh', state: 'PA', zip: '15237' },
  { id: 'bb3eccc5-8a27-47f0-bb64-ea3491ff3eac', name: 'GetGo', address: '3601 Saw Mill Run Blvd', city: 'Pittsburgh', state: 'PA', zip: '15227' },
  { id: '87b3e2e9-6b54-4c42-8c7d-e1ef46bd8c40', name: 'GetGo', address: '1636 Cochran Rd', city: 'Pittsburgh', state: 'PA', zip: '15220' },
  { id: '276d007c-2af6-4720-8aba-92d38e60c1f7', name: 'GetGo', address: '1043 S Braddock Ave', city: 'Pittsburgh', state: 'PA', zip: '15218' },
  { id: '92e8f4a9-f641-485a-a52a-e28f6b9dd859', name: 'GetGo', address: '4900 Steubenville Pike', city: 'Pittsburgh', state: 'PA', zip: '15205' },
  { id: 'cf8e3052-218d-4434-8c4f-76e8b7c65e62', name: 'GetGo', address: '6513 Steubenville Pike', city: 'Pittsburgh', state: 'PA', zip: '15205' },
  { id: '36f05e8e-28fe-4ccd-b439-7d09efeebda7', name: 'GetGo', address: '3247 E Carson St', city: 'Pittsburgh', state: 'PA', zip: '15203' },
  { id: '4341fe7f-d11c-402e-be57-d135276dad3f', name: 'GetGo', address: '5801 Forward Ave', city: 'Pittsburgh', state: 'PA', zip: '15217' },
  { id: '1e03e1a4-cef2-4690-979a-83b617f3ba5f', name: 'GetGo Cafe + Market', address: '4000 Butler St', city: 'Pittsburgh', state: 'PA', zip: '15201' },
  { id: '086c3f3c-7817-441e-b749-4f4b89ad7323', name: 'GetGo Cafe + Market', address: '4924 Baum Blvd', city: 'Pittsburgh', state: 'PA', zip: '15213' },
  { id: '219d3f32-39c4-4831-9961-87b508b23dfb', name: 'GetGo Cafe + Market', address: '7675 McKnight Rd', city: 'Pittsburgh', state: 'PA', zip: '15237' },
  { id: '58db15f9-3b3b-4fe9-bbfe-636ccdaa78fe', name: 'Giant Eagle', address: '254 Yost Blvd', city: 'Pittsburgh', state: 'PA', zip: '15221' },
  { id: '2a8eab53-7395-4b49-835f-746dccad26cc', name: 'Giant Eagle', address: '318 Cedar Ave', city: 'Pittsburgh', state: 'PA', zip: '15212' },
  { id: 'f65b48e0-e582-4407-8e15-b7c4e8880b0e', name: 'Giant Eagle', address: '1901 Murray Ave', city: 'Pittsburgh', state: 'PA', zip: '15217' },
  { id: 'd9601848-98c8-4c02-8db8-6c410439ecb8', name: 'Giant Eagle', address: '9805 McKnight Rd', city: 'Pittsburgh', state: 'PA', zip: '15237' },
  { id: 'ba5d1653-1660-4873-b95f-e02d07e7a09c', name: 'Giant Eagle', address: '5260 Grove Rd', city: 'Pittsburgh', state: 'PA', zip: '15236' },
  { id: 'c2eb494e-7aa1-4bba-b2b9-bc8cc130a990', name: 'Giant Eagle', address: '132 Ben Avon Heights Rd', city: 'Pittsburgh', state: 'PA', zip: '15237' },
  { id: 'b2d654bd-4ef1-4bff-a65c-bcbde835930d', name: 'Giant Eagle', address: '600 Towne Square Way', city: 'Pittsburgh', state: 'PA', zip: '15227' },
  { id: '1475776b-6fa7-4ae5-b03f-e803cee61d1a', name: 'Giant Eagle', address: '9001 Frankstown Rd', city: 'Pittsburgh', state: 'PA', zip: '15235' },
  { id: '5d59b861-3dde-4d56-8c7f-0f306186d526', name: 'Giant Eagle', address: '225 Blazier Dr', city: 'Pittsburgh', state: 'PA', zip: '15237' },
  { id: 'd4c99d40-9373-4dba-95f5-cb31ce2bd93b', name: 'Giant Eagle', address: '230 Rodi Rd', city: 'Pittsburgh', state: 'PA', zip: '15235' },
  { id: '8c67f799-5db2-4085-a160-57a925b3c265', name: 'Giant Eagle Market District', address: '6310 Penn Ave', city: 'Pittsburgh', state: 'PA', zip: '15206' },
  { id: '8b9ab545-b8b8-4e3d-91b4-375a0fb68d46', name: 'Giant Eagle Market District', address: '5550 Centre Ave', city: 'Pittsburgh', state: 'PA', zip: '15232' },
  { id: 'ef9b0422-0324-4a1b-91ac-a169a0510e1a', name: 'Giant Eagle Market District', address: '1717 Cochran Rd', city: 'Pittsburgh', state: 'PA', zip: '15220' },
  { id: '837712c4-f39e-4101-930c-8ea4efd3c4ce', name: 'Giant Eagle Market District', address: '910 Freeport Rd', city: 'Pittsburgh', state: 'PA', zip: '15238' },
  { id: '0d94c58d-f8ef-42ed-bebe-72fd453cbe64', name: 'Groceria Merante', address: '3454 Bates St', city: 'Pittsburgh', state: 'PA', zip: '15213' },
  { id: '50d76abc-8cef-4ad8-a38a-3d4369aabd94', name: 'One Stop Mini Mart', address: '3601 Blvd of the Allies', city: 'Pittsburgh', state: 'PA', zip: '15213' },
  { id: 'fb2450d1-7793-4c33-9e4b-a37cb4c908b6', name: 'Sheetz', address: '3457 William Penn Hwy', city: 'Pittsburgh', state: 'PA', zip: '15235' },
  { id: '2c5fc23b-018c-4983-a46d-e1e04c95b50a', name: 'Sheetz', address: '2871 Freeport Rd', city: 'Pittsburgh', state: 'PA', zip: '15238' },
  { id: 'eb68cea6-65f8-4a49-b9ab-aa29a6b0f52d', name: 'Sheetz', address: '8500 Perry Hwy', city: 'Pittsburgh', state: 'PA', zip: '15237' },
  { id: '14b7eebe-a3d6-4bf7-b083-4b8210cf83ab', name: 'Sheetz', address: '211 Mount Nebo Rd', city: 'Pittsburgh', state: 'PA', zip: '15237' },
  { id: '1457b6c6-7d3e-4890-a1c3-fae344fc3efe', name: 'Sheetz', address: '1000 Clairton Blvd', city: 'Pittsburgh', state: 'PA', zip: '15236' },
  { id: 'abd01dac-3bb2-45fa-a26b-539b4c528438', name: 'Sheetz', address: '251 Curry Hollow Rd', city: 'Pittsburgh', state: 'PA', zip: '15236' },
  { id: '5191081b-2a59-46c6-bf24-96421fc3b099', name: 'Sheetz', address: '950 Presque Isle Dr', city: 'Pittsburgh', state: 'PA', zip: '15239' },
  { id: '1cc65d2b-29c2-431f-8ac7-4d8e6b9beaa5', name: 'Sheetz', address: '5410 Campbells Run Rd', city: 'Pittsburgh', state: 'PA', zip: '15205' },
  { id: 'c9f9dd98-a2e9-4da3-8de9-506abaad8544', name: 'Sheetz', address: '3025 Babcock Blvd', city: 'Pittsburgh', state: 'PA', zip: '15237' },
  { id: '0f2d8543-2226-4531-9d58-910ca49a28f6', name: 'Sheetz', address: '5800 Grand Ave', city: 'Pittsburgh', state: 'PA', zip: '15225' },
  { id: '1679a2ce-0561-4419-aa78-0575ceafc2a5', name: 'Sunoco', address: '301 Craft Ave', city: 'Pittsburgh', state: 'PA', zip: '15213' },
  { id: '539ebff4-29da-4972-840c-dbd81a2886b5', name: 'Target', address: '482 Smithfield St', city: 'Pittsburgh', state: 'PA', zip: '15219' },
  { id: '51c4942a-28ec-4d13-b311-a5b2b2793c64', name: 'Target', address: '6231 Penn Ave', city: 'Pittsburgh', state: 'PA', zip: '15206' },
  { id: '3493b203-9b59-49fb-a37c-f73b661b2c16', name: 'Target', address: '2661 Freeport Rd', city: 'Pittsburgh', state: 'PA', zip: '15238' },
  { id: '06daab5a-e031-4718-b675-6dfeebd99e57', name: 'Target', address: '105 Blazier Dr', city: 'Pittsburgh', state: 'PA', zip: '15237' },
  { id: 'c4552f69-81ce-4523-898c-c5f90e3cd47a', name: 'Target', address: '4801 McKnight Rd', city: 'Pittsburgh', state: 'PA', zip: '15237' },
  { id: '29a44a70-4712-4573-b494-34d7f47aaeeb', name: 'Target', address: '201 S Hills Village', city: 'Pittsburgh', state: 'PA', zip: '15241' },
  { id: '64ccffc0-a8fe-4f51-a841-c41ca69cd355', name: 'The Pitt Shop', address: '3939 Forbes Ave', city: 'Pittsburgh', state: 'PA', zip: '15213' },
  { id: '3781dacd-e0dd-4ffa-be88-a59f8c7bf2c6', name: 'The University Store on Fifth', address: '4000 Fifth Ave', city: 'Pittsburgh', state: 'PA', zip: '15213' },
  { id: 'e1ba209a-ff43-49f9-8e2f-4fc33ecef2ca', name: 'Walgreens', address: '1907 Forbes Ave', city: 'Pittsburgh', state: 'PA', zip: '15219' },
  { id: '71c3c37a-f2bd-4999-9a28-f9f79c20b350', name: 'Walgreens', address: '7628 Penn Ave', city: 'Pittsburgh', state: 'PA', zip: '15221' },
  { id: '30cf06a4-2c69-43a0-91e4-b20211a42708', name: 'Walgreens', address: '5956 Centre Ave', city: 'Pittsburgh', state: 'PA', zip: '15206' },
  { id: 'fa20b452-136e-4068-a5b6-76037bc7d4a3', name: 'Walgreens', address: '1000 Bower Hill Rd', city: 'Pittsburgh', state: 'PA', zip: '15243' },
  { id: 'd70a5115-1553-4f61-a514-012b3399fd3b', name: 'Walgreens', address: '6201 Saltsburg Rd', city: 'Pittsburgh', state: 'PA', zip: '15235' },
  { id: 'a2df9578-5d26-4deb-82ed-95f938065fe7', name: 'Walgreens', address: '130 Enterprise Dr', city: 'Pittsburgh', state: 'PA', zip: '15275' },
  { id: 'd228db4a-0cca-4e01-9299-ab9e9696604e', name: 'Walgreens', address: '4885 McKnight Rd', city: 'Pittsburgh', state: 'PA', zip: '15237' },
  { id: '01dcd1ae-34e8-417d-aea6-d71d3b198a96', name: 'Walgreens', address: '1741 Washington Rd', city: 'Pittsburgh', state: 'PA', zip: '15241' },
  { id: '7f3fab5a-6d77-4435-a124-d6cdd64ac5db', name: 'Walmart', address: '250 Summit Park Dr', city: 'Pittsburgh', state: 'PA', zip: '15275' },
  { id: '1caf23c6-a41b-4467-9f58-56b2621fd6dd', name: 'Sheetz', address: '2246 Lancaster Pike', city: 'Reading', state: 'PA', zip: '19607' },
  { id: '10f77cdb-e817-4e66-bb73-d04d890bfb1b', name: 'Weis Markets', address: '2020 N 13th St', city: 'Reading', state: 'PA', zip: '19604' },
  { id: '81ad8a19-4234-43e0-a88e-3b928a16218c', name: 'CVS Pharmacy', address: '116 W College Ave', city: 'State College', state: 'PA', zip: '16801' },
  { id: 'd70f38d3-6ae7-48f1-a9ad-5dc66417b4e4', name: 'Sheetz', address: '3261 W College Ave', city: 'State College', state: 'PA', zip: '16801' },
  { id: '2ae4f432-405e-47f8-8ee2-22e43acf03c9', name: 'Weis Markets', address: '1471 Martin St', city: 'State College', state: 'PA', zip: '16803' },
  { id: '0f307f1d-ff7d-4610-b0ee-3510a0fe9f14', name: 'Sheetz', address: '5001 MacArthur Rd', city: 'Whitehall', state: 'PA', zip: '18052' },
  { id: '9af1b61d-3324-4a74-82ce-49a1cb8894ef', name: 'Aldi', address: '401 Penn Ave', city: 'Wilkinsburg', state: 'PA', zip: '15221' },
]

async function geocode(store) {
  const query = encodeURIComponent(`${store.address}, ${store.city}, ${store.state} ${store.zip}`)
  const url = `https://api.tomtom.com/search/2/geocode/${query}.json?key=${TOMTOM_KEY}&limit=1&countrySet=US`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${store.name}`)

  const data = await res.json()
  const result = data.results?.[0]
  if (!result) throw new Error(`No result for ${store.name} at ${store.address}`)

  return {
    lat: result.position.lat,
    lon: result.position.lon,
    score: result.score,
    matchedAddress: result.address?.freeformAddress,
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  console.log(`Geocoding ${STORES.length} stores via TomTom API...\n`)

  const results = []
  const failed = []

  for (let i = 0; i < STORES.length; i++) {
    const store = STORES[i]
    process.stdout.write(`[${i + 1}/${STORES.length}] ${store.name} — ${store.address}, ${store.city}... `)

    try {
      const geo = await geocode(store)
      results.push({ store, geo })
      console.log(`✓ ${geo.lat.toFixed(5)}, ${geo.lon.toFixed(5)} (score: ${geo.score?.toFixed(2)})`)
    } catch (err) {
      console.log(`✗ FAILED: ${err.message}`)
      failed.push({ store, error: err.message })
    }

    // TomTom allows up to 5 req/sec on free tier; be conservative
    if (i < STORES.length - 1) await sleep(250)
  }

  // Generate migration SQL
  const timestamp = new Date().toISOString().replace(/[-T:]/g, '').slice(0, 14)
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', `${timestamp}_geocode_all_stores.sql`)

  const lines = [
    '-- Auto-generated by scripts/geocode-stores.mjs',
    `-- Geocoded ${results.length} stores via TomTom Search API`,
    `-- Generated: ${new Date().toISOString()}`,
    '',
  ]

  for (const { store, geo } of results) {
    lines.push(
      `UPDATE stores SET latitude = ${geo.lat}, longitude = ${geo.lon} WHERE id = '${store.id}'; -- ${store.name}, ${store.address}`,
    )
  }

  if (failed.length > 0) {
    lines.push('')
    lines.push('-- The following stores could not be geocoded:')
    for (const { store, error } of failed) {
      lines.push(`-- ${store.id} | ${store.name}, ${store.address} | ${error}`)
    }
  }

  fs.writeFileSync(migrationPath, lines.join('\n') + '\n')

  console.log(`\n✓ Done. ${results.length} geocoded, ${failed.length} failed.`)
  console.log(`Migration written to: ${migrationPath}`)
  console.log('\nApply it with:')
  console.log('  npx supabase db push')
  console.log('  -- or --')
  console.log('  npx supabase migration up')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
