/**
 * Template 11: Glassmorphism
 * Frosted glass effect with gradient background
 * Paper: A5 Landscape | Category: Modern
 */
import React from 'react';
import { format } from 'date-fns';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const glassCard = {
  backgroundColor: 'rgba(255,255,255,0.85)',
  borderRadius: '10px',
  padding: '6px 10px',
  border: '1px solid rgba(255,255,255,0.3)',
};

const Template11_Glassmorphism = ({ receiptData, copyType }) => {
  const {
    student, school, lineItems = [], feeStatement = [],
    totalPaid, totalDiscount, totalFine, grandTotal,
    overallTotalAmount = 0, overallBalance = 0,
    transactionId, receiptDate, paymentMode,
    isRefund, isOriginal, printSettings, sessionName, title = 'FEE RECEIPT'
  } = receiptData;

  const showConcession = totalDiscount > 0;

  return (
    <div style={{ width: '200mm', height: '140mm', boxSizing: 'border-box', pageBreakInside: 'avoid', position: 'relative', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', fontFamily: "'Segoe UI', sans-serif", overflow: 'hidden', color: '#333' }}>
      
      {/* Print fallback */}
      <style>{`@media print { .glass-bg { background: #fff !important; } .glass-card { background: #fff !important; border: 1px solid #ddd !important; } }`}</style>

      <div className="glass-bg" style={{ padding: '8px 15px', height: '100%', boxSizing: 'border-box' }}>
        
        {/* HEADER */}
        {printSettings?.header_image_url ? (
          <div style={{ width: '100%' }}><img src={printSettings.header_image_url} alt='Header' style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '10px' }} /></div>
        ) : (
          <div className="glass-card" style={{ ...glassCard, display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
            {school?.logo_url && <img src={school.logo_url} alt='Logo' style={{ height: '38px', width: 'auto' }} />}
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '14px', fontWeight: '700', color: '#4a148c', margin: 0 }}>{school?.name || '-'}</h1>
              {school?.address && <p style={{ fontSize: '8px', color: '#666', margin: '1px 0 0' }}>{school.address}</p>}
            </div>
            <div style={{ textAlign: 'right', fontSize: '8px', color: '#555' }}>
              <div style={{ fontWeight: '700', color: '#4a148c', fontSize: '10px' }}>{title}</div>
              <div>#{transactionId?.split('/').pop() || '-'}</div>
              <div>{receiptDate ? format(new Date(receiptDate), 'dd MMM yyyy') : '-'}</div>
            </div>
          </div>
        )}

        {/* COPY TYPE */}
        <div style={{ textAlign: 'right', fontSize: '7px', marginBottom: '2px' }}>
          <span style={{ backgroundColor: 'rgba(255,255,255,0.7)', padding: '1px 8px', borderRadius: '10px', color: '#4a148c', fontWeight: '600' }}>{copyType}{!isOriginal ? ' • REPRINT' : ''}</span>
        </div>

        {/* STUDENT INFO */}
        <div className="glass-card" style={{ ...glassCard, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', columnGap: '8px', rowGap: '2px', fontSize: '8px', marginBottom: '5px' }}>
          <div><span style={{ color: '#9e9e9e' }}>Name:</span> <strong>{student?.full_name || '-'}</strong></div>
          <div><span style={{ color: '#9e9e9e' }}>Father:</span> {student?.father_name || '-'}</div>
          <div><span style={{ color: '#9e9e9e' }}>Class:</span> {student?.class?.name || '-'}{student?.section?.name ? ` (${student.section.name})` : ''}</div>
          <div><span style={{ color: '#9e9e9e' }}>Adm No:</span> {student?.school_code || '-'}</div>
          <div><span style={{ color: '#9e9e9e' }}>Session:</span> {sessionName || '-'}</div>
          <div><span style={{ color: '#9e9e9e' }}>Mode:</span> {paymentMode || 'Cash'}</div>
        </div>

        {/* FEE TABLE */}
        <div className="glass-card" style={{ ...glassCard, marginBottom: '4px', padding: '0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(90deg, #667eea, #764ba2)', color: '#fff' }}>
                <th style={{ padding: '4px 5px', textAlign: 'center', width: '28px' }}>#</th>
                <th style={{ padding: '4px 5px', textAlign: 'left' }}>Particulars</th>
                <th style={{ padding: '4px 5px', textAlign: 'right', width: '70px' }}>Total</th>
                {showConcession && <th style={{ padding: '4px 5px', textAlign: 'right', width: '60px' }}>Concession</th>}
                <th style={{ padding: '4px 5px', textAlign: 'right', width: '60px' }}>Paid</th>
                <th style={{ padding: '4px 5px', textAlign: 'right', width: '55px' }}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)' }}>
                  <td style={{ padding: '3px 5px', textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ padding: '3px 5px', fontWeight: '500' }}>{item.description}</td>
                  <td style={{ padding: '3px 5px', textAlign: 'right' }}>{fmt(item.totalAmount)}</td>
                  {showConcession && <td style={{ padding: '3px 5px', textAlign: 'right' }}>{Number(item.discount || 0) > 0 ? fmt(item.discount) : ''}</td>}
                  <td style={{ padding: '3px 5px', textAlign: 'right' }}>{fmt(item.amount)}</td>
                  <td style={{ padding: '3px 5px', textAlign: 'right' }}>{fmt(item.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TOTAL */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '3px' }}>
          <div style={{ background: 'linear-gradient(90deg, #667eea, #764ba2)', color: '#fff', borderRadius: '10px', padding: '4px 16px', fontSize: '11px', fontWeight: '700' }}>
            {isRefund ? 'Refund' : 'Paid'}: ₹{fmt(grandTotal)}
            {overallBalance > 0 && <span style={{ fontSize: '8px', marginLeft: '8px', opacity: 0.8 }}>Balance: ₹{fmt(overallBalance)}</span>}
          </div>
        </div>

        {/* FEE STATEMENT */}
        {feeStatement.length > 0 && (
          <div className="glass-card" style={{ ...glassCard, marginBottom: '3px', padding: '4px 8px' }}>
            <div style={{ fontSize: '8px', fontWeight: '600', color: '#4a148c', marginBottom: '2px' }}>Fee Statement</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7.5px' }}>
              <tbody>
                {feeStatement.map((fee, i) => (
                  <tr key={i}>
                    <td style={{ padding: '1px 3px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{fee.name}</td>
                    <td style={{ padding: '1px', textAlign: 'right', width: '55px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{fmt(fee.amount)}</td>
                    <td style={{ padding: '1px', textAlign: 'right', width: '55px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{fmt(fee.paid)}</td>
                    <td style={{ padding: '1px', textAlign: 'right', width: '55px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{fmt(fee.balance)}</td>
                    <td style={{ padding: '1px', textAlign: 'center', width: '42px', borderBottom: '1px solid rgba(0,0,0,0.06)', fontSize: '7px', fontWeight: 'bold', color: fee.status?.toLowerCase() === 'paid' ? '#388e3c' : fee.status?.toLowerCase() === 'partial' ? '#f57c00' : '#e53935' }}>{fee.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* FOOTER */}
        {printSettings?.footer_content ? (
          <div style={{ textAlign: 'center', lineHeight: '1.4' }} className="receipt-footer-content" dangerouslySetInnerHTML={{ __html: printSettings.footer_content }} />
        ) : (
          <div style={{ textAlign: 'center', fontSize: '7.5px', color: 'rgba(255,255,255,0.8)' }}>
            TXN: {transactionId || '-'} • Computer generated receipt
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

Template11_Glassmorphism.templateMeta = {
  key: 'glassmorphism',
  name: 'Glassmorphism',
  description: 'Frosted glass effect with purple gradient background',
  category: 'modern',
  paperSize: 'A5',
  orientation: 'landscape',
  features: ['fee_statement', 'copy_type', 'glass_effect', 'gradient_bg'],
  colorScheme: { primary: '#667eea', secondary: '#764ba2', accent: '#ffffff' }
};

export default Template11_Glassmorphism;
