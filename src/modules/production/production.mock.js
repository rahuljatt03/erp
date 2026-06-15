/**
 * Seed production orders. Delete `erp:production_orders` in localStorage to reset.
 *
 * @type {import('./production.types').ProductionOrder[]}
 */
export const seedProductionOrders = [
  {
    id: 'wo_seed_1',
    woNo: 'WO-2026-0001',
    productName: 'PCB Control Board',
    productCode: 'PCB-CTRL-7',
    finishedGoodId: 'fg_4',
    quantity: 500,
    unit: 'pcs',
    producedQty: 0,
    status: 'planned',
    dueDate: '2026-08-25',
    sourceInquiryId: 'inq_seed_3',
    sourceInquiryNo: 'INQ-2026-0003',
    notes: 'Built from requirement analysis of INQ-2026-0003.',
    createdBy: 'Operations User',
    createdAt: '2026-06-11T09:00:00.000Z',
    updatedAt: '2026-06-11T09:00:00.000Z',
    materials: [
      { id: 'wom_s1', materialName: 'FR4 Laminate Sheet', materialCode: 'FR4', rawMaterialId: 'rw_7', quantity: 60, unit: 'sheet', consumedQty: 0 },
      { id: 'wom_s2', materialName: 'Surface-mount Resistors', materialCode: 'SMD-RES', rawMaterialId: 'rw_8', quantity: 12000, unit: 'pcs', consumedQty: 0 },
      { id: 'wom_s3', materialName: 'Solder Paste', materialCode: 'SOLDER-P', rawMaterialId: 'rw_9', quantity: 8, unit: 'kg', consumedQty: 0 },
    ],
  },
];
