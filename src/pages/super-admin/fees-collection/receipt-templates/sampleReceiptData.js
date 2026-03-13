/**
 * Sample Receipt Data
 * ===================
 * Used for template preview in the ReceiptTemplates gallery page
 * Contains realistic sample data matching the receiptData structure
 */

export const sampleReceiptData = {
  student: {
    full_name: 'RAJESH KUMAR S',
    father_name: 'Suresh Kumar',
    school_code: 'SSV-2025-001',
    admission_no: 'ADM001',
    class: { name: '10th Standard' },
    section: { name: 'A' }
  },
  school: {
    name: 'Sri Saraswati Vidya Kendra',
    address: '#123, MG Road, Bangalore - 560001, Karnataka',
    contact_number: '080-12345678',
    contact_email: 'info@ssvk.edu.in',
    logo_url: null
  },
  lineItems: [
    { description: 'Tuition Fee', totalAmount: 25000, amount: 12500, discount: 0, balance: 12500, fine: 0 },
    { description: 'Library Fee', totalAmount: 2000, amount: 2000, discount: 500, balance: 0, fine: 0 },
    { description: 'Lab Fee', totalAmount: 3000, amount: 3000, discount: 0, balance: 0, fine: 0 },
    { description: 'Transport Fee', totalAmount: 8000, amount: 4000, discount: 0, balance: 4000, fine: 0 }
  ],
  feeStatement: [
    { name: 'Tuition Fee', amount: 25000, paid: 12500, balance: 12500, status: 'Partial' },
    { name: 'Library Fee', amount: 2000, paid: 2000, balance: 0, status: 'Paid' },
    { name: 'Lab Fee', amount: 3000, paid: 3000, balance: 0, status: 'Paid' },
    { name: 'Transport Fee', amount: 8000, paid: 4000, balance: 4000, status: 'Partial' },
    { name: 'Hostel Fee', amount: 15000, paid: 0, balance: 15000, status: 'Pending' }
  ],
  totalPaid: 21500,
  totalDiscount: 500,
  totalFine: 0,
  grandTotal: 21500,
  overallTotalAmount: 38000,
  overallBalance: 16500,
  transactionId: 'TXN-20260215-A1B2C3D4',
  receiptDate: new Date().toISOString(),
  paymentMode: 'Cash',
  remarks: '',
  extraInfo: null,
  isRefund: false,
  isOriginal: true,
  printSettings: {
    header_image_url: null,
    footer_content: '<p style="text-align:center;font-size:8px;color:#666;">This is a computer generated receipt. No signature required.</p>'
  },
  sessionName: '2025-2026',
  title: 'FEE RECEIPT'
};

/**
 * Sample data for refund receipt preview
 */
export const sampleRefundData = {
  ...sampleReceiptData,
  title: 'REFUND RECEIPT',
  isRefund: true,
  lineItems: [
    { description: 'Tuition Fee (Refund)', totalAmount: 25000, amount: 5000, discount: 0, balance: 0, fine: 0 }
  ],
  grandTotal: 5000,
  totalPaid: 5000,
  totalDiscount: 0,
  totalFine: 0,
  overallTotalAmount: 25000,
  overallBalance: 0,
  transactionId: 'REF-20260215-X9Y8Z7W6'
};

export default sampleReceiptData;
