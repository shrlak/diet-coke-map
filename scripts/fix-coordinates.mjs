#!/usr/bin/env node
/**
 * Geocodes all active store addresses via Nominatim (OpenStreetMap) and
 * generates a Supabase migration SQL with corrected lat/lng coordinates.
 *
 * Usage: node scripts/fix-coordinates.mjs
 * Output: supabase/migrations/<timestamp>_fix_store_coordinates.sql
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const STORES = [
  { id: 'b3b97da3-5876-4c9a-8094-a8b3bb1b9fe7', name: 'CVS Pharmacy', address: '1601 W Liberty St', city: 'Allentown', state: 'PA', zip: '18102' },
  { id: 'a6ad3e32-6410-447c-bbc2-625196ea9d5d', name: 'Weis Markets', address: '1500 N Cedar Crest Blvd', city: 'Allentown', state: 'PA', zip: '18104' },
  { id: 'b7354a68-fd19-469a-8e96-93e9119b8bfb', name: 'Giant Eagle (Bethel Park)', address: '5055 Library Rd', city: 'Bethel Park', state: 'PA', zip: '15102' },
  { id: 'd7df0729-8afa-4512-a10d-fa73029304a8', name: 'Giant Eagle Market District (South Hills)', address: '7000 Oxford Dr', city: 'Bethel Park', state: 'PA', zip: '15102' },
  { id: '5491fd80-a917-4176-87cb-1fb2dec4975b', name: 'GetGo (Carnegie)', address: '350 E Main St', city: 'Carnegie', state: 'PA', zip: '15106' },
  { id: '8d8d0548-4fea-487e-bfbb-7ba33bbb1c09', name: 'Giant Eagle Erie', address: '2877 W 26th St', city: 'Erie', state: 'PA', zip: '16506' },
  { id: 'db79322c-838b-4afe-a1af-16398e5dfda9', name: 'Sheetz Erie', address: '8180 Perry Hwy', city: 'Erie', state: 'PA', zip: '16509' },
  { id: 'fed9ef3a-010f-4c94-a94a-de392219b910', name: 'Walgreens Erie', address: '3727 Peach St', city: 'Erie', state: 'PA', zip: '16508' },
  { id: 'a9c11441-d424-4543-843f-ade2e4b618b5', name: 'Sheetz Harrisburg', address: '4651 Lindle Rd', city: 'Harrisburg', state: 'PA', zip: '17111' },
  { id: '923202d8-a802-4aab-99e5-5c839961a006', name: 'Turkey Hill Harrisburg', address: '2885 Paxton St', city: 'Harrisburg', state: 'PA', zip: '17111' },
  { id: '3bddf9fc-edfb-47fd-9e96-65c72039a876', name: 'Weis Markets Harrisburg', address: '3885 Union Deposit Rd', city: 'Harrisburg', state: 'PA', zip: '17109' },
  { id: '0a57ad2a-9763-46c5-a5f0-cb818616b5a4', name: 'Chick-fil-A Waterfront', address: '480 E Waterfront Dr', city: 'Homestead', state: 'PA', zip: '15120' },
  { id: 'd12ac729-26df-40f8-83f3-1f0938c19d7a', name: 'Target Waterfront', address: '360 E Waterfront Dr', city: 'Homestead', state: 'PA', zip: '15120' },
  { id: 'a8ed6d8f-1a72-420b-a74d-6cfc111dd35e', name: 'CVS Lancaster', address: '32 W Lemon St', city: 'Lancaster', state: 'PA', zip: '17603' },
  { id: 'e69c1715-b9f4-4440-8e79-a07e7ffba13d', name: 'Sheetz Lancaster', address: '3101 Columbia Ave', city: 'Lancaster', state: 'PA', zip: '17603' },
  { id: 'ac62d38e-8a89-4cb7-861d-fcb089fff45e', name: 'Weis Markets Lancaster', address: '1400 Stony Battery Rd', city: 'Lancaster', state: 'PA', zip: '17601' },
  { id: '1f019bc0-0f3d-468d-83c7-fcf1182f718c', name: 'CVS Monroeville', address: '3893 William Penn Hwy', city: 'Monroeville', state: 'PA', zip: '15146' },
  { id: '61badc32-101f-417a-952c-5b43ea5dfb6f', name: 'Giant Eagle Monroeville', address: '4010 Monroeville Blvd', city: 'Monroeville', state: 'PA', zip: '15146' },
  { id: 'c7532b8c-138f-4868-85ae-6e2db476a9fc', name: 'Sheetz Monroeville', address: '2100 Mosside Blvd', city: 'Monroeville', state: 'PA', zip: '15146' },
  { id: 'f9df2517-317e-4898-ba3a-49df7ab0ccb7', name: 'Target Monroeville', address: '4004 Monroeville Blvd', city: 'Monroeville', state: 'PA', zip: '15146' },
  { id: 'ac65d3bb-22f2-4286-ae86-a6945d97cda4', name: 'Target Moon Township', address: '600 Chauvet Dr', city: 'Moon Township', state: 'PA', zip: '15108' },
  { id: 'fc46fbbb-6f5b-48c7-b868-0ced7d6dcead', name: 'Walmart Moon Township', address: '7500 University Blvd', city: 'Moon Township', state: 'PA', zip: '15108' },
  { id: '6bc479ff-3e89-49e3-b47a-6590fc9fe038', name: 'Aldi Penn Hills', address: '7350 Saltsburg Rd', city: 'Penn Hills', state: 'PA', zip: '15235' },
  { id: '40d54ffc-e67c-4e56-be01-704ff0e56232', name: 'CVS Philadelphia Chestnut', address: '1826 Chestnut St', city: 'Philadelphia', state: 'PA', zip: '19103' },
  { id: 'd7805646-e358-4c7e-9944-118ce64a3aa8', name: 'Giant Food Stores Philadelphia', address: '2550 Grant Ave', city: 'Philadelphia', state: 'PA', zip: '19114' },
  { id: 'f48c3b5c-fd53-46ae-9ecd-47a3f89ab639', name: 'Walgreens Philadelphia', address: '1349 Chestnut St', city: 'Philadelphia', state: 'PA', zip: '19107' },
  { id: '157b6b01-0956-4408-bca8-e9df34be2af3', name: 'Wawa Philadelphia Sansom', address: '1700 Sansom St', city: 'Philadelphia', state: 'PA', zip: '19103' },
  { id: '6fbf6346-ca92-4fa2-a77f-a530b9ae281f', name: 'Wawa Philadelphia Market', address: '3300 Market St', city: 'Philadelphia', state: 'PA', zip: '19104' },
  { id: 'afaf6df8-ce39-4721-940f-ec6d3b65f958', name: '7-Eleven Oakland', address: '195 N Craig St', city: 'Pittsburgh', state: 'PA', zip: '15213' },
  { id: '8fafc04a-1690-4e49-a626-de796d8ffc40', name: 'Aldi Banksville', address: '2515 Banksville Rd', city: 'Pittsburgh', state: 'PA', zip: '15216' },
  { id: 'ea93a083-154e-45dd-8c22-f748e88f2b59', name: 'Aldi Bloomfield Baum', address: '5631 Baum Blvd', city: 'Pittsburgh', state: 'PA', zip: '15206' },
  { id: '7a7b69db-0c64-49e7-8e4f-f6c408a92a5e', name: 'Aldi Bloomfield Penn', address: '5200 Penn Ave', city: 'Pittsburgh', state: 'PA', zip: '15224' },
  { id: 'd84baf05-49ec-4298-b7cd-a4d95234059c', name: 'Aldi Lawrenceville', address: '450 56th St', city: 'Pittsburgh', state: 'PA', zip: '15201' },
  { id: '6508b72e-3da7-4894-b8f3-dae4f1e2293b', name: 'Aldi Overbrook', address: '3089 Sussex Ave', city: 'Pittsburgh', state: 'PA', zip: '15226' },
  { id: '8ed0327e-9595-430b-9948-a04feef57d4d', name: 'Aldi Ross McKnight', address: '7221 McKnight Rd', city: 'Pittsburgh', state: 'PA', zip: '15237' },
  { id: '27e80ba8-ea32-44a9-b33f-895df69754e4', name: 'Aldi Ross Northway', address: '6290 Northway Dr', city: 'Pittsburgh', state: 'PA', zip: '15237' },
  { id: 'e17485fc-50c7-4ca2-8f2e-e5844cf6082a', name: 'Aldi South Side', address: '2628 E Carson St', city: 'Pittsburgh', state: 'PA', zip: '15203' },
  { id: '9aa14861-9598-402a-989c-092449155c99', name: 'CVS Centre Ave', address: '4610 Centre Ave', city: 'Pittsburgh', state: 'PA', zip: '15213' },
  { id: '6a000b59-8074-48dc-9067-6e2821313083', name: 'CVS Wilkins Ave', address: '5600 Wilkins Ave', city: 'Pittsburgh', state: 'PA', zip: '15217' },
  { id: '51b2bded-54f4-4517-845c-fd060f1f4c26', name: 'CVS Browns Hill', address: '4664 Browns Hill Rd', city: 'Pittsburgh', state: 'PA', zip: '15217' },
  { id: 'ea9f59f9-298f-4ed6-aa3f-12ea26632982', name: 'CVS Fifth Ave', address: '242 Fifth Ave', city: 'Pittsburgh', state: 'PA', zip: '15222' },
  { id: '175e1a9d-fc87-466e-874e-f433621258d9', name: 'CVS Baldwin Clairton', address: '5242 Clairton Blvd', city: 'Pittsburgh', state: 'PA', zip: '15236' },
  { id: '43f6d99b-f64b-43df-999f-d8c279201b5b', name: 'CVS Brookline', address: '510 Brookline Blvd', city: 'Pittsburgh', state: 'PA', zip: '15226' },
  { id: 'ef7e5898-8318-471d-abc0-25ee812a38ec', name: 'CVS Carnegie Steuben', address: '70 W Steuben St', city: 'Pittsburgh', state: 'PA', zip: '15205' },
  { id: 'd845e7f6-818c-49e8-be55-3690ef9918be', name: 'CVS Dormont', address: '3075 W Liberty Ave', city: 'Pittsburgh', state: 'PA', zip: '15216' },
  { id: '4126949d-bcbf-40b1-b6e3-1dea71d13bac', name: 'CVS Downtown Smithfield', address: '482 Smithfield St', city: 'Pittsburgh', state: 'PA', zip: '15219' },
  { id: 'f4e06a75-e0d9-4e2c-bfdd-09f98c37a705', name: 'CVS McCandless', address: '9805 McKnight Rd', city: 'Pittsburgh', state: 'PA', zip: '15237' },
  { id: 'a67e5b6f-7b09-43ef-b3bc-08c63a219647', name: 'CVS Oakland Forbes', address: '3422 Forbes Ave', city: 'Pittsburgh', state: 'PA', zip: '15213' },
  { id: '676d0f1f-cbb6-41d5-8280-6c305c9ff7dd', name: 'CVS Penn Hills Frankstown', address: '10600 Frankstown Rd', city: 'Pittsburgh', state: 'PA', zip: '15235' },
  { id: 'cfaa1afb-c165-4298-a376-44b659032f48', name: 'CVS Upper St Clair', address: '1740 Washington Rd', city: 'Pittsburgh', state: 'PA', zip: '15241' },
  { id: '17d514b9-4256-4b9c-a70a-98d70d73ae58', name: 'Five Guys Downtown', address: '3 PPG Place', city: 'Pittsburgh', state: 'PA', zip: '15222' },
  { id: '2340a43c-c34c-4cb4-a703-a67963ac56bd', name: 'Five Guys Oakland', address: '117 S Bouquet St', city: 'Pittsburgh', state: 'PA', zip: '15213' },
  { id: '09d6a302-9aaa-4a9a-b169-5f75fbe61a51', name: 'Food For Thought Deli', address: '196 N Craig St', city: 'Pittsburgh', state: 'PA', zip: '15213' },
  { id: 'dfd148a0-8e06-4a7d-947f-413eb2420cae', name: 'Forbes Street Market', address: '3955 Forbes Ave', city: 'Pittsburgh', state: 'PA', zip: '15213' },
  { id: 'b9118d26-b1c6-4337-bfed-9038fab1f8ae', name: "Frenchi's Deli", address: '449 Atwood St', city: 'Pittsburgh', state: 'PA', zip: '15213' },
  { id: '6beb6a09-8297-4c84-a8ef-1b9c84b7d8f8', name: 'GetGo Ben Avon', address: '156 Ben Avon Heights Rd', city: 'Pittsburgh', state: 'PA', zip: '15237' },
  { id: 'bb3eccc5-8a27-47f0-bb64-ea3491ff3eac', name: 'GetGo Brentwood', address: '3601 Saw Mill Run Blvd', city: 'Pittsburgh', state: 'PA', zip: '15227' },
  { id: '276d007c-2af6-4720-8aba-92d38e60c1f7', name: 'GetGo Edgewood', address: '1043 S Braddock Ave', city: 'Pittsburgh', state: 'PA', zip: '15218' },
  { id: '92e8f4a9-f641-485a-a52a-e28f6b9dd859', name: 'GetGo Robinson 4900', address: '4900 Steubenville Pike', city: 'Pittsburgh', state: 'PA', zip: '15205' },
  { id: 'cf8e3052-218d-4434-8c4f-76e8b7c65e62', name: 'GetGo Robinson 6513', address: '6513 Steubenville Pike', city: 'Pittsburgh', state: 'PA', zip: '15205' },
  { id: '36f05e8e-28fe-4ccd-b439-7d09efeebda7', name: 'GetGo South Side', address: '3247 E Carson St', city: 'Pittsburgh', state: 'PA', zip: '15203' },
  { id: '4341fe7f-d11c-402e-be57-d135276dad3f', name: 'GetGo Squirrel Hill', address: '5801 Forward Ave', city: 'Pittsburgh', state: 'PA', zip: '15217' },
  { id: '086c3f3c-7817-441e-b749-4f4b89ad7323', name: 'GetGo Cafe Baum', address: '4924 Baum Blvd', city: 'Pittsburgh', state: 'PA', zip: '15213' },
  { id: '1e03e1a4-cef2-4690-979a-83b617f3ba5f', name: 'GetGo Cafe Butler', address: '4000 Butler St', city: 'Pittsburgh', state: 'PA', zip: '15201' },
  { id: '219d3f32-39c4-4831-9961-87b508b23dfb', name: 'GetGo Cafe McKnight', address: '7675 McKnight Rd', city: 'Pittsburgh', state: 'PA', zip: '15237' },
  { id: 'f65b48e0-e582-4407-8e15-b7c4e8880b0e', name: 'Giant Eagle Murray', address: '1901 Murray Ave', city: 'Pittsburgh', state: 'PA', zip: '15217' },
  { id: '2a8eab53-7395-4b49-835f-746dccad26cc', name: 'Giant Eagle Cedar', address: '318 Cedar Ave', city: 'Pittsburgh', state: 'PA', zip: '15212' },
  { id: '58db15f9-3b3b-4fe9-bbfe-636ccdaa78fe', name: 'Giant Eagle Yost', address: '254 Yost Blvd', city: 'Pittsburgh', state: 'PA', zip: '15221' },
  { id: 'd9601848-98c8-4c02-8db8-6c410439ecb8', name: 'Giant Eagle McKnight', address: '9805 McKnight Rd', city: 'Pittsburgh', state: 'PA', zip: '15237' },
  { id: 'ba5d1653-1660-4873-b95f-e02d07e7a09c', name: 'Giant Eagle Grove', address: '5260 Grove Rd', city: 'Pittsburgh', state: 'PA', zip: '15236' },
  { id: 'c2eb494e-7aa1-4bba-b2b9-bc8cc130a990', name: 'Giant Eagle Ben Avon', address: '132 Ben Avon Heights Rd', city: 'Pittsburgh', state: 'PA', zip: '15237' },
  { id: 'b2d654bd-4ef1-4bff-a65c-bcbde835930d', name: 'Giant Eagle Brentwood', address: '600 Towne Square Way', city: 'Pittsburgh', state: 'PA', zip: '15227' },
  { id: '1475776b-6fa7-4ae5-b03f-e803cee61d1a', name: 'Giant Eagle Frankstown', address: '9001 Frankstown Rd', city: 'Pittsburgh', state: 'PA', zip: '15235' },
  { id: '5d59b861-3dde-4d56-8c7f-0f306186d526', name: 'Giant Eagle Blazier', address: '225 Blazier Dr', city: 'Pittsburgh', state: 'PA', zip: '15237' },
  { id: 'd4c99d40-9373-4dba-95f5-cb31ce2bd93b', name: 'Giant Eagle Rodi', address: '230 Rodi Rd', city: 'Pittsburgh', state: 'PA', zip: '15235' },
  { id: '8b9ab545-b8b8-4e3d-91b4-375a0fb68d46', name: 'Giant Eagle Market District Shadyside', address: '5550 Centre Ave', city: 'Pittsburgh', state: 'PA', zip: '15232' },
  { id: '8c67f799-5db2-4085-a160-57a925b3c265', name: 'Giant Eagle Market District East Liberty', address: '6310 Penn Ave', city: 'Pittsburgh', state: 'PA', zip: '15206' },
  { id: 'ef9b0422-0324-4a1b-91ac-a169a0510e1a', name: 'Giant Eagle Market District Cochran', address: '1717 Cochran Rd', city: 'Pittsburgh', state: 'PA', zip: '15220' },
  { id: '837712c4-f39e-4101-930c-8ea4efd3c4ce', name: 'Giant Eagle Market District Waterworks', address: '910 Freeport Rd', city: 'Pittsburgh', state: 'PA', zip: '15238' },
  { id: '0d94c58d-f8ef-42ed-bebe-72fd453cbe64', name: 'Groceria Merante', address: '3454 Bates St', city: 'Pittsburgh', state: 'PA', zip: '15213' },
  { id: 'ee0f2091-68d7-4900-b13a-9be9a428c5ba', name: "McDonald's Downtown", address: '500 Liberty Ave', city: 'Pittsburgh', state: 'PA', zip: '15222' },
  { id: '919ea472-ff1d-44db-a616-662648824833', name: "McDonald's North Shore", address: '801 Allegheny Ave', city: 'Pittsburgh', state: 'PA', zip: '15233' },
  { id: '5a8f230a-f933-4fc4-842f-497881b980bc', name: "McDonald's Oakland", address: '3708 Forbes Ave', city: 'Pittsburgh', state: 'PA', zip: '15213' },
  { id: '50d76abc-8cef-4ad8-a38a-3d4369aabd94', name: 'One Stop Mini Mart', address: '3601 Blvd of the Allies', city: 'Pittsburgh', state: 'PA', zip: '15213' },
  { id: '3e09a57d-4904-4217-8e93-1d7e540e661f', name: 'Panera Bread Oakland', address: '3800 Forbes Ave', city: 'Pittsburgh', state: 'PA', zip: '15213' },
  { id: 'fb2450d1-7793-4c33-9e4b-a37cb4c908b6', name: 'Sheetz William Penn Hwy', address: '3457 William Penn Hwy', city: 'Pittsburgh', state: 'PA', zip: '15235' },
  { id: '2c5fc23b-018c-4983-a46d-e1e04c95b50a', name: 'Sheetz Aspinwall', address: '2871 Freeport Rd', city: 'Pittsburgh', state: 'PA', zip: '15238' },
  { id: 'eb68cea6-65f8-4a49-b9ab-aa29a6b0f52d', name: 'Sheetz North Hills Perry', address: '8500 Perry Hwy', city: 'Pittsburgh', state: 'PA', zip: '15237' },
  { id: '14b7eebe-a3d6-4bf7-b083-4b8210cf83ab', name: 'Sheetz Ohio Township', address: '211 Mount Nebo Rd', city: 'Pittsburgh', state: 'PA', zip: '15237' },
  { id: '1457b6c6-7d3e-4890-a1c3-fae344fc3efe', name: 'Sheetz Pleasant Hills Clairton', address: '1000 Clairton Blvd', city: 'Pittsburgh', state: 'PA', zip: '15236' },
  { id: 'abd01dac-3bb2-45fa-a26b-539b4c528438', name: 'Sheetz Pleasant Hills Curry', address: '251 Curry Hollow Rd', city: 'Pittsburgh', state: 'PA', zip: '15236' },
  { id: '5191081b-2a59-46c6-bf24-96421fc3b099', name: 'Sheetz Plum', address: '950 Presque Isle Dr', city: 'Pittsburgh', state: 'PA', zip: '15239' },
  { id: '1cc65d2b-29c2-431f-8ac7-4d8e6b9beaa5', name: 'Sheetz Robinson Campbells Run', address: '5410 Campbells Run Rd', city: 'Pittsburgh', state: 'PA', zip: '15205' },
  { id: 'c9f9dd98-a2e9-4da3-8de9-506abaad8544', name: 'Sheetz Ross Babcock', address: '3025 Babcock Blvd', city: 'Pittsburgh', state: 'PA', zip: '15237' },
  { id: '0f2d8543-2226-4531-9d58-910ca49a28f6', name: 'Sheetz Stowe Grand', address: '5800 Grand Ave', city: 'Pittsburgh', state: 'PA', zip: '15225' },
  { id: '1679a2ce-0561-4419-aa78-0575ceafc2a5', name: 'Sunoco Oakland', address: '301 Craft Ave', city: 'Pittsburgh', state: 'PA', zip: '15213' },
  { id: '539ebff4-29da-4972-840c-dbd81a2886b5', name: 'Target Downtown', address: '482 Smithfield St', city: 'Pittsburgh', state: 'PA', zip: '15219' },
  { id: '51c4942a-28ec-4d13-b311-a5b2b2793c64', name: 'Target East Liberty', address: '6231 Penn Ave', city: 'Pittsburgh', state: 'PA', zip: '15206' },
  { id: '3493b203-9b59-49fb-a37c-f73b661b2c16', name: 'Target Fox Chapel', address: '2661 Freeport Rd', city: 'Pittsburgh', state: 'PA', zip: '15238' },
  { id: '06daab5a-e031-4718-b675-6dfeebd99e57', name: 'Target North Hills Blazier', address: '105 Blazier Dr', city: 'Pittsburgh', state: 'PA', zip: '15237' },
  { id: 'c4552f69-81ce-4523-898c-c5f90e3cd47a', name: 'Target Ross McKnight', address: '4801 McKnight Rd', city: 'Pittsburgh', state: 'PA', zip: '15237' },
  { id: '29a44a70-4712-4573-b494-34d7f47aaeeb', name: 'Target South Hills Village', address: '201 S Hills Village', city: 'Pittsburgh', state: 'PA', zip: '15241' },
  { id: '64ccffc0-a8fe-4f51-a841-c41ca69cd355', name: 'The Pitt Shop', address: '3939 Forbes Ave', city: 'Pittsburgh', state: 'PA', zip: '15213' },
  { id: '3781dacd-e0dd-4ffa-be88-a59f8c7bf2c6', name: 'University Store on Fifth', address: '4000 Fifth Ave', city: 'Pittsburgh', state: 'PA', zip: '15213' },
  { id: '30cf06a4-2c69-43a0-91e4-b20211a42708', name: 'Walgreens Centre Ave', address: '5956 Centre Ave', city: 'Pittsburgh', state: 'PA', zip: '15206' },
  { id: '71c3c37a-f2bd-4999-9a28-f9f79c20b350', name: 'Walgreens Penn Ave', address: '7628 Penn Ave', city: 'Pittsburgh', state: 'PA', zip: '15221' },
  { id: 'e1ba209a-ff43-49f9-8e2f-4fc33ecef2ca', name: 'Walgreens Forbes Ave', address: '1907 Forbes Ave', city: 'Pittsburgh', state: 'PA', zip: '15219' },
  { id: 'fa20b452-136e-4068-a5b6-76037bc7d4a3', name: 'Walgreens Mt Lebanon', address: '1000 Bower Hill Rd', city: 'Pittsburgh', state: 'PA', zip: '15243' },
  { id: 'd70a5115-1553-4f61-a514-012b3399fd3b', name: 'Walgreens Penn Hills Saltsburg', address: '6201 Saltsburg Rd', city: 'Pittsburgh', state: 'PA', zip: '15235' },
  { id: 'a2df9578-5d26-4deb-82ed-95f938065fe7', name: 'Walgreens Robinson Enterprise', address: '130 Enterprise Dr', city: 'Pittsburgh', state: 'PA', zip: '15275' },
  { id: 'd228db4a-0cca-4e01-9299-ab9e9696604e', name: 'Walgreens Ross McKnight', address: '4885 McKnight Rd', city: 'Pittsburgh', state: 'PA', zip: '15237' },
  { id: '01dcd1ae-34e8-417d-aea6-d71d3b198a96', name: 'Walgreens Upper St Clair', address: '1741 Washington Rd', city: 'Pittsburgh', state: 'PA', zip: '15241' },
  { id: '7f3fab5a-6d77-4435-a124-d6cdd64ac5db', name: 'Walmart Robinson Summit', address: '250 Summit Park Dr', city: 'Pittsburgh', state: 'PA', zip: '15275' },
  { id: '1caf23c6-a41b-4467-9f58-56b2621fd6dd', name: 'Sheetz Reading', address: '2246 Lancaster Pike', city: 'Reading', state: 'PA', zip: '19607' },
  { id: '10f77cdb-e817-4e66-bb73-d04d890bfb1b', name: 'Weis Markets Reading', address: '2020 N 13th St', city: 'Reading', state: 'PA', zip: '19604' },
  { id: '81ad8a19-4234-43e0-a88e-3b928a16218c', name: 'CVS State College', address: '116 W College Ave', city: 'State College', state: 'PA', zip: '16801' },
  { id: 'd70f38d3-6ae7-48f1-a9ad-5dc66417b4e4', name: 'Sheetz State College', address: '3261 W College Ave', city: 'State College', state: 'PA', zip: '16801' },
  { id: '2ae4f432-405e-47f8-8ee2-22e43acf03c9', name: 'Weis Markets State College', address: '1471 Martin St', city: 'State College', state: 'PA', zip: '16803' },
  { id: '0f307f1d-ff7d-4610-b0ee-3510a0fe9f14', name: 'Sheetz Whitehall', address: '5001 MacArthur Rd', city: 'Whitehall', state: 'PA', zip: '18052' },
  { id: '9af1b61d-3324-4a74-82ce-49a1cb8894ef', name: 'Aldi Wilkinsburg', address: '401 Penn Ave', city: 'Wilkinsburg', state: 'PA', zip: '15221' },
]

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function geocode(store) {
  const query = `${store.address}, ${store.city}, ${store.state} ${store.zip}`
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=us`

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'diet-coke-map-geocoder/1.0 (educational project)' }
    })
    const data = await res.json()
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), display: data[0].display_name }
    }
    return null
  } catch (e) {
    console.error(`  Error geocoding ${store.name}: ${e.message}`)
    return null
  }
}

function distance(lat1, lon1, lat2, lon2) {
  const R = 6371000 // meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

// Current coordinates from database
const CURRENT = {
  'b3b97da3-5876-4c9a-8094-a8b3bb1b9fe7': { lat: 40.60420000, lon: -75.49355000 },
  'a6ad3e32-6410-447c-bbc2-625196ea9d5d': { lat: 40.60833000, lon: -75.52333000 },
  'b7354a68-fd19-469a-8e96-93e9119b8bfb': { lat: 40.33897000, lon: -80.02604000 },
  'd7df0729-8afa-4512-a10d-fa73029304a8': { lat: 40.33460000, lon: -80.04720000 },
  '5491fd80-a917-4176-87cb-1fb2dec4975b': { lat: 40.39510000, lon: -80.08360000 },
  '8d8d0548-4fea-487e-bfbb-7ba33bbb1c09': { lat: 42.08814000, lon: -80.13729000 },
  'db79322c-838b-4afe-a1af-16398e5dfda9': { lat: 42.10449000, lon: -80.14992000 },
  'fed9ef3a-010f-4c94-a94a-de392219b910': { lat: 42.09741270, lon: -80.08112280 },
  'a9c11441-d424-4543-843f-ade2e4b618b5': { lat: 40.25380000, lon: -76.86640000 },
  '923202d8-a802-4aab-99e5-5c839961a006': { lat: 40.25590000, lon: -76.83975000 },
  '3bddf9fc-edfb-47fd-9e96-65c72039a876': { lat: 40.30256000, lon: -76.82157000 },
  '0a57ad2a-9763-46c5-a5f0-cb818616b5a4': { lat: 40.41270000, lon: -79.90790000 },
  'd12ac729-26df-40f8-83f3-1f0938c19d7a': { lat: 40.40830000, lon: -79.90080000 },
  'a8ed6d8f-1a72-420b-a74d-6cfc111dd35e': { lat: 40.04408670, lon: -76.30809970 },
  'e69c1715-b9f4-4440-8e79-a07e7ffba13d': { lat: 40.03680000, lon: -76.33170000 },
  'ac62d38e-8a89-4cb7-861d-fcb089fff45e': { lat: 40.07050000, lon: -76.39870000 },
  '1f019bc0-0f3d-468d-83c7-fcf1182f718c': { lat: 40.43726000, lon: -79.77978900 },
  '61badc32-101f-417a-952c-5b43ea5dfb6f': { lat: 40.43575000, lon: -79.77114000 },
  'c7532b8c-138f-4868-85ae-6e2db476a9fc': { lat: 40.39753290, lon: -79.76826130 },
  'f9df2517-317e-4898-ba3a-49df7ab0ccb7': { lat: 40.42810000, lon: -79.75650000 },
  'ac65d3bb-22f2-4286-ae86-a6945d97cda4': { lat: 40.50060000, lon: -80.20650000 },
  'fc46fbbb-6f5b-48c7-b868-0ced7d6dcead': { lat: 40.51560000, lon: -80.22412000 },
  '6bc479ff-3e89-49e3-b47a-6590fc9fe038': { lat: 40.46410000, lon: -79.81830000 },
  '40d54ffc-e67c-4e56-be01-704ff0e56232': { lat: 39.94980000, lon: -75.16973000 },
  'd7805646-e358-4c7e-9944-118ce64a3aa8': { lat: 40.07665000, lon: -75.02820000 },
  'f48c3b5c-fd53-46ae-9ecd-47a3f89ab639': { lat: 39.94942000, lon: -75.16145000 },
  '157b6b01-0956-4408-bca8-e9df34be2af3': { lat: 39.95063250, lon: -75.16918790 },
  '6fbf6346-ca92-4fa2-a77f-a530b9ae281f': { lat: 39.95228000, lon: -75.20207000 },
  'afaf6df8-ce39-4721-940f-ec6d3b65f958': { lat: 40.44933290, lon: -79.95104580 },
  '8fafc04a-1690-4e49-a626-de796d8ffc40': { lat: 40.40578320, lon: -80.03598940 },
  'ea93a083-154e-45dd-8c22-f748e88f2b59': { lat: 40.45430000, lon: -79.92340000 },
  '7a7b69db-0c64-49e7-8e4f-f6c408a92a5e': { lat: 40.46370000, lon: -79.93480000 },
  'd84baf05-49ec-4298-b7cd-a4d95234059c': { lat: 40.47420000, lon: -79.95740000 },
  '6508b72e-3da7-4894-b8f3-dae4f1e2293b': { lat: 40.38730000, lon: -80.00650000 },
  '8ed0327e-9595-430b-9948-a04feef57d4d': { lat: 40.54300000, lon: -80.02000000 },
  '27e80ba8-ea32-44a9-b33f-895df69754e4': { lat: 40.51930000, lon: -80.01350000 },
  'e17485fc-50c7-4ca2-8f2e-e5844cf6082a': { lat: 40.42700000, lon: -79.97410000 },
  '9aa14861-9598-402a-989c-092449155c99': { lat: 40.45350000, lon: -79.95000000 },
  '6a000b59-8074-48dc-9067-6e2821313083': { lat: 40.43542000, lon: -79.92193000 },
  '51b2bded-54f4-4517-845c-fd060f1f4c26': { lat: 40.41447310, lon: -79.92272960 },
  'ea9f59f9-298f-4ed6-aa3f-12ea26632982': { lat: 40.44180000, lon: -79.99890000 },
  '175e1a9d-fc87-466e-874e-f433621258d9': { lat: 40.35770000, lon: -79.98530000 },
  '43f6d99b-f64b-43df-999f-d8c279201b5b': { lat: 40.39556810, lon: -80.02358810 },
  'ef7e5898-8318-471d-abc0-25ee812a38ec': { lat: 40.42530000, lon: -80.08760000 },
  'd845e7f6-818c-49e8-be55-3690ef9918be': { lat: 40.40160000, lon: -80.01570000 },
  '4126949d-bcbf-40b1-b6e3-1dea71d13bac': { lat: 40.43810000, lon: -79.99580000 },
  'f4e06a75-e0d9-4e2c-bfdd-09f98c37a705': { lat: 40.58550000, lon: -80.03650000 },
  'a67e5b6f-7b09-43ef-b3bc-08c63a219647': { lat: 40.43882690, lon: -79.96058580 },
  '676d0f1f-cbb6-41d5-8280-6c305c9ff7dd': { lat: 40.46050000, lon: -79.83150000 },
  'cfaa1afb-c165-4298-a376-44b659032f48': { lat: 40.34670000, lon: -80.04910000 },
  '17d514b9-4256-4b9c-a70a-98d70d73ae58': { lat: 40.44010000, lon: -80.00270000 },
  '2340a43c-c34c-4cb4-a703-a67963ac56bd': { lat: 40.44230000, lon: -79.95670000 },
  '09d6a302-9aaa-4a9a-b169-5f75fbe61a51': { lat: 40.44830000, lon: -79.95040000 },
  'dfd148a0-8e06-4a7d-947f-413eb2420cae': { lat: 40.44320000, lon: -79.95320000 },
  'b9118d26-b1c6-4337-bfed-9038fab1f8ae': { lat: 40.43705000, lon: -79.95870000 },
  '6beb6a09-8297-4c84-a8ef-1b9c84b7d8f8': { lat: 40.50460000, lon: -80.05240000 },
  'bb3eccc5-8a27-47f0-bb64-ea3491ff3eac': { lat: 40.37213000, lon: -79.98160000 },
  '276d007c-2af6-4720-8aba-92d38e60c1f7': { lat: 40.42650000, lon: -79.89790000 },
  '92e8f4a9-f641-485a-a52a-e28f6b9dd859': { lat: 40.45190000, lon: -80.14710000 },
  'cf8e3052-218d-4434-8c4f-76e8b7c65e62': { lat: 40.44745000, lon: -80.16289000 },
  '36f05e8e-28fe-4ccd-b439-7d09efeebda7': { lat: 40.42710000, lon: -79.96660000 },
  '4341fe7f-d11c-402e-be57-d135276dad3f': { lat: 40.42999410, lon: -79.92318130 },
  '086c3f3c-7817-441e-b749-4f4b89ad7323': { lat: 40.45530000, lon: -79.92260000 },
  '1e03e1a4-cef2-4690-979a-83b617f3ba5f': { lat: 40.46990000, lon: -79.96050000 },
  '219d3f32-39c4-4831-9961-87b508b23dfb': { lat: 40.54554000, lon: -80.01647000 },
  'f65b48e0-e582-4407-8e15-b7c4e8880b0e': { lat: 40.42860000, lon: -79.92620000 },
  '2a8eab53-7395-4b49-835f-746dccad26cc': { lat: 40.45620000, lon: -80.01730000 },
  '58db15f9-3b3b-4fe9-bbfe-636ccdaa78fe': { lat: 40.41408000, lon: -79.85047000 },
  'd9601848-98c8-4c02-8db8-6c410439ecb8': { lat: 40.58571000, lon: -80.03713000 },
  'ba5d1653-1660-4873-b95f-e02d07e7a09c': { lat: 40.36000000, lon: -79.99500000 },
  'c2eb494e-7aa1-4bba-b2b9-bc8cc130a990': { lat: 40.50450000, lon: -80.05250000 },
  'b2d654bd-4ef1-4bff-a65c-bcbde835930d': { lat: 40.37210000, lon: -79.99270000 },
  '1475776b-6fa7-4ae5-b03f-e803cee61d1a': { lat: 40.45890000, lon: -79.82900000 },
  '5d59b861-3dde-4d56-8c7f-0f306186d526': { lat: 40.55010000, lon: -80.02180000 },
  'd4c99d40-9373-4dba-95f5-cb31ce2bd93b': { lat: 40.46323000, lon: -79.82416000 },
  '8b9ab545-b8b8-4e3d-91b4-375a0fb68d46': { lat: 40.45695000, lon: -79.93497000 },
  '8c67f799-5db2-4085-a160-57a925b3c265': { lat: 40.46329000, lon: -79.92237000 },
  'ef9b0422-0324-4a1b-91ac-a169a0510e1a': { lat: 40.39328000, lon: -80.06523000 },
  '837712c4-f39e-4101-930c-8ea4efd3c4ce': { lat: 40.49900000, lon: -79.89930000 },
  '0d94c58d-f8ef-42ed-bebe-72fd453cbe64': { lat: 40.43657290, lon: -79.95537570 },
  'ee0f2091-68d7-4900-b13a-9be9a428c5ba': { lat: 40.44000000, lon: -80.00200000 },
  '919ea472-ff1d-44db-a616-662648824833': { lat: 40.45080000, lon: -80.01900000 },
  '5a8f230a-f933-4fc4-842f-497881b980bc': { lat: 40.44140000, lon: -79.95670000 },
  '50d76abc-8cef-4ad8-a38a-3d4369aabd94': { lat: 40.43700000, lon: -79.95770000 },
  '3e09a57d-4904-4217-8e93-1d7e540e661f': { lat: 40.44150000, lon: -79.95680000 },
  'fb2450d1-7793-4c33-9e4b-a37cb4c908b6': { lat: 40.44370000, lon: -79.79480000 },
  '2c5fc23b-018c-4983-a46d-e1e04c95b50a': { lat: 40.48620000, lon: -79.90240000 },
  'eb68cea6-65f8-4a49-b9ab-aa29a6b0f52d': { lat: 40.56840000, lon: -80.03350000 },
  '14b7eebe-a3d6-4bf7-b083-4b8210cf83ab': { lat: 40.50930000, lon: -80.11180000 },
  '1457b6c6-7d3e-4890-a1c3-fae344fc3efe': { lat: 40.32036000, lon: -79.94189000 },
  'abd01dac-3bb2-45fa-a26b-539b4c528438': { lat: 40.33613440, lon: -79.97061420 },
  '5191081b-2a59-46c6-bf24-96421fc3b099': { lat: 40.49750000, lon: -79.76850000 },
  '1cc65d2b-29c2-431f-8ac7-4d8e6b9beaa5': { lat: 40.44574000, lon: -80.15871000 },
  'c9f9dd98-a2e9-4da3-8de9-506abaad8544': { lat: 40.51720000, lon: -80.02080000 },
  '0f2d8543-2226-4531-9d58-910ca49a28f6': { lat: 40.48860000, lon: -80.07110000 },
  '1679a2ce-0561-4419-aa78-0575ceafc2a5': { lat: 40.44080000, lon: -79.95660000 },
  '539ebff4-29da-4972-840c-dbd81a2886b5': { lat: 40.43760000, lon: -79.99640000 },
  '51c4942a-28ec-4d13-b311-a5b2b2793c64': { lat: 40.45910000, lon: -79.92210000 },
  '3493b203-9b59-49fb-a37c-f73b661b2c16': { lat: 40.48440000, lon: -79.89930000 },
  '06daab5a-e031-4718-b675-6dfeebd99e57': { lat: 40.55030000, lon: -80.02180000 },
  'c4552f69-81ce-4523-898c-c5f90e3cd47a': { lat: 40.51800000, lon: -80.01830000 },
  '29a44a70-4712-4573-b494-34d7f47aaeeb': { lat: 40.34610000, lon: -80.04870000 },
  '64ccffc0-a8fe-4f51-a841-c41ca69cd355': { lat: 40.44260000, lon: -79.95430000 },
  '3781dacd-e0dd-4ffa-be88-a59f8c7bf2c6': { lat: 40.44430000, lon: -79.95510000 },
  '30cf06a4-2c69-43a0-91e4-b20211a42708': { lat: 40.45730000, lon: -79.92800000 },
  '71c3c37a-f2bd-4999-9a28-f9f79c20b350': { lat: 40.44880000, lon: -79.85350000 },
  'e1ba209a-ff43-49f9-8e2f-4fc33ecef2ca': { lat: 40.43960000, lon: -79.98920000 },
  'fa20b452-136e-4068-a5b6-76037bc7d4a3': { lat: 40.37490000, lon: -80.04890000 },
  'd70a5115-1553-4f61-a514-012b3399fd3b': { lat: 40.45950000, lon: -79.82500000 },
  'a2df9578-5d26-4deb-82ed-95f938065fe7': { lat: 40.50280000, lon: -80.19620000 },
  'd228db4a-0cca-4e01-9299-ab9e9696604e': { lat: 40.51860000, lon: -80.01680000 },
  '01dcd1ae-34e8-417d-aea6-d71d3b198a96': { lat: 40.34660000, lon: -80.04910000 },
  '7f3fab5a-6d77-4435-a124-d6cdd64ac5db': { lat: 40.50210000, lon: -80.21180000 },
  '1caf23c6-a41b-4467-9f58-56b2621fd6dd': { lat: 40.30689390, lon: -75.97900760 },
  '10f77cdb-e817-4e66-bb73-d04d890bfb1b': { lat: 40.36607360, lon: -75.91131930 },
  '81ad8a19-4234-43e0-a88e-3b928a16218c': { lat: 40.79401620, lon: -77.86191570 },
  'd70f38d3-6ae7-48f1-a9ad-5dc66417b4e4': { lat: 40.79050000, lon: -77.91250000 },
  '2ae4f432-405e-47f8-8ee2-22e43acf03c9': { lat: 40.80493000, lon: -77.89039000 },
  '0f307f1d-ff7d-4610-b0ee-3510a0fe9f14': { lat: 40.67371460, lon: -75.51594640 },
  '9af1b61d-3324-4a74-82ce-49a1cb8894ef': { lat: 40.44050000, lon: -79.87320000 },
}

const THRESHOLD_METERS = 150 // flag if > 150m off

async function main() {
  const updates = []
  const skipped = []
  const errors = []

  console.log(`Geocoding ${STORES.length} stores via Nominatim...\n`)

  for (const store of STORES) {
    const current = CURRENT[store.id]
    process.stdout.write(`  [${STORES.indexOf(store)+1}/${STORES.length}] ${store.name} (${store.address}, ${store.city})... `)

    const result = await geocode(store)
    await sleep(1100) // Nominatim rate limit: 1 req/sec

    if (!result) {
      console.log('NO RESULT')
      errors.push({ store, reason: 'No geocoding result' })
      continue
    }

    const dist = distance(current.lat, current.lon, result.lat, result.lon)

    if (dist > THRESHOLD_METERS) {
      console.log(`MISMATCH (${Math.round(dist)}m off) → new: ${result.lat.toFixed(6)}, ${result.lon.toFixed(6)}`)
      updates.push({ store, current, geocoded: result, dist: Math.round(dist) })
    } else {
      console.log(`OK (${Math.round(dist)}m)`)
      skipped.push({ store, dist: Math.round(dist) })
    }
  }

  console.log(`\n=== Summary ===`)
  console.log(`OK: ${skipped.length} stores`)
  console.log(`Mismatches: ${updates.length} stores need coordinate updates`)
  console.log(`Errors: ${errors.length} stores could not be geocoded`)

  if (updates.length === 0 && errors.length === 0) {
    console.log('\nAll coordinates are accurate. No migration needed.')
    return
  }

  // Generate SQL migration
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
  const filename = `${timestamp}_fix_store_coordinates.sql`
  const filepath = path.join(__dirname, '..', 'supabase', 'migrations', filename)

  const lines = [
    `-- Fix store coordinates: ${updates.length} stores updated based on Nominatim geocoding`,
    `-- Generated: ${new Date().toISOString()}`,
    `-- Threshold: > ${THRESHOLD_METERS}m discrepancy triggers update`,
    '',
  ]

  for (const { store, current, geocoded, dist } of updates) {
    lines.push(`-- ${store.name}: ${store.address}, ${store.city} (was ${dist}m off)`)
    lines.push(`-- Old: ${current.lat}, ${current.lon}`)
    lines.push(`-- New (Nominatim): ${geocoded.lat.toFixed(8)}, ${geocoded.lon.toFixed(8)}`)
    lines.push(`UPDATE stores SET latitude = ${geocoded.lat.toFixed(8)}, longitude = ${geocoded.lon.toFixed(8)}, updated_at = NOW() WHERE id = '${store.id}';`)
    lines.push('')
  }

  if (errors.length > 0) {
    lines.push('-- Stores that could not be geocoded (manual review needed):')
    for (const { store, reason } of errors) {
      lines.push(`-- ${store.name}: ${store.address}, ${store.city} — ${reason}`)
    }
  }

  fs.writeFileSync(filepath, lines.join('\n'))
  console.log(`\nMigration written to: supabase/migrations/${filename}`)

  if (updates.length > 0) {
    console.log('\nStores needing updates:')
    for (const { store, current, geocoded, dist } of updates) {
      console.log(`  ${store.name} (${store.city}): ${dist}m off`)
      console.log(`    Old: ${current.lat}, ${current.lon}`)
      console.log(`    New: ${geocoded.lat.toFixed(8)}, ${geocoded.lon.toFixed(8)}`)
    }
  }
}

main().catch(console.error)
