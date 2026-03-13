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

      {/* STUDENT INFO - Table style */}
      <div style={{ padding: '5px 20px', fontSize: '9px', borderBottom: '1px solid #ddd' }}>
        <table style={{ width: '100%', fontSize: '9px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '2px 4px', fontWeight: 'bold', color: '#800000', width: '90px' }}>Student Name</td>
              <td style={{ padding: '2px 4px', backgroundColor: '#fff' }}>: <strong>{student?.full_name || '-'}</strong></td>
              <td style={{ padding: '2px 4px', fontWeight: 'bold', color: '#800000', width: '80px' }}>Receipt No</td>
              <td style={{ padding: '2px 4px', backgroundColor: '#fff' }}>: {transactionId || '-'}</td>
            </tr>
            <tr>
              <td style={{ padding: '2px 4px', fontWeight: 'bold', color: '#800000' }}>Father's Name</td>
              <td style={{ padding: '2px 4px', backgroundColor: '#fff' }}>: {student?.father_name || '-'}</td>
              <td style={{ padding: '2px 4px', fontWeight: 'bold', color: '#800000' }}>Date</td>
              <td style={{ padding: '2px 4px', backgroundColor: '#fff' }}>: {receiptDate ? format(new Date(receiptDate), 'dd MMM yyyy') : '-'}</td>
            </tr>
            <tr>
              <td style={{ padding: '2px 4px', fontWeight: 'bold', color: '#800000' }}>Adm. No</td>
              <td style={{ padding: '2px 4px', backgroundColor: '#fff' }}>: {student?.school_code || student?.admission_no || '-'}</td>
              <td style={{ padding: '2px 4px', fontWeight: 'bold', color: '#800000' }}>Mode</td>
              <td style={{ padding: '2px 4px', backgroundColor: '#fff' }}>: {paymentMode || 'Cash'}</td>
            </tr>
            <tr>
              <td style={{ padding: '2px 4px', fontWeight: 'bold', color: '#800000' }}>Class</td>
              <td style={{ padding: '2px 4px', backgroundColor: '#fff' }}>: {student?.class?.name || '-'}{student?.section?.name ? ` (${student.section.name})` : ''}</td>
              <td style={{ padding: '2px 4px', fontWeight: 'bold', color: '#800000' }}>Session</td>
              <td style={{ padding: '2px 4px', backgroundColor: '#fff' }}>: {sessionName || '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* FEE TABLE */}
      <div style={{ padding: '4px 20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px' }}>
          <thead>
            <tr style={{ backgroundColor: '#800000', color: '#fffdd0' }}>
              <th style={{ border: '1px solid #800000', padding: '3px 4px', textAlign: 'center', width: '28px' }}>S.No</th>
              <th style={{ border: '1px solid #800000', padding: '3px 4px', textAlign: 'left' }}>Particulars</th>
              <th style={{ border: '1px solid #800000', padding: '3px 4px', textAlign: 'right', width: '72px' }}>Total</th>
              {showConcession && <th style={{ border: '1px solid #800000', padding: '3px 4px', textAlign: 'right', width: '62px' }}>Concession</th>}
              <th style={{ border: '1px solid #800000', padding: '3px 4px', textAlign: 'right', width: '62px' }}>Paid</th>
              <th style={{ border: '1px solid #800000', padding: '3px 4px', textAlign: 'right', width: '55px' }}>Balance</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => (
              <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fffdd0' : '#fff' }}>
                <td style={{ border: '1px solid #ccc', padding: '3px 4px', textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ border: '1px solid #ccc', padding: '3px 4px', fontWeight: '600' }}>{item.description}</td>
                <td style={{ border: '1px solid #ccc', padding: '3px 4px', textAlign: 'right' }}>{fmt(item.totalAmount)}</td>
                {showConcession && <td style={{ border: '1px solid #ccc', padding: '3px 4px', textAlign: 'right' }}>{Number(item.discount || 0) > 0 ? fmt(item.discount) : ''}</td>}
                <td style={{ border: '1px solid #ccc', padding: '3px 4px', textAlign: 'right' }}>{fmt(item.amount)}</td>
                <td style={{ border: '1px solid #ccc', padding: '3px 4px', textAlign: 'right' }}>{fmt(item.balance)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: 'bold', backgroundColor: '#800000', color: '#fffdd0' }}>
              <td style={{ border: '1px solid #800000', padding: '4px' }}></td>
              <td style={{ border: '1px solid #800000', padding: '4px', textAlign: 'right' }}>{isRefund ? 'Total Refund' : 'Total'}</td>
              <td style={{ border: '1px solid #800000', padding: '4px', textAlign: 'right' }}>{fmt(overallTotalAmount)}</td>
              {showConcession && <td style={{ border: '1px solid #800000', padding: '4px', textAlign: 'right' }}>{fmt(totalDiscount)}</td>}
              <td style={{ border: '1px solid #800000', padding: '4px', textAlign: 'right' }}>{fmt(grandTotal)}</td>
              <td style={{ border: '1px solid #800000', padding: '4px', textAlign: 'right' }}>{fmt(overallBalance)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* AMOUNT IN WORDS - Bordered box */}
      <div style={{ margin: '3px 20px', padding: '3px 8px', border: '1px solid #800000', fontSize: '8.5px', backgroundColor: '#fff' }}>
        <strong>Amount in Words:</strong> <em>{amountInWords}</em>
      </div>

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
