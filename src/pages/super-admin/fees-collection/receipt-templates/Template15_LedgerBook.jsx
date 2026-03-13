/**
 * Template 15: Ledger Book
 * Accounting ledger style - ruled lines, green/red columns
 * Paper: A5 Landscape | Category: Classic
 */
import React from 'react';
import { format } from 'date-fns';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Template15_LedgerBook = ({ receiptData, copyType }) => {
  const {
    student, school, lineItems = [], feeStatement = [],
    totalPaid, totalDiscount, totalFine, grandTotal,
    overallBalance = 0,
    transactionId, receiptDate, paymentMode,
    isRefund, isOriginal, printSettings, sessionName, title = 'FEE RECEIPT'
  } = receiptData;

  const showConcession = totalDiscount > 0;

  return (
    <div style={{ width: '200mm', height: '140mm', boxSizing: 'border-box', pageBreakInside: 'avoid', position: 'relative', backgroundColor: '#f9f6ef', fontFamily: "'Courier New', 'Consolas', monospace", color: '#1a1a1a', overflow: 'hidden', padding: '10px 15px' }}>
      
      {/* Ledger ruled lines background effect */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'repeating-linear-gradient(transparent, transparent 13px, #d4e6d4 13px, #d4e6d4 14px)', opacity: 0.3, pointerEvents: 'none' }} />
      {/* Red margin line */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '30mm', width: '1px', backgroundColor: '#e88888', opacity: 0.4, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* HEADER */}
        {printSettings?.header_image_url ? (
          <div style={{ marginBottom: '6px' }}><img src={printSettings.header_image_url} alt='Header' style={{ width: '100%', height: 'auto', display: 'block' }} /></div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '2px solid #2e7d32', paddingBottom: '5px', marginBottom: '5px' }}>
            {school?.logo_url && <img src={school.logo_url} alt='Logo' style={{ height: '35px', width: 'auto' }} />}
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0, color: '#2e7d32' }}>{school?.name || '-'}</h1>
              {school?.address && <p style={{ fontSize: '8px', margin: '2px 0 0', color: '#666' }}>{school.address}</p>}
            </div>
            <div style={{ textAlign: 'right', fontSize: '8px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#2e7d32' }}>{title}</div>
              <div>{copyType}{!isOriginal ? ' | REPRINT' : ''}</div>
            </div>
          </div>
        )}

        {/* RECEIPT INFO LINE */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', marginBottom: '4px', borderBottom: '1px solid #bbb', paddingBottom: '3px' }}>
          <span>RECEIPT #: <strong>{transactionId?.split('/').pop() || '-'}</strong></span>
          <span>DATE: <strong>{receiptDate ? format(new Date(receiptDate), 'dd-MM-yyyy') : '-'}</strong></span>
          <span>SESSION: <strong>{sessionName || '-'}</strong></span>
          <span>MODE: <strong>{paymentMode || 'Cash'}</strong></span>
        </div>

        {/* STUDENT */}
        <div style={{ fontSize: '8.5px', marginBottom: '5px', display: 'flex', gap: '15px' }}>
          <span>STUDENT: <strong>{student?.full_name || '-'}</strong></span>
          <span>S/O: {student?.father_name || '-'}</span>
          <span>CLASS: {student?.class?.name || '-'}{student?.section?.name ? `-${student.section.name}` : ''}</span>
          <span>ADM#: {student?.school_code || '-'}</span>
        </div>

        {/* FEE TABLE - Ledger style */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px', marginBottom: '5px' }}>
          <thead>
            <tr style={{ borderTop: '2px solid #333', borderBottom: '2px solid #333' }}>
              <th style={{ padding: '3px 5px', textAlign: 'center', width: '26px', borderRight: '1px solid #999' }}>SL</th>
              <th style={{ padding: '3px 5px', textAlign: 'left', borderRight: '1px solid #999' }}>PARTICULARS</th>
              <th style={{ padding: '3px 5px', textAlign: 'right', width: '68px', borderRight: '1px solid #999', backgroundColor: '#e8f5e9', color: '#2e7d32' }}>DR (₹)</th>
              {showConcession && <th style={{ padding: '3px 5px', textAlign: 'right', width: '58px', borderRight: '1px solid #999' }}>CONC.(₹)</th>}
              <th style={{ padding: '3px 5px', textAlign: 'right', width: '68px', borderRight: '1px solid #999', backgroundColor: '#e8f5e9', color: '#2e7d32' }}>CR (₹)</th>
              <th style={{ padding: '3px 5px', textAlign: 'right', width: '58px', backgroundColor: overallBalance > 0 ? '#ffebee' : '#e8f5e9', color: overallBalance > 0 ? '#c62828' : '#2e7d32' }}>BAL (₹)</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #ccc' }}>
                <td style={{ padding: '2.5px 5px', textAlign: 'center', borderRight: '1px solid #ddd' }}>{idx + 1}</td>
                <td style={{ padding: '2.5px 5px', borderRight: '1px solid #ddd' }}>{item.description}</td>
                <td style={{ padding: '2.5px 5px', textAlign: 'right', borderRight: '1px solid #ddd', backgroundColor: '#f1f8e9' }}>{fmt(item.totalAmount)}</td>
                {showConcession && <td style={{ padding: '2.5px 5px', textAlign: 'right', borderRight: '1px solid #ddd' }}>{Number(item.discount || 0) > 0 ? fmt(item.discount) : '-'}</td>}
                <td style={{ padding: '2.5px 5px', textAlign: 'right', borderRight: '1px solid #ddd', backgroundColor: '#f1f8e9' }}>{fmt(item.amount)}</td>
                <td style={{ padding: '2.5px 5px', textAlign: 'right' }}>{fmt(item.balance)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid #333', fontWeight: 'bold', fontSize: '9px' }}>
              <td colSpan={showConcession ? 4 : 3} style={{ padding: '3px 5px', textAlign: 'right', borderRight: '1px solid #ddd' }}>{isRefund ? 'TOTAL REFUND:' : 'TOTAL PAID:'}</td>
              <td style={{ padding: '3px 5px', textAlign: 'right', borderRight: '1px solid #ddd', backgroundColor: '#e8f5e9', color: '#2e7d32', fontSize: '10px' }}>₹{fmt(grandTotal)}</td>
              <td style={{ padding: '3px 5px', textAlign: 'right', color: overallBalance > 0 ? '#c62828' : '#2e7d32' }}>₹{fmt(overallBalance)}</td>
            </tr>
          </tfoot>
        </table>

        {/* FEE STATEMENT */}
        {feeStatement.length > 0 && (
          <div style={{ marginBottom: '4px', borderTop: '1px dashed #999', paddingTop: '3px' }}>
            <span style={{ fontSize: '8px', fontWeight: 'bold' }}>LEDGER SUMMARY: </span>
            <span style={{ fontSize: '7.5px' }}>
              {feeStatement.map((fee, i) => `${fee.name}=${fmt(fee.paid)}/${fmt(fee.amount)}[${fee.status}]`).join(' | ')}
            </span>
          </div>
        )}

        {/* FOOTER */}
        {printSettings?.footer_content ? (
          <div style={{ lineHeight: '1.4' }} className="receipt-footer-content" dangerouslySetInnerHTML={{ __html: printSettings.footer_content }} />
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7.5px', color: '#666', borderTop: '1px solid #999', paddingTop: '3px' }}>
            <span>TXN: {transactionId || '-'}</span>
            <span>Auto-generated ledger entry — No signature required</span>
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

Template15_LedgerBook.templateMeta = {
  key: 'ledger_book',
  name: 'Ledger Book',
  description: 'Accounting ledger style with ruled lines, DR/CR columns',
  category: 'classic',
  paperSize: 'A5',
  orientation: 'landscape',
  features: ['fee_statement', 'copy_type', 'ledger_style', 'ruled_lines'],
  colorScheme: { primary: '#2e7d32', secondary: '#f9f6ef', accent: '#c62828' }
};

export default Template15_LedgerBook;
