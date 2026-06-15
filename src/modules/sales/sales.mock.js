/**
 * Seed sales orders. Delete `erp:sales_orders` in localStorage to reset.
 *
 * @type {import('./sales.types').SalesOrder[]}
 */
export const seedSalesOrders = [
  {
    id: 'so_seed_1',
    soNo: 'SO-2026-0001',
    customerName: 'Harbor Logistics',
    customerContact: 'orders@harbor.example',
    sourceInquiryId: null,
    sourceInquiryNo: '',
    orderDate: '2026-06-09',
    expectedDeliveryDate: '2026-07-30',
    status: 'confirmed',
    notes: 'Direct repeat order.',
    createdBy: 'Operations User',
    createdAt: '2026-06-09T10:00:00.000Z',
    updatedAt: '2026-06-09T10:00:00.000Z',
    items: [
      {
        id: 'soi_s1',
        productName: 'Brass Gate Valve',
        productCode: 'VLV-22',
        quantity: 50,
        unit: 'pcs',
        deliveryDate: '2026-07-30',
        unitPrice: 18.5,
      },
    ],
  },
];
