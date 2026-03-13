/**
 * Template 26: Bilingual Hindi
 * Hindi + English dual-language receipt
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

const Template26_BilingualHindi = ({ receiptData, copyType }) => {
  const {
    student, school, lineItems = [], feeStatement = [],
    totalPaid, totalDiscount, totalFine, grandTotal,
    overallTotalAmount = 0, overallBalance = 0,
    transactionId, receiptDate, paymentMode,
    isRefund, isOriginal, printSettings, sessionName, title = 'FEE RECEIPT'
  } = receiptData;

  const showConcession = totalDiscount > 0;
  const saffron = '#ff6f00';

  return (
    <div style={{ width: '200mm', height: '140mm', boxSizing: 'border-box', pageBreakInside: 'avoid', position: 'relative', backgroundColor: '#fff', fontFamily: "'Segoe UI', 'Noto Sans Devanagari', sans-serif", color: '#333', overflow: 'hidden', border: '2px solid #1a237e' }}>
      
      {/* TRICOLOR TOP */}
      <div style={{ display: 'flex', height: '5px' }}>
        <div style={{ flex: 1, backgroundColor: '#ff9933' }} />
        <div style={{ flex: 1, backgroundColor: '#fff' }} />
        <div style={{ flex: 1, backgroundColor: '#138808' }} />
      </div>

      <div style={{ padding: '6px 15px' }}>
        {/* HEADER */}
        {printSettings?.header_image_url ? (
          <div style={{ marginBottom: '5px' }}><img src={printSettings.header_image_url} alt='Header' style={{ width: '100%', height: 'auto', display: 'block' }} /></div>
        ) : (
          <div style={{ textAlign: 'center', marginBottom: '5px', borderBottom: '1px solid #1a237e', paddingBottom: '4px' }}>
            {school?.logo_url && <img src={school.logo_url} alt='Logo' style={{ height: '34px', width: 'auto', marginBottom: '2px' }} />}
            <h1 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0, color: '#1a237e' }}>{school?.name || '-'}</h1>
            {school?.address && <p style={{ fontSize: '8px', margin: '1px 0 0', color: '#666' }}>{school.address}</p>}
          </div>
        )}

        {/* TITLE - Bilingual */}
        <div style={{ textAlign: 'center', marginBottom: '5px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: saffron }}>शुल्क रसीद</span>
          <span style={{ fontSize: '10px', color: '#888', margin: '0 8px' }}>|</span>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1a237e' }}>{title}</span>
          <div style={{ fontSize: '7px', color: '#999' }}>{copyType}{!isOriginal ? ' / प्रतिलिपि (Duplicate)' : ''}</div>
        </div>

        {/* STUDENT INFO - Bilingual */}
        <table style={{ width: '100%', fontSize: '8.5px', marginBottom: '5px', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ width: '25%', padding: '2px 3px' }}><span style={{ color: saffron }}>नाम / Name:</span> <strong>{student?.full_name || '-'}</strong></td>
              <td style={{ width: '25%', padding: '2px 3px' }}><span style={{ color: saffron }}>पिता / Father:</span> {student?.father_name || '-'}</td>
              <td style={{ width: '25%', padding: '2px 3px' }}><span style={{ color: saffron }}>कक्षा / Class:</span> {student?.class?.name || '-'}{student?.section?.name ? ` (${student.section.name})` : ''}</td>
              <td style={{ width: '25%', padding: '2px 3px' }}><span style={{ color: saffron }}>प्रवेश सं. / Adm#:</span> {student?.school_code || '-'}</td>
            </tr>
            <tr>
              <td style={{ padding: '2px 3px' }}><span style={{ color: saffron }}>रसीद सं. / Receipt#:</span> {transactionId?.split('/').pop() || '-'}</td>
              <td style={{ padding: '2px 3px' }}><span style={{ color: saffron }}>दिनांक / Date:</span> {receiptDate ? format(new Date(receiptDate), 'dd-MM-yyyy') : '-'}</td>
              <td style={{ padding: '2px 3px' }}><span style={{ color: saffron }}>भुगतान / Mode:</span> {paymentMode || 'Cash / नकद'}</td>
              <td style={{ padding: '2px 3px' }}><span style={{ color: saffron }}>सत्र / Session:</span> {sessionName || '-'}</td>
            </tr>
          </tbody>
        </table>

        {/* FEE TABLE */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px', marginBottom: '4px', border: '1px solid #ddd' }}>
          <thead>
            <tr style={{ backgroundColor: '#1a237e', color: '#fff' }}>
              <th style={{ padding: '3px 5px', textAlign: 'left' }}>विवरण / Description</th>
              <th style={{ padding: '3px 5px', textAlign: 'right', width: '80px' }}>शुल्क / Fees</th>
              <th style={{ padding: '3px 5px', textAlign: 'right', width: '80px' }}>भुगतान / Payment</th>
              <th style={{ padding: '3px 5px', textAlign: 'center', width: '80px' }}>स्थिति / Status</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => {
              const isPaid = Number(item.balance || 0) === 0 && Number(item.amount || 0) > 0;
              const isPartial = Number(item.amount || 0) > 0 && Number(item.balance || 0) > 0;
              return (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '2.5px 5px' }}>
                    {item.description}
                    {Number(item.discount || 0) > 0 && <span style={{ fontSize: '7px', color: saffron }}> (छूट: ₹{fmt(item.discount)})</span>}
                  </td>
                  <td style={{ padding: '2.5px 5px', textAlign: 'right' }}>{fmt(item.totalAmount)}</td>
                  <td style={{ padding: '2.5px 5px', textAlign: 'right' }}>{fmt(item.amount)}</td>
                  <td style={{ padding: '2.5px 5px', textAlign: 'center', fontSize: '7.5px', color: isPaid ? '#388e3c' : isPartial ? '#e65100' : '#c00' }}>
                    {isPaid ? '✓ पूर्ण / Paid' : isPartial ? '◐ आंशिक / Partial' : '✗ अदत्त / Unpaid'}
                  </td>
                </tr>
              );
            })}
            {totalFine > 0 && (
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '2.5px 5px', color: '#c00' }}>विलंब शुल्क / Late Fine</td>
                <td style={{ padding: '2.5px 5px' }}></td>
                <td style={{ padding: '2.5px 5px', textAlign: 'right', color: '#c00' }}>+₹{fmt(totalFine)}</td>
                <td style={{ padding: '2.5px 5px' }}></td>
              </tr>
            )}
            <tr style={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', borderTop: '2px solid #1a237e' }}>
              <td style={{ padding: '3px 5px', textAlign: 'right' }}>{isRefund ? 'कुल वापसी / Total Refund' : 'कुल भुगतान / Total Paid'}:</td>
              <td style={{ padding: '3px 5px', textAlign: 'right' }}>₹{fmt(overallTotalAmount)}</td>
              <td style={{ padding: '3px 5px', textAlign: 'right', color: '#1a237e', fontSize: '10px' }}>₹{fmt(grandTotal)}</td>
              <td style={{ padding: '3px 5px', textAlign: 'center', fontSize: '7.5px', color: overallBalance > 0 ? '#c00' : '#388e3c' }}>
                {overallBalance > 0 ? `शेष: ₹${fmt(overallBalance)}` : '✓ पूर्ण / Settled'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* AMOUNT IN WORDS */}
        <div style={{ fontSize: '8px', marginBottom: '3px', fontStyle: 'italic' }}>
          <strong>शब्दों में / In Words:</strong> {numberToWords(grandTotal)}
          {overallBalance > 0 && <span style={{ color: '#c00', marginLeft: '8px' }}>(शेष / Balance: ₹{fmt(overallBalance)})</span>}
        </div>

        {/* FOOTER */}
        {printSettings?.footer_content ? (
          <div style={{ lineHeight: '1.4' }} className="receipt-footer-content" dangerouslySetInnerHTML={{ __html: printSettings.footer_content }} />
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7.5px', color: '#888' }}>
            <span>TXN: {transactionId || '-'} • कंप्यूटर जनित रसीद / Computer Generated</span>
            <span style={{ borderTop: '1px solid #1a237e', paddingTop: '3px', minWidth: '90px', textAlign: 'center', color: '#1a237e' }}>अधिकृत हस्ताक्षर / Auth. Sign.</span>
          </div>
        )}
      </div>

      {/* TRICOLOR BOTTOM */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', height: '3px' }}>
        <div style={{ flex: 1, backgroundColor: '#ff9933' }} />
        <div style={{ flex: 1, backgroundColor: '#fff' }} />
        <div style={{ flex: 1, backgroundColor: '#138808' }} />
      </div>

      {isRefund && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)', opacity: 0.07, pointerEvents: 'none' }}>
          <span style={{ fontSize: '48px', fontWeight: 'bold', color: 'red' }}>REFUND</span>
        </div>
      )}
    </div>
  );
};

Template26_BilingualHindi.templateMeta = {
  key: 'bilingual_hindi',
  name: 'Bilingual Hindi',
  description: 'Hindi + English dual-language receipt with tricolor accent',
  category: 'creative',
  paperSize: 'A5',
  orientation: 'landscape',
  features: ['fee_statement', 'copy_type', 'amount_in_words', 'signature', 'bilingual', 'hindi'],
  colorScheme: { primary: '#1a237e', secondary: '#ffffff', accent: '#ff6f00' }
};

export default Template26_BilingualHindi;
