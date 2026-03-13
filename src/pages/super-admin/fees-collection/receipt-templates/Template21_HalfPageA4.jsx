/**
 * Template 21: Half Page A4
 * A4 half page (portrait, top half) — common for schools
 * Paper: A4 Half | Category: Minimal
 */
import React from 'react';
import { format } from 'date-fns';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function numberToWords(num) {
  if (!num || num === 0) return 'Zero';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const convert = (n) => { if (n < 20) return a[n]; if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : ''); return ''; };
  const n = Math.round(Math.abs(num));
  if (n === 0) return 'Zero';
  let result = '';
  if (Math.floor(n / 10000000) > 0) result += convert(Math.floor(n / 10000000)) + ' Crore ';
  if (Math.floor((n % 10000000) / 100000) > 0) result += convert(Math.floor((n % 10000000) / 100000)) + ' Lakh ';
  if (Math.floor((n % 100000) / 1000) > 0) result += convert(Math.floor((n % 100000) / 1000)) + ' Thousand ';
  if (Math.floor((n % 1000) / 100) > 0) result += a[Math.floor((n % 1000) / 100)] + ' Hundred ';
  if (n % 100 > 0) { if (result) result += 'and '; result += convert(n % 100); }
  return result.trim() + ' Rupees Only';
}

