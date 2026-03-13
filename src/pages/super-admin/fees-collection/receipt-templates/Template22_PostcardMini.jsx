/**
 * Template 22: Postcard Mini
 * Small postcard-size receipt — compact, clean
 * Paper: A6 (105mm × 148mm) | Category: Minimal
 */
import React from 'react';
import { format } from 'date-fns';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Template22_PostcardMini = ({ receiptData, copyType }) => {
  const {
    student, school, lineItems = [], feeStatement = [],
    totalPaid, totalDiscount, totalFine, grandTotal,
    overallBalance = 0,
    transactionId, receiptDate, paymentMode,
    isRefund, isOriginal, printSettings, sessionName, title = 'FEE RECEIPT'
  } = receiptData;

  return (
    <div style={{ width: '148mm', height: '105mm', boxSizing: 'border-box', pageBreakInside: 'avoid', position: 'relative', backgroundColor: '#fff', fontFamily: "'Arial', sans-serif", color: '#333', overflow: 'hidden', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}>
      
      {/* HEADER */}
      {printSettings?.header_image_url ? (
        <div style={{ marginBottom: '4px' }}><img src={printSettings.header_image_url} alt='Header' style={{ width: '100%', height: 'auto', display: 'block' }} /></div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', paddingBottom: '3px', borderBottom: '1px solid #333' }}>
          {school?.logo_url && <img src={school.logo_url} alt='Logo' style={{ height: '22px', width: 'auto' }} />}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: '700' }}>{school?.name || '-'}</div>
          </div>
          <div style={{ fontSize: '9px', fontWeight: '600' }}>{title}</div>
        </div>
      )}

      {/* INFO LINE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7.5px', color: '#666', marginBottom: '4px' }}>
        <span>#{transactionId?.split('/').pop() || '-'} | {receiptDate ? format(new Date(receiptDate), 'dd-MM-yyyy') : '-'}</span>
        <span>{copyType}{!isOriginal ? ' (Dup)' : ''}</span>
      </div>

      {/* STUDENT */}
      <div style={{ fontSize: '8px', marginBottom: '4px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <strong>{student?.full_name || '-'}</strong>
        <span>{student?.class?.name || '-'}{student?.section?.name ? `(${student.section.name})` : ''}</span>
        <span>#{student?.school_code || '-'}</span>
        <span>{paymentMode || 'Cash'}</span>
      </div>

      {/* ITEMS - Compact */}
      <div style={{ marginBottom: '4px', borderTop: '1px solid #eee', borderBottom: '1px solid #eee', padding: '2px 0' }}>
        {lineItems.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', padding: '1.5px 0', borderBottom: idx < lineItems.length - 1 ? '1px dotted #eee' : 'none' }}>
            <span>{item.description}</span>
            <span style={{ fontWeight: '600' }}>{fmt(item.amount)}</span>
          </div>
        ))}
      </div>

      {/* TOTAL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700', marginBottom: '4px', padding: '3px 0', borderBottom: '2px solid #333' }}>
        <span>{isRefund ? 'REFUND' : 'TOTAL'}</span>
        <span>₹{fmt(grandTotal)}</span>
      </div>

      {overallBalance > 0 && (
        <div style={{ textAlign: 'right', fontSize: '7.5px', color: '#c00', marginBottom: '2px' }}>Balance: ₹{fmt(overallBalance)}</div>
      )}

      {/* FEE STATEMENT - Ultra compact */}
      {feeStatement.length > 0 && (
        <div style={{ fontSize: '7px', color: '#888', marginBottom: '3px' }}>
          {feeStatement.map((fee, i) => `${fee.name}:${fmt(fee.paid)}`).join(' | ')}
        </div>
      )}

      {/* FOOTER */}
      {printSettings?.footer_content ? (
        <div style={{ fontSize: '7px', lineHeight: '1.3' }} className="receipt-footer-content" dangerouslySetInnerHTML={{ __html: printSettings.footer_content }} />
      ) : (
        <div style={{ fontSize: '6.5px', color: '#aaa', textAlign: 'center' }}>
          {transactionId || '-'} • Computer generated
        </div>
      )}

      {isRefund && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)', opacity: 0.06, pointerEvents: 'none' }}>
          <span style={{ fontSize: '36px', fontWeight: 'bold', color: 'red' }}>REFUND</span>
        </div>
      )}
    </div>
  );
};

Template22_PostcardMini.templateMeta = {
  key: 'postcard_mini',
  name: 'Postcard Mini',
  description: 'Compact A6 postcard-size receipt — minimal and quick',
  category: 'minimal',
  paperSize: 'A6',
  orientation: 'landscape',
  features: ['fee_statement', 'copy_type', 'compact'],
  colorScheme: { primary: '#333333', secondary: '#ffffff', accent: '#888888' }
};

export default Template22_PostcardMini;
