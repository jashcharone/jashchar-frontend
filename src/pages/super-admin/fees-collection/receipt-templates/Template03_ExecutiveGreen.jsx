/**
 * Template 03: Executive Green
 * Forest green & gold, premium feel
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

const Template03_ExecutiveGreen = ({ receiptData, copyType }) => {
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
    <div style={{ width: '200mm', height: '140mm', boxSizing: 'border-box', pageBreakInside: 'avoid', position: 'relative', backgroundColor: '#fff', color: '#000', fontFamily: 'Georgia, serif', overflow: 'hidden' }}>
      
      {/* HEADER - Green with gold accent */}
      {printSettings?.header_image_url ? (
        <div style={{ width: '100%' }}><img src={printSettings.header_image_url} alt='Header' style={{ width: '100%', height: 'auto', display: 'block' }} /></div>
      ) : (
        <div style={{ backgroundColor: '#1b5e20', padding: '10px 15px', textAlign: 'center', borderBottom: '3px solid #c8a415' }}>
          {school?.logo_url && <img src={school.logo_url} alt='Logo' style={{ height: '50px', width: 'auto', display: 'block', margin: '0 auto 4px' }} />}
          <h1 style={{ fontSize: '16px', fontWeight: 'bold', color: '#c8a415', margin: 0, letterSpacing: '2px', textTransform: 'uppercase' }}>{school?.name || '-'}</h1>
          {school?.address && <p style={{ fontSize: '9px', color: '#a5d6a7', margin: '2px 0 0' }}>{school.address}</p>}
        </div>
      )}

      {/* TITLE - Gold framed */}
      <div style={{ textAlign: 'center', padding: '5px 15px', borderBottom: '1px solid #c8a415' }}>
        <span style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '3px', color: '#1b5e20', border: '2px solid #c8a415', padding: '3px 20px', display: 'inline-block' }}>
          {title}
        </span>
        {!isOriginal && <span style={{ fontSize: '8px', color: '#fff', backgroundColor: '#c62828', padding: '2px 6px', borderRadius: '3px', marginLeft: '8px' }}>REPRINT</span>}
        <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#fff', backgroundColor: copyType === 'OFFICE COPY' ? '#d32f2f' : copyType === 'STUDENT COPY' ? '#1565c0' : '#2e7d32', padding: '2px 8px', borderRadius: '3px', marginLeft: '8px' }}>{copyType}</span>
      </div>

      {/* 2-SECTION LAYOUT - Student info + Payment details */}
      <div style={{ display: 'flex', padding: '5px 15px', gap: '10px', fontSize: '9px', borderBottom: '1px solid #e0e0e0' }}>
        <div style={{ flex: 1, borderLeft: '3px solid #1b5e20', paddingLeft: '8px' }}>
          <div style={{ marginBottom: '2px' }}><strong>Student:</strong> <strong style={{ color: '#1b5e20' }}>{student?.full_name || '-'}</strong></div>
          <div style={{ marginBottom: '2px' }}><strong>Father:</strong> {student?.father_name || '-'}</div>
          <div style={{ marginBottom: '2px' }}><strong>Adm#:</strong> {student?.school_code || student?.admission_no || '-'}</div>
          <div><strong>Class:</strong> {student?.class?.name || '-'}{student?.section?.name ? ` (${student.section.name})` : ''}</div>
        </div>
        <div style={{ flex: 1, borderLeft: '3px solid #c8a415', paddingLeft: '8px' }}>
          <div style={{ marginBottom: '2px' }}><strong>Receipt:</strong> {transactionId || '-'}</div>
          <div style={{ marginBottom: '2px' }}><strong>Date:</strong> {receiptDate ? format(new Date(receiptDate), 'dd MMM yyyy hh:mm a') : '-'}</div>
          <div style={{ marginBottom: '2px' }}><strong>Mode:</strong> {paymentMode || 'Cash'}</div>
          <div><strong>Session:</strong> {sessionName || '-'}</div>
        </div>
      </div>

      {/* FEE TABLE */}
      <div style={{ padding: '4px 15px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px' }}>
          <thead>
            <tr style={{ backgroundColor: '#c8a415', color: '#1b5e20' }}>
              <th style={{ border: '1px solid #999', padding: '3px 4px', textAlign: 'center', width: '28px' }}>S.No</th>
              <th style={{ border: '1px solid #999', padding: '3px 4px', textAlign: 'left' }}>Particulars</th>
              <th style={{ border: '1px solid #999', padding: '3px 4px', textAlign: 'right', width: '72px' }}>Total</th>
              {showConcession && <th style={{ border: '1px solid #999', padding: '3px 4px', textAlign: 'right', width: '62px' }}>Concession</th>}
              <th style={{ border: '1px solid #999', padding: '3px 4px', textAlign: 'right', width: '62px' }}>Paid</th>
              <th style={{ border: '1px solid #999', padding: '3px 4px', textAlign: 'right', width: '55px' }}>Balance</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => (
              <tr key={idx} style={{ backgroundColor: '#fff' }}>
                <td style={{ border: '1px solid #ccc', padding: '3px 4px', textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ border: '1px solid #ccc', padding: '3px 4px', fontWeight: '600', color: '#1b5e20', borderLeft: '3px solid #1b5e20' }}>{item.description}</td>
                <td style={{ border: '1px solid #ccc', padding: '3px 4px', textAlign: 'right' }}>{fmt(item.totalAmount)}</td>
                {showConcession && <td style={{ border: '1px solid #ccc', padding: '3px 4px', textAlign: 'right' }}>{Number(item.discount || 0) > 0 ? fmt(item.discount) : ''}</td>}
                <td style={{ border: '1px solid #ccc', padding: '3px 4px', textAlign: 'right' }}>{fmt(item.amount)}</td>
                <td style={{ border: '1px solid #ccc', padding: '3px 4px', textAlign: 'right' }}>{fmt(item.balance)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: 'bold', backgroundColor: '#1b5e20', color: '#fff' }}>
              <td style={{ border: '1px solid #999', padding: '4px' }}></td>
              <td style={{ border: '1px solid #999', padding: '4px', textAlign: 'right' }}>{isRefund ? 'Total Refund' : 'Total'}</td>
              <td style={{ border: '1px solid #999', padding: '4px', textAlign: 'right' }}>{fmt(overallTotalAmount)}</td>
              {showConcession && <td style={{ border: '1px solid #999', padding: '4px', textAlign: 'right' }}>{fmt(totalDiscount)}</td>}
              <td style={{ border: '1px solid #999', padding: '4px', textAlign: 'right' }}>{fmt(grandTotal)}</td>
              <td style={{ border: '1px solid #999', padding: '4px', textAlign: 'right' }}>{fmt(overallBalance)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* AMOUNT IN WORDS */}
      <div style={{ padding: '3px 15px', fontSize: '8.5px' }}>
        <strong>Amount in Words:</strong> <em>{amountInWords}</em>
      </div>

      {/* FEE STATEMENT */}
      {feeStatement.length > 0 && (
        <div style={{ padding: '3px 15px', borderTop: '1px solid #e0e0e0' }}>
          <div style={{ fontSize: '8px', fontWeight: 'bold', marginBottom: '2px', color: '#1b5e20' }}>FEE STATEMENT</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7.5px' }}>
            <thead><tr style={{ backgroundColor: '#e8f5e9' }}><th style={{ border: '1px solid #ccc', padding: '2px 4px', textAlign: 'left' }}>Fee</th><th style={{ border: '1px solid #ccc', padding: '2px 4px', textAlign: 'right', width: '65px' }}>Amount</th><th style={{ border: '1px solid #ccc', padding: '2px 4px', textAlign: 'right', width: '65px' }}>Paid</th><th style={{ border: '1px solid #ccc', padding: '2px 4px', textAlign: 'right', width: '65px' }}>Balance</th><th style={{ border: '1px solid #ccc', padding: '2px 4px', textAlign: 'center', width: '50px' }}>Status</th></tr></thead>
            <tbody>
              {feeStatement.map((fee, i) => (
                <tr key={i}><td style={{ border: '1px solid #ccc', padding: '2px 4px' }}>{fee.name}</td><td style={{ border: '1px solid #ccc', padding: '2px 4px', textAlign: 'right' }}>{fmt(fee.amount)}</td><td style={{ border: '1px solid #ccc', padding: '2px 4px', textAlign: 'right' }}>{fmt(fee.paid)}</td><td style={{ border: '1px solid #ccc', padding: '2px 4px', textAlign: 'right' }}>{fmt(fee.balance)}</td><td style={{ border: '1px solid #ccc', padding: '2px 4px', textAlign: 'center', fontSize: '7px', fontWeight: 'bold', color: fee.status?.toLowerCase() === 'paid' ? '#080' : fee.status?.toLowerCase() === 'partial' ? '#c50' : '#c00' }}>{fee.status}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* FOOTER */}
      {printSettings?.footer_content ? (
        <div style={{ padding: '6px 15px', borderTop: '1px solid #e0e0e0', color: '#333', lineHeight: '1.4' }} className="receipt-footer-content" dangerouslySetInnerHTML={{ __html: printSettings.footer_content }} />
      ) : (
        <div style={{ padding: '6px 15px', borderTop: '2px solid #1b5e20', display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#1b5e20', fontStyle: 'italic' }}>
          <span>This is a computer-generated receipt</span>
          <div style={{ display: 'flex', gap: '40px' }}>
            <div style={{ textAlign: 'center' }}><div style={{ borderTop: '1px solid #333', width: '100px', marginTop: '15px', paddingTop: '2px' }}>Cashier</div></div>
            <div style={{ textAlign: 'center' }}><div style={{ borderTop: '1px solid #333', width: '100px', marginTop: '15px', paddingTop: '2px' }}>Manager</div></div>
          </div>
        </div>
      )}

      {/* WATERMARK */}
      {isRefund && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)', opacity: 0.08, pointerEvents: 'none' }}>
          <span style={{ fontSize: '48px', fontWeight: 'bold', color: 'red' }}>REFUND</span>
        </div>
      )}
    </div>
  );
};

Template03_ExecutiveGreen.templateMeta = {
  key: 'executive_green',
  name: 'Executive Green',
  description: 'Forest green & gold, premium feel with dual signature lines',
  category: 'professional',
  paperSize: 'A5',
  orientation: 'landscape',
  features: ['fee_statement', 'amount_in_words', 'copy_type', 'dual_signature'],
  colorScheme: { primary: '#1b5e20', secondary: '#c8a415', accent: '#a5d6a7' }
};

export default Template03_ExecutiveGreen;
