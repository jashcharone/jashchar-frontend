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
            { label: 'Adm No', value: student?.school_code, color: '#1e88e5' },
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
              <th style={{ padding: '4px 5px', textAlign: 'center', width: '28px', backgroundColor: '#e53935', color: '#fff', borderRadius: '4px 0 0 0' }}>#</th>
              <th style={{ padding: '4px 5px', textAlign: 'left', backgroundColor: '#fb8c00', color: '#fff' }}>Particulars</th>
              <th style={{ padding: '4px 5px', textAlign: 'right', width: '70px', backgroundColor: '#fdd835', color: '#333' }}>Total</th>
              {showConcession && <th style={{ padding: '4px 5px', textAlign: 'right', width: '60px', backgroundColor: '#43a047', color: '#fff' }}>Conc.</th>}
              <th style={{ padding: '4px 5px', textAlign: 'right', width: '60px', backgroundColor: '#1e88e5', color: '#fff' }}>Paid</th>
              <th style={{ padding: '4px 5px', textAlign: 'right', width: '55px', backgroundColor: '#8e24aa', color: '#fff', borderRadius: '0 4px 0 0' }}>Balance</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '3px 5px', textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ padding: '3px 5px' }}>{item.description}</td>
                <td style={{ padding: '3px 5px', textAlign: 'right' }}>{fmt(item.totalAmount)}</td>
                {showConcession && <td style={{ padding: '3px 5px', textAlign: 'right' }}>{Number(item.discount || 0) > 0 ? fmt(item.discount) : ''}</td>}
                <td style={{ padding: '3px 5px', textAlign: 'right' }}>{fmt(item.amount)}</td>
                <td style={{ padding: '3px 5px', textAlign: 'right' }}>{fmt(item.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTAL */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
          <div style={{ background: 'linear-gradient(90deg, #e53935, #fb8c00, #1e88e5)', color: '#fff', padding: '5px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
            {isRefund ? 'Refund' : 'Paid'}: ₹{fmt(grandTotal)}
            {overallBalance > 0 && <span style={{ fontSize: '8px', marginLeft: '8px', opacity: 0.8 }}>Bal: ₹{fmt(overallBalance)}</span>}
          </div>
        </div>

        {/* FEE STATEMENT */}
        {feeStatement.length > 0 && (
          <div style={{ fontSize: '7.5px', marginBottom: '3px' }}>
            {feeStatement.map((fee, i) => (
              <span key={i} style={{ marginRight: '8px', padding: '1px 5px', borderRadius: '8px', backgroundColor: bandColors[i % bandColors.length] + '20', color: bandColors[i % bandColors.length] }}>{fee.name}: ₹{fmt(fee.paid)} [{fee.status}]</span>
            ))}
          </div>
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
