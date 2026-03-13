/**
 * Template 18: Colonial Elegant
 * Victorian/Colonial era design — dark burgundy, gold filigree, elegant
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

const Template18_ColonialElegant = ({ receiptData, copyType }) => {
  const {
    student, school, lineItems = [], feeStatement = [],
    totalPaid, totalDiscount, totalFine, grandTotal,
    overallTotalAmount = 0, overallBalance = 0,
    transactionId, receiptDate, paymentMode,
    isRefund, isOriginal, printSettings, sessionName, title = 'FEE RECEIPT'
  } = receiptData;

  const showConcession = totalDiscount > 0;
  const burg = '#4a0020';
  const gold = '#c5a55a';

  return (
    <div style={{ width: '200mm', height: '140mm', boxSizing: 'border-box', pageBreakInside: 'avoid', position: 'relative', backgroundColor: '#faf5ef', fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, serif", color: '#2a1a0e', overflow: 'hidden', border: `3px solid ${burg}` }}>
      
      {/* Inner gold border */}
      <div style={{ border: `1px solid ${gold}`, margin: '3px', height: 'calc(100% - 6px)', boxSizing: 'border-box', padding: '6px 14px' }}>
        
        {/* HEADER */}
        {printSettings?.header_image_url ? (
          <div style={{ marginBottom: '5px' }}><img src={printSettings.header_image_url} alt='Header' style={{ width: '100%', height: 'auto', display: 'block' }} /></div>
        ) : (
          <div style={{ textAlign: 'center', borderBottom: `2px double ${burg}`, paddingBottom: '5px', marginBottom: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
              {school?.logo_url && (
                <div style={{ border: `2px solid ${gold}`, borderRadius: '50%', padding: '3px', display: 'inline-block' }}>
                  <img src={school.logo_url} alt='Logo' style={{ height: '32px', width: 'auto', display: 'block' }} />
                </div>
              )}
              <div>
                <h1 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: burg, fontVariant: 'small-caps', letterSpacing: '2px' }}>{school?.name || '-'}</h1>
                {school?.address && <p style={{ fontSize: '8px', margin: '1px 0 0', color: '#8a6a5a', fontStyle: 'italic' }}>{school.address}</p>}
              </div>
            </div>
          </div>
        )}

        {/* TITLE */}
        <div style={{ textAlign: 'center', marginBottom: '5px' }}>
          <span style={{ color: gold, fontSize: '11px' }}>✦</span>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: burg, letterSpacing: '5px', textTransform: 'uppercase', margin: '0 8px' }}>{title}</span>
          <span style={{ color: gold, fontSize: '11px' }}>✦</span>
          <div style={{ fontSize: '7px', color: '#999', marginTop: '1px' }}>{copyType}{!isOriginal ? ' — Duplicate Issue' : ''}</div>
        </div>

        {/* STUDENT */}
        <table style={{ width: '100%', fontSize: '8.5px', marginBottom: '5px', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '2px', color: burg, width: '10%', fontStyle: 'italic' }}>Name:</td>
              <td style={{ padding: '2px', fontWeight: 'bold', borderBottom: `1px solid ${gold}`, width: '40%' }}>{student?.full_name || '-'}</td>
              <td style={{ padding: '2px', color: burg, width: '10%', fontStyle: 'italic', textAlign: 'right' }}>Receipt:</td>
              <td style={{ padding: '2px', borderBottom: `1px solid ${gold}` }}>{transactionId?.split('/').pop() || '-'}</td>
            </tr>
            <tr>
              <td style={{ padding: '2px', color: burg, fontStyle: 'italic' }}>Guardian:</td>
              <td style={{ padding: '2px', borderBottom: `1px solid ${gold}` }}>{student?.father_name || '-'}</td>
              <td style={{ padding: '2px', color: burg, fontStyle: 'italic', textAlign: 'right' }}>Date:</td>
              <td style={{ padding: '2px', borderBottom: `1px solid ${gold}` }}>{receiptDate ? format(new Date(receiptDate), 'dd MMMM yyyy') : '-'}</td>
            </tr>
            <tr>
              <td style={{ padding: '2px', color: burg, fontStyle: 'italic' }}>Class:</td>
              <td style={{ padding: '2px', borderBottom: `1px solid ${gold}` }}>{student?.class?.name || '-'}{student?.section?.name ? ` — Section ${student.section.name}` : ''}</td>
              <td style={{ padding: '2px', color: burg, fontStyle: 'italic', textAlign: 'right' }}>Mode:</td>
              <td style={{ padding: '2px', borderBottom: `1px solid ${gold}` }}>{paymentMode || 'Cash'}</td>
            </tr>
          </tbody>
        </table>

        {/* FEE TABLE */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px', marginBottom: '4px', border: `1px solid ${burg}` }}>
          <thead>
            <tr style={{ backgroundColor: burg, color: gold }}>
              <th style={{ padding: '3px 5px', textAlign: 'center', width: '26px' }}>S.No</th>
              <th style={{ padding: '3px 5px', textAlign: 'left', fontVariant: 'small-caps', letterSpacing: '1px' }}>Description of Fees</th>
              <th style={{ padding: '3px 5px', textAlign: 'right', width: '75px' }}>Assessed (₹)</th>
              <th style={{ padding: '3px 5px', textAlign: 'right', width: '70px' }}>Concession</th>
              <th style={{ padding: '3px 5px', textAlign: 'right', width: '75px' }}>Received (₹)</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: `1px solid #e8d8c8`, backgroundColor: idx % 2 === 0 ? '#faf5ef' : '#f5ede0' }}>
                <td style={{ padding: '2.5px 5px', textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ padding: '2.5px 5px', fontStyle: 'italic' }}>{item.description}</td>
                <td style={{ padding: '2.5px 5px', textAlign: 'right' }}>{fmt(item.totalAmount)}</td>
                <td style={{ padding: '2.5px 5px', textAlign: 'right', color: gold }}>{Number(item.discount || 0) > 0 ? fmt(item.discount) : '—'}</td>
                <td style={{ padding: '2.5px 5px', textAlign: 'right' }}>{fmt(item.amount)}</td>
              </tr>
            ))}
            {totalFine > 0 && (
              <tr style={{ borderBottom: `1px solid #e8d8c8`, backgroundColor: '#faf5ef' }}>
                <td style={{ padding: '2.5px 5px' }}></td>
                <td style={{ padding: '2.5px 5px', fontStyle: 'italic', color: '#8b0000' }}>Late Fine</td>
                <td style={{ padding: '2.5px 5px' }}></td>
                <td style={{ padding: '2.5px 5px' }}></td>
                <td style={{ padding: '2.5px 5px', textAlign: 'right', color: '#8b0000' }}>+₹{fmt(totalFine)}</td>
              </tr>
            )}
            <tr style={{ fontWeight: 'bold', backgroundColor: '#efe0cc', borderTop: `2px solid ${burg}` }}>
              <td colSpan={2} style={{ padding: '3px 5px', textAlign: 'right', fontVariant: 'small-caps' }}>{isRefund ? 'Total Refund' : 'Grand Total'}:</td>
              <td style={{ padding: '3px 5px', textAlign: 'right' }}>₹{fmt(overallTotalAmount)}</td>
              <td style={{ padding: '3px 5px', textAlign: 'right', color: gold }}>{totalDiscount > 0 ? `₹${fmt(totalDiscount)}` : '—'}</td>
              <td style={{ padding: '3px 5px', textAlign: 'right', color: burg, fontSize: '10px' }}>₹{fmt(grandTotal)}</td>
            </tr>
          </tbody>
        </table>

        {/* AMOUNT IN WORDS */}
        <div style={{ fontSize: '8px', fontStyle: 'italic', color: burg, marginBottom: '3px' }}>
          <strong>In Words:</strong> {numberToWords(grandTotal)}
          {overallBalance > 0 && <span style={{ color: '#8b0000', marginLeft: '10px' }}>[Balance: ₹{fmt(overallBalance)}]</span>}
        </div>

        {/* SCHEDULE OF FEES */}
        {feeStatement.length > 0 && (
          <div style={{ fontSize: '7.5px', borderTop: `1px solid ${gold}`, paddingTop: '2px', marginBottom: '3px' }}>
            <strong style={{ color: burg, fontVariant: 'small-caps' }}>Schedule of Fees:</strong>
            {feeStatement.map((fee, i) => (
              <span key={i} style={{ marginLeft: '6px', borderBottom: `1px dotted ${gold}`, padding: '0 2px' }}>
                {fee.name}: {fee.status?.toLowerCase() === 'paid' ? '✓' : '✗'} (₹{fmt(fee.paid)}/{fmt(fee.amount)})
              </span>
            ))}
          </div>
        )}

        {/* FOOTER */}
        {printSettings?.footer_content ? (
          <div style={{ lineHeight: '1.4' }} className="receipt-footer-content" dangerouslySetInnerHTML={{ __html: printSettings.footer_content }} />
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7.5px', marginTop: '3px' }}>
            <span style={{ fontStyle: 'italic', color: '#999' }}>Session: {sessionName || '-'} | {transactionId || '-'}</span>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: `1px solid ${burg}`, paddingTop: '3px', minWidth: '100px', color: burg, fontVariant: 'small-caps' }}>Bursar / Authorised Signatory</div>
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

Template18_ColonialElegant.templateMeta = {
  key: 'colonial_elegant',
  name: 'Colonial Elegant',
  description: 'Victorian-era design with burgundy and gold filigree',
  category: 'classic',
  paperSize: 'A5',
  orientation: 'landscape',
  features: ['fee_statement', 'copy_type', 'amount_in_words', 'signature', 'double_border'],
  colorScheme: { primary: '#4a0020', secondary: '#faf5ef', accent: '#c5a55a' }
};

export default Template18_ColonialElegant;
