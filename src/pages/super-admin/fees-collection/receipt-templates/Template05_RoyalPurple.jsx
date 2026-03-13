/**
 * Template 05: Royal Purple
 * Deep purple & silver, prestigious
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

const Template05_RoyalPurple = ({ receiptData, copyType }) => {
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
    <div style={{ width: '200mm', height: '140mm', boxSizing: 'border-box', pageBreakInside: 'avoid', position: 'relative', backgroundColor: '#fff', color: '#000', fontFamily: 'Arial, sans-serif', border: '1px solid #4a148c', overflow: 'hidden' }}>
      
      {/* HEADER - Purple gradient */}
      {printSettings?.header_image_url ? (
        <div style={{ width: '100%' }}><img src={printSettings.header_image_url} alt='Header' style={{ width: '100%', height: 'auto', display: 'block' }} /></div>
      ) : (
        <div style={{ background: 'linear-gradient(135deg, #4a148c, #7b1fa2)', padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '3px solid #c0c0c0' }}>
          {school?.logo_url && <img src={school.logo_url} alt='Logo' style={{ height: '50px', width: 'auto', borderRadius: '50%', border: '2px solid #c0c0c0', padding: '2px', backgroundColor: '#fff' }} />}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h1 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', margin: 0, letterSpacing: '2px', textTransform: 'uppercase' }}>{school?.name || '-'}</h1>
            {school?.address && <p style={{ fontSize: '9px', color: '#e1bee7', margin: '2px 0 0' }}>{school.address}</p>}
          </div>
        </div>
      )}

      {/* TITLE BAR - Silver */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 15px', backgroundColor: '#c0c0c0' }}>
        <span style={{ fontSize: '9px', color: '#fff', backgroundColor: '#4a148c', padding: '2px 10px', borderRadius: '12px', fontWeight: 'bold' }}>#{transactionId?.split('/').pop() || '-'}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '15px', fontWeight: 'bold', letterSpacing: '3px', color: '#4a148c' }}>{title}</span>
          {!isOriginal && <span style={{ fontSize: '8px', color: '#fff', backgroundColor: '#c62828', padding: '2px 6px', borderRadius: '3px' }}>REPRINT</span>}
        </div>
        <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#fff', backgroundColor: copyType === 'OFFICE COPY' ? '#d32f2f' : copyType === 'STUDENT COPY' ? '#4a148c' : '#2e7d32', padding: '2px 8px', borderRadius: '12px' }}>{copyType}</span>
      </div>

      {/* STUDENT INFO */}
      <div style={{ display: 'flex', padding: '5px 15px', borderBottom: '1px solid #e0e0e0', fontSize: '9px', gap: '8px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: '2px' }}><span style={{ color: '#4a148c', fontWeight: 'bold' }}>Student:</span> <strong>{student?.full_name || '-'}</strong></div>
          <div style={{ marginBottom: '2px' }}><span style={{ color: '#4a148c', fontWeight: 'bold' }}>Father:</span> {student?.father_name || '-'}</div>
          <div><span style={{ color: '#4a148c', fontWeight: 'bold' }}>Adm#:</span> {student?.school_code || student?.admission_no || '-'}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: '2px' }}><span style={{ color: '#4a148c', fontWeight: 'bold' }}>Date:</span> {receiptDate ? format(new Date(receiptDate), 'dd MMM yyyy hh:mm a') : '-'}</div>
          <div style={{ marginBottom: '2px' }}><span style={{ color: '#4a148c', fontWeight: 'bold' }}>Mode:</span> {paymentMode || 'Cash'}</div>
          <div><span style={{ color: '#4a148c', fontWeight: 'bold' }}>Class:</span> {student?.class?.name || '-'}{student?.section?.name ? ` (${student.section.name})` : ''} | <span style={{ color: '#4a148c', fontWeight: 'bold' }}>Session:</span> {sessionName || '-'}</div>
        </div>
      </div>

      {/* FEE TABLE */}
      <div style={{ padding: '4px 15px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px' }}>
          <thead>
            <tr style={{ backgroundColor: '#4a148c', color: '#fff' }}>
              <th style={{ border: '1px solid #7b1fa2', padding: '4px 6px', textAlign: 'left' }}>Fee Head</th>
              <th style={{ border: '1px solid #7b1fa2', padding: '4px 6px', textAlign: 'right', width: '85px' }}>Annual Fee</th>
              <th style={{ border: '1px solid #7b1fa2', padding: '4px 6px', textAlign: 'right', width: '85px' }}>This Payment</th>
              <th style={{ border: '1px solid #7b1fa2', padding: '4px 6px', textAlign: 'right', width: '85px' }}>Paid to Date</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => (
              <tr key={idx} style={{ borderLeft: '3px solid #4a148c' }}>
                <td style={{ border: '1px solid #ddd', padding: '4px 6px', fontWeight: '600' }}>
                  {item.description}
                  {Number(item.discount || 0) > 0 && <span style={{ fontSize: '7px', color: '#9c27b0', marginLeft: '4px' }}>(Conc: \u20b9{fmt(item.discount)})</span>}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '4px 6px', textAlign: 'right' }}>{fmt(item.totalAmount)}</td>
                <td style={{ border: '1px solid #ddd', padding: '4px 6px', textAlign: 'right', fontWeight: 'bold', color: '#4a148c' }}>{fmt(item.amount)}</td>
                <td style={{ border: '1px solid #ddd', padding: '4px 6px', textAlign: 'right' }}>{fmt(Number(item.totalAmount || 0) - Number(item.balance || 0))}</td>
              </tr>
            ))}
            {totalFine > 0 && (
              <tr style={{ backgroundColor: '#fce4ec' }}>
                <td style={{ border: '1px solid #ddd', padding: '4px 6px', color: '#c00', fontWeight: '600' }}>Late Fine</td>
                <td style={{ border: '1px solid #ddd', padding: '4px 6px' }}></td>
                <td style={{ border: '1px solid #ddd', padding: '4px 6px', textAlign: 'right', color: '#c00' }}>+\u20b9{fmt(totalFine)}</td>
                <td style={{ border: '1px solid #ddd', padding: '4px 6px' }}></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAYMENT PROGRESS */}
      <div style={{ padding: '5px 15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', marginBottom: '3px' }}>
          <span style={{ color: '#4a148c', fontWeight: 'bold' }}>Payment Progress</span>
          <span style={{ fontWeight: 'bold' }}>
            \u20b9{fmt(grandTotal)} of \u20b9{fmt(overallTotalAmount)}{' '}
            ({overallTotalAmount > 0 ? Math.round((grandTotal / overallTotalAmount) * 100) : 0}%)
          </span>
        </div>
        <div style={{ height: '10px', backgroundColor: '#f3e5f5', borderRadius: '5px', overflow: 'hidden', border: '1px solid #ce93d8' }}>
          <div style={{ height: '100%', width: `${overallTotalAmount > 0 ? Math.min(100, Math.round((grandTotal / overallTotalAmount) * 100)) : 0}%`, backgroundColor: '#4a148c', borderRadius: '5px' }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7.5px', color: '#666', marginTop: '2px' }}>
          <span>{isRefund ? 'Refunded' : 'Paid'}: \u20b9{fmt(grandTotal)}</span>
          {totalDiscount > 0 && <span>Concession: \u20b9{fmt(totalDiscount)}</span>}
          <span>Balance: \u20b9{fmt(overallBalance)}</span>
        </div>
      </div>

      {/* FOOTER */}
      {printSettings?.footer_content ? (
        <div style={{ padding: '6px 15px', borderTop: '1px solid #e0e0e0', color: '#333', lineHeight: '1.4' }} className="receipt-footer-content" dangerouslySetInnerHTML={{ __html: printSettings.footer_content }} />
      ) : (
        <div style={{ padding: '4px 15px', borderTop: '2px solid #c0c0c0', display: 'flex', justifyContent: 'flex-end', fontSize: '9px', color: '#4a148c' }}>
          <div style={{ textAlign: 'center' }}><div style={{ borderTop: '1px solid #4a148c', width: '120px', marginTop: '12px', paddingTop: '2px' }}>Cashier / Manager</div></div>
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

Template05_RoyalPurple.templateMeta = {
  key: 'royal_purple',
  name: 'Royal Purple',
  description: 'Deep purple & silver, prestigious with pill badges',
  category: 'professional',
  paperSize: 'A5',
  orientation: 'landscape',
  features: ['fee_statement', 'amount_in_words', 'copy_type'],
  colorScheme: { primary: '#4a148c', secondary: '#c0c0c0', accent: '#7b1fa2' }
};

export default Template05_RoyalPurple;
