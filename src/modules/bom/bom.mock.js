/**
 * Seed bills of materials — per-unit recipes for the seeded products. These are
 * what the requirement analysis prefers over the inquiry's line totals. Delete
 * `erp:boms` in localStorage to reset.
 *
 * @type {import('./bom.types').Bom[]}
 */
export const seedBoms = [
  {
    id: 'bom_seed_1',
    productName: 'Cast Iron Pump Housing',
    productCode: 'PH-450',
    finishedGoodId: 'fg_1',
    outputUnit: 'pcs',
    status: 'active',
    notes: 'Sand-casting recipe, per housing.',
    createdBy: 'Operations User',
    createdAt: '2026-05-20T09:00:00.000Z',
    updatedAt: '2026-05-20T09:00:00.000Z',
    components: [
      { id: 'bc_s1', materialName: 'Grey Cast Iron FG260', materialCode: 'CI-FG260', rawMaterialId: 'rw_1', quantityPerUnit: 12.5, unit: 'kg' },
      { id: 'bc_s2', materialName: 'Foundry Sand', materialCode: 'SAND-01', rawMaterialId: 'rw_2', quantityPerUnit: 6, unit: 'kg' },
    ],
  },
  {
    id: 'bom_seed_2',
    productName: 'Stainless Impeller',
    productCode: 'IM-12S',
    finishedGoodId: 'fg_2',
    outputUnit: 'pcs',
    status: 'active',
    notes: 'Machined from bar stock.',
    createdBy: 'Operations User',
    createdAt: '2026-05-20T09:10:00.000Z',
    updatedAt: '2026-05-20T09:10:00.000Z',
    components: [
      { id: 'bc_s3', materialName: 'SS 316 Bar Stock', materialCode: 'SS316-BAR', rawMaterialId: 'rw_3', quantityPerUnit: 3.5, unit: 'kg' },
    ],
  },
  {
    id: 'bom_seed_3',
    productName: 'Oak Office Desk',
    productCode: 'DSK-OAK-160',
    finishedGoodId: 'fg_3',
    outputUnit: 'pcs',
    status: 'active',
    notes: '',
    createdBy: 'Operations User',
    createdAt: '2026-05-22T11:00:00.000Z',
    updatedAt: '2026-05-22T11:00:00.000Z',
    components: [
      { id: 'bc_s4', materialName: 'Oak Wood Plank', materialCode: 'OAK-PLK', rawMaterialId: 'rw_4', quantityPerUnit: 2.5, unit: 'sheet' },
      { id: 'bc_s5', materialName: 'Steel Leg Frame', materialCode: 'LEG-STL', rawMaterialId: 'rw_5', quantityPerUnit: 4, unit: 'pcs' },
      { id: 'bc_s6', materialName: 'Matte Lacquer', materialCode: 'LACQ-MT', rawMaterialId: 'rw_6', quantityPerUnit: 1.5, unit: 'l' },
    ],
  },
  {
    id: 'bom_seed_4',
    productName: 'PCB Control Board',
    productCode: 'PCB-CTRL-7',
    finishedGoodId: 'fg_4',
    outputUnit: 'pcs',
    status: 'active',
    notes: 'RoHS components only.',
    createdBy: 'Operations User',
    createdAt: '2026-05-25T14:00:00.000Z',
    updatedAt: '2026-05-25T14:00:00.000Z',
    components: [
      { id: 'bc_s7', materialName: 'FR4 Laminate Sheet', materialCode: 'FR4', rawMaterialId: 'rw_7', quantityPerUnit: 0.12, unit: 'sheet' },
      { id: 'bc_s8', materialName: 'Surface-mount Resistors', materialCode: 'SMD-RES', rawMaterialId: 'rw_8', quantityPerUnit: 24, unit: 'pcs' },
      { id: 'bc_s9', materialName: 'Solder Paste', materialCode: 'SOLDER-P', rawMaterialId: 'rw_9', quantityPerUnit: 0.016, unit: 'kg' },
    ],
  },
];
