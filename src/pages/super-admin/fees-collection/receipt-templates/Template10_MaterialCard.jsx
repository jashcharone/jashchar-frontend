/**
 * Template 10: Material Card
 * Google Material Design 3 style
 * Paper: A5 Landscape | Category: Modern
 */
import React from 'react';
import { format } from 'date-fns';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Template10_MaterialCard = ({ receiptData, copyType }) => {
  const {
    student, school, lineItems = [], feeStatement = [],
    totalPaid, totalDiscount, totalFine, grandTotal,
    overallTotalAmount = 0, overallBalance = 0,
    transactionId, receiptDate, paymentMode,
    isRefund, isOriginal, printSettings, sessionName, title = 'FEE RECEIPT'
  } = receiptData;

  const showConcession = totalDiscount > 0;

  const chipStyle = { display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontSize: '8px', backgroundColor: '#e3f2fd', color: '#1565c0', fontWeight: '500', margin: '1px 2px' };

  return (
    <div style={{ width: '200mm', height: '140mm', boxSizing: 'border-box', pageBreakInside: 'avoid', position: 'relative', backgroundColor: '#fafafa', color: '#212121', fontFamily: "'Roboto', 'Segoe UI', sans-serif", overflow: 'hidden' }}>
      
      {/* HEADER - Material blue with elevation */}
      {printSettings?.header_image_url ? (
        <div style={{ width: '100%' }}><img src={printSettings.header_image_url} alt='Header' style={{ width: '100%', height: 'auto', display: 'block' }} /></div>
      ) : (
        <div style={{ backgroundColor: '#1976d2', padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
          {school?.logo_url && (
            <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img src={school.logo_url} alt='Logo' style={{ height: '38px', width: 'auto' }} />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '15px', fontWeight: '500', color: '#fff', margin: 0 }}>{school?.name || '-'}</h1>
            {school?.address && <p style={{ fontSize: '9px', color: '#bbdefb', margin: '2px 0 0' }}>{school.address}</p>}
          </div>
        </div>
      )}

      {/* FLOATING TITLE CARD */}
      <div style={{ margin: '4px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ backgroundColor: '#fff', padding: '5px 15px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.12)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#1976d2' }}>{title}</span>
          {!isOriginal && <span style={{ fontSize: '7px', color: '#fff', backgroundColor: '#e53935', padding: '1px 5px', borderRadius: '10px' }}>REPRINT</span>}
          <span style={{ fontSize: '7px', color: '#fff', backgroundColor: copyType === 'OFFICE COPY' ? '#e53935' : copyType === 'STUDENT COPY' ? '#1976d2' : '#388e3c', padding: '1px 5px', borderRadius: '10px' }}>{copyType}</span>
        </div>
        <div style={{ fontSize: '8px', color: '#757575' }}>
          #{transactionId?.split('/').pop() || '-'} | {receiptDate ? format(new Date(receiptDate), 'dd MMM yyyy') : '-'}
        </div>
      </div>

      {/* STUDENT - Material chips */}
      <div style={{ padding: '4px 15px', display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
        <span style={chipStyle}>👤 {student?.full_name || '-'}</span>
        <span style={chipStyle}>👨 {student?.father_name || '-'}</span>
        <span style={chipStyle}>📚 {student?.class?.name || '-'}{student?.section?.name ? `(${student.section.name})` : ''}</span>
        <span style={chipStyle}>🎫 {student?.school_code || '-'}</span>
        <span style={chipStyle}>📅 {receiptDate ? format(new Date(receiptDate), 'dd MMM yyyy') : '-'}</span>
        <span style={chipStyle}>💳 {paymentMode || 'Cash'}</span>
        <span style={chipStyle}>📖 {sessionName || '-'}</span>
      </div>

      {/* FEE TABLE - Material table */}
      <div style={{ padding: '4px 15px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#1976d2', color: '#fff' }}>
                <th style={{ padding: '4px 5px', textAlign: 'center', width: '28px' }}>S.No</th>
                <th style={{ padding: '4px 5px', textAlign: 'left' }}>Particulars</th>
                <th style={{ padding: '4px 5px', textAlign: 'right', width: '72px' }}>Total</th>
                {showConcession && <th style={{ padding: '4px 5px', textAlign: 'right', width: '62px' }}>Concession</th>}
                <th style={{ padding: '4px 5px', textAlign: 'right', width: '62px' }}>Paid</th>
                <th style={{ padding: '4px 5px', textAlign: 'right', width: '55px' }}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f5f5f5' }}>
                  <td style={{ padding: '4px 5px', textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ padding: '4px 5px', fontWeight: '500' }}>{item.description}</td>
                  <td style={{ padding: '4px 5px', textAlign: 'right' }}>{fmt(item.totalAmount)}</td>
                  {showConcession && <td style={{ padding: '4px 5px', textAlign: 'right' }}>{Number(item.discount || 0) > 0 ? fmt(item.discount) : ''}</td>}
                  <td style={{ padding: '4px 5px', textAlign: 'right' }}>{fmt(item.amount)}</td>
                  <td style={{ padding: '4px 5px', textAlign: 'right' }}>{fmt(item.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TOTAL - Material outlined card */}
      <div style={{ margin: '4px 15px', display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ border: '2px solid #1976d2', borderRadius: '8px', padding: '5px 15px', display: 'inline-block' }}>
          <span style={{ fontSize: '9px', color: '#757575' }}>{isRefund ? 'Total Refund:' : 'Total Paid:'}</span>
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1976d2', marginLeft: '8px' }}>₹{fmt(grandTotal)}</span>
          {overallBalance > 0 && <span style={{ fontSize: '8px', color: '#e53935', marginLeft: '8px' }}>Balance: ₹{fmt(overallBalance)}</span>}
        </div>
      </div>

      {/* FEE STATEMENT - Material expandable */}
      {feeStatement.length > 0 && (
        <div style={{ padding: '3px 15px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '6px', padding: '4px 8px', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: '8px', fontWeight: '500', color: '#1976d2', marginBottom: '2px' }}>Fee Statement</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7.5px' }}>
              <tbody>
                {feeStatement.map((fee, i) => (
                  <tr key={i}><td style={{ padding: '1px 4px', borderBottom: '1px solid #f5f5f5' }}>{fee.name}</td><td style={{ padding: '1px 4px', textAlign: 'right', borderBottom: '1px solid #f5f5f5', width: '60px' }}>{fmt(fee.amount)}</td><td style={{ padding: '1px 4px', textAlign: 'right', borderBottom: '1px solid #f5f5f5', width: '60px' }}>{fmt(fee.paid)}</td><td style={{ padding: '1px 4px', textAlign: 'right', borderBottom: '1px solid #f5f5f5', width: '60px' }}>{fmt(fee.balance)}</td><td style={{ padding: '1px 4px', textAlign: 'center', borderBottom: '1px solid #f5f5f5', width: '45px', fontSize: '7px', fontWeight: 'bold', color: fee.status?.toLowerCase() === 'paid' ? '#388e3c' : fee.status?.toLowerCase() === 'partial' ? '#f57c00' : '#e53935' }}>{fee.status}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FOOTER */}
      {printSettings?.footer_content ? (
        <div style={{ padding: '6px 15px', color: '#333', lineHeight: '1.4' }} className="receipt-footer-content" dangerouslySetInnerHTML={{ __html: printSettings.footer_content }} />
      ) : (
        <div style={{ padding: '4px 15px', fontSize: '8px', color: '#9e9e9e', textAlign: 'center' }}>
          TXN: {transactionId || '-'} • Computer generated receipt
        </div>
      )}

      {isRefund && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)', opacity: 0.07, pointerEvents: 'none' }}>
          <span style={{ fontSize: '48px', fontWeight: 'bold', color: 'red' }}>REFUND</span>
        </div>
      )}
    </div>
  );
};

Template10_MaterialCard.templateMeta = {
  key: 'material_card',
  name: 'Material Card',
  description: 'Google Material Design 3 — chips, cards, shadows',
  category: 'modern',
  paperSize: 'A5',
  orientation: 'landscape',
  features: ['fee_statement', 'copy_type', 'material_chips', 'card_layout'],
  colorScheme: { primary: '#1976d2', secondary: '#ffffff', accent: '#e3f2fd' }
};

export default Template10_MaterialCard;
