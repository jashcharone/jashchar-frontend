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
          { icon: '🏷️', label: 'Adm No', value: student?.school_code || '-', bg: '#fff3e0' },
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
              <th style={{ padding: '3px 5px', textAlign: 'center', width: '26px' }}>#</th>
              <th style={{ padding: '3px 5px', textAlign: 'left' }}>Fee Type</th>
              <th style={{ padding: '3px 5px', textAlign: 'right', width: '65px' }}>Total</th>
              {showConcession && <th style={{ padding: '3px 5px', textAlign: 'right', width: '55px' }}>Conc.</th>}
              <th style={{ padding: '3px 5px', textAlign: 'right', width: '55px' }}>Paid</th>
              <th style={{ padding: '3px 5px', textAlign: 'right', width: '50px' }}>Bal.</th>
              <th style={{ padding: '3px 5px', textAlign: 'center', width: '50px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => {
              const itemBal = Number(item.balance || 0);
              return (
                <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '2.5px 5px', textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ padding: '2.5px 5px' }}>{item.description}</td>
                  <td style={{ padding: '2.5px 5px', textAlign: 'right' }}>{fmt(item.totalAmount)}</td>
                  {showConcession && <td style={{ padding: '2.5px 5px', textAlign: 'right' }}>{Number(item.discount || 0) > 0 ? fmt(item.discount) : ''}</td>}
                  <td style={{ padding: '2.5px 5px', textAlign: 'right' }}>{fmt(item.amount)}</td>
                  <td style={{ padding: '2.5px 5px', textAlign: 'right' }}>{fmt(item.balance)}</td>
                  <td style={{ padding: '2.5px 5px', textAlign: 'center' }}>
                    <span style={{ fontSize: '7px', padding: '1px 5px', borderRadius: '8px', backgroundColor: itemBal <= 0 ? '#e8f5e9' : '#fff3e0', color: itemBal <= 0 ? '#388e3c' : '#e65100', fontWeight: '600' }}>{itemBal <= 0 ? '✓ Paid' : 'Due'}</span>
                  </td>
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

        {/* FEE STATEMENT inline */}
        {feeStatement.length > 0 && (
          <div style={{ fontSize: '7px', color: '#666' }}>
            {feeStatement.map((fee, i) => (
              <span key={i} style={{ marginLeft: '6px' }}>{fee.name}: {fmt(fee.paid)}/{fmt(fee.amount)}</span>
            ))}
          </div>
        )}
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
