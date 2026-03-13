/**
 * Template 19: Ultra Simple
 * Bare minimum — no borders, no colors, maximum readability
 * Paper: A5 Landscape | Category: Minimal
 */
import React from 'react';
import { format } from 'date-fns';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Template19_UltraSimple = ({ receiptData, copyType }) => {
  const {
    student, school, lineItems = [], feeStatement = [],
    totalPaid, totalDiscount, totalFine, grandTotal,
    overallBalance = 0,
    transactionId, receiptDate, paymentMode,
    isRefund, isOriginal, printSettings, sessionName, title = 'FEE RECEIPT'
  } = receiptData;

  const showConcession = totalDiscount > 0;

  return (
    <div style={{ width: '200mm', height: '140mm', boxSizing: 'border-box', pageBreakInside: 'avoid', position: 'relative', backgroundColor: '#fff', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", color: '#000', overflow: 'hidden', padding: '12px 18px' }}>
      
      {/* HEADER */}
      {printSettings?.header_image_url ? (
        <div style={{ marginBottom: '8px' }}><img src={printSettings.header_image_url} alt='Header' style={{ width: '100%', height: 'auto', display: 'block' }} /></div>
      ) : (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {school?.logo_url && <img src={school.logo_url} alt='Logo' style={{ height: '30px', width: 'auto' }} />}
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>{school?.name || '-'}</div>
              {school?.address && <div style={{ fontSize: '8px', color: '#666' }}>{school.address}</div>}
            </div>
          </div>
        </div>
      )}

      {/* TITLE + INFO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
        <div style={{ fontSize: '12px', fontWeight: '600' }}>{title}</div>
        <div style={{ fontSize: '8px', color: '#666' }}>
          {transactionId?.split('/').pop() || '-'} | {receiptDate ? format(new Date(receiptDate), 'dd MMM yyyy') : '-'} | {copyType}
        </div>
      </div>

      {/* STUDENT - Single line */}
      <div style={{ fontSize: '8.5px', marginBottom: '8px', color: '#333' }}>
        {student?.full_name || '-'} | {student?.class?.name || '-'}{student?.section?.name ? ` (${student.section.name})` : ''} | {student?.school_code || '-'} | {paymentMode || 'Cash'}
      </div>

      {/* TABLE - Clean, borderless */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px', marginBottom: '8px' }}>
        <thead>
          <tr style={{ borderBottom: '1.5px solid #000' }}>
            <th style={{ padding: '3px 4px', textAlign: 'left', fontWeight: '600' }}>Fee</th>
            <th style={{ padding: '3px 4px', textAlign: 'right', width: '100px', fontWeight: '600' }}>Amount Paid</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '3px 4px' }}>{item.description}</td>
              <td style={{ padding: '3px 4px', textAlign: 'right' }}>{fmt(item.amount)}</td>
            </tr>
          ))}
          {totalDiscount > 0 && (
            <tr style={{ borderBottom: '1px solid #eee', color: '#2e7d32' }}>
              <td style={{ padding: '3px 4px', fontSize: '8px' }}>Concession Applied</td>
              <td style={{ padding: '3px 4px', textAlign: 'right', fontSize: '8px' }}>-{fmt(totalDiscount)}</td>
            </tr>
          )}
          {totalFine > 0 && (
            <tr style={{ borderBottom: '1px solid #eee', color: '#c00' }}>
              <td style={{ padding: '3px 4px', fontSize: '8px' }}>Late Fine</td>
              <td style={{ padding: '3px 4px', textAlign: 'right', fontSize: '8px' }}>+{fmt(totalFine)}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* TOTAL - Simple */}
      <div style={{ textAlign: 'right', marginBottom: '6px', borderTop: '1.5px solid #000', paddingTop: '4px' }}>
        <span style={{ fontSize: '12px', fontWeight: '700' }}>{isRefund ? 'Refund' : 'Paid'}: ₹{fmt(grandTotal)}</span>
      </div>
      {overallBalance > 0 && (
        <div style={{ textAlign: 'right', fontSize: '8px', color: '#888', marginBottom: '6px' }}>
          Outstanding: ₹{fmt(overallBalance)}
        </div>
      )}

      {/* FOOTER */}
      {printSettings?.footer_content ? (
        <div style={{ lineHeight: '1.4' }} className="receipt-footer-content" dangerouslySetInnerHTML={{ __html: printSettings.footer_content }} />
      ) : (
        <div style={{ fontSize: '7px', color: '#999', textAlign: 'center' }}>
          Computer generated receipt • {transactionId || '-'}
        </div>
      )}

      {isRefund && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)', opacity: 0.06, pointerEvents: 'none' }}>
          <span style={{ fontSize: '48px', fontWeight: 'bold', color: 'red' }}>REFUND</span>
        </div>
      )}
    </div>
  );
};

Template19_UltraSimple.templateMeta = {
  key: 'ultra_simple',
  name: 'Ultra Simple',
  description: 'Bare minimum design — no borders, no colors, pure readability',
  category: 'minimal',
  paperSize: 'A5',
  orientation: 'landscape',
  features: ['fee_statement', 'copy_type', 'borderless'],
  colorScheme: { primary: '#000000', secondary: '#ffffff', accent: '#666666' }
};

export default Template19_UltraSimple;
