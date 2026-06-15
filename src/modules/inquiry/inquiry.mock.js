/**
 * Seed inquiries — loaded into localStorage the first time the app runs so the
 * module looks alive. Delete the `erp:inquiries` localStorage key to reset.
 *
 * @type {import('./inquiry.types').Inquiry[]}
 */
export const seedInquiries = [
  {
    id: 'inq_seed_1',
    inquiryNo: 'INQ-2026-0001',
    customerName: 'Apex Industrial Pumps',
    customerContact: 'procurement@apexpumps.com',
    inquiryDate: '2026-06-02',
    status: 'under_review',
    createdBy: 'Operations User',
    createdAt: '2026-06-02T09:15:00.000Z',
    updatedAt: '2026-06-05T11:30:00.000Z',
    notes: 'Customer needs delivery before their plant shutdown in August.',
    items: [
      {
        id: 'item_seed_1',
        productName: 'Cast Iron Pump Housing',
        productCode: 'PH-450',
        quantity: 120,
        unit: 'pcs',
        targetDeliveryDate: '2026-07-20',
        remarks: 'Machined finish, tolerance ±0.1mm',
        rawMaterials: [
          { id: 'rm_s1', materialName: 'Grey Cast Iron FG260', quantity: 1500, unit: 'kg' },
          { id: 'rm_s2', materialName: 'Foundry Sand', quantity: 800, unit: 'kg' },
        ],
      },
      {
        id: 'item_seed_2',
        productName: 'Stainless Impeller',
        productCode: 'IM-12S',
        quantity: 120,
        unit: 'pcs',
        targetDeliveryDate: '2026-07-25',
        remarks: '',
        rawMaterials: [{ id: 'rm_s3', materialName: 'SS 316 Bar Stock', quantity: 420, unit: 'kg' }],
      },
    ],
  },
  {
    id: 'inq_seed_2',
    inquiryNo: 'INQ-2026-0002',
    customerName: 'Northwind Furniture Co.',
    customerContact: '+1 555 0142',
    inquiryDate: '2026-06-08',
    status: 'submitted',
    createdBy: 'Operations User',
    createdAt: '2026-06-08T14:05:00.000Z',
    updatedAt: '2026-06-08T14:05:00.000Z',
    notes: '',
    items: [
      {
        id: 'item_seed_3',
        productName: 'Oak Office Desk',
        productCode: 'DSK-OAK-160',
        quantity: 40,
        unit: 'pcs',
        targetDeliveryDate: '2026-08-15',
        remarks: 'Matte lacquer finish',
        rawMaterials: [
          { id: 'rm_s4', materialName: 'Oak Wood Plank', quantity: 95, unit: 'sheet' },
          { id: 'rm_s5', materialName: 'Steel Leg Frame', quantity: 160, unit: 'pcs' },
          { id: 'rm_s6', materialName: 'Matte Lacquer', quantity: 60, unit: 'l' },
        ],
      },
    ],
  },
  {
    id: 'inq_seed_3',
    inquiryNo: 'INQ-2026-0003',
    customerName: 'Volt Electronics Ltd.',
    customerContact: 'sourcing@volt.example',
    inquiryDate: '2026-06-11',
    status: 'draft',
    createdBy: 'Operations User',
    createdAt: '2026-06-11T08:40:00.000Z',
    updatedAt: '2026-06-11T08:40:00.000Z',
    notes: 'Awaiting confirmation on quantity.',
    items: [
      {
        id: 'item_seed_4',
        productName: 'PCB Control Board',
        productCode: 'PCB-CTRL-7',
        quantity: 500,
        unit: 'pcs',
        targetDeliveryDate: '2026-09-01',
        remarks: 'RoHS compliant components only',
        rawMaterials: [
          { id: 'rm_s7', materialName: 'FR4 Laminate Sheet', quantity: 60, unit: 'sheet' },
          { id: 'rm_s8', materialName: 'Surface-mount Resistors', quantity: 12000, unit: 'pcs' },
          { id: 'rm_s9', materialName: 'Solder Paste', quantity: 8, unit: 'kg' },
        ],
      },
    ],
  },
];
