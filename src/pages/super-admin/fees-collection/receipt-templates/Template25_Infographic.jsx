/**
 * Template 25: Infographic
 * Visual/infographic style — progress bars, icons, stats
 * Paper: A5 Landscape | Category: Creative
 */
import React from 'react';
import { format } from 'date-fns';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Template25_Infographic = ({ receiptData, copyType }) => {
  const {
    student, school, lineItems = [], feeStatement = [],
    totalPaid, totalDiscount, totalFine, grandTotal,
    overallTotalAmount = 0, overallBalance = 0,
    transactionId, receiptDate, paymentMode,
    isRefund, isOriginal, printSettings, sessionName, title = 'FEE RECEIPT'
  } = receiptData;

  const showConcession = totalDiscount > 0;
  const paidPercent = overallTotalAmount > 0 ? Math.round(((overallTotalAmount - overallBalance) / overallTotalAmount) * 100) : 100;

  return (
    <div style={{ width: '200mm', height: '140mm', boxSizing: 'border-box', pageBreakInside: 'avoid', position: 'relative', backgroundColor: '#f8f9fa', fontFamily: "'Segoe UI', sans-serif", color: '#333', overflow: 'hidden', padding: '10px 15px' }}>
      
      {/* HEADER */}
      {printSettings?.header_image_url ? (
        <div style={{ marginBottom: '6px' }}><img src={printSettings.header_image_url} alt='Header' style={{ width: '100%', height: 'auto', display: 'block' }} /></div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          {school?.logo_url && <img src={school.logo_url} alt='Logo' style={{ height: '32px', width: 'auto' }} />}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#2196f3' }}>{school?.name || '-'}</div>
            {school?.address && <div style={{ fontSize: '7px', color: '#888' }}>{school.address}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#333' }}>{title}</div>
            <div style={{ fontSize: '7px', color: '#888' }}>{copyType}{!isOriginal ? ' • Reprint' : ''} | {receiptDate ? format(new Date(receiptDate), 'dd MMM yyyy') : '-'}</div>
          </div>
        </div>
      )}

      {/* STAT CARDS */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
        {[
          { icon: '👤', label: 'Student', value: student?.full_name || '-', bg: '#e3f2fd' },
          { icon: '📚', label: 'Class', value: `${student?.class?.name || '-'}${student?.section?.name ? ` (${student.section.name})` : ''}`, bg: '#e8f5e9' },
          { icon: '🏷️', label: 'Enroll ID', value: student?.enrollment_id || '-', bg: '#fff3e0' },
          { icon: '💰', label: isRefund ? 'Refund' : 'This Payment', value: `₹${fmt(grandTotal)}`, bg: '#fce4ec' },
        ].map((card, i) => (
          <div key={i} style={{ flex: 1, backgroundColor: card.bg, borderRadius: '8px', padding: '5px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px' }}>{card.icon}</div>
            <div style={{ fontSize: '7px', color: '#888' }}>{card.label}</div>
            <div style={{ fontSize: '9px', fontWeight: '700' }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* PROGRESS BAR */}
      <div style={{ marginBottom: '6px', padding: '4px 8px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7.5px', marginBottom: '2px' }}>
          <span>Fee Payment Progress</span>
          <span style={{ fontWeight: '700', color: paidPercent >= 100 ? '#4caf50' : '#ff9800' }}>{paidPercent}%</span>
        </div>
        <div style={{ height: '8px', backgroundColor: '#e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(paidPercent, 100)}%`, background: paidPercent >= 100 ? 'linear-gradient(90deg, #4caf50, #81c784)' : 'linear-gradient(90deg, #ff9800, #ffb74d)', borderRadius: '4px', transition: 'width 0.3s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7px', color: '#888', marginTop: '1px' }}>
          <span>Paid: ₹{fmt(overallTotalAmount - overallBalance)}</span>
          <span>Total: ₹{fmt(overallTotalAmount)}</span>
        </div>
      </div>

      {/* FEE TABLE */}
      <div style={{ backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', marginBottom: '5px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px' }}>
          <thead>
            <tr style={{ backgroundColor: '#2196f3', color: '#fff' }}>
              <th style={{ padding: '3px 5px', textAlign: 'left' }}>Fee Type</th>
              <th style={{ padding: '3px 5px', textAlign: 'right', width: '70px' }}>Amount</th>
              <th style={{ padding: '3px 5px', textAlign: 'center', width: '120px' }}>Payment Progress</th>
              <th style={{ padding: '3px 5px', textAlign: 'right', width: '70px' }}>This Payment</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => {
              const pct = Number(item.totalAmount) > 0 ? Math.round(((Number(item.totalAmount) - Number(item.balance || 0)) / Number(item.totalAmount)) * 100) : 100;
              return (
                <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '2.5px 5px' }}>
                    {item.description}
                    {Number(item.discount || 0) > 0 && <span style={{ fontSize: '7px', color: '#4caf50' }}> (-{fmt(item.discount)})</span>}
                  </td>
                  <td style={{ padding: '2.5px 5px', textAlign: 'right' }}>{fmt(item.totalAmount)}</td>
                  <td style={{ padding: '2.5px 5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ flex: 1, height: '6px', backgroundColor: '#e0e0e0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, backgroundColor: pct >= 100 ? '#4caf50' : pct > 50 ? '#ff9800' : '#f44336', borderRadius: '3px' }} />
                      </div>
                      <span style={{ fontSize: '7px', fontWeight: '600', color: pct >= 100 ? '#4caf50' : '#ff9800', minWidth: '24px', textAlign: 'right' }}>{pct}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '2.5px 5px', textAlign: 'right', fontWeight: '600' }}>{fmt(item.amount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* BOTTOM INFO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '7.5px', color: '#888' }}>
          Receipt #{transactionId?.split('/').pop() || '-'} | {paymentMode || 'Cash'} | Session: {sessionName || '-'}
        </div>
        <div style={{ fontSize: '8px', fontWeight: '700', color: '#2196f3' }}>
          {isRefund ? 'Refund' : 'Paid'}: ₹{fmt(grandTotal)}
          {overallBalance > 0 && <span style={{ color: '#f44336', marginLeft: '8px' }}>Due: ₹{fmt(overallBalance)}</span>}
        </div>
      </div>

      {/* FOOTER */}
      {printSettings?.footer_content ? (
        <div style={{ lineHeight: '1.4', marginTop: '3px' }} className="receipt-footer-content" dangerouslySetInnerHTML={{ __html: printSettings.footer_content }} />
      ) : (
        <div style={{ fontSize: '7px', color: '#bbb', textAlign: 'center', marginTop: '2px' }}>
          Computer generated receipt • {transactionId || '-'}
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

Template25_Infographic.templateMeta = {
  key: 'infographic',
  name: 'Infographic',
  description: 'Visual infographic style — progress bars, stat cards, status badges',
  category: 'creative',
  paperSize: 'A5',
  orientation: 'landscape',
  features: ['fee_statement', 'copy_type', 'progress_bar', 'stat_cards', 'status_badges'],
  colorScheme: { primary: '#2196f3', secondary: '#f8f9fa', accent: '#4caf50' }
};

export default Template25_Infographic;
