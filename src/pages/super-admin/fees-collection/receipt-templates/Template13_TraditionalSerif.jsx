/**
 * Template 13: Traditional Serif
 * Newspaper/book style with serif fonts, old-world feel
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
  if (Math.floor(n / 10000000) > 0) { result += convert(Math.floor(n / 10000000)) + ' Crore '; }
  if (Math.floor((n % 10000000) / 100000) > 0) { result += convert(Math.floor((n % 10000000) / 100000)) + ' Lakh '; }
  if (Math.floor((n % 100000) / 1000) > 0) { result += convert(Math.floor((n % 100000) / 1000)) + ' Thousand '; }
  if (Math.floor((n % 1000) / 100) > 0) { result += a[Math.floor((n % 1000) / 100)] + ' Hundred '; }
  if (n % 100 > 0) { if (result) result += 'and '; result += convert(n % 100); }
  return result.trim() + ' Rupees Only';
}

const Template13_TraditionalSerif = ({ receiptData, copyType }) => {
  const {
    student, school, lineItems = [], feeStatement = [],
    totalPaid, totalDiscount, totalFine, grandTotal,
    overallTotalAmount = 0, overallBalance = 0,
    transactionId, receiptDate, paymentMode,
    isRefund, isOriginal, printSettings, sessionName, title = 'FEE RECEIPT'
  } = receiptData;

  const showConcession = totalDiscount > 0;
  const serifFont = "'Georgia', 'Times New Roman', serif";

  return (
    <div style={{ width: '200mm', height: '140mm', boxSizing: 'border-box', pageBreakInside: 'avoid', position: 'relative', backgroundColor: '#fdf6e3', fontFamily: serifFont, color: '#2c1810', overflow: 'hidden', border: '2px solid #8b4513', padding: '10px 15px' }}>
      
      {/* INNER BORDER */}
      <div style={{ border: '1px solid #c9a96e', padding: '6px 10px', height: 'calc(100% - 12px)', boxSizing: 'border-box' }}>

        {/* HEADER */}
        {printSettings?.header_image_url ? (
          <div style={{ marginBottom: '6px' }}><img src={printSettings.header_image_url} alt='Header' style={{ width: '100%', height: 'auto', display: 'block' }} /></div>
        ) : (
          <div style={{ textAlign: 'center', borderBottom: '2px double #8b4513', paddingBottom: '6px', marginBottom: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
              {school?.logo_url && <img src={school.logo_url} alt='Logo' style={{ height: '38px', width: 'auto' }} />}
              <div>
                <h1 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#5c2d0e', fontVariant: 'small-caps' }}>{school?.name || '-'}</h1>
                {school?.address && <p style={{ fontSize: '8px', margin: '1px 0 0', color: '#6b4226', fontStyle: 'italic' }}>{school.address}</p>}
              </div>
            </div>
          </div>
        )}

        {/* TITLE */}
        <div style={{ textAlign: 'center', marginBottom: '5px' }}>
          <span style={{ fontSize: '12px', fontVariant: 'small-caps', fontWeight: 'bold', letterSpacing: '3px', color: '#5c2d0e', borderBottom: '1px solid #c9a96e', paddingBottom: '2px' }}>{title}</span>
          <span style={{ fontSize: '7px', marginLeft: '8px', color: '#999', fontStyle: 'italic' }}>{copyType}{!isOriginal ? ' — Reprint' : ''}</span>
        </div>

        {/* STUDENT INFO - Table style */}
        <table style={{ width: '100%', fontSize: '8.5px', marginBottom: '5px', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '2px 4px', width: '12%', color: '#8b4513', fontStyle: 'italic' }}>Name:</td>
              <td style={{ padding: '2px 4px', width: '38%', fontWeight: 'bold', borderBottom: '1px dotted #c9a96e' }}>{student?.full_name || '-'}</td>
              <td style={{ padding: '2px 4px', width: '12%', color: '#8b4513', fontStyle: 'italic' }}>Receipt No.:</td>
              <td style={{ padding: '2px 4px', borderBottom: '1px dotted #c9a96e' }}>{transactionId?.split('/').pop() || '-'}</td>
            </tr>
            <tr>
              <td style={{ padding: '2px 4px', color: '#8b4513', fontStyle: 'italic' }}>Father&apos;s Name:</td>
              <td style={{ padding: '2px 4px', borderBottom: '1px dotted #c9a96e' }}>{student?.father_name || '-'}</td>
              <td style={{ padding: '2px 4px', color: '#8b4513', fontStyle: 'italic' }}>Date:</td>
              <td style={{ padding: '2px 4px', borderBottom: '1px dotted #c9a96e' }}>{receiptDate ? format(new Date(receiptDate), 'dd MMM yyyy') : '-'}</td>
            </tr>
            <tr>
              <td style={{ padding: '2px 4px', color: '#8b4513', fontStyle: 'italic' }}>Class:</td>
              <td style={{ padding: '2px 4px', borderBottom: '1px dotted #c9a96e' }}>{student?.class?.name || '-'}{student?.section?.name ? ` (${student.section.name})` : ''}</td>
              <td style={{ padding: '2px 4px', color: '#8b4513', fontStyle: 'italic' }}>Mode:</td>
              <td style={{ padding: '2px 4px', borderBottom: '1px dotted #c9a96e' }}>{paymentMode || 'Cash'}</td>
            </tr>
          </tbody>
        </table>

        {/* FEE TABLE */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px', marginBottom: '5px', border: '1px solid #c9a96e' }}>
          <thead>
            <tr style={{ backgroundColor: '#5c2d0e', color: '#fdf6e3' }}>
              <th style={{ padding: '4px 5px', textAlign: 'left', borderRight: '1px solid #c9a96e', fontVariant: 'small-caps' }}>Particulars</th>
              <th style={{ padding: '4px 5px', textAlign: 'right', width: '80px', borderRight: '1px solid #c9a96e' }}>Assessed ({`\u20b9`})</th>
              <th style={{ padding: '4px 5px', textAlign: 'right', width: '80px', borderRight: '1px solid #c9a96e' }}>Received ({`\u20b9`})</th>
              <th style={{ padding: '4px 5px', textAlign: 'center', width: '90px' }}>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => {
              const isPaid = Number(item.balance || 0) === 0 && Number(item.amount || 0) > 0;
              const isPartial = Number(item.amount || 0) > 0 && Number(item.balance || 0) > 0;
              return (
                <tr key={idx} style={{ borderBottom: '1px solid #e8d5b5' }}>
                  <td style={{ padding: '3px 5px', fontStyle: 'italic', borderRight: '1px solid #e8d5b5' }}>
                    {item.description}
                    {Number(item.discount || 0) > 0 && <span style={{ fontSize: '7px', color: '#c9a96e' }}> (Conc: {`\u20b9`}{fmt(item.discount)})</span>}
                  </td>
                  <td style={{ padding: '3px 5px', textAlign: 'right', borderRight: '1px solid #e8d5b5' }}>{fmt(item.totalAmount)}</td>
                  <td style={{ padding: '3px 5px', textAlign: 'right', borderRight: '1px solid #e8d5b5' }}>{fmt(item.amount)}</td>
                  <td style={{ padding: '3px 5px', textAlign: 'center', fontSize: '7.5px', fontStyle: 'italic', color: isPaid ? '#2e7d32' : isPartial ? '#e65100' : '#c62828' }}>
                    {isPaid ? 'Paid in Full' : isPartial ? 'Partial Payment' : 'Not Paid'}
                  </td>
                </tr>
              );
            })}
            {totalFine > 0 && (
              <tr style={{ borderBottom: '1px solid #e8d5b5' }}>
                <td style={{ padding: '3px 5px', fontStyle: 'italic', borderRight: '1px solid #e8d5b5', color: '#c00' }}>Late Fine</td>
                <td style={{ padding: '3px 5px', borderRight: '1px solid #e8d5b5' }}></td>
                <td style={{ padding: '3px 5px', textAlign: 'right', borderRight: '1px solid #e8d5b5', color: '#c00' }}>+{`\u20b9`}{fmt(totalFine)}</td>
                <td style={{ padding: '3px 5px' }}></td>
              </tr>
            )}
            <tr style={{ backgroundColor: '#f5e6cc', fontWeight: 'bold' }}>
              <td style={{ padding: '4px 5px', textAlign: 'right', borderRight: '1px solid #e8d5b5', fontVariant: 'small-caps' }}>{isRefund ? 'Total Refund' : 'Total Received'}:</td>
              <td style={{ padding: '4px 5px', textAlign: 'right', borderRight: '1px solid #e8d5b5' }}>{`\u20b9`}{fmt(overallTotalAmount)}</td>
              <td style={{ padding: '4px 5px', textAlign: 'right', borderRight: '1px solid #e8d5b5' }}>{`\u20b9`}{fmt(grandTotal)}</td>
              <td style={{ padding: '4px 5px', textAlign: 'center', fontSize: '7.5px', color: overallBalance > 0 ? '#c00' : '#2e7d32' }}>
                {overallBalance > 0 ? `Balance: \u20b9${fmt(overallBalance)}` : 'All Settled'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* AMOUNT IN WORDS */}
        <div style={{ fontSize: '8px', fontStyle: 'italic', color: '#5c2d0e', marginBottom: '4px' }}>
          Amount in words: <strong>{numberToWords(grandTotal)}</strong>
        </div>

        {/* RECEIPT NARRATIVE */}
        {feeStatement.length > 0 && (
          <div style={{ borderTop: '1px dashed #c9a96e', paddingTop: '3px', marginBottom: '3px', fontSize: '7.5px', fontStyle: 'italic', lineHeight: '1.5' }}>
            This receipt acknowledges payment towards: {feeStatement.map((fee, i) => `${fee.name} (\u20b9${fmt(fee.paid)} of \u20b9${fmt(fee.amount)}, ${fee.status})`).join('; ')}.
          </div>
        )}

        {/* FOOTER */}
        {printSettings?.footer_content ? (
          <div style={{ lineHeight: '1.4' }} className="receipt-footer-content" dangerouslySetInnerHTML={{ __html: printSettings.footer_content }} />
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7.5px', marginTop: '4px', color: '#8b4513' }}>
            <span style={{ fontStyle: 'italic' }}>Session: {sessionName || '-'} | TXN: {transactionId || '-'}</span>
            <span style={{ borderTop: '1px solid #8b4513', paddingTop: '3px', minWidth: '80px', textAlign: 'center' }}>Authorised Signatory</span>
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

Template13_TraditionalSerif.templateMeta = {
  key: 'traditional_serif',
  name: 'Traditional Serif',
  description: 'Old-world newspaper style with serif fonts and warm tones',
  category: 'classic',
  paperSize: 'A5',
  orientation: 'landscape',
  features: ['fee_statement', 'copy_type', 'amount_in_words', 'signature'],
  colorScheme: { primary: '#5c2d0e', secondary: '#fdf6e3', accent: '#c9a96e' }
};

export default Template13_TraditionalSerif;