const Template21_HalfPageA4 = ({ receiptData, copyType }) => {
  const {
    student, school, lineItems = [], feeStatement = [],
    totalPaid, totalDiscount, totalFine, grandTotal,
    overallTotalAmount = 0, overallBalance = 0,
    transactionId, receiptDate, paymentMode,
    isRefund, isOriginal, printSettings, sessionName, title = 'FEE RECEIPT'
  } = receiptData;

  const showConcession = totalDiscount > 0;

  return (
    <div style={{ width: '210mm', height: '148.5mm', boxSizing: 'border-box', pageBreakInside: 'avoid', position: 'relative', backgroundColor: '#fff', fontFamily: "'Segoe UI', Arial, sans-serif", color: '#222', overflow: 'hidden', padding: '12px 20px', border: '1px solid #ccc' }}>
      
      {/* HEADER */}
      {printSettings?.header_image_url ? (
        <div style={{ marginBottom: '8px' }}><img src={printSettings.header_image_url} alt='Header' style={{ width: '100%', height: 'auto', display: 'block' }} /></div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '2px solid #333', paddingBottom: '6px', marginBottom: '6px' }}>
          {school?.logo_url && <img src={school.logo_url} alt='Logo' style={{ height: '42px', width: 'auto' }} />}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>{school?.name || '-'}</h1>
            {school?.address && <p style={{ fontSize: '9px', margin: '2px 0 0', color: '#555' }}>{school.address}</p>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: '700' }}>{title}</div>
            <div style={{ fontSize: '8px', color: '#666' }}>{copyType}{!isOriginal ? ' (Duplicate)' : ''}</div>
          </div>
        </div>
      )}

      {/* STUDENT + RECEIPT INFO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginBottom: '6px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: '2px 6px' }}>
          <span style={{ color: '#666' }}>Name:</span><strong>{student?.full_name || '-'}</strong>
          <span style={{ color: '#666' }}>Father:</span><span>{student?.father_name || '-'}</span>
          <span style={{ color: '#666' }}>Class:</span><span>{student?.class?.name || '-'}{student?.section?.name ? ` (${student.section.name})` : ''}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: '2px 6px', textAlign: 'left' }}>
          <span style={{ color: '#666' }}>Receipt No:</span><span>{transactionId?.split('/').pop() || '-'}</span>
          <span style={{ color: '#666' }}>Date:</span><span>{receiptDate ? format(new Date(receiptDate), 'dd MMM yyyy') : '-'}</span>
          <span style={{ color: '#666' }}>Mode:</span><span>{paymentMode || 'Cash'}</span>
        </div>
      </div>

      {/* FEE TABLE */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', marginBottom: '6px', border: '1px solid #ddd' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #333' }}>
            <th style={{ padding: '4px 6px', textAlign: 'center', width: '30px', borderRight: '1px solid #ddd' }}>#</th>
            <th style={{ padding: '4px 6px', textAlign: 'left', borderRight: '1px solid #ddd' }}>Description</th>
            <th style={{ padding: '4px 6px', textAlign: 'right', width: '90px', borderRight: '1px solid #ddd' }}>Charged (₹)</th>
            <th style={{ padding: '4px 6px', textAlign: 'right', width: '90px' }}>This Payment (₹)</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '3px 6px', textAlign: 'center', borderRight: '1px solid #eee' }}>{idx + 1}</td>
              <td style={{ padding: '3px 6px', borderRight: '1px solid #eee' }}>
                {item.description}
                {Number(item.discount || 0) > 0 && <span style={{ fontSize: '7.5px', color: '#388e3c' }}> (Conc: ₹{fmt(item.discount)})</span>}
              </td>
              <td style={{ padding: '3px 6px', textAlign: 'right', borderRight: '1px solid #eee' }}>{fmt(item.totalAmount)}</td>
              <td style={{ padding: '3px 6px', textAlign: 'right' }}>{fmt(item.amount)}</td>
            </tr>
          ))}
          {totalFine > 0 && (
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '3px 6px', borderRight: '1px solid #eee' }}></td>
              <td style={{ padding: '3px 6px', borderRight: '1px solid #eee', color: '#c00' }}>Late Fine / Penalty</td>
              <td style={{ padding: '3px 6px', borderRight: '1px solid #eee' }}></td>
              <td style={{ padding: '3px 6px', textAlign: 'right', color: '#c00' }}>+₹{fmt(totalFine)}</td>
            </tr>
          )}
          <tr style={{ fontWeight: '700', borderTop: '2px solid #333', backgroundColor: '#f9f9f9' }}>
            <td colSpan={2} style={{ padding: '4px 6px', textAlign: 'right', borderRight: '1px solid #ddd' }}>{isRefund ? 'Total Refund' : 'Total Paid'}:</td>
            <td style={{ padding: '4px 6px', textAlign: 'right', borderRight: '1px solid #ddd' }}>₹{fmt(overallTotalAmount)}</td>
            <td style={{ padding: '4px 6px', textAlign: 'right', fontSize: '11px' }}>₹{fmt(grandTotal)}</td>
          </tr>
        </tbody>
      </table>

      {/* AMOUNT IN WORDS + SUMMARY */}
      <div style={{ fontSize: '8.5px', marginBottom: '4px' }}>
        <span style={{ color: '#666' }}>In Words:</span> <strong>{numberToWords(grandTotal)}</strong>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '4px', fontSize: '8px' }}>
        <div style={{ flex: 1, textAlign: 'center', padding: '3px', backgroundColor: '#f0f0f0', borderRadius: '2px' }}>
          <div style={{ color: '#666', fontSize: '7px' }}>TOTAL FEES</div>
          <div style={{ fontWeight: '700' }}>₹{fmt(overallTotalAmount)}</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center', padding: '3px', backgroundColor: '#e8f5e9', borderRadius: '2px' }}>
          <div style={{ color: '#666', fontSize: '7px' }}>PAID</div>
          <div style={{ fontWeight: '700', color: '#2e7d32' }}>₹{fmt(grandTotal)}</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center', padding: '3px', backgroundColor: overallBalance > 0 ? '#ffebee' : '#e8f5e9', borderRadius: '2px' }}>
          <div style={{ color: '#666', fontSize: '7px' }}>BALANCE</div>
          <div style={{ fontWeight: '700', color: overallBalance > 0 ? '#c00' : '#2e7d32' }}>₹{fmt(overallBalance)}</div>
        </div>
      </div>

      {/* FOOTER */}
      {printSettings?.footer_content ? (
        <div style={{ lineHeight: '1.4' }} className="receipt-footer-content" dangerouslySetInnerHTML={{ __html: printSettings.footer_content }} />
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#888', marginTop: '6px' }}>
          <span>Session: {sessionName || '-'} | TXN: {transactionId || '-'}</span>
          <span style={{ borderTop: '1px solid #333', paddingTop: '4px', minWidth: '100px', textAlign: 'center', color: '#333' }}>Authorised Signatory</span>
        </div>
      )}

      {isRefund && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)', opacity: 0.06, pointerEvents: 'none' }}>
          <span style={{ fontSize: '48px', fontWeight: 'bold', color: 'red' }}>REFUND</span>
        </div>
      )}
    </div>
  );
};

Template21_HalfPageA4.templateMeta = {
  key: 'half_page_a4',
  name: 'Half Page A4',
  description: 'A4 portrait half page — standard school receipt format',
  category: 'minimal',
  paperSize: 'A4-half',
  orientation: 'portrait',
  features: ['fee_statement', 'copy_type', 'amount_in_words', 'signature'],
  colorScheme: { primary: '#333333', secondary: '#ffffff', accent: '#666666' }
};

export default Template21_HalfPageA4;
