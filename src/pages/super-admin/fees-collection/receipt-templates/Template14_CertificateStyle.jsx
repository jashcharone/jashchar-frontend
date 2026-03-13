/**
 * Template 14: Certificate Style
 * Ornamental border, certificate-like layout, gold accents
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

const Template14_CertificateStyle = ({ receiptData, copyType }) => {
  const {
    student, school, lineItems = [], feeStatement = [],
    totalPaid, totalDiscount, totalFine, grandTotal,
    overallBalance = 0,
    transactionId, receiptDate, paymentMode,
    isRefund, isOriginal, printSettings, sessionName, title = 'FEE RECEIPT'
  } = receiptData;

  const showConcession = totalDiscount > 0;

  return (
    <div style={{ width: '200mm', height: '140mm', boxSizing: 'border-box', pageBreakInside: 'avoid', position: 'relative', backgroundColor: '#fffef5', fontFamily: "'Georgia', serif", color: '#333', overflow: 'hidden', border: '4px double #b8860b', padding: '4px' }}>
      {/* Inner ornamental border */}
      <div style={{ border: '2px solid #daa520', height: 'calc(100% - 8px)', boxSizing: 'border-box', padding: '8px 14px', position: 'relative' }}>
        
        {/* Corner decorations */}
        {['top:0;left:0', 'top:0;right:0', 'bottom:0;left:0', 'bottom:0;right:0'].map((pos, i) => {
          const [y, x] = pos.split(';').map(p => p.split(':'));
          return <div key={i} style={{ position: 'absolute', [y[0]]: '-2px', [x[0]]: '-2px', width: '14px', height: '14px', borderColor: '#b8860b', borderStyle: 'solid', borderWidth: `${y[0] === 'top' ? '3px' : 0} ${x[0] === 'right' ? '3px' : 0} ${y[0] === 'bottom' ? '3px' : 0} ${x[0] === 'left' ? '3px' : 0}` }} />;
        })}

        {/* HEADER */}
        {printSettings?.header_image_url ? (
          <div style={{ textAlign: 'center', marginBottom: '5px' }}><img src={printSettings.header_image_url} alt='Header' style={{ width: '100%', height: 'auto', display: 'block' }} /></div>
        ) : (
          <div style={{ textAlign: 'center', marginBottom: '5px' }}>
            {school?.logo_url && <img src={school.logo_url} alt='Logo' style={{ height: '35px', width: 'auto', marginBottom: '3px' }} />}
            <h1 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#8b6914', letterSpacing: '2px' }}>{school?.name || '-'}</h1>
            {school?.address && <p style={{ fontSize: '8px', margin: '1px 0 0', color: '#888', fontStyle: 'italic' }}>{school.address}</p>}
          </div>
        )}

        {/* TITLE - Certificate style */}
        <div style={{ textAlign: 'center', margin: '3px 0 6px' }}>
          <div style={{ display: 'inline-block', position: 'relative', padding: '2px 30px' }}>
            <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', color: '#daa520', fontSize: '14px' }}>❧</span>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#8b6914', letterSpacing: '4px', textTransform: 'uppercase' }}>{title}</span>
            <span style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%) scaleX(-1)', color: '#daa520', fontSize: '14px' }}>❧</span>
          </div>
          <div style={{ fontSize: '7px', color: '#999', marginTop: '1px' }}>{copyType}{!isOriginal ? ' • Reprint' : ''}</div>
        </div>

        {/* STUDENT INFO */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8.5px', marginBottom: '5px', borderBottom: '1px solid #e8d8b0', paddingBottom: '4px' }}>
          <div><span style={{ color: '#b8860b' }}>Name:</span> <strong>{student?.full_name || '-'}</strong></div>
          <div><span style={{ color: '#b8860b' }}>Class:</span> {student?.class?.name || '-'}{student?.section?.name ? ` (${student.section.name})` : ''}</div>
          <div><span style={{ color: '#b8860b' }}>Adm No:</span> {student?.school_code || '-'}</div>
          <div><span style={{ color: '#b8860b' }}>Date:</span> {receiptDate ? format(new Date(receiptDate), 'dd MMM yyyy') : '-'}</div>
          <div><span style={{ color: '#b8860b' }}>No:</span> {transactionId?.split('/').pop() || '-'}</div>
        </div>

        {/* FEE TABLE */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px', marginBottom: '4px' }}>
          <thead>
            <tr style={{ backgroundColor: '#8b6914', color: '#fffef5' }}>
              <th style={{ padding: '3px 5px', textAlign: 'center', width: '26px', border: '1px solid #b8860b' }}>S.No</th>
              <th style={{ padding: '3px 5px', textAlign: 'left', border: '1px solid #b8860b' }}>Particulars</th>
              <th style={{ padding: '3px 5px', textAlign: 'right', width: '68px', border: '1px solid #b8860b' }}>Amount</th>
              {showConcession && <th style={{ padding: '3px 5px', textAlign: 'right', width: '58px', border: '1px solid #b8860b' }}>Concession</th>}
              <th style={{ padding: '3px 5px', textAlign: 'right', width: '58px', border: '1px solid #b8860b' }}>Paid</th>
              <th style={{ padding: '3px 5px', textAlign: 'right', width: '52px', border: '1px solid #b8860b' }}>Balance</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => (
              <tr key={idx}>
                <td style={{ padding: '2.5px 5px', textAlign: 'center', border: '1px solid #e8d8b0' }}>{idx + 1}</td>
                <td style={{ padding: '2.5px 5px', border: '1px solid #e8d8b0' }}>{item.description}</td>
                <td style={{ padding: '2.5px 5px', textAlign: 'right', border: '1px solid #e8d8b0' }}>{fmt(item.totalAmount)}</td>
                {showConcession && <td style={{ padding: '2.5px 5px', textAlign: 'right', border: '1px solid #e8d8b0' }}>{Number(item.discount || 0) > 0 ? fmt(item.discount) : ''}</td>}
                <td style={{ padding: '2.5px 5px', textAlign: 'right', border: '1px solid #e8d8b0' }}>{fmt(item.amount)}</td>
                <td style={{ padding: '2.5px 5px', textAlign: 'right', border: '1px solid #e8d8b0' }}>{fmt(item.balance)}</td>
              </tr>
            ))}
            <tr style={{ fontWeight: 'bold', backgroundColor: '#faf3e0' }}>
              <td colSpan={showConcession ? 4 : 3} style={{ padding: '3px 5px', textAlign: 'right', border: '1px solid #e8d8b0' }}>{isRefund ? 'Total Refund' : 'Total Paid'}:</td>
              <td style={{ padding: '3px 5px', textAlign: 'right', border: '1px solid #e8d8b0', color: '#8b6914', fontSize: '10px' }}>₹{fmt(grandTotal)}</td>
              <td style={{ padding: '3px 5px', textAlign: 'right', border: '1px solid #e8d8b0' }}>₹{fmt(overallBalance)}</td>
            </tr>
          </tbody>
        </table>

        {/* AMOUNT IN WORDS */}
        <div style={{ fontSize: '8px', fontStyle: 'italic', color: '#8b6914', marginBottom: '3px', borderBottom: '1px dotted #daa520', paddingBottom: '2px' }}>
          <strong>In Words:</strong> {numberToWords(grandTotal)}
        </div>

        {/* FEE STATEMENT */}
        {feeStatement.length > 0 && (
          <div style={{ marginBottom: '3px' }}>
            <div style={{ fontSize: '7.5px', color: '#b8860b', fontWeight: 'bold', marginBottom: '1px' }}>Fee Summary</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', fontSize: '7px' }}>
              {feeStatement.map((fee, i) => (
                <span key={i} style={{ padding: '1px 5px', border: '1px solid #e8d8b0', borderRadius: '3px', backgroundColor: '#faf3e0' }}>{fee.name}: ₹{fmt(fee.paid)} <em style={{ color: fee.status?.toLowerCase() === 'paid' ? '#388e3c' : '#e53935' }}>[{fee.status}]</em></span>
              ))}
            </div>
          </div>
        )}

        {/* FOOTER */}
        {printSettings?.footer_content ? (
          <div style={{ lineHeight: '1.4' }} className="receipt-footer-content" dangerouslySetInnerHTML={{ __html: printSettings.footer_content }} />
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '7.5px', color: '#888' }}>
            <span style={{ fontStyle: 'italic' }}>Session: {sessionName || '-'} | Mode: {paymentMode || 'Cash'}</span>
            <span style={{ borderTop: '1px solid #daa520', paddingTop: '3px', minWidth: '90px', textAlign: 'center', color: '#8b6914' }}>Authorised Signatory</span>
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

Template14_CertificateStyle.templateMeta = {
  key: 'certificate_style',
  name: 'Certificate Style',
  description: 'Ornamental border with gold accents, certificate layout',
  category: 'classic',
  paperSize: 'A5',
  orientation: 'landscape',
  features: ['fee_statement', 'copy_type', 'amount_in_words', 'signature', 'ornamental'],
  colorScheme: { primary: '#8b6914', secondary: '#fffef5', accent: '#daa520' }
};

export default Template14_CertificateStyle;
