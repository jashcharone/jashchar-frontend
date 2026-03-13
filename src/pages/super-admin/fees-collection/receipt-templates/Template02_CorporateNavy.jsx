/**
 * Template 02: Corporate Navy
 * Navy & silver, corporate elegance
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

const Template02_CorporateNavy = ({ receiptData, copyType }) => {
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
      
      {/* HEADER - Navy gradient */}
      {printSettings?.header_image_url ? (
        <div style={{ width: '100%' }}><img src={printSettings.header_image_url} alt='Header' style={{ width: '100%', height: 'auto', display: 'block' }} /></div>
      ) : (
        <div style={{ background: 'linear-gradient(135deg, #0a1628, #1e3a5f)', padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {school?.logo_url && <img src={school.logo_url} alt='Logo' style={{ height: '55px', width: 'auto', borderRadius: '50%', border: '2px solid #c0c0c0' }} />}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h1 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', margin: 0, letterSpacing: '2px', textTransform: 'uppercase' }}>{school?.name || '-'}</h1>
            {school?.address && <p style={{ fontSize: '9px', color: '#c0c0c0', margin: '3px 0 0' }}>{school.address}</p>}
            {(school?.contact_number || school?.contact_email) && (
              <p style={{ fontSize: '8px', color: '#999', margin: '2px 0 0' }}>
                {school?.contact_number && `Ph: ${school.contact_number}`}{school?.contact_number && school?.contact_email && ' | '}{school?.contact_email && `Email: ${school.contact_email}`}
              </p>
            )}
          </div>
        </div>
      )}

      {/* TITLE BAR - Silver */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 15px', backgroundColor: '#c0c0c0', borderBottom: '2px solid #0a1628' }}>
        <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#fff', backgroundColor: '#0a1628', padding: '3px 10px', borderRadius: '3px' }}>Receipt: {transactionId?.split('/').pop() || '-'}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '3px', color: '#0a1628', textTransform: 'uppercase' }}>{title}</span>
          {!isOriginal && <span style={{ fontSize: '8px', color: '#fff', backgroundColor: '#c62828', padding: '2px 6px', borderRadius: '3px', fontWeight: 'bold' }}>REPRINT</span>}
          <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#fff', backgroundColor: copyType === 'OFFICE COPY' ? '#d32f2f' : copyType === 'STUDENT COPY' ? '#1565c0' : '#2e7d32', padding: '2px 8px', borderRadius: '3px' }}>{copyType}</span>
        </div>
        <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#0a1628', backgroundColor: '#e0e0e0', padding: '3px 10px', borderRadius: '3px' }}>TXN: {transactionId || '-'}</span>
      </div>

      {/* STUDENT INFO - Horizontal strip */}
      <div style={{ padding: '5px 15px', borderBottom: '1px solid #dee2e6', fontSize: '9px', display: 'flex', flexWrap: 'wrap', gap: '4px 12px', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
        <span><strong style={{ color: '#0a1628' }}>{student?.full_name || '-'}</strong></span>
        <span style={{ color: '#999' }}>|</span>
        <span>Father: {student?.father_name || '-'}</span>
        <span style={{ color: '#999' }}>|</span>
        <span>Adm#: {student?.school_code || student?.admission_no || '-'}</span>
        <span style={{ color: '#999' }}>|</span>
        <span>Class: {student?.class?.name || '-'}{student?.section?.name ? `(${student.section.name})` : ''}</span>
        <span style={{ color: '#999' }}>|</span>
        <span>{receiptDate ? format(new Date(receiptDate), 'dd MMM yyyy') : '-'}</span>
        <span style={{ color: '#999' }}>|</span>
        <span>{paymentMode || 'Cash'}</span>
        <span style={{ color: '#999' }}>|</span>
        <span>Session: {sessionName || '-'}</span>
        {extraInfo?.route && <><span style={{ color: '#999' }}>|</span><span>Route: {extraInfo.route}</span></>}
      </div>

      {/* FEE TABLE */}
      <div style={{ padding: '4px 15px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px' }}>
          <thead>
            <tr style={{ backgroundColor: '#0a1628', color: '#fff' }}>
              <th style={{ border: '1px solid #dee2e6', padding: '3px 4px', textAlign: 'center', width: '28px' }}>S.No</th>
              <th style={{ border: '1px solid #dee2e6', padding: '3px 4px', textAlign: 'left' }}>Particulars</th>
              <th style={{ border: '1px solid #dee2e6', padding: '3px 4px', textAlign: 'right', width: '72px' }}>Total Amt</th>
              {showConcession && <th style={{ border: '1px solid #dee2e6', padding: '3px 4px', textAlign: 'right', width: '62px' }}>Concession</th>}
              <th style={{ border: '1px solid #dee2e6', padding: '3px 4px', textAlign: 'right', width: '62px' }}>Paid</th>
              <th style={{ border: '1px solid #dee2e6', padding: '3px 4px', textAlign: 'right', width: '55px' }}>Balance</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => (
              <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                <td style={{ border: '1px solid #dee2e6', padding: '3px 4px', textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ border: '1px solid #dee2e6', padding: '3px 4px', fontWeight: '600', color: '#1e3a5f' }}>{item.description}</td>
                <td style={{ border: '1px solid #dee2e6', padding: '3px 4px', textAlign: 'right' }}>{fmt(item.totalAmount)}</td>
                {showConcession && <td style={{ border: '1px solid #dee2e6', padding: '3px 4px', textAlign: 'right' }}>{Number(item.discount || 0) > 0 ? fmt(item.discount) : ''}</td>}
                <td style={{ border: '1px solid #dee2e6', padding: '3px 4px', textAlign: 'right' }}>{fmt(item.amount)}</td>
                <td style={{ border: '1px solid #dee2e6', padding: '3px 4px', textAlign: 'right' }}>{fmt(item.balance)}</td>
              </tr>
            ))}
            {totalFine > 0 && (
              <tr><td style={{ border: '1px solid #dee2e6', padding: '3px 4px' }}></td><td style={{ border: '1px solid #dee2e6', padding: '3px 4px', color: '#c00' }}>Late Fine</td><td style={{ border: '1px solid #dee2e6', padding: '3px 4px' }}></td>{showConcession && <td style={{ border: '1px solid #dee2e6', padding: '3px 4px' }}></td>}<td style={{ border: '1px solid #dee2e6', padding: '3px 4px', textAlign: 'right', color: '#c00' }}>+{fmt(totalFine)}</td><td style={{ border: '1px solid #dee2e6', padding: '3px 4px' }}></td></tr>
            )}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: 'bold', backgroundColor: '#0a1628', color: '#fff' }}>
              <td style={{ border: '1px solid #dee2e6', padding: '4px' }}></td>
              <td style={{ border: '1px solid #dee2e6', padding: '4px', textAlign: 'right' }}>{isRefund ? 'Total Refund' : 'Total'}</td>
              <td style={{ border: '1px solid #dee2e6', padding: '4px', textAlign: 'right' }}>{fmt(overallTotalAmount)}</td>
              {showConcession && <td style={{ border: '1px solid #dee2e6', padding: '4px', textAlign: 'right' }}>{fmt(totalDiscount)}</td>}
              <td style={{ border: '1px solid #dee2e6', padding: '4px', textAlign: 'right' }}>{fmt(grandTotal)}</td>
              <td style={{ border: '1px solid #dee2e6', padding: '4px', textAlign: 'right' }}>{fmt(overallBalance)}</td>
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
        <div style={{ padding: '3px 15px', borderTop: '1px solid #dee2e6' }}>
          <div style={{ fontSize: '8px', fontWeight: 'bold', marginBottom: '2px', color: '#0a1628' }}>FEE STATEMENT</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7.5px' }}>
            <thead><tr style={{ backgroundColor: '#e8ecf0' }}><th style={{ border: '1px solid #ccc', padding: '2px 4px', textAlign: 'left' }}>Fee</th><th style={{ border: '1px solid #ccc', padding: '2px 4px', textAlign: 'right', width: '65px' }}>Amount</th><th style={{ border: '1px solid #ccc', padding: '2px 4px', textAlign: 'right', width: '65px' }}>Paid</th><th style={{ border: '1px solid #ccc', padding: '2px 4px', textAlign: 'right', width: '65px' }}>Balance</th><th style={{ border: '1px solid #ccc', padding: '2px 4px', textAlign: 'center', width: '50px' }}>Status</th></tr></thead>
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
        <div style={{ padding: '6px 15px', borderTop: '1px solid #dee2e6', color: '#333', lineHeight: '1.4' }} className="receipt-footer-content" dangerouslySetInnerHTML={{ __html: printSettings.footer_content }} />
      ) : (
        <div style={{ padding: '6px 15px', borderTop: '2px solid #0a1628', display: 'flex', justifyContent: 'flex-end', fontSize: '9px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #333', width: '120px', marginTop: '15px', paddingTop: '2px' }}>Cashier Signature</div>
          </div>
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

Template02_CorporateNavy.templateMeta = {
  key: 'corporate_navy',
  name: 'Corporate Navy',
  description: 'Navy & silver, corporate elegance with horizontal student info strip',
  category: 'professional',
  paperSize: 'A5',
  orientation: 'landscape',
  features: ['fee_statement', 'amount_in_words', 'copy_type', 'custom_footer'],
  colorScheme: { primary: '#0a1628', secondary: '#c0c0c0', accent: '#1e3a5f' }
};

export default Template02_CorporateNavy;
