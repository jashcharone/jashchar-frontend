/**
 * Template 23: Colorful Bands
 * Rainbow/multi-color band header, playful, school-friendly
 * Paper: A5 Landscape | Category: Creative
 */
import React from 'react';
import { format } from 'date-fns';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const bandColors = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa'];

const Template23_ColorfulBands = ({ receiptData, copyType }) => {
  const {
    student, school, lineItems = [], feeStatement = [],
    totalPaid, totalDiscount, totalFine, grandTotal,
    overallBalance = 0,
    transactionId, receiptDate, paymentMode,
    isRefund, isOriginal, printSettings, sessionName, title = 'FEE RECEIPT'
  } = receiptData;

  const showConcession = totalDiscount > 0;

  return (
    <div style={{ width: '200mm', height: '140mm', boxSizing: 'border-box', pageBreakInside: 'avoid', position: 'relative', backgroundColor: '#fff', fontFamily: "'Segoe UI', Arial, sans-serif", color: '#333', overflow: 'hidden' }}>
      
      {/* RAINBOW BANDS */}
      <div style={{ display: 'flex', height: '6px' }}>
        {bandColors.map((c, i) => <div key={i} style={{ flex: 1, backgroundColor: c }} />)}
      </div>

      <div style={{ padding: '8px 15px' }}>
        {/* HEADER */}
        {printSettings?.header_image_url ? (
          <div style={{ marginBottom: '6px' }}><img src={printSettings.header_image_url} alt='Header' style={{ width: '100%', height: 'auto', display: 'block' }} /></div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            {school?.logo_url && <img src={school.logo_url} alt='Logo' style={{ height: '38px', width: 'auto' }} />}
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: '#1e88e5' }}>{school?.name || '-'}</h1>
              {school?.address && <p style={{ fontSize: '8px', margin: '1px 0 0', color: '#888' }}>{school.address}</p>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#e53935' }}>{title}</div>
              <div style={{ fontSize: '7px', color: '#888' }}>{copyType}{!isOriginal ? ' • REPRINT' : ''}</div>
            </div>
          </div>
        )}

        {/* STUDENT - Color-coded cards */}
        <div style={{ display: 'flex', gap: '5px', marginBottom: '6px', flexWrap: 'wrap' }}>
          {[
            { label: 'Student', value: student?.full_name, color: '#e53935' },
            { label: 'Father', value: student?.father_name, color: '#fb8c00' },
            { label: 'Class', value: `${student?.class?.name || '-'}${student?.section?.name ? ` (${student.section.name})` : ''}`, color: '#43a047' },
            { label: 'Enroll ID', value: student?.enrollment_id, color: '#1e88e5' },
            { label: 'Date', value: receiptDate ? format(new Date(receiptDate), 'dd MMM yyyy') : '-', color: '#8e24aa' },
            { label: 'Mode', value: paymentMode || 'Cash', color: '#fdd835' },
          ].map((item, i) => (
            <div key={i} style={{ borderLeft: `3px solid ${item.color}`, padding: '2px 6px', backgroundColor: '#f9f9f9', borderRadius: '0 4px 4px 0', fontSize: '8px' }}>
              <span style={{ color: '#999', fontSize: '7px' }}>{item.label}</span><br />
              <strong>{item.value || '-'}</strong>
            </div>
          ))}
        </div>

        {/* FEE TABLE - Colorful header */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px', marginBottom: '5px' }}>
          <thead>
            <tr>
              <th style={{ padding: '4px 5px', textAlign: 'left', backgroundColor: '#1e88e5', color: '#fff', borderRadius: '4px 0 0 0' }}>Fee Description</th>
              <th style={{ padding: '4px 5px', textAlign: 'right', width: '90px', backgroundColor: '#fb8c00', color: '#fff' }}>Charged (₹)</th>
              <th style={{ padding: '4px 5px', textAlign: 'right', width: '90px', backgroundColor: '#43a047', color: '#fff', borderRadius: '0 4px 0 0' }}>Paid (₹)</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0', borderLeft: `3px solid ${bandColors[idx % bandColors.length]}` }}>
                <td style={{ padding: '3px 5px' }}>
                  {item.description}
                  {Number(item.discount || 0) > 0 && <span style={{ fontSize: '7px', color: '#43a047' }}> (Conc: ₹{fmt(item.discount)})</span>}
                </td>
                <td style={{ padding: '3px 5px', textAlign: 'right' }}>{fmt(item.totalAmount)}</td>
                <td style={{ padding: '3px 5px', textAlign: 'right' }}>{fmt(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTALS */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginBottom: '4px', alignItems: 'center' }}>
          {totalDiscount > 0 && <span style={{ fontSize: '8px', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#43a04720', color: '#43a047' }}>Concession: -₹{fmt(totalDiscount)}</span>}
          {totalFine > 0 && <span style={{ fontSize: '8px', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#e5393520', color: '#e53935' }}>Fine: +₹{fmt(totalFine)}</span>}
          <div style={{ background: 'linear-gradient(90deg, #e53935, #fb8c00, #1e88e5)', color: '#fff', padding: '5px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
            {isRefund ? 'Refund' : 'Paid'}: ₹{fmt(grandTotal)}
          </div>
        </div>
        {overallBalance > 0 && (
          <div style={{ textAlign: 'right', fontSize: '8px', color: '#e53935', marginBottom: '3px' }}>Balance Due: ₹{fmt(overallBalance)}</div>
        )}

        {/* FOOTER */}
        {printSettings?.footer_content ? (
          <div style={{ lineHeight: '1.4' }} className="receipt-footer-content" dangerouslySetInnerHTML={{ __html: printSettings.footer_content }} />
        ) : (
          <div style={{ fontSize: '7.5px', color: '#aaa', textAlign: 'center' }}>
            {transactionId || '-'} • Computer generated receipt
          </div>
        )}
      </div>

      {/* BOTTOM BANDS */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', height: '4px' }}>
        {bandColors.map((c, i) => <div key={i} style={{ flex: 1, backgroundColor: c }} />)}
      </div>

      {isRefund && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)', opacity: 0.07, pointerEvents: 'none' }}>
          <span style={{ fontSize: '48px', fontWeight: 'bold', color: 'red' }}>REFUND</span>
        </div>
      )}
    </div>
  );
};

Template23_ColorfulBands.templateMeta = {
  key: 'colorful_bands',
  name: 'Colorful Bands',
  description: 'Rainbow bands — playful, school-friendly design',
  category: 'creative',
  paperSize: 'A5',
  orientation: 'landscape',
  features: ['fee_statement', 'copy_type', 'rainbow', 'playful'],
  colorScheme: { primary: '#1e88e5', secondary: '#ffffff', accent: '#e53935' }
};

export default Template23_ColorfulBands;
