/**
 * Template 17: Stamp Paper
 * Official stamp paper look with watermark, green tint
 * Paper: A5 Landscape | Category: Classic
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

const Template17_StampPaper = ({ receiptData, copyType }) => {
  const {
    student, school, lineItems = [], feeStatement = [],
    totalPaid, totalDiscount, totalFine, grandTotal,
    overallBalance = 0,
    transactionId, receiptDate, paymentMode,
    isRefund, isOriginal, printSettings, sessionName, title = 'FEE RECEIPT'
  } = receiptData;

  const showConcession = totalDiscount > 0;

  return (
    <div style={{ width: '200mm', height: '140mm', boxSizing: 'border-box', pageBreakInside: 'avoid', position: 'relative', backgroundColor: '#e8f0e0', fontFamily: "'Times New Roman', serif", color: '#1a3a1a', overflow: 'hidden', border: '3px solid #4a7a4a' }}>
      
      {/* Stamp paper watermark text */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-25deg)', opacity: 0.04, pointerEvents: 'none', fontSize: '60px', fontWeight: 'bold', color: '#2e7d32', whiteSpace: 'nowrap' }}>
        OFFICIAL RECEIPT
      </div>

      <div style={{ padding: '10px 15px', position: 'relative', zIndex: 1 }}>
        {/* TOP STRIP - Like stamp paper denomination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #4a7a4a', paddingBottom: '4px', marginBottom: '5px' }}>
          <div style={{ fontSize: '7px', color: '#4a7a4a', fontStyle: 'italic' }}>No: {transactionId?.split('/').pop() || '-'}</div>
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#2e5a2e', letterSpacing: '4px', textTransform: 'uppercase' }}>
            ★ {title} ★
          </div>
          <div style={{ fontSize: '7px', color: '#4a7a4a' }}>{copyType}{!isOriginal ? ' (Duplicate)' : ''}</div>
        </div>

        {/* HEADER */}
        {printSettings?.header_image_url ? (
          <div style={{ marginBottom: '5px' }}><img src={printSettings.header_image_url} alt='Header' style={{ width: '100%', height: 'auto', display: 'block' }} /></div>
        ) : (
          <div style={{ textAlign: 'center', marginBottom: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
              {school?.logo_url && <img src={school.logo_url} alt='Logo' style={{ height: '34px', width: 'auto' }} />}
              <div>
                <h1 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0, color: '#2e5a2e' }}>{school?.name || '-'}</h1>
                {school?.address && <p style={{ fontSize: '8px', margin: '1px 0 0', color: '#5a7a5a' }}>{school.address}</p>}
              </div>
            </div>
          </div>
        )}

        {/* STUDENT INFO */}
        <div style={{ display: 'flex', gap: '12px', fontSize: '8.5px', marginBottom: '5px', padding: '4px 6px', backgroundColor: '#d4e8d4', border: '1px solid #8aaf8a' }}>
          <span><strong>Student:</strong> {student?.full_name || '-'}</span>
          <span><strong>S/D of:</strong> {student?.father_name || '-'}</span>
          <span><strong>Class:</strong> {student?.class?.name || '-'}{student?.section?.name ? `(${student.section.name})` : ''}</span>
          <span><strong>Adm#:</strong> {student?.enrollment_id || '-'}</span>
          <span><strong>Date:</strong> {receiptDate ? format(new Date(receiptDate), 'dd-MM-yyyy') : '-'}</span>
        </div>

        {/* FEE TABLE */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px', marginBottom: '4px', border: '1px solid #4a7a4a' }}>
          <thead>
            <tr style={{ backgroundColor: '#4a7a4a', color: '#e8f0e0' }}>
              <th style={{ padding: '3px 5px', textAlign: 'center', width: '30px', borderRight: '1px solid #8aaf8a' }}>Sl.</th>
              <th style={{ padding: '3px 5px', textAlign: 'left', borderRight: '1px solid #8aaf8a' }}>Towards (Head of Fee)</th>
              <th style={{ padding: '3px 5px', textAlign: 'right', width: '100px' }}>Amount Received (₹)</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #b5cfb5' }}>
                <td style={{ padding: '2.5px 5px', textAlign: 'center', borderRight: '1px solid #d4e8d4' }}>({String.fromCharCode(105 + idx)})</td>
                <td style={{ padding: '2.5px 5px', borderRight: '1px solid #d4e8d4' }}>
                  Towards {item.description}
                  {Number(item.discount || 0) > 0 && <span style={{ fontSize: '7px', color: '#4a7a4a' }}> (after concession of ₹{fmt(item.discount)})</span>}
                </td>
                <td style={{ padding: '2.5px 5px', textAlign: 'right' }}>{fmt(item.amount)}</td>
              </tr>
            ))}
            {totalFine > 0 && (
              <tr style={{ borderBottom: '1px solid #b5cfb5' }}>
                <td style={{ padding: '2.5px 5px', textAlign: 'center', borderRight: '1px solid #d4e8d4' }}>({String.fromCharCode(105 + lineItems.length)})</td>
                <td style={{ padding: '2.5px 5px', borderRight: '1px solid #d4e8d4', color: '#8b0000' }}>Towards Late Fine / Penalty</td>
                <td style={{ padding: '2.5px 5px', textAlign: 'right', color: '#8b0000' }}>{fmt(totalFine)}</td>
              </tr>
            )}
            <tr style={{ fontWeight: 'bold', backgroundColor: '#c4dcc4', borderTop: '2px solid #4a7a4a' }}>
              <td colSpan={2} style={{ padding: '3px 5px', textAlign: 'right', borderRight: '1px solid #d4e8d4' }}>{isRefund ? 'TOTAL REFUND' : 'THE TOTAL SUM OF'}:</td>
              <td style={{ padding: '3px 5px', textAlign: 'right', fontSize: '10px', color: '#1a3a1a' }}>₹{fmt(grandTotal)}</td>
            </tr>
          </tbody>
        </table>

        {/* AMOUNT IN WORDS - Legal */}
        <div style={{ fontSize: '8px', marginBottom: '3px', padding: '4px 6px', border: '1px solid #8aaf8a', backgroundColor: '#d4e8d4' }}>
          <em>The total sum of Rupees</em> <strong>{numberToWords(grandTotal)}</strong> <em>has been duly received.</em>
        </div>
        {overallBalance > 0 && (
          <div style={{ fontSize: '7.5px', color: '#8b0000', marginBottom: '3px', fontStyle: 'italic' }}>
            Balance of ₹{fmt(overallBalance)} remains outstanding and payable.
          </div>
        )}

        {/* FOOTER */}
        {printSettings?.footer_content ? (
          <div style={{ lineHeight: '1.4' }} className="receipt-footer-content" dangerouslySetInnerHTML={{ __html: printSettings.footer_content }} />
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7.5px', color: '#5a7a5a', marginTop: '3px' }}>
            <span>Mode: {paymentMode || 'Cash'} | Session: {sessionName || '-'} | TXN: {transactionId || '-'}</span>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid #4a7a4a', paddingTop: '2px', minWidth: '80px' }}>Cashier / Authorised Signatory</div>
            </div>
          </div>
        )}
      </div>

      {isRefund && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)', opacity: 0.07, pointerEvents: 'none' }}>
          <span style={{ fontSize: '48px', fontWeight: 'bold', color: 'red' }}>REFUND</span>
        </div>
      )}
    </div>
  );
};

Template17_StampPaper.templateMeta = {
  key: 'stamp_paper',
  name: 'Stamp Paper',
  description: 'Official stamp paper look with green tint and watermark',
  category: 'classic',
  paperSize: 'A5',
  orientation: 'landscape',
  features: ['fee_statement', 'copy_type', 'amount_in_words', 'signature', 'watermark'],
  colorScheme: { primary: '#4a7a4a', secondary: '#e8f0e0', accent: '#2e5a2e' }
};

export default Template17_StampPaper;
