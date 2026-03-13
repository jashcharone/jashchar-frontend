/**
 * Template 27: Bilingual Kannada
 * Kannada + English dual-language receipt
 * Paper: A5 Landscape | Category: Creative
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

const Template27_BilingualKannada = ({ receiptData, copyType }) => {
  const {
    student, school, lineItems = [], feeStatement = [],
    totalPaid, totalDiscount, totalFine, grandTotal,
    overallTotalAmount = 0, overallBalance = 0,
    transactionId, receiptDate, paymentMode,
    isRefund, isOriginal, printSettings, sessionName, title = 'FEE RECEIPT'
  } = receiptData;

  const showConcession = totalDiscount > 0;
  const crimson = '#b71c1c';
  const darkGold = '#c17900';

  return (
    <div style={{ width: '200mm', height: '140mm', boxSizing: 'border-box', pageBreakInside: 'avoid', position: 'relative', backgroundColor: '#fffef8', fontFamily: "'Segoe UI', 'Noto Sans Kannada', sans-serif", color: '#333', overflow: 'hidden', border: `2px solid ${crimson}` }}>
      
      {/* Top decorative band */}
      <div style={{ height: '5px', background: `linear-gradient(90deg, ${crimson}, ${darkGold}, ${crimson})` }} />

      <div style={{ padding: '6px 15px' }}>
        {/* HEADER */}
        {printSettings?.header_image_url ? (
          <div style={{ marginBottom: '5px' }}><img src={printSettings.header_image_url} alt='Header' style={{ width: '100%', height: 'auto', display: 'block' }} /></div>
        ) : (
          <div style={{ textAlign: 'center', marginBottom: '5px', borderBottom: `1px solid ${crimson}`, paddingBottom: '4px' }}>
            {school?.logo_url && <img src={school.logo_url} alt='Logo' style={{ height: '34px', width: 'auto', marginBottom: '2px' }} />}
            <h1 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0, color: crimson }}>{school?.name || '-'}</h1>
            {school?.address && <p style={{ fontSize: '8px', margin: '1px 0 0', color: '#666' }}>{school.address}</p>}
          </div>
        )}

        {/* TITLE - Bilingual */}
        <div style={{ textAlign: 'center', marginBottom: '5px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: darkGold }}>ಶುಲ್ಕ ರಸೀದಿ</span>
          <span style={{ fontSize: '10px', color: '#999', margin: '0 8px' }}>|</span>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: crimson }}>{title}</span>
          <div style={{ fontSize: '7px', color: '#999' }}>{copyType}{!isOriginal ? ' / ನಕಲು (Duplicate)' : ''}</div>
        </div>

        {/* STUDENT INFO - Bilingual */}
        <table style={{ width: '100%', fontSize: '8.5px', marginBottom: '5px', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ width: '25%', padding: '2px 3px' }}><span style={{ color: darkGold }}>ಹೆಸರು / Name:</span> <strong>{student?.full_name || '-'}</strong></td>
              <td style={{ width: '25%', padding: '2px 3px' }}><span style={{ color: darkGold }}>ತಂದೆ / Father:</span> {student?.father_name || '-'}</td>
              <td style={{ width: '25%', padding: '2px 3px' }}><span style={{ color: darkGold }}>ತರಗತಿ / Class:</span> {student?.class?.name || '-'}{student?.section?.name ? ` (${student.section.name})` : ''}</td>
              <td style={{ width: '25%', padding: '2px 3px' }}><span style={{ color: darkGold }}>ಪ್ರವೇಶ ಸಂ. / Adm#:</span> {student?.school_code || '-'}</td>
            </tr>
            <tr>
              <td style={{ padding: '2px 3px' }}><span style={{ color: darkGold }}>ರಸೀದಿ ಸಂ. / Receipt#:</span> {transactionId?.split('/').pop() || '-'}</td>
              <td style={{ padding: '2px 3px' }}><span style={{ color: darkGold }}>ದಿನಾಂಕ / Date:</span> {receiptDate ? format(new Date(receiptDate), 'dd-MM-yyyy') : '-'}</td>
              <td style={{ padding: '2px 3px' }}><span style={{ color: darkGold }}>ಪಾವತಿ / Mode:</span> {paymentMode || 'ನಗದು / Cash'}</td>
              <td style={{ padding: '2px 3px' }}><span style={{ color: darkGold }}>ಅವಧಿ / Session:</span> {sessionName || '-'}</td>
            </tr>
          </tbody>
        </table>

        {/* FEE TABLE */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px', marginBottom: '4px', border: '1px solid #ddd' }}>
          <thead>
            <tr style={{ backgroundColor: crimson, color: '#fff' }}>
              <th style={{ padding: '3px 5px', textAlign: 'left' }}>ವಿವರ / Description</th>
              <th style={{ padding: '3px 5px', textAlign: 'right', width: '95px' }}>ಶುಲ್ಕ / Assessed (₹)</th>
              <th style={{ padding: '3px 5px', textAlign: 'right', width: '95px' }}>ಪಡೆದ ಮೊತ್ತ / Received (₹)</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #eee', backgroundColor: idx % 2 === 0 ? '#fffef8' : '#faf5e8' }}>
                <td style={{ padding: '2.5px 5px' }}>
                  {item.description}
                  {Number(item.discount || 0) > 0 && <span style={{ fontSize: '7px', color: darkGold }}> (ರಿಯಾಯಿತಿ: ₹{fmt(item.discount)})</span>}
                </td>
                <td style={{ padding: '2.5px 5px', textAlign: 'right' }}>{fmt(item.totalAmount)}</td>
                <td style={{ padding: '2.5px 5px', textAlign: 'right' }}>{fmt(item.amount)}</td>
              </tr>
            ))}
            {totalFine > 0 && (
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '2.5px 5px', color: '#c00' }}>ವಿಳಂಬ ದಂಡ / Late Fine</td>
                <td style={{ padding: '2.5px 5px' }}></td>
                <td style={{ padding: '2.5px 5px', textAlign: 'right', color: '#c00' }}>+₹{fmt(totalFine)}</td>
              </tr>
            )}
            <tr style={{ fontWeight: 'bold', backgroundColor: '#f0e0c0', borderTop: `2px solid ${crimson}` }}>
              <td style={{ padding: '3px 5px', textAlign: 'right' }}>{isRefund ? 'ಒಟ್ಟು ಮರುಪಾವತಿ / Total Refund' : 'ಒಟ್ಟು ಪಾವತಿ / Total Paid'}:</td>
              <td style={{ padding: '3px 5px', textAlign: 'right' }}>₹{fmt(overallTotalAmount)}</td>
              <td style={{ padding: '3px 5px', textAlign: 'right', color: crimson, fontSize: '10px' }}>₹{fmt(grandTotal)}</td>
            </tr>
          </tbody>
        </table>

        {/* AMOUNT IN WORDS */}
        <div style={{ fontSize: '8px', marginBottom: '3px', fontStyle: 'italic' }}>
          <strong>ಅಕ್ಷರಗಳಲ್ಲಿ / In Words:</strong> {numberToWords(grandTotal)}
          {overallBalance > 0 && <span style={{ color: '#c00', marginLeft: '8px' }}>(ಬಾಕಿ / Balance: ₹{fmt(overallBalance)})</span>}
        </div>

        {/* FOOTER */}
        {printSettings?.footer_content ? (
          <div style={{ lineHeight: '1.4' }} className="receipt-footer-content" dangerouslySetInnerHTML={{ __html: printSettings.footer_content }} />
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7.5px', color: '#888' }}>
            <span>TXN: {transactionId || '-'} • ಕಂಪ್ಯೂಟರ್ ರಸೀದಿ / Computer Generated</span>
            <span style={{ borderTop: `1px solid ${crimson}`, paddingTop: '3px', minWidth: '90px', textAlign: 'center', color: crimson }}>ಅಧಿಕೃತ ಸಹಿ / Auth. Sign.</span>
          </div>
        )}
      </div>

      {/* Bottom decorative band */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${crimson}, ${darkGold}, ${crimson})` }} />

      {isRefund && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)', opacity: 0.07, pointerEvents: 'none' }}>
          <span style={{ fontSize: '48px', fontWeight: 'bold', color: 'red' }}>REFUND</span>
        </div>
      )}
    </div>
  );
};

Template27_BilingualKannada.templateMeta = {
  key: 'bilingual_kannada',
  name: 'Bilingual Kannada',
  description: 'Kannada + English dual-language receipt with crimson-gold theme',
  category: 'creative',
  paperSize: 'A5',
  orientation: 'landscape',
  features: ['fee_statement', 'copy_type', 'amount_in_words', 'signature', 'bilingual', 'kannada'],
  colorScheme: { primary: '#b71c1c', secondary: '#fffef8', accent: '#c17900' }
};

export default Template27_BilingualKannada;
