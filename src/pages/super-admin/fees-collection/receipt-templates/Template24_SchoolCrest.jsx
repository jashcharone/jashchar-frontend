/**
 * Template 24: School Crest
 * Centered crest/logo focus, shield-like layout, academic feel
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

const Template24_SchoolCrest = ({ receiptData, copyType }) => {
  const {
    student, school, lineItems = [], feeStatement = [],
    totalPaid, totalDiscount, totalFine, grandTotal,
    overallTotalAmount = 0, overallBalance = 0,
    transactionId, receiptDate, paymentMode,
    isRefund, isOriginal, printSettings, sessionName, title = 'FEE RECEIPT'
  } = receiptData;

  const showConcession = totalDiscount > 0;
  const navy = '#0d1b2a';
  const gold = '#d4a437';

  return (
    <div style={{ width: '200mm', height: '140mm', boxSizing: 'border-box', pageBreakInside: 'avoid', position: 'relative', backgroundColor: '#fff', fontFamily: "'Garamond', 'Georgia', serif", color: '#1a1a1a', overflow: 'hidden', border: `2px solid ${navy}` }}>
      
      {/* Watermark logo in center */}
      {school?.logo_url && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.04, pointerEvents: 'none' }}>
          <img src={school.logo_url} alt='' style={{ height: '180px', width: 'auto' }} />
        </div>
      )}

      <div style={{ padding: '8px 15px', position: 'relative', zIndex: 1 }}>
        {/* HEADER - Centered crest */}
        {printSettings?.header_image_url ? (
          <div style={{ marginBottom: '5px' }}><img src={printSettings.header_image_url} alt='Header' style={{ width: '100%', height: 'auto', display: 'block' }} /></div>
        ) : (
          <div style={{ textAlign: 'center', marginBottom: '5px', paddingBottom: '5px', borderBottom: `2px solid ${navy}` }}>
            {school?.logo_url && (
              <div style={{ display: 'inline-block', border: `3px solid ${gold}`, borderRadius: '50%', padding: '4px', marginBottom: '3px' }}>
                <img src={school.logo_url} alt='Crest' style={{ height: '36px', width: 'auto', display: 'block' }} />
              </div>
            )}
            <h1 style={{ fontSize: '16px', fontWeight: 'bold', margin: '2px 0 0', color: navy, letterSpacing: '3px', textTransform: 'uppercase' }}>{school?.name || '-'}</h1>
            {school?.address && <p style={{ fontSize: '8px', margin: '1px 0 0', color: '#666', fontStyle: 'italic' }}>{school.address}</p>}
          </div>
        )}

        {/* TITLE + RECEIPT INFO - Symmetrical */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
          <div style={{ fontSize: '8px', color: '#777' }}>No: {transactionId?.split('/').pop() || '-'}</div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: gold, letterSpacing: '4px', textTransform: 'uppercase' }}>— {title} —</span>
            <div style={{ fontSize: '7px', color: '#999' }}>{copyType}{!isOriginal ? ' (Duplicate)' : ''}</div>
          </div>
          <div style={{ fontSize: '8px', color: '#777' }}>Date: {receiptDate ? format(new Date(receiptDate), 'dd-MM-yyyy') : '-'}</div>
        </div>

        {/* STUDENT */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', fontSize: '8.5px', marginBottom: '5px', padding: '3px 0', borderTop: `1px solid ${gold}`, borderBottom: `1px solid ${gold}` }}>
          <span><strong>Name:</strong> {student?.full_name || '-'}</span>
          <span><strong>Class:</strong> {student?.class?.name || '-'}{student?.section?.name ? ` (${student.section.name})` : ''}</span>
          <span><strong>Enroll ID:</strong> {student?.enrollment_id || '-'}</span>
          <span><strong>Mode:</strong> {paymentMode || 'Cash'}</span>
        </div>

        {/* FEE TABLE */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px', marginBottom: '4px' }}>
          <thead>
            <tr style={{ backgroundColor: navy, color: gold }}>
              <th style={{ padding: '3px 5px', textAlign: 'left' }}>Description</th>
              <th style={{ padding: '3px 5px', textAlign: 'right', width: '80px' }}>Fees Charged</th>
              <th style={{ padding: '3px 5px', textAlign: 'right', width: '75px' }}>Scholarship</th>
              <th style={{ padding: '3px 5px', textAlign: 'right', width: '80px' }}>Net Received</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #e8e8e8' }}>
                <td style={{ padding: '2.5px 5px' }}>{item.description}</td>
                <td style={{ padding: '2.5px 5px', textAlign: 'right' }}>{fmt(item.totalAmount)}</td>
                <td style={{ padding: '2.5px 5px', textAlign: 'right', color: gold }}>{Number(item.discount || 0) > 0 ? fmt(item.discount) : '—'}</td>
                <td style={{ padding: '2.5px 5px', textAlign: 'right' }}>{fmt(item.amount)}</td>
              </tr>
            ))}
            {totalFine > 0 && (
              <tr style={{ borderBottom: '1px solid #e8e8e8' }}>
                <td style={{ padding: '2.5px 5px', color: '#c00' }}>Late Fine / Penalty</td>
                <td style={{ padding: '2.5px 5px' }}></td>
                <td style={{ padding: '2.5px 5px' }}></td>
                <td style={{ padding: '2.5px 5px', textAlign: 'right', color: '#c00' }}>+₹{fmt(totalFine)}</td>
              </tr>
            )}
            <tr style={{ fontWeight: 'bold', borderTop: `2px solid ${navy}` }}>
              <td style={{ padding: '3px 5px', textAlign: 'right' }}>{isRefund ? 'Total Refund' : 'Grand Total'}:</td>
              <td style={{ padding: '3px 5px', textAlign: 'right' }}>₹{fmt(overallTotalAmount)}</td>
              <td style={{ padding: '3px 5px', textAlign: 'right', color: gold }}>{totalDiscount > 0 ? `₹${fmt(totalDiscount)}` : '—'}</td>
              <td style={{ padding: '3px 5px', textAlign: 'right', color: navy, fontSize: '10px' }}>₹{fmt(grandTotal)}</td>
            </tr>
          </tbody>
        </table>

        {/* AMOUNT IN WORDS */}
        <div style={{ fontSize: '8px', fontStyle: 'italic', marginBottom: '3px' }}>
          <strong>In Words:</strong> {numberToWords(grandTotal)}
          {overallBalance > 0 && <span style={{ color: '#c00', marginLeft: '10px' }}>[Balance Outstanding: ₹{fmt(overallBalance)}]</span>}
        </div>

        {/* FOOTER */}
        {printSettings?.footer_content ? (
          <div style={{ lineHeight: '1.4' }} className="receipt-footer-content" dangerouslySetInnerHTML={{ __html: printSettings.footer_content }} />
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7.5px', color: '#888' }}>
            <span>Session: {sessionName || '-'}</span>
            <span style={{ borderTop: `1px solid ${navy}`, paddingTop: '3px', minWidth: '90px', textAlign: 'center', color: navy }}>Bursar</span>
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

Template24_SchoolCrest.templateMeta = {
  key: 'school_crest',
  name: 'School Crest',
  description: 'Centered crest focus — academic, shield-like layout',
  category: 'creative',
  paperSize: 'A5',
  orientation: 'landscape',
  features: ['fee_statement', 'copy_type', 'amount_in_words', 'signature', 'watermark_logo'],
  colorScheme: { primary: '#0d1b2a', secondary: '#ffffff', accent: '#d4a437' }
};

export default Template24_SchoolCrest;
