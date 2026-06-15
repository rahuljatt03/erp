/**
 * Seed quotations. Delete `erp:quotations` in localStorage to reset.
 *
 * @type {import('./quotation.types').Quotation[]}
 */
export const seedQuotations = [
  {
    id: 'qt_seed_1',
    quoteNo: 'QT-2026-0001',
    customerName: 'Northwind Pumps',
    customerContact: 'purchasing@northwind.example',
    sourceInquiryId: null,
    sourceInquiryNo: '',
    quoteDate: '2026-06-10',
    validUntil: '2026-07-10',
    status: 'sent',
    notes: 'Pricing valid for 30 days. Lead time 4–6 weeks.',
    createdBy: 'Operations User',
    createdAt: '2026-06-10T09:00:00.000Z',
    updatedAt: '2026-06-10T09:00:00.000Z',
    items: [
      {
        id: 'qti_s1',
        productName: 'Brass Gate Valve',
        productCode: 'VLV-22',
        quantity: 50,
        unit: 'pcs',
        deliveryDate: '2026-07-30',
        unitPrice: 19.5,
      },
      {
        id: 'qti_s2',
        productName: 'Stainless Coupling',
        productCode: 'CPL-08',
        quantity: 120,
        unit: 'pcs',
        deliveryDate: '2026-07-30',
        unitPrice: 6.25,
      },
    ],
  },
];
