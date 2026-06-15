/**
 * Seed purchase orders. Delete `erp:purchase_orders` in localStorage to reset.
 *
 * @type {import('./procurement.types').PurchaseOrder[]}
 */
export const seedPurchaseOrders = [
  {
    id: 'po_seed_1',
    poNo: 'PO-2026-0001',
    supplierName: 'Meridian Metals Supply',
    supplierContact: 'sales@meridianmetals.example',
    status: 'ordered',
    orderDate: '2026-06-06',
    expectedDate: '2026-06-18',
    sourceInquiryId: 'inq_seed_1',
    sourceInquiryNo: 'INQ-2026-0001',
    notes: 'Generated from requirement analysis of INQ-2026-0001.',
    createdBy: 'Operations User',
    createdAt: '2026-06-06T10:00:00.000Z',
    updatedAt: '2026-06-06T10:00:00.000Z',
    items: [
      {
        id: 'poi_s1',
        materialName: 'Grey Cast Iron FG260',
        materialCode: 'CI-FG260',
        rawMaterialId: 'rw_1',
        quantity: 625,
        unit: 'kg',
        unitPrice: 1.2,
        receivedQty: 0,
      },
      {
        id: 'poi_s2',
        materialName: 'SS 316 Bar Stock',
        materialCode: 'SS316-BAR',
        rawMaterialId: 'rw_3',
        quantity: 320,
        unit: 'kg',
        unitPrice: 4.5,
        receivedQty: 0,
      },
    ],
  },
];
