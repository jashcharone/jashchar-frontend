/**
 * Template 04: Maroon Heritage
 * Maroon & cream, heritage look with double border
 * Paper: A5 Landscape | Category: Professional
 */
import React from 'react';
import { format } from 'date-fns';

const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (num === 0) return 'Zero';
  if (num < 0) return 'Minus ' + numberToWords(-num);
  let words = '';
  if (Math.floor(num / 10000000) > 0) { words += numberToWords(Math.floor(num / 10000000)) + ' Crore '; num %= 10000000; }
  if (Math.floor(num / 100000) > 0) { words += numberToWords(Math.floor(num / 100000)) + ' Lakh '; num %= 100000; }
  if (Math.floor(num / 1000) > 0) { words += numberToWords(Math.floor(num / 1000)) + ' Thousand '; num %= 1000; }
  if (Math.floor(num / 100) > 0) { words += numberToWords(Math.floor(num / 100)) + ' Hundred '; num %= 100; }
  if (num > 0) { if (num < 20) words += ones[num]; else words += tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : ''); }
  return words.trim();
};

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Template04_MaroonHeritage = ({ receiptData, copyType }) => {
  const {
    student, school, lineItems = [], feeStatement = [],
    totalPaid, totalDiscount, totalFine, grandTotal,
    overallTotalAmount = 0, overallBalance = 0,
    transactionId, receiptDate, paymentMode,
    extraInfo, isRefund, isOriginal, printSettings,
    sessionName, title = 'FEE RECEIPT'
  } = receiptData;

  const amountInWords = numberToWords(Math.floor(grandTotal)) + ' Rupees Only';
  const showConcession = totalDiscount > 0;

  return (
    <div style={{ width: '200mm', height: '140mm', boxSizing: 'border-box', pageBreakInside: 'avoid', position: 'relative', backgroundColor: '#fffdd0', color: '#000', fontFamily: 'Georgia, serif', border: '3px double #800000', overflow: 'hidden' }}>
      
      {/* Corner ornaments */}
      <div style={{ position: 'absolute', top: '3px', left: '3px', width: '20px', height: '20px', borderTop: '2px solid #800000', borderLeft: '2px solid #800000' }}></div>
      <div style={{ position: 'absolute', top: '3px', right: '3px', width: '20px', height: '20px', borderTop: '2px solid #800000', borderRight: '2px solid #800000' }}></div>
      <div style={{ position: 'absolute', bottom: '3px', left: '3px', width: '20px', height: '20px', borderBottom: '2px solid #800000', borderLeft: '2px solid #800000' }}></div>
      <div style={{ position: 'absolute', bottom: '3px', right: '3px', width: '20px', height: '20px', borderBottom: '2px solid #800000', borderRight: '2px solid #800000' }}></div>

      {/* HEADER */}
      {printSettings?.header_image_url ? (
        <div style={{ width: '100%' }}><img src={printSettings.header_image_url} alt='Header' style={{ width: '100%', height: 'auto', display: 'block' }} /></div>
      ) : (
        <div style={{ padding: '10px 20px', textAlign: 'center', borderBottom: '2px solid #800000' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <h1 style={{ fontSize: '16px', fontWeight: 'bold', color: '#800000', margin: 0, letterSpacing: '3px', textTransform: 'uppercase' }}>{school?.name || '-'}</h1>
              {school?.address && <p style={{ fontSize: '9px', color: '#666', margin: '3px 0 0', backgroundColor: '#fffdd0', padding: '2px 8px' }}>{school.address}</p>}
            </div>
            {school?.logo_url && <img src={school.logo_url} alt='Logo' style={{ height: '50px', width: 'auto', borderRadius: '50%', border: '2px solid #800000' }} />}
          </div>
        </div>
      )}

      {/* TITLE - Decorative serif */}
      <div style={{ textAlign: 'center', padding: '4px 15px', borderBottom: '1px solid #800000' }}>
        <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#800000', fontFamily: 'Georgia, serif', borderBottom: '2px solid #800000', paddingBottom: '2px', letterSpacing: '4px' }}>
          ✦ {title} ✦
        </span>
        {!isOriginal && <span style={{ fontSize: '8px', color: '#fff', backgroundColor: '#c62828', padding: '2px 6px', borderRadius: '3px', marginLeft: '8px' }}>REPRINT</span>}
        <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#fff', backgroundColor: copyType === 'OFFICE COPY' ? '#800000' : copyType === 'STUDENT COPY' ? '#1565c0' : '#2e7d32', padding: '2px 8px', borderRadius: '3px', marginLeft: '6px' }}>{copyType}</span>
      </div>

      {/* RECEIPT ACKNOWLEDGMENT - Prose Format */}
      <div style={{ padding: '8px 20px', fontSize: '9px', borderBottom: '1px solid #ddd', lineHeight: '1.6' }}>
        <p style={{ margin: '0 0 4px', fontSize: '8px', color: '#666' }}>
          <strong style={{ color: '#800000' }}>Receipt No:</strong> {transactionId || '-'} &nbsp;|&nbsp;
          <strong style={{ color: '#800000' }}>Date:</strong> {receiptDate ? format(new Date(receiptDate), 'dd MMM yyyy') : '-'} &nbsp;|&nbsp;
          <strong style={{ color: '#800000' }}>Session:</strong> {sessionName || '-'}
        </p>
        <p style={{ margin: 0, textIndent: '20px' }}>
          Received with thanks from <strong>Shri/Smt. {student?.father_name || '______'}</strong>,{' '}
          parent/guardian of <strong style={{ color: '#800000' }}>{student?.full_name || '______'}</strong>,{' '}
          Admission No. <strong>{student?.school_code || student?.admission_no || '______'}</strong>,{' '}
          studying in Class <strong>{student?.class?.name || '______'}{student?.section?.name ? ` (${student.section.name})` : ''}</strong>,{' '}
          the sum as detailed below via <strong>{paymentMode || 'Cash'}</strong>:
        </p>
      </div>

      {/* FEE DETAILS - Numbered List Format */}
      <div style={{ padding: '6px 20px', fontSize: '9px' }}>
        {lineItems.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px dotted #ccc' }}>
            <span>
              <strong style={{ color: '#800000' }}>({idx + 1})</strong>{' '}
              Towards <em>{item.description}</em>
              {Number(item.discount || 0) > 0 && <span style={{ fontSize: '8px', color: '#666' }}> (less concession \u20b9{fmt(item.discount)})</span>}
            </span>
            <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>\u20b9 {fmt(item.amount)}</span>
          </div>
        ))}
        {totalFine > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px dotted #ccc', color: '#c00' }}>
            <span><strong>({lineItems.length + 1})</strong> Late Fine</span>
            <span style={{ fontWeight: 'bold' }}>+ \u20b9 {fmt(totalFine)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderTop: '2px solid #800000', marginTop: '4px' }}>
          <span style={{ fontWeight: 'bold', color: '#800000', fontSize: '10px' }}>{isRefund ? 'Total Refund' : 'Total Amount Received'}</span>
          <span style={{ fontWeight: 'bold', color: '#800000', fontSize: '10px' }}>\u20b9 {fmt(grandTotal)}</span>
        </div>
      </div>

      {/* AMOUNT IN WORDS - Ornamental Box */}
      <div style={{ margin: '4px 20px', padding: '5px 12px', border: '2px solid #800000', borderRadius: '3px', fontSize: '9px', backgroundColor: '#fff', textAlign: 'center' }}>
        {`\u2766`} <strong>In Words:</strong> <em>{amountInWords}</em> {`\u2766`}
      </div>
      {overallBalance > 0 && (
        <div style={{ padding: '3px 20px', fontSize: '8px', textAlign: 'right', color: '#c00', fontStyle: 'italic' }}>
          Balance Remaining: \u20b9{fmt(overallBalance)}
        </div>
      )}

      {/* FOOTER */}
      {printSettings?.footer_content ? (
        <div style={{ padding: '6px 20px', borderTop: '1px solid #800000', color: '#333', lineHeight: '1.4' }} className="receipt-footer-content" dangerouslySetInnerHTML={{ __html: printSettings.footer_content }} />
      ) : (
        <div style={{ padding: '4px 20px', fontSize: '8px', color: '#800000', fontStyle: 'italic', textAlign: 'center' }}>
          Preserve this receipt for future reference
        </div>
      )}

      {isRefund && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)', opacity: 0.08, pointerEvents: 'none' }}>
          <span style={{ fontSize: '48px', fontWeight: 'bold', color: 'red' }}>REFUND</span>
        </div>
      )}
    </div>
  );
};

Template04_MaroonHeritage.templateMeta = {
  key: 'maroon_heritage',
  name: 'Maroon Heritage',
  description: 'Maroon & cream, heritage look with double border and corner ornaments',
  category: 'professional',
  paperSize: 'A5',
  orientation: 'landscape',
  features: ['fee_statement', 'amount_in_words', 'copy_type', 'corner_ornaments'],
  colorScheme: { primary: '#800000', secondary: '#fffdd0', accent: '#c62828' }
};

export default Template04_MaroonHeritage;
