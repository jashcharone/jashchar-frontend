/**
 * Template 07: Modern Minimal
 * Black & white, maximum whitespace, Stripe-style
 * Paper: A5 Landscape | Category: Modern
 */
import React from 'react';
import { format } from 'date-fns';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Template07_ModernMinimal = ({ receiptData, copyType }) => {
  const {
    student, school, lineItems = [],
    totalPaid, totalDiscount, totalFine, grandTotal,
    overallTotalAmount = 0, overallBalance = 0,
    transactionId, receiptDate, paymentMode,
    isRefund, isOriginal, printSettings, sessionName, title = 'FEE RECEIPT'
  } = receiptData;

  const showConcession = totalDiscount > 0;

  return (
    <div style={{ width: '200mm', height: '140mm', boxSizing: 'border-box', pageBreakInside: 'avoid', position: 'relative', backgroundColor: '#fff', color: '#000', fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif", padding: '12px 20px', overflow: 'hidden' }}>
      
      {/* HEADER - Logo + school name, minimal */}
      {printSettings?.header_image_url ? (
        <div style={{ width: '100%', marginBottom: '8px' }}><img src={printSettings.header_image_url} alt='Header' style={{ width: '100%', height: 'auto', display: 'block' }} /></div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '8px', borderBottom: '1px solid #000' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {school?.logo_url && <img src={school.logo_url} alt='Logo' style={{ height: '40px', width: 'auto' }} />}
            <div>
              <h1 style={{ fontSize: '14px', fontWeight: '600', margin: 0, color: '#000' }}>{school?.name || '-'}</h1>
              {school?.address && <p style={{ fontSize: '8px', color: '#666', margin: '2px 0 0' }}>{school.address}</p>}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '8px', color: '#888' }}>
            <div style={{ fontSize: '12px', color: '#ccc', fontWeight: '300', marginBottom: '2px' }}>{title}</div>
            <div>Receipt# {transactionId?.split('/').pop() || '-'}</div>
            <div>{receiptDate ? format(new Date(receiptDate), 'dd MMM yyyy') : '-'}</div>
            <div>{paymentMode || 'Cash'}</div>
            {!isOriginal && <div style={{ color: '#e74c3c', fontWeight: 'bold' }}>REPRINT</div>}
          </div>
        </div>
      )}

      {/* STUDENT - Clean single line */}
      <div style={{ padding: '8px 0', fontSize: '10px', borderBottom: '1px solid #eee' }}>
        <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '2px' }}>{student?.full_name || '-'}</div>
        <div style={{ color: '#666', fontSize: '9px' }}>
          Father: {student?.father_name || '-'} &nbsp;|&nbsp; Class: {student?.class?.name || '-'}{student?.section?.name ? ` (${student.section.name})` : ''} &nbsp;|&nbsp; Adm#: {student?.school_code || student?.admission_no || '-'} &nbsp;|&nbsp; Session: {sessionName || '-'}
        </div>
      </div>

      {/* FEE TABLE - Material style, no borders */}
      <div style={{ padding: '8px 0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
          <thead>
            <tr>
              <th style={{ padding: '5px 4px', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #000', fontSize: '8px', textTransform: 'uppercase', color: '#888', letterSpacing: '0.5px' }}>Description</th>
              <th style={{ padding: '5px 4px', textAlign: 'right', fontWeight: '600', borderBottom: '2px solid #000', width: '100px', fontSize: '8px', textTransform: 'uppercase', color: '#888', letterSpacing: '0.5px' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => (
              <tr key={idx}>
                <td style={{ padding: '5px 4px', borderBottom: '1px solid #eee' }}>{item.description}</td>
                <td style={{ padding: '5px 4px', textAlign: 'right', borderBottom: '1px solid #eee' }}>{fmt(item.amount)}</td>
              </tr>
            ))}
            {totalDiscount > 0 && (
              <tr>
                <td style={{ padding: '4px', textAlign: 'right', color: '#27ae60', fontSize: '8px' }}>Concession/Discount</td>
                <td style={{ padding: '4px', textAlign: 'right', color: '#27ae60', fontSize: '8px' }}>-{fmt(totalDiscount)}</td>
              </tr>
            )}
            {totalFine > 0 && (
              <tr>
                <td style={{ padding: '4px', textAlign: 'right', color: '#e74c3c', fontSize: '8px' }}>Late Fine</td>
                <td style={{ padding: '4px', textAlign: 'right', color: '#e74c3c', fontSize: '8px' }}>+{fmt(totalFine)}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td style={{ padding: '6px 4px', borderTop: '2px solid #000', fontWeight: 'bold', textAlign: 'right' }}>{isRefund ? 'Total Refund' : 'Amount Paid'}</td>
              <td style={{ padding: '6px 4px', borderTop: '2px solid #000', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>{`\u20b9`}{fmt(grandTotal)}</td>
            </tr>
            {overallBalance > 0 && (
              <tr>
                <td style={{ padding: '3px 4px', textAlign: 'right', fontSize: '8px', color: '#888' }}>Balance Remaining</td>
                <td style={{ padding: '3px 4px', textAlign: 'right', fontSize: '9px', color: '#c0392b' }}>{`\u20b9`}{fmt(overallBalance)}</td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>

      {/* FOOTER */}
      {printSettings?.footer_content ? (
        <div style={{ padding: '6px 0', borderTop: '1px solid #eee', color: '#333', lineHeight: '1.4' }} className="receipt-footer-content" dangerouslySetInnerHTML={{ __html: printSettings.footer_content }} />
      ) : (
        <div style={{ position: 'absolute', bottom: '12px', left: '20px', right: '20px', fontSize: '8px', color: '#aaa', textAlign: 'center' }}>
          Computer generated receipt • No signature required • {copyType} • TXN: {transactionId || '-'}
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

Template07_ModernMinimal.templateMeta = {
  key: 'modern_minimal',
  name: 'Modern Minimal',
  description: 'Black & white, Stripe-style invoice with maximum whitespace',
  category: 'modern',
  paperSize: 'A5',
  orientation: 'landscape',
  features: ['copy_type', 'clean_design', 'no_borders'],
  colorScheme: { primary: '#000000', secondary: '#ffffff', accent: '#888888' }
};

export default Template07_ModernMinimal;
