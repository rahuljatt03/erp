/**
 * Seed stock. Names/SKUs deliberately overlap the inquiry seed data so the
 * requirement analysis shows a realistic mix of "in stock", "build" and
 * "purchase" outcomes. Delete `erp:finished_goods` / `erp:raw_materials` in
 * localStorage to reset.
 */

/** @type {import('./inventory.types').FinishedGood[]} */
export const seedFinishedGoods = [
  { id: 'fg_1', sku: 'PH-450', name: 'Cast Iron Pump Housing', unit: 'pcs', onHand: 30 },
  { id: 'fg_2', sku: 'IM-12S', name: 'Stainless Impeller', unit: 'pcs', onHand: 0 },
  { id: 'fg_3', sku: 'DSK-OAK-160', name: 'Oak Office Desk', unit: 'pcs', onHand: 10 },
  { id: 'fg_4', sku: 'PCB-CTRL-7', name: 'PCB Control Board', unit: 'pcs', onHand: 0 },
  { id: 'fg_5', sku: 'VLV-22', name: 'Brass Gate Valve', unit: 'pcs', onHand: 75 },
];

/** @type {import('./inventory.types').RawMaterialStock[]} */
export const seedRawMaterials = [
  { id: 'rw_1', code: 'CI-FG260', name: 'Grey Cast Iron FG260', unit: 'kg', onHand: 500 },
  { id: 'rw_2', code: 'SAND-01', name: 'Foundry Sand', unit: 'kg', onHand: 2000 },
  { id: 'rw_3', code: 'SS316-BAR', name: 'SS 316 Bar Stock', unit: 'kg', onHand: 100 },
  { id: 'rw_4', code: 'OAK-PLK', name: 'Oak Wood Plank', unit: 'sheet', onHand: 40 },
  { id: 'rw_5', code: 'LEG-STL', name: 'Steel Leg Frame', unit: 'pcs', onHand: 200 },
  { id: 'rw_6', code: 'LACQ-MT', name: 'Matte Lacquer', unit: 'l', onHand: 100 },
  { id: 'rw_7', code: 'FR4', name: 'FR4 Laminate Sheet', unit: 'sheet', onHand: 20 },
  { id: 'rw_8', code: 'SMD-RES', name: 'Surface-mount Resistors', unit: 'pcs', onHand: 5000 },
  { id: 'rw_9', code: 'SOLDER-P', name: 'Solder Paste', unit: 'kg', onHand: 10 },
];
