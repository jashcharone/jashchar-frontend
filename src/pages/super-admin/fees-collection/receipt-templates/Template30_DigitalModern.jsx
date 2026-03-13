/**
 * Template 30: Digital Modern
 * ============================
 * Digital-first receipt with QR placeholder and verification code
 * Paper: A5 Landscape | Category: Formal
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

const fmt = (n) => (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Template30_DigitalModern = ({ receiptData, copyType }) => {
  const {
    student, school, lineItems = [], feeStatement = [],
    totalPaid, totalDiscount, totalFine, grandTotal,
    overallTotalAmount, overallBalance,
    transactionId, receiptDate, paymentMode,
    extraInfo, isRefund, isOriginal, printSettings, sessionName, title
  } = receiptData;

  const formattedDate = receiptDate ? format(new Date(receiptDate), 'dd MMM yyyy, hh:mm a') : '';
  const showFeeStatement = printSettings?.showFeeStatement !== false && feeStatement.length > 0;
  const verifyCode = transactionId ? transactionId.slice(-8).toUpperCase() : 'XXXXXXXX';

  const accent = '#0ea5e9';
  const bg = '#f8fafc';
  const dark = '#0f172a';

  return (
    <div style={{ width: '200mm', minHeight: '140mm', padding: '10mm', fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif", fontSize: '9.5px', color: dark, backgroundColor: bg, boxSizing: 'border-box', position: 'relative' }}>

      {/* Refund Watermark */}
      {isRefund && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-25deg)', fontSize: '60px', color: 'rgba(239,68,68,0.1)', fontWeight: 'bold', zIndex: 0 }}>REFUND</div>
      )}

      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', position: 'relative', zIndex: 1 }}>
        {/* Left - School Info */}
        <div style={{ flex: 1 }}>
          {printSettings?.showCustomHeader && printSettings?.headerImage ? (
            <img src={printSettings.headerImage} alt="" style={{ maxHeight: '40px' }} />
          ) : (
            <>
              <div style={{ fontSize: '15px', fontWeight: '700', color: dark }}>{school?.name || 'School Name'}</div>
              {school?.address && <div style={{ fontSize: '8px', color: '#64748b', marginTop: '1px' }}>{school.address}</div>}
            </>
          )}
        </div>

        {/* Right - Digital Badge + Copy Type */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'inline-block', padding: '3px 12px', backgroundColor: accent, color: '#fff', borderRadius: '16px', fontSize: '8px', fontWeight: '600', letterSpacing: '1px' }}>
            DIGITAL RECEIPT
          </div>
          <div style={{ fontSize: '7px', color: '#94a3b8', marginTop: '3px' }}>
            {copyType || (isOriginal ? 'ORIGINAL' : 'DUPLICATE')}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', position: 'relative', zIndex: 1 }}>
        {/* Main Content */}
        <div style={{ flex: 1 }}>
          {/* Receipt Info Cards */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <div style={{ flex: 1, padding: '6px 10px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '7px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Receipt No</div>
              <div style={{ fontSize: '10px', fontWeight: '600', color: accent }}>{transactionId || 'N/A'}</div>
            </div>
            <div style={{ flex: 1, padding: '6px 10px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '7px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</div>
              <div style={{ fontSize: '10px', fontWeight: '600' }}>{formattedDate}</div>
            </div>
            <div style={{ flex: 1, padding: '6px 10px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '7px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mode</div>
              <div style={{ fontSize: '10px', fontWeight: '600' }}>{paymentMode || 'N/A'}</div>
            </div>
          </div>

          {/* Student Info Bar */}
          <div style={{ padding: '6px 10px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '8px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div><span style={{ fontSize: '7px', color: '#94a3b8' }}>STUDENT</span><br /><span style={{ fontWeight: '600' }}>{student?.full_name || ''}</span></div>
            <div><span style={{ fontSize: '7px', color: '#94a3b8' }}>PARENT</span><br /><span>{student?.father_name || ''}</span></div>
            <div><span style={{ fontSize: '7px', color: '#94a3b8' }}>CLASS</span><br /><span>{student?.class?.name || ''} {student?.section?.name ? `(${student.section.name})` : ''}</span></div>
            <div><span style={{ fontSize: '7px', color: '#94a3b8' }}>ADM NO</span><br /><span style={{ fontWeight: '600', color: accent }}>{student?.school_code || student?.admission_no || ''}</span></div>
          </div>

          {/* Fee Table */}
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', marginBottom: '6px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <thead>
              <tr>
                <th style={{ padding: '5px 8px', backgroundColor: dark, color: '#fff', fontSize: '8px', textAlign: 'left', fontWeight: '600' }}>Description</th>
                <th style={{ padding: '5px 8px', backgroundColor: dark, color: '#fff', fontSize: '8px', textAlign: 'right', fontWeight: '600', width: '65px' }}>Amount</th>
                <th style={{ padding: '5px 8px', backgroundColor: dark, color: '#fff', fontSize: '8px', textAlign: 'right', fontWeight: '600', width: '60px' }}>Discount</th>
                <th style={{ padding: '5px 8px', backgroundColor: dark, color: '#fff', fontSize: '8px', textAlign: 'right', fontWeight: '600', width: '65px' }}>Paid</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, i) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                  <td style={{ padding: '4px 8px', fontSize: '8.5px', borderBottom: '1px solid #f1f5f9' }}>{item.description}</td>
                  <td style={{ padding: '4px 8px', fontSize: '8.5px', textAlign: 'right', borderBottom: '1px solid #f1f5f9' }}>{fmt(item.totalAmount)}</td>
                  <td style={{ padding: '4px 8px', fontSize: '8.5px', textAlign: 'right', borderBottom: '1px solid #f1f5f9', color: item.discount ? '#f59e0b' : '#cbd5e1' }}>{fmt(item.discount)}</td>
                  <td style={{ padding: '4px 8px', fontSize: '8.5px', textAlign: 'right', fontWeight: '600', borderBottom: '1px solid #f1f5f9' }}>{fmt(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', backgroundColor: accent, color: '#fff', borderRadius: '8px', marginBottom: '6px' }}>
            <div style={{ fontSize: '8px' }}>Rs. {numberToWords(Math.round(grandTotal || totalPaid))} Only</div>
            <div style={{ fontSize: '14px', fontWeight: '700' }}>₹ {fmt(grandTotal || totalPaid)}</div>
          </div>

          {/* Fee Statement */}
          {showFeeStatement && (
            <div style={{ marginTop: '4px' }}>
              <div style={{ fontSize: '8px', fontWeight: '600', color: '#64748b', marginBottom: '3px' }}>Fee Summary — {sessionName || ''}</div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {feeStatement.map((f, i) => (
                  <div key={i} style={{ flex: '1 1 45%', padding: '4px 8px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '7.5px' }}>
                    <span>{f.name}</span>
                    <span style={{ fontWeight: '600', color: f.status === 'Paid' ? '#22c55e' : f.status === 'Partial' ? '#f59e0b' : '#ef4444' }}>
                      {f.status === 'Paid' ? '✓' : f.status === 'Partial' ? '◐' : '✗'} ₹{fmt(f.paid)}/{fmt(f.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - QR & Verification */}
        <div style={{ width: '70px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          {/* QR Placeholder */}
          <div style={{ width: '64px', height: '64px', border: '2px solid #e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', flexDirection: 'column' }}>
            <div style={{ fontSize: '16px' }}>📱</div>
            <div style={{ fontSize: '6px', color: '#94a3b8', textAlign: 'center', marginTop: '2px' }}>SCAN TO VERIFY</div>
          </div>

          {/* Verification Code */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '6px', color: '#94a3b8', textTransform: 'uppercase' }}>Verify Code</div>
            <div style={{ fontSize: '9px', fontWeight: '700', fontFamily: 'monospace', letterSpacing: '1px', color: accent }}>{verifyCode}</div>
          </div>

          {/* Digital Seal */}
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid ' + accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', backgroundColor: 'rgba(14,165,233,0.05)' }}>
            <div style={{ fontSize: '6px', fontWeight: '700', color: accent, textAlign: 'center', lineHeight: '1.2' }}>DIGITALLY<br />VERIFIED</div>
            <div style={{ fontSize: '5px', color: '#94a3b8', marginTop: '1px' }}>✓ Authentic</div>
          </div>

          {/* Session */}
          <div style={{ fontSize: '6.5px', color: '#94a3b8', textAlign: 'center' }}>
            {sessionName || ''}
          </div>
        </div>
      </div>

      {/* Footer */}
      {printSettings?.showCustomFooter && printSettings?.footerImage ? (
        <img src={printSettings.footerImage} alt="" style={{ maxWidth: '100%', maxHeight: '30px', marginTop: '6px' }} />
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #e2e8f0', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '7px', color: '#94a3b8' }}>
            Computer generated receipt — No signature required
          </div>
          <div style={{ fontSize: '7px', color: '#94a3b8' }}>
            {school?.contact_email || ''} {school?.contact_number ? `| ${school.contact_number}` : ''}
          </div>
        </div>
      )}
    </div>
  );
};

Template30_DigitalModern.templateMeta = {
  key: 'digital_modern',
  name: 'Digital Modern',
  description: 'Digital-first receipt with QR placeholder and verification code for modern schools',
  category: 'formal',
  paperSize: 'A5',
  orientation: 'landscape',
  thumbnail: null,
  features: ['fee_statement', 'amount_in_words', 'copy_type', 'custom_header', 'custom_footer', 'qr_code', 'verification_code', 'digital_seal'],
  colorScheme: { primary: '#0ea5e9', secondary: '#0f172a', accent: '#f8fafc' }
};

export default Template30_DigitalModern;
