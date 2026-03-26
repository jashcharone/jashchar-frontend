/**
 * Template 08: Gradient Sunset
 * Warm gradient, vibrant - great for play schools/kindergarten
 * Paper: A5 Landscape | Category: Modern
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

const Template08_GradientSunset = ({ receiptData, copyType }) => {
  const {
    student, school, lineItems = [], feeStatement = [],
    totalPaid, totalDiscount, totalFine, grandTotal,
    overallTotalAmount = 0, overallBalance = 0,
    transactionId, receiptDate, paymentMode,
    isRefund, isOriginal, printSettings, sessionName, title = 'FEE RECEIPT'
  } = receiptData;

  const amountInWords = numberToWords(Math.floor(grandTotal)) + ' Rupees Only';
  const showConcession = totalDiscount > 0;

  return (
    <div style={{ width: '200mm', height: '140mm', boxSizing: 'border-box', pageBreakInside: 'avoid', position: 'relative', backgroundColor: '#fff8f0', color: '#333', fontFamily: "'Segoe UI', sans-serif", overflow: 'hidden' }}>
      
      {/* HEADER - Warm gradient */}
      {printSettings?.header_image_url ? (
        <div style={{ width: '100%' }}><img src={printSettings.header_image_url} alt='Header' style={{ width: '100%', height: 'auto', display: 'block' }} /></div>
      ) : (
        <div style={{ background: 'linear-gradient(135deg, #ff6b6b, #ffa726, #ffee58)', padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {school?.logo_url && <img src={school.logo_url} alt='Logo' style={{ height: '50px', width: 'auto', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }} />}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h1 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', margin: 0, textShadow: '1px 1px 3px rgba(0,0,0,0.3)' }}>{school?.name || '-'}</h1>
            {school?.address && <p style={{ fontSize: '9px', color: '#fff', margin: '2px 0 0', textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}>{school.address}</p>}
          </div>
        </div>
      )}

      {/* TITLE - Rounded pill */}
      <div style={{ textAlign: 'center', padding: '5px 0' }}>
        <span style={{ background: 'linear-gradient(135deg, #ff6b6b, #ffa726)', color: '#fff', padding: '4px 25px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', letterSpacing: '2px', display: 'inline-block' }}>{title}</span>
        {!isOriginal && <span style={{ fontSize: '8px', color: '#fff', backgroundColor: '#e74c3c', padding: '2px 6px', borderRadius: '10px', marginLeft: '6px' }}>REPRINT</span>}
        <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#fff', backgroundColor: copyType === 'OFFICE COPY' ? '#e74c3c' : copyType === 'STUDENT COPY' ? '#3498db' : '#27ae60', padding: '2px 8px', borderRadius: '10px', marginLeft: '6px' }}>{copyType}</span>
      </div>

      {/* STUDENT INFO - White cards */}
      <div style={{ display: 'flex', padding: '4px 12px', gap: '8px', fontSize: '9px' }}>
        <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: '8px', padding: '6px 10px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ marginBottom: '2px' }}><strong style={{ color: '#ff6b6b' }}>Student:</strong> <strong>{student?.full_name || '-'}</strong></div>
          <div style={{ marginBottom: '2px' }}><strong style={{ color: '#ff6b6b' }}>Father:</strong> {student?.father_name || '-'}</div>
          <div><strong style={{ color: '#ff6b6b' }}>Adm#:</strong> {student?.enrollment_id || '-'} | <strong style={{ color: '#ff6b6b' }}>Class:</strong> {student?.class?.name || '-'}{student?.section?.name ? `(${student.section.name})` : ''}</div>
        </div>
        <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: '8px', padding: '6px 10px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ marginBottom: '2px' }}><strong style={{ color: '#ffa726' }}>Receipt:</strong> {transactionId || '-'}</div>
          <div style={{ marginBottom: '2px' }}><strong style={{ color: '#ffa726' }}>Date:</strong> {receiptDate ? format(new Date(receiptDate), 'dd MMM yyyy hh:mm a') : '-'}</div>
          <div><strong style={{ color: '#ffa726' }}>Mode:</strong> {paymentMode || 'Cash'} | <strong style={{ color: '#ffa726' }}>Session:</strong> {sessionName || '-'}</div>
        </div>
      </div>

      {/* FEE TABLE */}
      <div style={{ padding: '4px 12px' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', fontSize: '8.5px', borderRadius: '8px', overflow: 'hidden' }}>
          <thead>
            <tr style={{ backgroundColor: '#ff9800', color: '#fff' }}>
              <th style={{ padding: '4px 5px', textAlign: 'left' }}>Fee</th>
              <th style={{ padding: '4px 5px', textAlign: 'right', width: '80px' }}>Total ({`\u20b9`})</th>
              <th style={{ padding: '4px 5px', textAlign: 'center', width: '160px' }}>Payment Progress</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => {
              const pct = Number(item.totalAmount || 0) > 0 ? Math.round(((Number(item.totalAmount || 0) - Number(item.balance || 0)) / Number(item.totalAmount || 0)) * 100) : 0;
              return (
                <tr key={idx} style={{ backgroundColor: '#fff' }}>
                  <td style={{ padding: '4px 5px', borderBottom: '1px solid #fce4b8', fontWeight: '500', borderLeft: '3px solid #ff9800' }}>
                    {item.description}
                    {Number(item.discount || 0) > 0 && <span style={{ fontSize: '7px', color: '#e65100', marginLeft: '4px' }}>(Conc: {`\u20b9`}{fmt(item.discount)})</span>}
                  </td>
                  <td style={{ padding: '4px 5px', textAlign: 'right', borderBottom: '1px solid #fce4b8' }}>{fmt(item.totalAmount)}</td>
                  <td style={{ padding: '4px 5px', borderBottom: '1px solid #fce4b8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ flex: 1, height: '8px', backgroundColor: '#fff3e0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #ff6b6b, #ffa726)', borderRadius: '4px' }}></div>
                      </div>
                      <span style={{ fontSize: '7px', fontWeight: 'bold', color: '#e65100', minWidth: '28px', textAlign: 'right' }}>{pct}%</span>
                    </div>
                    <div style={{ fontSize: '7px', color: '#999', textAlign: 'center' }}>{`\u20b9`}{fmt(item.amount)} paid</div>
                  </td>
                </tr>
              );
            })}
            {totalFine > 0 && (
              <tr style={{ backgroundColor: '#fff5f5' }}>
                <td style={{ padding: '4px 5px', borderBottom: '1px solid #fce4b8', color: '#c00', fontWeight: '500' }}>Late Fine</td>
                <td style={{ padding: '4px 5px', textAlign: 'right', borderBottom: '1px solid #fce4b8', color: '#c00' }}>+{`\u20b9`}{fmt(totalFine)}</td>
                <td style={{ padding: '4px 5px', borderBottom: '1px solid #fce4b8' }}></td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr style={{ background: 'linear-gradient(135deg, #ff6b6b, #ffa726)', color: '#fff', fontWeight: 'bold' }}>
              <td style={{ padding: '5px' }}>{isRefund ? 'Total Refund' : 'Total Paid'}</td>
              <td style={{ padding: '5px', textAlign: 'right' }}>{fmt(overallTotalAmount)}</td>
              <td style={{ padding: '5px', textAlign: 'center', fontSize: '11px' }}>{`\u20b9`}{fmt(grandTotal)} / {`\u20b9`}{fmt(overallTotalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* AMOUNT IN WORDS */}
      <div style={{ padding: '3px 12px', fontSize: '8.5px' }}>
        <strong>Amount in Words:</strong> <em>{amountInWords}</em>
      </div>

      {/* FOOTER */}
      {printSettings?.footer_content ? (
        <div style={{ padding: '6px 12px', borderTop: '1px solid #fce4b8', color: '#333', lineHeight: '1.4' }} className="receipt-footer-content" dangerouslySetInnerHTML={{ __html: printSettings.footer_content }} />
      ) : (
        <div style={{ padding: '4px 12px', textAlign: 'center', fontSize: '8px', color: '#ff9800' }}>
          🌅 Thank you for your payment
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

Template08_GradientSunset.templateMeta = {
  key: 'gradient_sunset',
  name: 'Gradient Sunset',
  description: 'Warm gradient, vibrant colors — great for play schools & kindergarten',
  category: 'modern',
  paperSize: 'A5',
  orientation: 'landscape',
  features: ['amount_in_words', 'copy_type', 'rounded_corners'],
  colorScheme: { primary: '#ff6b6b', secondary: '#ffa726', accent: '#ffee58' }
};

export default Template08_GradientSunset;
